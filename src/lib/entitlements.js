// ═══════════════════════════════════════════════════════════════
// ScoutIt Entitlements — the single source of truth for tier gating.
//
// Encodes the locked Tier Distinction spec (_SCOUTIT_BRAIN/06_MONETIZATION/
// TIER_DISTINCTION.md): which features each tier unlocks + the monthly free
// Connects ladder.
//
// ⚠️ SECURITY — UPDATED 2026-08-06 (§45). The "later hardening pass" this
// comment used to promise has happened.
//
// `getCurrentTier()` still reads localStorage and is still tamper-able, so it
// remains COSMETIC ONLY — use it to decide what a teaser looks like, never to
// decide what data a user receives.
//
// Premium property DATA is now stripped server-side before serialization
// (src/lib/premiumFields.js) on both the ISR property page and /api/cms, and
// the real values are served from /api/property/premium, which resolves the
// tier from the session. A tampered localStorage tier now changes nothing
// except which teaser is drawn.
//
// THE RULE: if a gate protects DATA, it must be enforced server-side. If it
// only changes presentation, canSee() is fine.
// ═══════════════════════════════════════════════════════════════

export const TIERS = ["starry", "solar", "cluster", "universe"];

export const TIER_LABELS = {
  starry: "Starry",
  solar: "Solar",
  cluster: "Cluster",
  universe: "Universe",
};

export function tierRank(tier) {
  const i = TIERS.indexOf(String(tier || "starry").toLowerCase());
  return i < 0 ? 0 : i;
}

// Feature key → minimum tier that unlocks it.
//
// ═══════════════════════════════════════════════════════════════════════
// ⚠️ WHAT A TIER CAN AND CANNOT BUY  (owner ruling 2026-08-06, §46)
// ═══════════════════════════════════════════════════════════════════════
//
// A tier buys access to DATA ScoutIt holds about a PROPERTY.
// A tier NEVER buys access to a PERSON.
//
// Seeing who is behind a Connect request, or a counterparty's phone and
// email, is gated by an ACT — the recipient accepting, then both sides
// signing the handshake (§38.3, §40.5) — and by spending Connects (§35.4).
// **No subscription level shortcuts that, and none ever should.** A Universe
// subscriber and a Starry one are on identical footing until the other party
// agrees.
//
// If you are adding a key here, ask: "does this reveal something about a
// person who has not agreed?" If yes, it does not belong in this table.
export const FEATURE_MIN_TIER = {
  // Seeker / buyer-facing
  deepIntel: "solar",        // cap rate, yield, noise/quiet level, verdict
  enhancedPhotos: "solar",
  // Access to the anonymous PROXY contact channel — not to anyone's real
  // details. Reaching a broker still spends a Connect, and their actual phone
  // and email still require the two-sided handshake. Tier buys the channel,
  // never the identity.
  brokerContact: "solar",
  guideWizard: "solar",
  conciergeBasic: "solar",
  vault: "cluster",          // Luma 3D maps, 360 tours, drone heatmaps
  marketIntel: "cluster",    // market/investment panel: txn history, cap-rate benchmark, appreciation modelling
  offMarket: "cluster",
  compare: "cluster",        // side-by-side comparison
  // ⚠️ `anonymityShield` DELIBERATELY DOES NOT APPEAR IN THIS TABLE.
  //    It is NOT tier-gated. See ANONYMITY_SHIELD_DEFAULT below and §46.8.
  //    Was `identityReveal: "cluster"` until 2026-08-06 — a name that read as
  //    "reveal identities at Cluster", the opposite of the product, and a gate
  //    on something ScoutIt already gives away.
  conciergeDeep: "cluster",  // vector / "vibe" search
  bounties: "cluster",
  universeListings: "universe",
  customBriefings: "universe",
  dedicatedCurator: "universe",
  conciergeAutodraft: "universe",
  ownAiMcp: "universe",      // plug your own AI into ScoutIt (MCP)
};

// ── ANONYMITY SHIELD — FREE FOR ALL, ON BY DEFAULT AT CLUSTER ────────────
// Owner ruling 2026-08-06 (§46.8):
//   "it's free for everyone. only if they know it. with cluster this will
//    immediately turn on."
//
// THE MODEL: the CAPABILITY is free; the paid part is the DEFAULT.
//
//   Everyone   → can switch it on. Nothing is withheld, ever.
//   Cluster+   → arrives already on, no discovery required.
//
// ScoutIt never sells safety. It sells not having to think about it. A buyer
// hesitating over a Connect must never meet the words "upgrade for privacy" —
// that is doubt introduced at the exact moment you want action, trading a
// Connect spend for a subscription upsell.
//
// ⚠️ NOT the same thing as baseline protection, which is free, universal AND
// on by default for everyone at every tier (§35): your name is hidden until
// you accept, contact needs the handshake plus Connects, and there is no
// public buyer directory. The shield is finer-grained control ON TOP of that.
//
// ⚠️ BROKERS DO NOT WANT THIS. Their entire value on ScoutIt is being found —
// every broker tier benefit is discoverability (directory placement, boosted
// search, priority lead routing, featured category placement). Never default
// it on for them and never sell it to them.
//
// Backed by real columns that already exist and are already free:
// privacy_settings.anonymous_browsing / .anonymous_byline.
export const ANONYMITY_SHIELD_ROLES = ["seeker", "owner"];
export const ANONYMITY_SHIELD_DEFAULT_FROM_TIER = "cluster";

/**
 * Should the anonymity shield start switched ON for this user?
 *
 * This decides a DEFAULT, never access. Everyone may turn it on regardless of
 * what this returns — if you find yourself using it to block a toggle, the
 * model has been misread.
 *
 * @param {string} tier
 * @param {string} role
 * @returns {boolean}
 */
export function anonymityShieldDefaultsOn(tier, role) {
  if (!ANONYMITY_SHIELD_ROLES.includes(String(role || "seeker").toLowerCase())) {
    return false; // brokers etc. — being found is the point
  }
  return tierRank(tier) >= tierRank(ANONYMITY_SHIELD_DEFAULT_FROM_TIER);
}

/**
 * Can this user use the anonymity shield at all?
 *
 * Always true for the roles it applies to. It exists so call sites read
 * honestly and nobody later "optimises" it into a tier check.
 */
export function canUseAnonymityShield(role) {
  return ANONYMITY_SHIELD_ROLES.includes(String(role || "seeker").toLowerCase());
}

// True if a viewer on `tier` can access `feature`.
export function canSee(feature, tier) {
  const min = FEATURE_MIN_TIER[feature];
  if (!min) return true; // unknown / ungated feature is free
  return tierRank(tier) >= tierRank(min);
}

// Monthly free Connects allowance by role + tier (the locked ladder).
export const CONNECTS_ALLOWANCE = {
  seeker: { starry: 1, solar: 6, cluster: 15, universe: 40 },
  owner: { starry: 1, solar: 6, cluster: 18, universe: 40 },
  broker: { starry: 1, solar: 8, cluster: 20, universe: 50 },
  photographer: { starry: 1, solar: 5, cluster: 12, universe: 25 },
  researcher: { starry: 1, solar: 5, cluster: 12, universe: 25 },
};

export function monthlyAllowance(role, tier) {
  const r = CONNECTS_ALLOWANCE[String(role || "seeker").toLowerCase()] || CONNECTS_ALLOWANCE.seeker;
  return r[String(tier || "starry").toLowerCase()] ?? 1;
}

// ── Reading the current (mock) user — SSR-safe ──────────────────
// Returns "starry"/"seeker" defaults on the server and when no user is set.
function readUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("scoutit_user") || "null");
  } catch {
    return null;
  }
}

export function getCurrentTier() {
  const u = readUser();
  return (u && (u.subscription_tier || u.tier)) || "starry";
}

export function getCurrentRole() {
  const u = readUser();
  const roles = u && (u.active_roles || u.tags);
  return (Array.isArray(roles) && roles[0]) || "seeker";
}

// Unlike getCurrentRole() (the primary/first hat), a user can hold several
// hats at once — e.g. the Operator hat (SCOUTIT_MASTER_BUILD_SPEC.md §9.4)
// alongside Owner/Broker. Use this when checking for one specific hat.
export function hasActiveRole(role) {
  const u = readUser();
  const roles = (u && (u.active_roles || u.tags)) || [];
  return Array.isArray(roles) && roles.includes(role);
}

export async function hasServerEntitlement(feature, request) {
  const { resolveServerTier } = await import("@/lib/serverAuth");
  const { tier, freeMode } = await resolveServerTier(request);
  if (freeMode) return true;
  return canSee(feature, tier);
}
