"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, logAction, TIERS } from "@/lib/rbac";
import { pushBriefingToAirtable, publishedMarkers } from "@/lib/intelPublish";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";

/**
 * The OSINT Control Center, as Mission Control's own capability.
 *
 * It used to be a client component fetching
 * `${NEXT_PUBLIC_MAIN_SITE_URL}/api/admin/osint` with no Authorization header,
 * against a variable that was set in neither app. The URL resolved to this
 * app's own origin, where that route does not exist, so the page had never
 * loaded a single row. Publishing an article from here has never once worked.
 *
 * These are server actions rather than a fixed-up cross-app fetch. See
 * `src/lib/crossAppPolicy.mjs` for the decision and what was rejected: briefly,
 * the main site's `requireAdmin` reads `user_profiles.role`, this app's staff
 * live in `admin_users` with a tier, and bridging the two would mean a third
 * competing answer to "is this person staff" inside the security check.
 *
 * Every action below is tier-gated first, audited after, and — because
 * publishing an article is machine work with an outcome staff cannot see —
 * mirrored into the system event log.
 */

/** Read the OSINT queue. Agent (Tier 1)+. */
export async function loadOsintWorkspace() {
  const staff = await getCurrentStaff();
  if (!staff) return { sources: [], briefings: [], error: "Not authorised" };
  try {
    assertTier(staff, TIERS.AGENT);
  } catch {
    return { sources: [], briefings: [], error: "Not authorised" };
  }

  const admin = createAdminClient();

  const [sourcesResult, briefingsResult] = await Promise.all([
    admin.from("intel_sources").select("*").order("created_at", { ascending: false }).limit(200),
    admin.from("intel_briefings").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  // Reported separately rather than collapsed into one empty list: "there is
  // nothing in the queue" and "the queue could not be read" look identical on
  // screen and mean opposite things.
  const error =
    sourcesResult.error?.message || briefingsResult.error?.message || null;

  return {
    sources: sourcesResult.data || [],
    briefings: briefingsResult.data || [],
    error,
  };
}

/** Add a raw signal by hand. Agent (Tier 1)+. */
export async function addOsintSignal(formData) {
  const staff = await getCurrentStaff();
  if (!staff) return { ok: false, message: "Not authorised" };
  try {
    assertTier(staff, TIERS.AGENT);
  } catch {
    return { ok: false, message: "Not authorised" };
  }

  const value = (k) => (formData.get(k) ?? "").toString().trim();
  const rawTitle = value("rawTitle");
  const rawContent = value("rawContent");

  if (!rawTitle || !rawContent) {
    return { ok: false, message: "A signal needs both a title and its content." };
  }

  const num = (k, fallback) => {
    const n = Number(formData.get(k));
    return Number.isFinite(n) ? n : fallback;
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("intel_sources")
    .insert({
      source_name: value("sourceName") || "Manual Mission Control Entry",
      source_url: value("sourceUrl"),
      raw_title: rawTitle,
      raw_content: rawContent,
      city: value("city") || "BGC, Taguig",
      region: value("region") || "Metro Manila",
      lat: num("lat", 14.5547),
      lng: num("lng", 121.0244),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  await logAction({
    staff,
    action: "osint.signal.add",
    targetTable: "intel_sources",
    targetId: data.id,
    metadata: { source_name: value("sourceName") || "Manual Mission Control Entry" },
  });

  revalidatePath("/dashboard/osint");
  return { ok: true, message: "Signal added to the OSINT queue." };
}

/** Build the master AI prompt for a set of signals. Agent (Tier 1)+. */
export async function generateOsintPrompt(sourceIds) {
  const staff = await getCurrentStaff();
  if (!staff) return { ok: false, message: "Not authorised" };
  try {
    assertTier(staff, TIERS.AGENT);
  } catch {
    return { ok: false, message: "Not authorised" };
  }

  const ids = Array.isArray(sourceIds) ? sourceIds.filter(Boolean) : [];
  if (ids.length === 0) return { ok: false, message: "Select at least one signal first." };

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("generate_osint_master_prompt", { source_ids: ids });

  if (error) return { ok: false, message: error.message };
  return { ok: true, prompt: data };
}

/**
 * Publish a synthesised briefing: Supabase draft, then the Airtable bridge.
 * Ops Manager (Tier 2)+ — this puts words on the public site under ScoutIt's name.
 *
 * The ordering and the honesty of the result are load-bearing. The Supabase row
 * is the draft of record and is committed first. The Airtable hop is
 * non-fatal — losing it is a sync problem, not a lost article — but the outcome
 * is reported as what it actually was, and `published_to_airtable` is set in
 * exactly one place, by `publishedMarkers`, which refuses to produce the flag
 * without a real record id. A schema must never certify something that did not
 * happen.
 */
export async function publishOsintBriefing({ briefingData, sourceId }) {
  const staff = await getCurrentStaff();
  if (!staff) return { ok: false, message: "Not authorised" };
  try {
    assertTier(staff, TIERS.OPS_MANAGER);
  } catch (err) {
    return { ok: false, message: err.message };
  }

  if (!briefingData?.title || !briefingData?.slug) {
    return { ok: false, message: "A briefing needs at least a title and a slug." };
  }

  const admin = createAdminClient();

  const { data: inserted, error: insertErr } = await admin
    .from("intel_briefings")
    .insert({
      source_id: sourceId || null,
      slug: briefingData.slug,
      title: briefingData.title,
      category: briefingData.category || "MARKET INTEL",
      excerpt: briefingData.excerpt || "",
      lead: briefingData.lead || "",
      our_take: briefingData.our_take || "",
      cover_image_url:
        briefingData.cover_image_url ||
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop",
      body_json: briefingData.body_json || [],
      city: briefingData.city || "BGC, Taguig",
      region: briefingData.region || "Metro Manila",
      lat: briefingData.lat ?? 14.5547,
      lng: briefingData.lng ?? 121.0244,
      source_name: briefingData.sourceName || briefingData.source_name || "OSINT Gazette",
      source_url: briefingData.sourceUrl || briefingData.source_url || "",
      published_to_airtable: false,
    })
    .select("*")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, message: `The draft could not be saved: ${insertErr?.message}` };
  }

  let airtableStatus = "unconfigured";
  let airtableRecordId = null;
  let airtableError = null;

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (apiKey && baseId) {
    try {
      const { recordId } = await pushBriefingToAirtable({
        apiKey,
        baseId,
        briefing: inserted,
        relatedPropertyIds: Array.isArray(briefingData.relatedPropertyIds)
          ? briefingData.relatedPropertyIds
          : [],
      });
      await admin.from("intel_briefings").update(publishedMarkers(recordId)).eq("id", inserted.id);
      airtableRecordId = recordId;
      airtableStatus = "published";
    } catch (err) {
      airtableStatus = "failed";
      airtableError = err.message;
    }
  }

  await recordSystemEvent({
    event: airtableStatus === "published" ? EVENTS.AIRTABLE_PUBLISH_OK : EVENTS.AIRTABLE_PUBLISH_FAILED,
    severity: airtableStatus === "published" ? "info" : "error",
    subjectTable: "intel_briefings",
    subjectId: inserted.id,
    summary:
      airtableStatus === "published"
        ? `Briefing '${inserted.slug}' synced to Airtable INTEL_CMS`
        : `Briefing '${inserted.slug}' saved as a draft but did not reach Airtable (${airtableStatus})`,
    detail: { slug: inserted.slug, airtableStatus, airtableRecordId, error: airtableError },
  });

  await logAction({
    staff,
    action: "osint.briefing.publish",
    targetTable: "intel_briefings",
    targetId: inserted.id,
    metadata: {
      slug: inserted.slug,
      airtable_status: airtableStatus,
      airtable_record_id: airtableRecordId,
    },
  });

  if (sourceId) {
    await admin
      .from("intel_sources")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", sourceId);
  }

  revalidatePath("/dashboard/osint");

  // The message names what actually happened. "Published" must not mean
  // "a Supabase row exists" — that is not what a reader of the word assumes.
  const message =
    airtableStatus === "published"
      ? "Draft saved and synced to Airtable. Tick Approved_For_Live_Site there to put it on the public site."
      : airtableStatus === "failed"
        ? `Draft saved to Supabase, but the Airtable sync failed (${airtableError}). The article is not in the CMS yet.`
        : "Draft saved to Supabase. Airtable is not configured, so it was not synced.";

  return { ok: true, message, airtable: { status: airtableStatus, recordId: airtableRecordId } };
}
