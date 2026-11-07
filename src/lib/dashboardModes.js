const ROLE_TO_DASHBOARD_MODE = Object.freeze({
  all: "all",
  unified: "all",
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

export const ACTIVE_WORKSPACE_ROLE_KEY = "scoutit_active_workspace_role";

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
  const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
  if (["event-planner", "event_planner", "events", "concept_designer", "designer"].includes(normalizedRole)) {
    return "designer";
  }
  if (["photographer", "researcher"].includes(normalizedRole)) {
    return normalizedRole;
  }
  if (explicitProviderType) return explicitProviderType;
  return undefined;
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
  if (targetMode === "all") {
    return heldModes.length > 0;
  }
  return heldModes.includes(targetMode);
}

/**
 * Extracts and normalizes the active roles and mode tags held by a user into a
 * flat, deduplicated array. Replaces duplicated role-harvesting logic across
 * dashboard views.
 */
export function getHeldRoles(user) {
  if (!user) return [];
  return [
    ...(Array.isArray(user.active_roles) ? user.active_roles : []),
    ...(Array.isArray(user.tags) ? user.tags : []),
    user.primary_mode,
    user.primaryMode,
    user.role,
  ].filter(Boolean);
}

/**
 * Reads the user's last selected workspace lens so navigating between
 * Workspace, Inbox, CRM, and Calendar never resets the active lens back to Buyer.
 */
export function getPersistedWorkspaceRole(storage = typeof window !== "undefined" ? window.localStorage : null) {
  if (!storage || typeof storage.getItem !== "function") return "";
  try {
    const direct = storage.getItem(ACTIVE_WORKSPACE_ROLE_KEY);
    if (direct && typeof direct === "string" && direct.trim()) {
      return direct.trim().toLowerCase();
    }
    const rawUser = storage.getItem("scoutit_user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.activeWorkspaceRole) return String(parsed.activeWorkspaceRole).trim().toLowerCase();
      if (parsed?.primaryMode) return String(parsed.primaryMode).trim().toLowerCase();
    }
  } catch {}
  return "";
}

/**
 * Persists the user's active workspace lens selection across dashboard routes.
 */
export function setPersistedWorkspaceRole(role, storage = typeof window !== "undefined" ? window.localStorage : null) {
  if (!storage || typeof storage.setItem !== "function" || typeof role !== "string" || !role.trim()) return;
  const clean = role.trim().toLowerCase();
  try {
    storage.setItem(ACTIVE_WORKSPACE_ROLE_KEY, clean);
    const rawUser = storage.getItem("scoutit_user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed && typeof parsed === "object") {
        parsed.activeWorkspaceRole = clean;
        const normalized = normalizeDashboardMode(clean);
        if (normalized && normalized !== "all") {
          parsed.primaryMode = normalized;
        }
        storage.setItem("scoutit_user", JSON.stringify(parsed));
      }
    }
  } catch {}
}

/**
 * Resolves the authoritative active workspace mode and role key across URL params,
 * persisted session state, and profile defaults so switching to Owner/Broker/All
 * and visiting Inbox/CRM/Calendar never drops the user back to Buyer.
 */
export function resolveActiveWorkspaceSelection({ requestedRole = "", persistedRole = "", user = null } = {}) {
  const rawHeldRoles = getHeldRoles(user);
  const tags = normalizeDashboardModes(
    user?.active_roles || user?.tags,
    user?.primary_mode || user?.primaryMode || user?.role,
  );

  const candidates = [
    requestedRole,
    persistedRole,
    user?.primary_mode,
    user?.primaryMode,
    user?.role,
  ]
    .map((c) => (typeof c === "string" ? c.trim().toLowerCase() : ""))
    .filter(Boolean);

  for (const candidate of candidates) {
    if (canAccessDashboardWorkspace(candidate, rawHeldRoles)) {
      const mode = normalizeDashboardMode(candidate);
      if (mode) {
        return {
          mode,
          roleKey: candidate,
          providerType: inferProviderType(candidate, user?.provider_type || user?.providerType),
          tags,
          isAuthorizedRequest: Boolean(
            requestedRole &&
              candidate === String(requestedRole).trim().toLowerCase() &&
              canAccessDashboardWorkspace(requestedRole, rawHeldRoles),
          ),
        };
      }
    }
  }

  const fallbackMode = pickPrimaryRole(tags, "buyer") || "buyer";
  const fallbackProviderType = user?.provider_type || user?.providerType;
  const fallbackRoleKey =
    fallbackMode === "provider" ? (fallbackProviderType || "photographer") : fallbackMode;

  return {
    mode: fallbackMode,
    roleKey: fallbackRoleKey,
    providerType: fallbackProviderType,
    tags,
    isAuthorizedRequest: false,
  };
}
