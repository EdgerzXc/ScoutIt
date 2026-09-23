const ROLE_TO_DASHBOARD_MODE = Object.freeze({
  seeker: "buyer",
  buyer: "buyer",
  exploring: "exploring",
  owner: "owner",
  broker: "broker",
  provider: "provider",
  photographer: "provider",
  researcher: "provider",
  designer: "provider",
  // A-146: event-planner is a shipped profession (entitlements PROVIDER_LADDER,
  // /event-planners directory, priced commissions) but resolved to "" — an
  // Unknown Mode fallback for a real workspace. Generic provider lens; the
  // subtype stays undefined until the workspace needs it.
  "event-planner": "provider",
  // Persisted preview IDs. They are intentionally absent from the dashboard's
  // self-service ACTIVATABLE_MODES list, but must survive profile hydration.
  mc_staff: "mc_staff",
  mc_enterprise: "mc_enterprise",
  operator: "operator",
});

export function normalizeDashboardMode(role) {
  if (typeof role !== "string") return "";
  return ROLE_TO_DASHBOARD_MODE[role.trim().toLowerCase()] || "";
}

export function normalizeDashboardModes(roles, fallbackRole) {
  const normalized = (Array.isArray(roles) ? roles : [])
    .map(normalizeDashboardMode)
    .filter(Boolean);

  const fallback = normalizeDashboardMode(fallbackRole);
  if (fallback) normalized.push(fallback);

  return [...new Set(normalized)];
}

// A-146: the deterministic primary. Three call sites fell back to tags[0] —
// insertion order, i.e. whichever lens was added first wins. A removed primary
// must resolve to the same workspace on every device and every load.
export const PRIMARY_ROLE_ORDER = Object.freeze(["buyer", "owner", "broker", "provider"]);

export function pickPrimaryRole(tags, preferred) {
  const held = (Array.isArray(tags) ? tags : [])
    .map(normalizeDashboardMode)
    .filter(Boolean);
  const want = normalizeDashboardMode(preferred);
  if (want && held.includes(want)) return want;
  for (const role of PRIMARY_ROLE_ORDER) {
    if (held.includes(role)) return role;
  }
  // Unknown-but-held modes (mc_enterprise previews) survive by position.
  return held[0] || "";
}

export function inferProviderType(role, explicitProviderType) {
  if (explicitProviderType) return explicitProviderType;
  const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
  return ["photographer", "researcher", "designer"].includes(normalizedRole)
    ? normalizedRole
    : undefined;
}
