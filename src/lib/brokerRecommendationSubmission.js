// ═══════════════════════════════════════════════════════════════
// A-023 audit gap G1 — what a client may submit as a recommendation.
//
// Pure boundary. The route owns authentication and the relationship check;
// this owns content and consent.
//
// Consent is the load-bearing rule. It must arrive as an explicit boolean
// `true`: not "true", not 1, not absent-and-assumed. A recommendation is
// published under a real person's chosen attribution, and inferring their
// agreement from a truthy value is exactly the kind of manufactured claim
// Rule 7 exists to prevent.
//
// The content controls are the same ones the broker's own narrative is held
// to, and reuse the same validator so the two cannot drift apart.
// ═══════════════════════════════════════════════════════════════

import { ATTRIBUTION_MODES } from "@/lib/brokerRecommendations";

export const MAX_RECOMMENDATION_LENGTH = 2000;

const SUBMISSION_KEYS = Object.freeze([
  "brokerId",
  "body",
  "attributionMode",
  "authorDisplayName",
  "relationshipType",
  "consentGranted",
]);

const SUPPORTED_MODES = new Set(Object.values(ATTRIBUTION_MODES));
const NAMED_MODES = new Set([ATTRIBUTION_MODES.FULL_NAME, ATTRIBUTION_MODES.INITIALS]);

const HTML = /<[^>]*>/;
const EMAIL = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i;
const PHONE = /(?:\+?\d[\s().-]*){7,}/;
const CONTACT_CHANNEL = /\b(?:whats?app|viber|telegram|wechat|signal)\b/i;
const UNSUPPORTED_CLAIM =
  /(?:#\s*1|\bnumber\s+one\b|\bbest\s+broker\b|\bhands\s+down\s+the\s+best\b|\bguaranteed\s+(?:returns?|results?)\b)/i;

const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

function bodyError(body) {
  if (!body) return "Write a few words about working with this advisor.";
  if (body.length > MAX_RECOMMENDATION_LENGTH) {
    return `Must be ${MAX_RECOMMENDATION_LENGTH} characters or fewer.`;
  }
  if (HTML.test(body)) return "Markup is not allowed.";
  if (EMAIL.test(body) || PHONE.test(body) || CONTACT_CHANNEL.test(body)) {
    return "Direct contact details are not allowed in a public recommendation.";
  }
  if (UNSUPPORTED_CLAIM.test(body)) {
    return "Unsupported superiority or outcome claims are not allowed.";
  }
  return null;
}

/**
 * Validate one client-submitted recommendation.
 *
 * Unknown keys are REJECTED rather than stripped. Silently dropping
 * `moderationState` or `qualifyingHandshakeId` would let a client believe they
 * had self-approved or self-verified; refusing tells them plainly that those
 * are not theirs to set.
 */
export function validateRecommendationSubmission(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const errors = {};

  const unknownFields = Object.keys(source)
    .filter((key) => !SUBMISSION_KEYS.includes(key))
    .sort();
  if (unknownFields.length) errors.unknownFields = unknownFields;

  const brokerId = clean(source.brokerId);
  if (!brokerId) errors.brokerId = "A broker is required.";

  const body = clean(source.body);
  const bodyProblem = bodyError(body);
  if (bodyProblem) errors.body = bodyProblem;

  const attributionMode = clean(source.attributionMode);
  if (!SUPPORTED_MODES.has(attributionMode)) {
    errors.attributionMode = "Choose how you would like to be credited.";
  }

  const authorDisplayName = clean(source.authorDisplayName);
  if (NAMED_MODES.has(attributionMode) && !authorDisplayName) {
    errors.authorDisplayName = "A name is required for this attribution choice.";
  }
  if (authorDisplayName && (authorDisplayName.length > 120 || HTML.test(authorDisplayName))) {
    errors.authorDisplayName = "Use plain text, 120 characters or fewer.";
  }

  const relationshipType = clean(source.relationshipType);
  if (relationshipType && (relationshipType.length > 80 || HTML.test(relationshipType))) {
    errors.relationshipType = "Use plain text, 80 characters or fewer.";
  }
  if (attributionMode === ATTRIBUTION_MODES.ROLE_ONLY && !relationshipType) {
    errors.relationshipType = "Describe your relationship to publish under it.";
  }

  // Explicit boolean true only.
  if (source.consentGranted !== true) {
    errors.consentGranted = "Consent to publish is required.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      brokerId,
      body,
      attributionMode,
      authorDisplayName,
      relationshipType,
      consentGranted: source.consentGranted === true,
    },
  };
}
