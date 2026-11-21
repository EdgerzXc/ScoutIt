import { NextResponse } from "next/server";
import { getVerifiedWorkspaceUser } from "@/lib/workspaceRequestAuth";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateProperty } from "@/lib/airtable";
import { z } from "zod";
import { sanitizeObject, stripAllTags } from "@/lib/sanitize";
import { notifyAttachedBrokers } from "@/lib/notifications";
import { sanitizeError } from "@/lib/sanitizeError";
import {
  canChangeDisplayTitle, getPublicationBinding, isPermanentlyRemoved, isStaffSuspended,
  matchPublicationSnapshot, normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES,
} from "@/lib/propertyLifecycle";
import { invalidateCmsBundle } from "@/lib/cmsCache";

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
  details: z.record(z.string(), z.unknown()).optional(),
  quietly_open_to_offers: z.boolean().optional(),
  contact_preference: z.enum(["owner_only", "broker_only", "owner_and_brokers"]).optional()
});

export async function POST(request) {
  try {
    const { submissionId, data } = (await request.json().catch(() => null)) || {};

    if (typeof submissionId !== "string" || !submissionId || !data) {
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
      
      const { data: { user }, error: authError } = await getVerifiedWorkspaceUser(authClient, token);
      
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

    // No anon-key fallback: `supabaseAdmin` above is non-null only when the
    // service role key is present, so falling back here could never be correct —
    // it could only mask a misconfiguration by quietly downgrading privileges.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
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
    if (isStaffSuspended(currentSubmission)) {
      return NextResponse.json({ error: "Staff-suspended listings require staff review" }, { status: 409 });
    }
    if (validatedData.title !== undefined && stripAllTags(validatedData.title) !== currentSubmission.title && !canChangeDisplayTitle(currentSubmission)) {
      return NextResponse.json({ error: "Live listing titles are locked to protect the canonical public URL" }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    const isLive = lifecycleState === PROPERTY_LIFECYCLE_STATES.LIVE;
    const binding = isLive ? getPublicationBinding(currentSubmission) : null;
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (isLive && !binding) {
      return NextResponse.json({ error: "This listing requires publication identity reconciliation" }, { status: 409 });
    }
    if (isLive && (!apiKey || !baseId)) {
      return NextResponse.json(
        { error: "Live property updates are unavailable while the Airtable CMS is unavailable", retryable: true },
        { status: 503 }
      );
    }

    // Format the payload for Supabase, sanitizing string inputs
    const supabasePayload = {
      title: validatedData.title ? stripAllTags(validatedData.title) : currentSubmission.title,
      type: validatedData.type ? stripAllTags(validatedData.type) : currentSubmission.type,
      location: validatedData.location ? stripAllTags(validatedData.location) : currentSubmission.location,
      // GAP-98: Preserve space_category so Airtable category-scoped field mapping is not bypassed
      space_category: currentSubmission.space_category,
    };
    if (typeof validatedData.quietly_open_to_offers === "boolean") {
      if (lifecycleState !== PROPERTY_LIFECYCLE_STATES.OFF_MARKET) {
        return NextResponse.json({ error: "Quietly open to offers is only available for off-market listings" }, { status: 409 });
      }
      supabasePayload.quietly_open_to_offers = validatedData.quietly_open_to_offers;
    }

    // Merge details JSONB safely with deep recursive sanitization (e.g. units_inventory objects)
    const mergedDetails = {
      ...(currentSubmission.details || {}),
      ...(validatedData.details ? sanitizeObject(validatedData.details) : {})
    };
    if (validatedData.contact_preference) {
      mergedDetails.contact_preference = validatedData.contact_preference;
    }
    if (validatedData.details || validatedData.contact_preference) {
      supabasePayload.details = mergedDetails;
    }

    // 2. Update Supabase
    // We verified ownership above. RLS might silently drop updates, so we use the service role key.

    const updateQuery = serviceClient
      .from('properties')
      .update(supabasePayload)
      .eq('id', submissionId)
      .eq('owner_id', userId);
    const { error: updateError, data: updateData } = await matchPublicationSnapshot(updateQuery, currentSubmission).select('id');

    if (updateError) {
      console.error("[UPDATE API] Failed to update Supabase:", updateError);
      return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
    }
    if (updateData?.length !== 1) {
      return NextResponse.json({ error: "Listing changed while the edit was being saved. Reload and retry.", retryable: true }, { status: 409 });
    }

    if (binding) {
      const publicPayload = { ...supabasePayload, expectedRecordId: binding.recordId };
      delete publicPayload.title;
      try {
        await updateProperty(apiKey, baseId, binding.slug, publicPayload);
      } catch (airtableErr) {
        console.error("[UPDATE API] Airtable update failed:", airtableErr);
        return NextResponse.json({ success: false, retryable: true, warning: "Private changes saved. The public listing update needs a retry." }, { status: 502 });
      }
    }

    // 2b. Broker-on-change alert — only for a watched price/status field
    // actually changing value, and only on already-approved (public)
    // properties, since that's the only state where an attached broker exists.
    if (isLive && validatedData.details) {
      const oldDetails = currentSubmission.details || {};
      const newDetails = supabasePayload.details || {};
      const touchedKeys = Object.keys(validatedData.details);
      const changedKey = BROKER_ALERT_WATCH_KEYS.find(
        (key) => touchedKeys.includes(key) && oldDetails[key] !== newDetails[key]
      );
      if (changedKey) {
        // A-146: isolated — the listing update stands; a bell failure must
        // neither 500 it (the retry would re-fire the alert) nor vanish.
        try {
          await notifyAttachedBrokers(serviceClient, {
            propertyId: submissionId,
            title: "Listing updated",
            desc: `"${currentSubmission.title}" was updated — check the latest details.`,
            icon: "📋",
            notificationType: "property_changed",
            excludeUserId: userId,
          });
        } catch (notifyError) {
          console.warn("[DASHBOARD UPDATE] Broker alert not delivered for", submissionId, notifyError?.message);
        }
      }
    }

    // Draft edits do not change the public catalogue and must not force a
    // four-table rebuild on the next visit. Live edits do need a purge.
    let publicCachePending = false;
    if (isLive) {
      try {
        const purge = await invalidateCmsBundle();
        publicCachePending = purge.sharedCachePurged === false;
      } catch (cacheError) {
        console.error("[UPDATE] Catalogue cache purge failed after an edit:", cacheError?.message);
        publicCachePending = true;
      }
    }

    return NextResponse.json({ success: true, publicCachePending });

  } catch (err) {
    console.error("[UPDATE API] Error during update process:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
