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

export function inferProviderType(role, explicitProviderType) {
  if (explicitProviderType) return explicitProviderType;
  const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
  return ["photographer", "researcher", "designer"].includes(normalizedRole)
    ? normalizedRole
    : undefined;
}
