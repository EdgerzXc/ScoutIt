// ─────────────────────────────────────────────────────────────────────────
// CONNECT SOURCE CONTEXT (A-144 — Connect Rules v1 §4/§7/§17, invariant #7)
//
// Every Connect must carry its origin: signal / profile / property /
// promotion / enterprise form. The `deals` table has no source columns and
// adding any is migration-gated (O-004), so the context travels in
// `crm_activity_log.metadata` (JSON, no schema change) AND back to the
// caller in the API response for analytics (`source_context`).
//
// Reason tags are normalized for analytics only — the sender's first message
// stays the human reason (§4: no artificial category required).
// ─────────────────────────────────────────────────────────────────────────

export const CONNECT_SOURCES = Object.freeze([
  "stratosphere_signal",
  "profile",
  "property",
  "promotion",
  "enterprise_form",
  "general",
]);

export const CONNECT_REASON_TAGS = Object.freeze([
  "GENERAL_CONNECT",
  "SIGNAL_CONNECT",
  "PROPERTY_CONNECT",
  "PROMOTION_CONNECT",
  "ENTERPRISE_INQUIRY",
  "REPRESENTATION_REQUEST",
  "OPERATOR_REQUEST",
]);

export const CONNECT_IDENTITY_MODES = Object.freeze(["public", "anonymous", "organization"]);

function cleanString(v, max = 120) {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t || null;
}

/**
 * Normalize caller-supplied source context. Never throws — unknown values
 * fall back to `general` / `GENERAL_CONNECT` / `public` so a bad param can
 * never block a paid send (Rule 6: fail closed only where safety demands).
 */
export function normalizeConnectSource(input = {}) {
  const rawSource = cleanString(input.source_type, 40);
  const source_type = CONNECT_SOURCES.includes(rawSource) ? rawSource : "general";
  const rawTag = cleanString(input.reason_tag, 40);
  const reason_tag = CONNECT_REASON_TAGS.includes(rawTag)
    ? rawTag
    : source_type === "stratosphere_signal"
      ? "SIGNAL_CONNECT"
      : source_type === "property"
        ? "PROPERTY_CONNECT"
        : source_type === "promotion"
          ? "PROMOTION_CONNECT"
          : source_type === "enterprise_form"
            ? "ENTERPRISE_INQUIRY"
            : "GENERAL_CONNECT";
  const rawMode = cleanString(input.sender_identity_mode, 20)?.toLowerCase();
  const sender_identity_mode = CONNECT_IDENTITY_MODES.includes(rawMode) ? rawMode : "public";
  return {
    source_type,
    source_id: cleanString(input.source_id, 120),
    reason_tag,
    sender_identity_mode,
  };
}

/**
 * Metadata payload stored on the `inquiry` / `deal_created` activity row.
 * Carries the auditable send event: who, what origin, what identity mode,
 * when. Balance-bucket detail comes from the spend RPC result at the call
 * site and is merged in there (see initiate/pitch/invite routes).
 */
export function connectSourceMetadata(normalized, extra = {}) {
  return {
    source_type: normalized.source_type,
    source_id: normalized.source_id,
    reason_tag: normalized.reason_tag,
    sender_identity_mode: normalized.sender_identity_mode,
    sent_at: new Date().toISOString(),
    ...extra,
  };
}
