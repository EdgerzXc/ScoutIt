import { MARKET_ROLES } from "@/lib/communitySignalsAdapter";
import { canAccessDashboardWorkspace, getHeldRoles } from "@/lib/dashboardModes";

export const STRATOSPHERE_LENS_DEFS = Object.freeze({
  owner: Object.freeze({
    id: "owner",
    label: "Owner",
    marketRole: MARKET_ROLES.DEMAND,
  }),
  broker: Object.freeze({
    id: "broker",
    label: "Broker",
    marketRole: MARKET_ROLES.DEMAND,
  }),
  operator: Object.freeze({
    id: "operator",
    label: "Operator",
    marketRole: MARKET_ROLES.DEMAND,
  }),
  buyer: Object.freeze({
    id: "buyer",
    label: "Seeker",
    marketRole: MARKET_ROLES.SUPPLY,
  }),
  photographer: Object.freeze({
    id: "photographer",
    label: "Photographer",
    marketRole: MARKET_ROLES.INTEL,
  }),
  designer: Object.freeze({
    id: "designer",
    label: "Designer",
    marketRole: MARKET_ROLES.INTEL,
  }),
  researcher: Object.freeze({
    id: "researcher",
    label: "Researcher",
    marketRole: MARKET_ROLES.INTEL,
  }),
  provider: Object.freeze({
    id: "provider",
    label: "Creator",
    marketRole: MARKET_ROLES.INTEL,
  }),
  all: Object.freeze({
    id: "all",
    label: "All",
    marketRole: MARKET_ROLES.ALL,
  }),
});

const LENS_DISPLAY_ORDER = Object.freeze([
  "owner",
  "broker",
  "operator",
  "buyer",
  "photographer",
  "designer",
  "researcher",
  "provider",
]);

const CREATOR_SUB_LENSES = new Set(["photographer", "designer", "researcher"]);

export function normalizeStratosphereLensId(raw) {
  if (typeof raw !== "string") return "";
  const r = raw.trim().toLowerCase();
  if (!r) return "";
  if (r === "buyer" || r === "tenant" || r === "seeker" || r === "exploring") return "buyer";
  if (r === "broker" || r === "salesperson") return "broker";
  if (r === "designer" || r === "event-planner" || r === "event_planner" || r === "events" || r === "concept_designer") {
    return "designer";
  }
  if (["owner", "operator", "photographer", "researcher", "provider", "all"].includes(r)) {
    return r;
  }
  return "";
}

export function defaultMarketRoleForLens(lensId) {
  const norm = normalizeStratosphereLensId(lensId);
  return STRATOSPHERE_LENS_DEFS[norm]?.marketRole || MARKET_ROLES.ALL;
}

export function getAvailableStratosphereLenses(profile) {
  if (!profile || typeof profile !== "object") return [];
  const rawTokens = [
    ...getHeldRoles(profile),
    ...(Array.isArray(profile.activeRoles) ? profile.activeRoles : []),
    profile.provider_type,
    profile.providerType,
  ]
    .filter((v) => typeof v === "string" && v.trim())
    .map((v) => v.trim().toLowerCase());

  if (rawTokens.length === 0) return [];

  if (rawTokens.includes("admin") || rawTokens.includes("staff")) {
    return [
      ...LENS_DISPLAY_ORDER.filter((id) => id !== "provider").map((id) => STRATOSPHERE_LENS_DEFS[id]),
      STRATOSPHERE_LENS_DEFS.all,
    ];
  }

  const heldIds = new Set();
  for (const token of rawTokens) {
    const norm = normalizeStratosphereLensId(token);
    if (norm && norm !== "all") {
      heldIds.add(norm);
    }
  }

  // Only show generic "Creator" lens if no concrete creator specialization is held
  if ([...CREATOR_SUB_LENSES].some((id) => heldIds.has(id))) {
    heldIds.delete("provider");
  }

  const ordered = LENS_DISPLAY_ORDER.filter((id) => heldIds.has(id)).map(
    (id) => STRATOSPHERE_LENS_DEFS[id],
  );
  if (ordered.length === 0) return [];
  return [...ordered, STRATOSPHERE_LENS_DEFS.all];
}

function isLensAllowedForProfile(lensId, profile, availableIds) {
  if (!profile) return Boolean(lensId);
  if (lensId === "all") return true;
  if (availableIds.has(lensId)) return true;
  const rawHeld = [
    ...getHeldRoles(profile),
    ...(Array.isArray(profile.activeRoles) ? profile.activeRoles : []),
    profile.provider_type,
    profile.providerType,
  ];
  return canAccessDashboardWorkspace(lensId, rawHeld);
}

export function resolveStratosphereDefaultLens({
  urlRole = "",
  persistedRole = "",
  profile = null,
} = {}) {
  const available = getAvailableStratosphereLenses(profile);
  const availableIds = new Set(available.map((l) => l.id));
  const rawUrl = typeof urlRole === "string" ? urlRole.trim().toLowerCase() : "";

  if (rawUrl) {
    if (Object.values(MARKET_ROLES).includes(rawUrl)) {
      return {
        lensId: rawUrl === MARKET_ROLES.ALL ? "all" : null,
        marketRole: rawUrl,
      };
    }
    const urlLens = normalizeStratosphereLensId(rawUrl);
    if (urlLens) {
      return {
        lensId: urlLens,
        marketRole: defaultMarketRoleForLens(urlLens),
      };
    }
  }

  const rawPersisted = typeof persistedRole === "string" ? persistedRole.trim().toLowerCase() : "";
  if (rawPersisted) {
    if (rawPersisted === "all" && available.filter((l) => l.id !== "all").length > 1) {
      return { lensId: "all", marketRole: MARKET_ROLES.ALL };
    }
    const persistedLens = normalizeStratosphereLensId(rawPersisted);
    if (persistedLens && isLensAllowedForProfile(persistedLens, profile, availableIds)) {
      return {
        lensId: persistedLens,
        marketRole: defaultMarketRoleForLens(persistedLens),
      };
    }
  }

  if (profile && typeof profile === "object") {
    const candidates = [
      profile.primaryMode,
      profile.primary_mode,
      profile.role,
      profile.providerType,
      profile.provider_type,
    ];
    for (const candidate of candidates) {
      const candidateLens = normalizeStratosphereLensId(candidate);
      if (candidateLens && candidateLens !== "all") {
        return {
          lensId: candidateLens,
          marketRole: defaultMarketRoleForLens(candidateLens),
        };
      }
    }
    const firstRoleLens = available.find((l) => l.id !== "all");
    if (firstRoleLens) {
      return {
        lensId: firstRoleLens.id,
        marketRole: firstRoleLens.marketRole,
      };
    }
  }

  return { lensId: "all", marketRole: MARKET_ROLES.ALL };
}
