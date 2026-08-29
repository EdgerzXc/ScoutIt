import { resolveBrokerAuthorityId } from "@/lib/brokerDossier";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const COLUMNS = [
  "broker_id", "portrait_url", "biography", "firm", "markets", "categories",
  "languages", "service_areas", "working_style", "availability",
  "intro_media_url", "revision", "published_revision", "publish_state",
  "airtable_record_id", "published_at", "updated_at",
].join(", ");

const emptyDraft = () => ({
  portraitUrl: "",
  biography: "",
  firm: "",
  markets: [],
  categories: [],
  languages: [],
  serviceAreas: [],
  workingStyle: "",
  availability: "not_set",
  introMediaUrl: "",
});

function recordFromRow(brokerId, row) {
  return {
    brokerId,
    revision: Number(row?.revision || 0),
    publishedRevision: row?.published_revision == null ? null : Number(row.published_revision),
    publishState: row?.publish_state || "draft",
    airtableRecordId: row?.airtable_record_id || null,
    publishedAt: row?.published_at || null,
    updatedAt: row?.updated_at || null,
    draft: row ? {
      portraitUrl: row.portrait_url || "",
      biography: row.biography || "",
      firm: row.firm || "",
      markets: row.markets || [],
      categories: row.categories || [],
      languages: row.languages || [],
      serviceAreas: row.service_areas || [],
      workingStyle: row.working_style || "",
      availability: row.availability || "not_set",
      introMediaUrl: row.intro_media_url || "",
    } : emptyDraft(),
  };
}

export function hasBrokerDossierAuthority(userId, brokers = []) {
  const authorityId = resolveBrokerAuthorityId(userId);
  return Boolean(authorityId && brokers.some((broker) => resolveBrokerAuthorityId(broker?.id) === authorityId));
}

export async function loadBrokerDossierDraft(brokerId, client = supabaseAdmin) {
  if (!client) return { ok: false, reason: "service_unavailable" };
  const { data, error } = await client
    .from("broker_dossier_drafts")
    .select(COLUMNS)
    .eq("broker_id", brokerId)
    .maybeSingle();
  if (error) return { ok: false, reason: "schema_unavailable" };
  return { ok: true, record: recordFromRow(brokerId, data) };
}

export async function saveBrokerDossierDraft({
  brokerId,
  actorId,
  expectedRevision,
  draft,
  client = supabaseAdmin,
}) {
  if (!client) return { ok: false, reason: "service_unavailable" };
  if (brokerId !== actorId) return { ok: false, reason: "forbidden" };
  const { data, error } = await client.rpc("save_broker_dossier_draft", {
    p_broker_id: brokerId,
    p_actor_id: actorId,
    p_expected_revision: expectedRevision,
    p_draft: draft,
  });
  if (error) return { ok: false, reason: /STALE_DRAFT_REVISION/.test(error.message || "") ? "stale_revision" : "save_failed" };
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, record: recordFromRow(brokerId, row) };
}

export async function markBrokerDossierPublished({
  brokerId,
  actorId,
  expectedRevision,
  airtableRecordId,
  client = supabaseAdmin,
}) {
  if (!client) return { ok: false, reason: "service_unavailable" };
  if (brokerId !== actorId) return { ok: false, reason: "forbidden" };
  const { data, error } = await client.rpc("mark_broker_dossier_published", {
    p_broker_id: brokerId,
    p_actor_id: actorId,
    p_expected_revision: expectedRevision,
    p_airtable_record_id: airtableRecordId,
  });
  if (error) return { ok: false, reason: /STALE_DRAFT_REVISION/.test(error.message || "") ? "stale_revision" : "publish_marker_failed" };
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, record: recordFromRow(brokerId, row) };
}
