import { SIGNAL_TYPES } from "./communitySignalsAdapter";

// ─────────────────────────────────────────────────────────────────────────
// COMMUNITY POSTING LOGIC (A-145 P1)
//
// Pure, testable rules for member-posted signals. No I/O here — the API
// routes own the database, this module owns the decisions so a test can call
// them rather than grep for them (STRUCTURE.md §3).
// ─────────────────────────────────────────────────────────────────────────

// Locked launch set (spec §5). SCOUTIT_INTELLIGENCE is system-only: the
// composer never offers it and the API refuses it from members.
export const POSTABLE_SIGNAL_TYPES = Object.freeze([
  SIGNAL_TYPES.LOOKING_FOR,
  SIGNAL_TYPES.REPRESENTING_CLIENT,
  SIGNAL_TYPES.UPCOMING_SUPPLY,
  SIGNAL_TYPES.BUSINESS_EXPANSION,
  SIGNAL_TYPES.OPPORTUNITY,
  SIGNAL_TYPES.MARKET_OBSERVATION,
  SIGNAL_TYPES.COMMERCIAL_PROMOTION,
]);

export const IDENTITY_MODES = Object.freeze(["anonymous", "public", "organization"]);

// Launch active-signal capacity by account class (spec §10). Closed/expired
// rows stop counting — capacity, never a lifetime quota.
export const SIGNAL_CAPACITY = Object.freeze({
  standard: 3,
  owner: 5,
  business: 5,
  broker: 10,
});

export function capacityFor(accountClass) {
  return SIGNAL_CAPACITY[accountClass] ?? SIGNAL_CAPACITY.standard;
}

// ── Persistent Scout ID ──────────────────────────────────────────────────
// One permanent pseudonym per account, derived deterministically so it needs
// no user-table column and no migration: the same account always resolves to
// the same SCOUT-####, and nothing about the account leaks from it. Anonymous
// mode changes display, never identity — every row still carries the real
// author_account_id underneath.
function hashAccountId(accountId) {
  let h = 2166136261;
  const s = String(accountId || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function scoutIdFor(accountId) {
  if (!accountId || typeof accountId !== "string" || accountId.trim() === "") return null;
  return `SCOUT-${String(hashAccountId(accountId) % 10000).padStart(4, "0")}`;
}

// ── Hard rules (spec §9.1 — deterministic, before any AI) ────────────────
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
// Loose PH-mobile / landline shapes: 09xxxxxxxxx, +639xxxxxxxxx, (02)….
// Narrow on purpose — a price ("₱1,200/sqm") must never trip it.
const PHONE_RE = /(?:\+?63[\s-]?9\d{2}[\s-]?\d{3}[\s-]?\d{4}|\b09\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|\(0\d{1,2}\)[\s-]?\d{3,4}[\s-]?\d{4})/;
const HANDLE_RE =
  // Long platform names match on a word boundary ("Telegram: foo"), but the
  // two-letter aliases (fb, ig) need an explicit @ — otherwise "Ortigas"
  // reads as an Instagram handle and an honest post gets refused (Rule 4:
  // showing nothing must never look like having nothing; same for refusing).
  /(?:telegram|viber|whatsapp|facebook|instagram|tiktok|wechat)\b\s*[:@]?\s*[\w.]{2,}|@[\w.]{3,}/i;
const URL_RE = /https?:\/\/[^\s)]+/gi;
// Listing-shaped: an exact address + a price + a transaction verb reads as a
// property ad, which belongs in Metropolis (Create Space), not here.
const PRICE_RE = /₱|php\s?[\d,]+|\d[\d,]*\s?\/?\s?(sqm|per sqm|mo\b)/i;
const TRANSACTION_RE = /\b(for sale|for lease|for rent|selling|leasing|renting out)\b/i;

const TITLE_MAX = 140;
const BODY_MAX = 2000;

function cleanStr(v, max) {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

/**
 * Validate a member's draft. Returns { ok, errors, normalized }.
 * Errors carry codes + human sentences (spec §9.3: explain, never raw scores).
 * LISTING_SHAPED is a redirect, not a rejection — the caller routes to
 * Create Space instead of showing a bare refusal.
 */
export function validateDraft(input = {}) {
  const errors = [];
  const fail = (code, message) => errors.push({ code, message });

  if (!input.authorAccountId || typeof input.authorAccountId !== "string") {
    fail("NO_ACCOUNT", "Posting needs a ScoutIt account. Sign in to share a signal.");
  }
  if (!POSTABLE_SIGNAL_TYPES.includes(input.signalType)) {
    fail(
      "BAD_TYPE",
      "Choose what kind of signal this is — demand, supply, opportunity, observation, expansion, or a labeled promotion."
    );
  }

  const title = cleanStr(input.title, TITLE_MAX + 1);
  const body = cleanStr(input.body, BODY_MAX + 1);
  if (title.length < 1) fail("TITLE_EMPTY", "Give the signal a short headline so scanners know what it is in seconds.");
  if (title.length > TITLE_MAX) fail("TITLE_LONG", `Keep the headline under ${TITLE_MAX} characters.`);
  if (body.length < 1) fail("BODY_EMPTY", "Add a sentence on what you need, see, or offer — location, size, and timing help most.");
  if (body.length > BODY_MAX) fail("BODY_LONG", `Keep the details under ${BODY_MAX} characters.`);

  const combined = `${title}\n${body}`;
  if (EMAIL_RE.test(combined)) {
    fail(
      "CONTACT_DUMP",
      "Leave emails and phone numbers out of the post — interested people reach you through Connect, where both sides stay permissioned."
    );
  } else if (PHONE_RE.test(combined)) {
    fail(
      "CONTACT_DUMP",
      "Leave emails and phone numbers out of the post — interested people reach you through Connect, where both sides stay permissioned."
    );
  } else if (HANDLE_RE.test(combined)) {
    fail(
      "CONTACT_DUMP",
      "Leave chat handles out of the post — interested people reach you through Connect, where both sides stay permissioned."
    );
  }
  const urls = combined.match(URL_RE) || [];
  if (urls.length > 1) {
    fail("TOO_MANY_LINKS", "One link at most. Extra links read as promotion spam and are held back.");
  }

  const city = cleanStr(input.city, 121);
  const district = cleanStr(input.district, 121);
  if (!city && !district) {
    fail(
      "NO_LOCATION",
      "Anchor the signal somewhere — a city or district is enough. Activity becomes intelligence only when it has a place."
    );
  }
  if (PRICE_RE.test(combined) && TRANSACTION_RE.test(combined) && (city || district)) {
    fail(
      "LISTING_SHAPED",
      "This reads as a property advertisement, which lives in Metropolis where it gets an owner-verified page. Post it through Create Space instead."
    );
  }

  const mode = String(input.identityMode || "anonymous").toLowerCase();
  if (!IDENTITY_MODES.includes(mode)) {
    fail("BAD_MODE", "Choose how the post is signed: anonymous Scout ID, public profile, or organization.");
  }

  const normalized = {
    signalType: POSTABLE_SIGNAL_TYPES.includes(input.signalType) ? input.signalType : null,
    commercialFlag: input.signalType === SIGNAL_TYPES.COMMERCIAL_PROMOTION,
    title: title.slice(0, TITLE_MAX),
    body: body.slice(0, BODY_MAX),
    city,
    district,
    region: cleanStr(input.region, 121),
    buildingName: cleanStr(input.buildingName, 161),
    precisionLevel:
      input.lat != null && input.lng != null ? "exact" : district ? "district" : "city",
    lat: Number.isFinite(Number(input.lat)) ? Number(input.lat) : null,
    lng: Number.isFinite(Number(input.lng)) ? Number(input.lng) : null,
    identityMode: IDENTITY_MODES.includes(mode) ? mode : "anonymous",
    transactionType: cleanStr(input.transactionType, 41),
    spaceType: cleanStr(input.spaceType, 81),
    budgetMin: toPositiveNumber(input.budgetMin),
    budgetMax: toPositiveNumber(input.budgetMax),
    sizeMinSqm: toPositiveNumber(input.sizeMinSqm),
    sizeMaxSqm: toPositiveNumber(input.sizeMaxSqm),
    timing: cleanStr(input.timing, 121),
    mustHave: toStringList(input.mustHave, 8),
    preferred: toStringList(input.preferred, 8),
  };
  if (normalized.lat != null && (normalized.lat < -90 || normalized.lat > 90)) {
    fail("BAD_COORDS", "That latitude is off the map. Drop the pin again or leave coordinates out.");
    normalized.lat = null;
    normalized.lng = null;
    normalized.precisionLevel = district ? "district" : "city";
  }
  if (normalized.lng != null && (normalized.lng < -180 || normalized.lng > 180)) {
    fail("BAD_COORDS", "That longitude is off the map. Drop the pin again or leave coordinates out.");
    normalized.lat = null;
    normalized.lng = null;
    normalized.precisionLevel = district ? "district" : "city";
  }

  return { ok: errors.length === 0, errors, normalized };
}

function toPositiveNumber(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function toStringList(v, max) {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  return arr
    .map((s) => String(s).trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, max);
}

// ── Freshness + lifecycle (spec §10) ─────────────────────────────────────
const DAY_MS = 86_400_000;

export function freshnessFor(lastConfirmedAt, now = new Date()) {
  const t = new Date(lastConfirmedAt).getTime();
  if (!Number.isFinite(t)) return "aging";
  const ageDays = Math.floor((new Date(now).getTime() - t) / DAY_MS);
  if (ageDays < 0) return "fresh";
  if (ageDays <= 7) return "fresh";
  if (ageDays <= 21) return "active";
  if (ageDays <= 30) return "aging";
  return "expired";
}

export function isLiveStatus(status) {
  return status === "live" || status === "limited";
}

/** Capacity check: closed/expired rows never count (spec §10). */
export function capacityCheck(activeCount, accountClass) {
  const cap = capacityFor(accountClass);
  return {
    cap,
    activeCount,
    allowed: activeCount < cap,
  };
}
