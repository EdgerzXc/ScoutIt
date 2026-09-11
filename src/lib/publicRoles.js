// A-135 — which roles a person may choose to show on their public profile.
// One list, read by the privacy route (which validates) and the Settings screen
// (which renders), so the two cannot disagree about what is allowed.
//
// Owner is deliberately absent: an owner's role is never shown publicly.

export const PUBLIC_ROLE_CHOICES = Object.freeze(["buyer", "broker", "provider"]);

export const PUBLIC_ROLE_LABELS = Object.freeze({
  buyer: "Seeker",
  broker: "Broker",
  provider: "Provider",
});

/**
 * Returns a clean, de-duplicated list of allowed roles, or null when the input
 * is not an array of allowed role names — never a partially trusted list.
 */
export function normalizePublicRoles(value) {
  if (!Array.isArray(value)) return null;
  if (!value.every((role) => typeof role === "string" && PUBLIC_ROLE_CHOICES.includes(role))) {
    return null;
  }
  return PUBLIC_ROLE_CHOICES.filter((role) => value.includes(role));
}
