import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateProperty } from "@/lib/airtable";
import { z } from "zod";
import { sanitizeObject, stripAllTags } from "@/lib/sanitize";
import { notifyAttachedBrokers } from "@/lib/notifications";
import { sanitizeError } from "@/lib/sanitizeError";
import { canChangeDisplayTitle, isPermanentlyRemoved, normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";
import { invalidateCmsBundle } from "@/lib/cmsCache";

// Price/status-ish keys across every category's details shape (Track 1,
// PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md — "Price + status + units"
// triggers a broker-on-change alert, not every autosave keystroke).
const BROKER_ALERT_WATCH_KEYS = [
  "price", "rentPerSqm", "camc", "acCharges", "nightlyRate", "rent", "rentalRate",
  "listedPrice", "Listed_Price", "priceStatus", "Price_Status", "availability",
];

const SERVER_OWNED_DETAIL_KEYS = new Set([
  "temp_storage_path",
  "airtable_record_id",
  "process_attempts",
  "pdf_verification_required",
  "pdf_deleted_at",
  "ai_confidence",
  "ai_gaps",
  "processed_at",
  "pdf_verified",
  "verified",
  "quarantine_reason",
  "quarantined_at",
  "canonical_slug",
  "slug",
  "owner_id",
]);

function stripServerOwnedDetails(detailsObj) {
  if (!detailsObj || typeof detailsObj !== "object" || Array.isArray(detailsObj)) return {};
  const cleaned = {};
  for (const [k, v] of Object.entries(detailsObj)) {
    if (SERVER_OWNED_DETAIL_KEYS.has(k) || k.startsWith("_") || k.startsWith("internal_")) {
      continue;
    }
    cleaned[k] = v;
  }
  return cleaned;
}

function cleanOptionalHttpUrl(rawUrl) {
  if (rawUrl == null) return { ok: true, value: null };
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return { ok: true, value: "" };
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, value: null };
    }
    return { ok: true, value: parsed.toString() };
  } catch {
    return { ok: false, value: null };
  }
}

const updateSchema = z.object({
  title: z.string().max(255).optional(),
  type: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  space_category: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  price: z.union([z.string().max(100), z.number().finite().nonnegative()]).optional(),
  description: z.string().max(10000).optional(),
  mediaLink: z.string().max(2000).optional(),
  media_link: z.string().max(2000).optional(),
  photos: z.array(z.string().max(2000)).max(50).optional(),
  matterportTourUrl: z.string().max(2000).optional(),
  completenessScore: z.number().finite().min(0).max(100).optional(),
  details: z.record(z.any()).optional(),
  quietly_open_to_offers: z.boolean().optional(),
  contact_preference: z.enum(["owner_only", "broker_only", "owner_and_brokers"]).optional()
});

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const { submissionId, data } = body && typeof body === "object" && !Array.isArray(body) ? body : {};

    if (!submissionId || !data) {
      return NextResponse.json({ error: "Missing submissionId or data" }, { status: 400 });
    }

    let userId = null;

    // 1. Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = /^Bearer\s+(.+)$/i.exec(authHeader || "")?.[1]?.trim() || null;
    
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
    const resolvedCategory = validatedData.space_category || validatedData.category;
    const supabasePayload = {
      title: validatedData.title ? stripAllTags(validatedData.title) : currentSubmission.title,
      type: validatedData.type ? stripAllTags(validatedData.type) : currentSubmission.type,
      location: validatedData.location ? stripAllTags(validatedData.location) : currentSubmission.location,
      // GAP-98: Preserve space_category so Airtable category-scoped field mapping is not bypassed
      space_category: resolvedCategory ? stripAllTags(resolvedCategory) : currentSubmission.space_category,
    };
    if (validatedData.price !== undefined) {
      supabasePayload.price =
        typeof validatedData.price === "string"
          ? stripAllTags(validatedData.price)
          : validatedData.price;
    }
    if (validatedData.description !== undefined) {
      supabasePayload.description = stripAllTags(validatedData.description);
    }
    const rawMediaLink =
      validatedData.media_link !== undefined ? validatedData.media_link : validatedData.mediaLink;
    if (rawMediaLink !== undefined) {
      const checkedMedia = cleanOptionalHttpUrl(rawMediaLink);
      if (!checkedMedia.ok) {
        return NextResponse.json({ error: "Invalid media URL protocol" }, { status: 400 });
      }
      supabasePayload.media_link = checkedMedia.value;
    }
    if (typeof validatedData.quietly_open_to_offers === "boolean") {
      if (lifecycleState !== PROPERTY_LIFECYCLE_STATES.OFF_MARKET) {
        return NextResponse.json({ error: "Quietly open to offers is only available for off-market listings" }, { status: 409 });
      }
      supabasePayload.quietly_open_to_offers = validatedData.quietly_open_to_offers;
    }

    // Merge details JSONB safely with deep recursive sanitization and strip server-owned keys
    const sanitizedClientDetails = validatedData.details
      ? sanitizeObject(stripServerOwnedDetails(validatedData.details))
      : {};
    const mergedDetails = {
      ...(currentSubmission.details || {}),
      ...sanitizedClientDetails,
    };
    if (validatedData.photos !== undefined) {
      mergedDetails.photos = validatedData.photos
        .map((url) => cleanOptionalHttpUrl(url))
        .filter((res) => res.ok && res.value)
        .map((res) => res.value);
    }
    if (validatedData.matterportTourUrl !== undefined) {
      const checkedTour = cleanOptionalHttpUrl(validatedData.matterportTourUrl);
      if (!checkedTour.ok) {
        return NextResponse.json({ error: "Invalid 3D tour URL protocol" }, { status: 400 });
      }
      mergedDetails.matterportTourUrl = checkedTour.value;
    }
    if (validatedData.completenessScore !== undefined) {
      mergedDetails.completenessScore = validatedData.completenessScore;
    }
    if (validatedData.contact_preference) {
      mergedDetails.contact_preference = validatedData.contact_preference;
    }
    if (
      validatedData.details ||
      validatedData.contact_preference ||
      validatedData.photos !== undefined ||
      validatedData.matterportTourUrl !== undefined ||
      validatedData.completenessScore !== undefined
    ) {
      supabasePayload.details = mergedDetails;
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
          const airtablePayload = currentSubmission.details?.airtable_record_id
            ? { ...supabasePayload, airtable_record_id: currentSubmission.details.airtable_record_id }
            : supabasePayload;
          await updateProperty(apiKey, baseId, slug, airtablePayload);
          
          // Never replace the first-publication canonical slug with Airtable's formula result.
        } catch (airtableErr) {
          console.error("[UPDATE API] Airtable update failed:", airtableErr);
          return NextResponse.json({ success: false, retryable: true, warning: "Supabase updated; Airtable sync is pending and can be retried." }, { status: 502 });
        }
      } else {
        console.warn("[UPDATE API] Airtable credentials missing, skipping sync.");
      }
    }

    // Draft edits do not change the public catalogue and must not force a
    // four-table rebuild on the next visit. Live edits do need a purge.
    let publicCachePending = false;
    if (lifecycleState === PROPERTY_LIFECYCLE_STATES.LIVE) {
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
