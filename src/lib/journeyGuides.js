import browserJourneys from "@/data/flow/browserJourneys.json";

export const PUBLIC_JOURNEYS = Object.freeze(browserJourneys);

export function normalizeJourneyRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (value === "buyer" || value === "seeker") return "seeker";
  if (value === "owner" || value === "broker") return value;
  return null;
}

export function guideForVerifiedRole(role) {
  const normalized = normalizeJourneyRole(role);
  return normalized ? PUBLIC_JOURNEYS[normalized] : null;
}
