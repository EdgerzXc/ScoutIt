// A-023 phase 3 — broker-authored narrative boundary.
//
// This module is deliberately pure. The API owns authentication/ownership;
// this boundary owns what a broker may say and what may cross into Airtable.

export const BROKER_DRAFT_KEYS = Object.freeze([
  "portraitUrl",
  "biography",
  "firm",
  "markets",
  "categories",
  "languages",
  "serviceAreas",
  "workingStyle",
  "availability",
  "introMediaUrl",
]);

const ARRAY_KEYS = new Set(["markets", "categories", "languages", "serviceAreas"]);
const AVAILABILITY = new Set(["not_set", "available", "limited", "unavailable"]);
const MAX_LENGTH = Object.freeze({
  biography: 1200,
  firm: 120,
  workingStyle: 600,
});
const HTML = /<[^>]*>/;
const EMAIL = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i;
const PHONE = /(?:\+?\d[\s().-]*){7,}/;
const CONTACT_CHANNEL = /\b(?:whats?app|viber|telegram|wechat|signal)\b/i;
const UNSUPPORTED_CLAIM = /(?:#\s*1|\bnumber\s+one\b|\bbest\s+broker\b|\bguaranteed\s+(?:returns?|results?)\b)/i;
const CONFIRMED_AIRTABLE_KEYS = new Set(["portraitUrl", "biography"]);

const cleanText = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

function narrativeError(value, maxLength) {
  if (value.length > maxLength) return `Must be ${maxLength} characters or fewer.`;
  if (HTML.test(value)) return "Markup is not allowed.";
  if (EMAIL.test(value) || PHONE.test(value) || CONTACT_CHANNEL.test(value)) {
    return "Direct contact details are not allowed in the public dossier.";
  }
  if (UNSUPPORTED_CLAIM.test(value)) return "Unsupported superiority or outcome claims are not allowed.";
  return null;
}

function normalizeList(value, key, errors) {
  if (!Array.isArray(value)) {
    errors[key] = "Must be a list.";
    return [];
  }
  if (value.length > 12) errors[key] = "Use no more than 12 entries.";
  const normalized = [...new Set(value.map(cleanText).filter(Boolean))];
  if (normalized.some((item) => item.length > 80 || HTML.test(item))) {
    errors[key] = "Each entry must be plain text no longer than 80 characters.";
  }
  return normalized.slice(0, 12);
}

function normalizeHttpsUrl(value, key, errors) {
  const candidate = cleanText(value);
  if (!candidate) return "";
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" || candidate.length > 2048) throw new Error("unsafe");
    return parsed.toString();
  } catch {
    errors[key] = "Use a valid HTTPS URL.";
    return "";
  }
}

export function validateBrokerDossierDraft(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const errors = {};
  const unknownFields = Object.keys(source)
    .filter((key) => !BROKER_DRAFT_KEYS.includes(key))
    .sort();
  if (unknownFields.length) errors.unknownFields = unknownFields;

  const draft = {};
  for (const key of BROKER_DRAFT_KEYS) {
    if (ARRAY_KEYS.has(key)) {
      draft[key] = normalizeList(source[key] ?? [], key, errors);
      continue;
    }
    if (key === "portraitUrl" || key === "introMediaUrl") {
      draft[key] = normalizeHttpsUrl(source[key], key, errors);
      continue;
    }
    if (key === "availability") {
      const availability = cleanText(source[key] || "not_set").toLowerCase();
      draft[key] = AVAILABILITY.has(availability) ? availability : "not_set";
      if (!AVAILABILITY.has(availability)) errors[key] = "Choose a supported availability state.";
      continue;
    }

    const value = cleanText(source[key]);
    draft[key] = value;
    const error = narrativeError(value, MAX_LENGTH[key]);
    if (error) errors[key] = error;
  }

  return { ok: Object.keys(errors).length === 0, draft, errors };
}

export function buildBrokerNarrativeFields(input) {
  const result = validateBrokerDossierDraft(input);
  if (!result.ok) throw new Error("Invalid broker dossier draft");
  return {
    Bio: result.draft.biography,
    Image: result.draft.portraitUrl,
  };
}

export function getUnpublishableDraftFields(input) {
  const { draft } = validateBrokerDossierDraft(input);
  return BROKER_DRAFT_KEYS
    .filter((key) => !CONFIRMED_AIRTABLE_KEYS.has(key))
    .filter((key) => {
      const value = draft[key];
      if (Array.isArray(value)) return value.length > 0;
      if (key === "availability") return value !== "not_set";
      return Boolean(value);
    })
    .sort();
}
