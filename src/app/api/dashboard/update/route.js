import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateProperty } from "@/lib/airtable";
import { z } from "zod";
import { sanitizeObject, stripAllTags } from "@/lib/sanitize";
import { notifyAttachedBrokers } from "@/lib/notifications";
import { sanitizeError } from "@/lib/sanitizeError";
import { canChangeDisplayTitle, isPermanentlyRemoved, normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";

// Price/status-ish keys across every category's details shape (Track 1,
// PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md — "Price + status + units"
// triggers a broker-on-change alert, not every autosave keystroke).
const BROKER_ALERT_WATCH_KEYS = [
  "price", "rentPerSqm", "camc", "acCharges", "nightlyRate", "rent", "rentalRate",
  "listedPrice", "Listed_Price", "priceStatus", "Price_Status", "availability",
];

const updateSchema = z.object({
  title: z.string().max(255).optional(),
  type: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  details: z.record(z.any()).optional(),
  quietly_open_to_offers: z.boolean().optional()
});

export async function POST(request) {
  try {
    const { submissionId, data  } = await request.json();

    if (!submissionId || !data) {
      return NextResponse.json({ error: "Missing submissionId or data" }, { status: 400 });
    }

    let userId = null;

    // 1. Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    if (token && token.trim() !== "") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      
      if (!authError && user) {
        userId = user.id;
      }
    }



    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }

    const validationResult = updateSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const validatedData = validationResult.data;
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey, {
      auth: { persistSession: false }
    });

    // 1. Fetch the current submission to check its status using SERVICE CLIENT because we might be mock user
    const { data: currentSubmission, error: fetchError } = await serviceClient
      .from('properties')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !currentSubmission) {
      console.error("[UPDATE API] Failed to fetch submission:", fetchError);
      return NextResponse.json({ error: "Submission not found or error fetching" }, { status: 404 });
    }

    if (currentSubmission.owner_id !== userId) {
      return NextResponse.json({ error: "Unauthorized: You do not own this property" }, { status: 403 });
    }

    const lifecycleState = normalizeLifecycleState(currentSubmission);
    if (isPermanentlyRemoved(currentSubmission)) {
      return NextResponse.json({ error: "Permanently removed listings are retained and cannot be edited" }, { status: 410 });
    }
    if (validatedData.title !== undefined && stripAllTags(validatedData.title) !== currentSubmission.title && !canChangeDisplayTitle(currentSubmission)) {
      return NextResponse.json({ error: "Live listing titles are locked to protect the canonical public URL" }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    if (lifecycleState === PROPERTY_LIFECYCLE_STATES.LIVE &&
        (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID)) {
      return NextResponse.json(
        { error: "Live property updates are unavailable while the Airtable CMS is unavailable", retryable: true },
        { status: 503 }
      );
    }

    // Format the payload for Supabase, sanitizing string inputs
    const supabasePayload = {
      title: validatedData.title ? stripAllTags(validatedData.title) : currentSubmission.title,
      type: validatedData.type ? stripAllTags(validatedData.type) : currentSubmission.type,
      location: validatedData.location ? stripAllTags(validatedData.location) : currentSubmission.location
    };
    if (typeof validatedData.quietly_open_to_offers === "boolean") {
      if (lifecycleState !== PROPERTY_LIFECYCLE_STATES.OFF_MARKET) {
        return NextResponse.json({ error: "Quietly open to offers is only available for off-market listings" }, { status: 409 });
      }
      supabasePayload.quietly_open_to_offers = validatedData.quietly_open_to_offers;
    }

    // Merge details JSONB safely with deep recursive sanitization (e.g. units_inventory objects)
    if (validatedData.details) {
      const sanitizedDetails = sanitizeObject(validatedData.details);

      supabasePayload.details = {
        ...(currentSubmission.details || {}),
        ...sanitizedDetails
      };
    }

    // 2. Update Supabase
    // We verified ownership above. RLS might silently drop updates, so we use the service role key.

    const { error: updateError, data: updateData } = await serviceClient
      .from('properties')
      .update(supabasePayload)
      .eq('id', submissionId)
      .select();

    if (!updateData || updateData.length === 0) {
      console.warn("[UPDATE API] Zero rows updated. Supabase RLS or missing ID issue.");
      return NextResponse.json({ error: "Failed to update database (0 rows affected)" }, { status: 500 });
    }

    if (updateError) {
      console.error("[UPDATE API] Failed to update Supabase:", updateError);
      return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
    }

    // 2b. Broker-on-change alert — only for a watched price/status field
    // actually changing value, and only on already-approved (public)
    // properties, since that's the only state where an attached broker exists.
    if (lifecycleState === PROPERTY_LIFECYCLE_STATES.LIVE && validatedData.details) {
      const oldDetails = currentSubmission.details || {};
      const newDetails = supabasePayload.details || {};
      const touchedKeys = Object.keys(validatedData.details);
      const changedKey = BROKER_ALERT_WATCH_KEYS.find(
        (key) => touchedKeys.includes(key) && oldDetails[key] !== newDetails[key]
      );
      if (changedKey) {
        await notifyAttachedBrokers(serviceClient, {
          propertyId: submissionId,
          title: "Listing updated",
          desc: `"${currentSubmission.title}" was updated — check the latest details.`,
          icon: "📋",
          notificationType: "property_changed",
          excludeUserId: userId,
        });
      }
    }

    // 3. If approved, update Airtable too!
    if (lifecycleState === PROPERTY_LIFECYCLE_STATES.LIVE) {
      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;

      if (apiKey && baseId) {
        // The slug is derived from the original title
        const slug = currentSubmission.canonical_slug || currentSubmission.slug;
        if (!slug) {
          return NextResponse.json({ error: "Live property is missing its canonical slug" }, { status: 409 });
        }

        try {
          console.log(`[UPDATE API] Syncing updates for slug ${slug} to Airtable...`);
          await updateProperty(apiKey, baseId, slug, supabasePayload);
          
          // Never replace the first-publication canonical slug with Airtable's formula result.
        } catch (airtableErr) {
          console.error("[UPDATE API] Airtable update failed:", airtableErr);
          return NextResponse.json({ success: false, retryable: true, warning: "Supabase updated; Airtable sync is pending and can be retried: " + airtableErr.message }, { status: 502 });
        }
      } else {
        console.warn("[UPDATE API] Airtable credentials missing, skipping sync.");
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[UPDATE API] Error during update process:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
