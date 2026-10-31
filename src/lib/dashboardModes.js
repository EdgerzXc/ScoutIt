const ROLE_TO_DASHBOARD_MODE = Object.freeze({
  seeker: "buyer",
  buyer: "buyer",
  exploring: "exploring",
  owner: "owner",
  broker: "broker",
  salesperson: "broker",
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
  if (["event-planner", "event_planner", "events", "concept_designer", "designer"].includes(normalizedRole)) {
    return "designer";
  }
  return ["photographer", "researcher"].includes(normalizedRole)
    ? normalizedRole
    : undefined;
}

/**
 * Verifies whether an account holding `heldRoles` is authorized to enter
 * the dashboard workspace corresponding to `requestedRole`.
 *
 * - `buyer` / `seeker` / `exploring` is the universal baseline available to all accounts.
 * - Canonical staff (`admin` / `staff`) may inspect any valid dashboard workspace.
 * - Specialized workspaces (`owner`, `broker`, `provider`, `operator`, `mc_enterprise`, `mc_staff`)
 *   require the matching normalized dashboard mode in `heldRoles`.
 */
export function canAccessDashboardWorkspace(requestedRole, heldRoles = []) {
  if (typeof requestedRole !== "string") return false;
  const targetMode = normalizeDashboardMode(requestedRole);
  if (!targetMode) return false;
  if (targetMode === "buyer" || targetMode === "exploring") return true;

  const rawHeld = (Array.isArray(heldRoles) ? heldRoles : [])
    .map((r) => (typeof r === "string" ? r.trim().toLowerCase() : ""))
    .filter(Boolean);

  if (rawHeld.includes("admin") || rawHeld.includes("staff")) {
    return true;
  }

  const heldModes = normalizeDashboardModes(rawHeld);
  return heldModes.includes(targetMode);
}
