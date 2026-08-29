import { FEATURE_MIN_TIER, canSee } from "./entitlements";

// ─────────────────────────────────────────────────────────────────────────
// PREMIUM FIELD STRIPPING  (NEW_IDEAS.md §25.1 / §45)
//
// §25.1: "Filter premium fields SERVER-SIDE before serialization — do not
// send-then-hide in the client."
//
// Until now the property page shipped every premium field to every visitor and
// the UI hid them behind `canSee(feature, getCurrentTier())`. `getCurrentTier`
// reads localStorage, so:
//
//   1. Setting `scoutit_user.subscription_tier = 'universe'` in a browser
//      console unlocked every gate, and
//   2. it didn't even need that — the values were already in the serialised
//      RSC payload, readable from "view source" without running anything.
//
// `CategorySpecBlock.js` said so outright: "client-trusted for now (later
// security pass enforces server-side) — that's why real values still only ship
// on demo/seed data." This is that pass.
//
// ── WHY A STRIP + SEPARATE FETCH, RATHER THAN A TIER CHECK IN THE PAGE ──
//
// `/property/[id]` is ISR (`revalidate = 3600`). One HTML document is built
// and shared by every visitor, so there is no "current user" at render time —
// which is precisely why the gating ended up in the client to begin with.
//
// So the split is:
//   · the STATIC payload carries no premium values at all (this module), and
//   · entitled users fetch them from /api/property/premium, which resolves the
//     tier server-side from the session.
//
// The teaser still renders for everyone — locked sections need to know a field
// EXISTS to advertise it — which is why `lockedFeatures` is returned rather
// than the fields simply vanishing.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Which property fields each gated feature covers.
 *
 * Keys must exist in FEATURE_MIN_TIER (asserted below) so a feature can never
 * be gated in the UI while its data ships wide open, or vice versa.
 */
export const PREMIUM_FIELD_MAP = {
  // Solar+ — the "Deeper Intelligence" panel: cap rate, yield, noise, verdict.
  deepIntel: ["deepIntel"],

  // Solar+ — professionally retouched photo set. The base `photos` array stays
  // public; only the enhanced variant is gated.
  enhancedPhotos: ["enhanced_photos"],

  // Cluster+ — the 3D Spatial Vault. These are URLs to hosted assets; leaking
  // one means the asset is reachable directly, bypassing the paywall entirely
  // and for as long as that URL lives.
  vault: [
    "virtual_tour_url",
    "matterportTourUrl",
    "luma3dMapUrl",
    "droneHeatmapUrl",
    "floorPlans",
  ],
};

// Fail fast if the two sources of truth drift apart.
for (const feature of Object.keys(PREMIUM_FIELD_MAP)) {
  if (!FEATURE_MIN_TIER[feature]) {
    throw new Error(
      `[premiumFields] "${feature}" has no entry in FEATURE_MIN_TIER. ` +
      `Every gated field group must map to a real tier.`,
    );
  }
}

/** Every field name any feature gates. */
export const ALL_PREMIUM_FIELDS = Object.values(PREMIUM_FIELD_MAP).flat();

/**
 * Returns a copy of 'property' with fields the tier can't see removed.
 *
 * @param {object} property
 * @param {string} tier - server-resolved tier. NEVER pass a client-supplied one.
 * @returns {object} copy, plus 'lockedFeatures: string[]' and
 *   'premiumAvailable: string[]' — the features this property actually HAS
 *   data for, so a teaser only advertises what exists.
 */
export function stripPremiumFields(property, tier) {
  if (!property || typeof property !== "object") return property;

  const out = { ...property };
  const lockedFeatures = [];
  const premiumAvailable = [];

  for (const [feature, fields] of Object.entries(PREMIUM_FIELD_MAP)) {
    // Does this listing actually carry anything for this feature? An owner who
    // never uploaded a 3D tour should not get a "Vault" teaser.
    const hasData = fields.some((f) => hasValue(property[f]));
    if (hasData) premiumAvailable.push(feature);

    if (canSee(feature, tier)) continue;

    lockedFeatures.push(feature);
    for (const field of fields) {
      // Replaced with an EMPTY value of the same shape rather than deleted, so
      // components doing `property.floorPlans.map(...)` don't crash on
      // undefined. The absence must be safe, not merely secure.
      out[field] = emptyLike(property[field]);
    }
  }

  out.lockedFeatures = lockedFeatures;
  out.premiumAvailable = premiumAvailable;
  return out;
}

/**
 * The inverse: just the premium fields, for the authenticated endpoint.
 *
 * @param {object} property
 * @param {string} tier - server-resolved
 * @returns {object} only the fields this tier is entitled to
 */
export function pickPremiumFields(property, tier) {
  const out = {};
  if (!property) return out;

  for (const [feature, fields] of Object.entries(PREMIUM_FIELD_MAP)) {
    if (!canSee(feature, tier)) continue;
    for (const field of fields) {
      if (property[field] !== undefined) out[field] = property[field];
    }
  }
  return out;
}

/**
 * Last line of defence before a payload is marked publicly cacheable.
 *
 * `stripPremiumFields` is what actually removes gated values, and the public
 * scope in /api/cms calls it with a constant tier so a session can never widen
 * the result. This function assumes neither of those held, and checks the
 * finished array for any gated field that still carries data.
 *
 * The point is the blast radius. A mistake in the stripping is bad; the same
 * mistake on a response carrying `Cache-Control: public` is far worse, because
 * a CDN then serves one subscriber's unlocked catalogue to every anonymous
 * visitor for the length of the cache window. This turns that silent, shared,
 * durable leak into a loud log and an uncacheable response.
 *
 * @param {object[]} properties the already-stripped array about to be sent
 * @returns {{slug: string, field: string}|null} the first offender, or null
 */
export function findPremiumLeak(properties) {
  for (const property of properties || []) {
    if (!property || typeof property !== "object") continue;
    for (const field of ALL_PREMIUM_FIELDS) {
      if (hasValue(property[field])) {
        return { slug: String(property.slug || property.id || "unknown"), field };
      }
    }
  }
  return null;
}

function hasValue(v) {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return String(v).trim() !== "";
}

function emptyLike(v) {
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return {};
  return "";
}
