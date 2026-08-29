// ═══════════════════════════════════════════════════════════════
// A-023 gap G4 — Career History, the SECONDARY statistics template.
//
// This module is pure, and its whole reason for existing is separation. The
// ScoutIt Record is computed from auditable platform events; Career History is
// what the broker says about work done elsewhere. A-023 forbids adding,
// averaging, normalizing or visually merging the two.
//
// Three structural guarantees keep that true:
//
//  1. Nothing here produces a score, weight or rank, and no export takes a
//     ScoutIt snapshot as an argument. There is no code path along which a
//     career claim could reach a computed figure.
//  2. Every published claim carries its unit, its coverage period and a
//     provenance label. A historical count without its span is unfalsifiable.
//  3. `verificationState` is never settable by the broker. Attestation is the
//     broker saying so; review is ScoutIt saying so, and only the second may
//     change the label.
//
// State names are distinct from the representation, recommendation,
// contribution and metric enums on purpose.
// ═══════════════════════════════════════════════════════════════

const text = (value) => String(value ?? "").trim();

export const CAREER_SECTION_STATES = Object.freeze({
  LISTED: "listed",
  NONE_PUBLISHABLE: "none_publishable",
  NOT_LINKED: "not_linked",
  LOOKUP_FAILED: "lookup_failed",
});

/** The complete set of claims a broker may make. Anything else is refused. */
export const CAREER_METRIC_KEYS = Object.freeze([
  "years_practicing",
  "historical_transactions",
  "historical_volume",
  "markets_served",
  "property_types",
]);

export const CAREER_METRIC_LABELS = Object.freeze({
  years_practicing: "Years practising",
  historical_transactions: "Transactions (before ScoutIt)",
  historical_volume: "Transaction volume (before ScoutIt)",
  markets_served: "Markets served",
  property_types: "Property types",
});

const CLAIM_KEYS = Object.freeze([
  "metricKey",
  "valueNumeric",
  "valueText",
  "unit",
  "currency",
  "coverageStart",
  "coverageEnd",
  "sourceNote",
  "attested",
]);

const HTML = /<[^>]*>/;
const EMAIL = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i;
const PHONE = /(?:\+?\d[\s().-]*){7,}/;
const CONTACT_CHANNEL = /\b(?:whats?app|viber|telegram|wechat|signal)\b/i;

const year = (iso) => {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getUTCFullYear();
};

/**
 * A claim reaches the public dossier only when all of these hold. Each is a
 * positive check; none is inferred from absence.
 */
export function isPublishableCareerClaim(row) {
  if (!row) return false;
  if (row.publishState !== "published") return false;
  if (!row.attestedAt) return false;
  if (row.withdrawnAt) return false;
  if (!text(row.unit)) return false;
  if (!text(row.sourceNote)) return false;
  if (!row.coverageStart || !row.coverageEnd) return false;
  return row.valueNumeric !== null || Boolean(text(row.valueText));
}

function card(row) {
  const reviewed = row.verificationState === "scoutit_reviewed";
  const start = year(row.coverageStart);
  const end = year(row.coverageEnd);

  return {
    id: text(row.id),
    metricKey: text(row.metricKey),
    label: CAREER_METRIC_LABELS[text(row.metricKey)] || "Declared experience",
    value: row.valueNumeric === null || row.valueNumeric === undefined
      ? text(row.valueText)
      : Number(row.valueNumeric),
    unit: text(row.unit),
    currency: text(row.currency) || null,
    coverageLabel: start && end ? `${start} – ${end}` : null,
    sourceNote: text(row.sourceNote),
    // The label the public sees. Attestation alone never upgrades it.
    provenance: reviewed ? "ScoutIt-reviewed" : "Broker-declared",
    reviewedAt: reviewed ? row.reviewedAt || null : null,
  };
}

/**
 * Build the secondary Career History section.
 *
 * Deliberately takes no ScoutIt snapshot and no rating input: there is no
 * parameter through which the primary record could influence this one, or
 * vice versa.
 */
export function buildCareerHistorySection({ authorityId = null, lookup = { ok: false } } = {}) {
  if (!authorityId) {
    return { state: CAREER_SECTION_STATES.NOT_LINKED, cards: [], claimsEmptiness: false };
  }
  if (!lookup?.ok) {
    return { state: CAREER_SECTION_STATES.LOOKUP_FAILED, cards: [], claimsEmptiness: false };
  }

  const cards = (lookup.claims || [])
    .filter(isPublishableCareerClaim)
    .map(card)
    .sort((a, b) => CAREER_METRIC_KEYS.indexOf(a.metricKey) - CAREER_METRIC_KEYS.indexOf(b.metricKey));

  return {
    state: cards.length ? CAREER_SECTION_STATES.LISTED : CAREER_SECTION_STATES.NONE_PUBLISHABLE,
    cards,
    claimsEmptiness: cards.length === 0,
  };
}

/**
 * Validate one broker-submitted career claim.
 *
 * Unknown keys are refused rather than stripped, so a broker sending
 * `verificationState: "scoutit_reviewed"` is told no instead of silently
 * having it dropped.
 */
export function validateCareerClaim(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const errors = {};

  const unknownFields = Object.keys(source)
    .filter((key) => !CLAIM_KEYS.includes(key))
    .sort();
  if (unknownFields.length) errors.unknownFields = unknownFields;

  const metricKey = text(source.metricKey);
  if (!CAREER_METRIC_KEYS.includes(metricKey)) {
    errors.metricKey = "Choose one of the supported experience fields.";
  }

  const hasNumber = source.valueNumeric !== undefined && source.valueNumeric !== null && source.valueNumeric !== "";
  const valueNumeric = hasNumber ? Number(source.valueNumeric) : null;
  const valueText = text(source.valueText);
  if (!hasNumber && !valueText) {
    errors.value = "Enter a value.";
  }
  if (hasNumber && (!Number.isFinite(valueNumeric) || valueNumeric < 0)) {
    errors.valueNumeric = "Enter a number of zero or more.";
  }
  if (valueText && (valueText.length > 200 || HTML.test(valueText))) {
    errors.valueText = "Use plain text, 200 characters or fewer.";
  }

  const unit = text(source.unit);
  if (!unit) errors.unit = "A unit is required so the number can be read.";
  if (unit.length > 40) errors.unit = "Use 40 characters or fewer.";

  const coverageStart = text(source.coverageStart);
  const coverageEnd = text(source.coverageEnd);
  if (!coverageStart) errors.coverageStart = "State when this period begins.";
  if (!coverageEnd) errors.coverageEnd = "State when this period ends.";
  if (coverageStart && coverageEnd) {
    const start = new Date(coverageStart).getTime();
    const end = new Date(coverageEnd).getTime();
    if (!Number.isFinite(start)) errors.coverageStart = "Use a valid date.";
    if (!Number.isFinite(end)) errors.coverageEnd = "Use a valid date.";
    if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
      errors.coverageEnd = "The period cannot end before it begins.";
    }
  }

  const sourceNote = text(source.sourceNote);
  if (!sourceNote) {
    errors.sourceNote = "Say where this figure comes from.";
  } else if (sourceNote.length > 400 || HTML.test(sourceNote)) {
    errors.sourceNote = "Use plain text, 400 characters or fewer.";
  } else if (EMAIL.test(sourceNote) || PHONE.test(sourceNote) || CONTACT_CHANNEL.test(sourceNote)) {
    errors.sourceNote = "Direct contact details are not allowed here.";
  }

  // Explicit boolean only. Attestation is a statement, not a default.
  if (source.attested !== true) {
    errors.attested = "You must attest that this figure is accurate.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      metricKey,
      valueNumeric,
      valueText,
      unit,
      currency: text(source.currency),
      coverageStart,
      coverageEnd,
      sourceNote,
    },
  };
}
