// ═══════════════════════════════════════════════════════════════
// INTEL PUBLISH BRIDGE — Supabase draft → Airtable published article
//
// THE RULE THIS IMPLEMENTS (AGENTS.md, Dual-CMS Golden Rule)
// ---------------------------------------------------------
//   SUPABASE = private capture and drafting
//   AIRTABLE = public read-only content
//   The bridge is publish.
//
// Properties already work this way (/api/dashboard/publish). Articles were
// designed to and never did: `intel_briefings` has carried
// `published_to_airtable` and `airtable_record_id` since it was created, and
// the ONLY line in the codebase touching either hardcoded
// `published_to_airtable: true` on insert. Nothing ever wrote to Airtable and
// nothing ever read the columns back — a column that certified something that
// never happened (Standing Rule 7: a schema must never manufacture a claim).
//
// ⚠️ SLUG IS WRITABLE HERE. AGENTS.md forbids writing `Slug` in an Airtable
// payload — that rule is about PROPERTIES_CMS, where Slug is a FORMULA field
// computed from Title. In INTEL_CMS `Slug` is a plain singleLineText
// (`fldoykXa6DXK6TLPf`), so it must be written or the article publishes with
// no URL. Verified against the live schema, not assumed. Do not "fix" this by
// removing the field.
// ═══════════════════════════════════════════════════════════════

const BASE_URL = "https://api.airtable.com/v0";
const INTEL_TABLE = "INTEL_CMS";

/**
 * Build the Airtable field payload for a briefing.
 *
 * Kept pure and exported so the mapping can be tested without a network call —
 * the mapping is where this class of bug lives (see SEO_Title, Floor_Plans,
 * Related_Property), not in the HTTP.
 *
 * @param {object} briefing A row from Supabase `intel_briefings`
 * @param {string[]} [relatedPropertyIds] Airtable PROPERTIES_CMS record ids
 */
export function buildIntelFields(briefing, relatedPropertyIds = []) {
  if (!briefing || !briefing.slug || !briefing.title) {
    throw new Error("intelPublish: briefing requires at least slug and title");
  }

  const body = briefing.body_json;
  // Supabase stores jsonb; Airtable holds the same blocks as a JSON *string*.
  const bodyJsonString = Array.isArray(body)
    ? JSON.stringify(body)
    : typeof body === "string"
      ? body
      : "";

  const fields = {
    Title: briefing.title,
    Slug: briefing.slug, // writable here — see the header note
    Excerpt: briefing.excerpt || "",
    Lead: briefing.lead || "",
    Body_JSON: bodyJsonString,
    City: briefing.city || "",
    Date: briefing.published_at
      ? String(briefing.published_at).slice(0, 10)
      : new Date().toISOString().slice(0, 10),

    // The editorial gates stay OFF on publish-to-Airtable. Reaching Airtable is
    // not the same as being approved for the public site: `fetchIntel` filters
    // on Approved_For_Live_Site, and flipping it here would let the bridge
    // publish straight past human review. A person ticks that box.
    Approved_For_Live_Site: false,
  };

  if (briefing.category) fields.IntelType = briefing.category;

  // Provenance. An OSINT briefing without its source is an assertion with no
  // receipt, and this product does not render those.
  if (briefing.source_name || briefing.source_url) {
    fields.AI_Draft_Notes = [
      briefing.source_name ? `Source: ${briefing.source_name}` : null,
      briefing.source_url || null,
      briefing.our_take ? `Our take: ${briefing.our_take}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (briefing.cover_image_url) fields.Image = briefing.cover_image_url;

  // Experience reference — the interactive itself is CODE in the repo, keyed by
  // this id in the Experience Registry. Only the key and its small config
  // travel with the article, which is why adding articles costs kilobytes and
  // not megabytes. Blank = plain block article, always valid.
  if (briefing.experience_id) fields.Experience_ID = briefing.experience_id;
  if (briefing.experience_config) {
    fields.Experience_Config =
      typeof briefing.experience_config === "string"
        ? briefing.experience_config
        : JSON.stringify(briefing.experience_config);
  }

  if (Array.isArray(relatedPropertyIds) && relatedPropertyIds.length > 0) {
    fields.Related_Property = relatedPropertyIds;
  }

  return fields;
}

/**
 * Create or update the Airtable article for a briefing.
 *
 * Idempotent: given an existing `airtable_record_id` it PATCHes rather than
 * creating a duplicate. Publishing twice is a normal editorial action, not an
 * error, and a bridge that produces a second article every time it runs is
 * worse than one that fails loudly.
 *
 * @returns {Promise<{recordId: string, created: boolean}>}
 */
export async function pushBriefingToAirtable({
  apiKey,
  baseId,
  briefing,
  relatedPropertyIds = [],
  fetchImpl = fetch,
}) {
  if (!apiKey || !baseId) throw new Error("intelPublish: missing Airtable credentials");

  const fields = buildIntelFields(briefing, relatedPropertyIds);
  const existingId = briefing.airtable_record_id || null;

  const url = existingId
    ? `${BASE_URL}/${baseId}/${INTEL_TABLE}/${existingId}`
    : `${BASE_URL}/${baseId}/${INTEL_TABLE}`;

  const body = existingId
    ? { fields, typecast: true }
    : { records: [{ fields }], typecast: true };

  const res = await fetchImpl(url, {
    method: existingId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    // Loud on purpose. The caller must NOT mark the briefing published when
    // this throws — that is the exact defect this module exists to end.
    throw new Error(`Airtable intel publish failed: ${res.status} ${errText}`);
  }

  const result = await res.json();
  const recordId = existingId ? result.id : result?.records?.[0]?.id;

  if (!recordId) {
    throw new Error("Airtable intel publish returned no record id");
  }

  return { recordId, created: !existingId };
}

/**
 * The fields to write back to Supabase AFTER a confirmed Airtable write.
 *
 * Separated from the write so the ordering is impossible to get wrong: there is
 * no way to call this without a record id, and no reason to call it unless the
 * push resolved.
 */
export function publishedMarkers(recordId) {
  if (!recordId) throw new Error("intelPublish: refusing to mark published without a record id");
  return {
    airtable_record_id: recordId,
    published_to_airtable: true,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
