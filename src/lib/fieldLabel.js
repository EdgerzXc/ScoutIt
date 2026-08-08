// ─────────────────────────────────────────────────────────────────────────
// SAFE LABEL RENDERING FOR SCHEMA FIELDS
// NEW_IDEAS_2.md §59 · W18.3 (crash triage)
//
// ── THE CRASH THIS PREVENTS ──────────────────────────────────────────
// Three production crashes in `error_reports`, on
// /property/aurelia-residences:
//
//   Minified React error #31 — "Objects are not valid as a React child
//   (found: object with keys {key, label, placeholder})"
//
// Those are `DEEP_INTEL_SCHEMA` entries from `lib/deepIntelSchema.js`. Both
// property flows rendered a field with a fallback that can return the OBJECT:
//
//   CommercialFlow   {field.label || field}
//   ResidentialFlow  {(field && field.label) || field}
//
// Both look defensive and neither is. `||` falls through on any falsy label —
// and an **empty string is falsy**. A field with `label: ""` renders the whole
// object, React throws, and the property page white-screens for the visitor.
// The guard that was added to ResidentialFlow after the first crash has exactly
// the same hole; it just moved the trigger from `undefined` to `""`.
//
// The two flows had also drifted: one was hardened and the other was not, so
// the same listing could crash on a commercial page and survive on a
// residential one. One helper, both flows, no drift.
//
// The real rule: a render fallback must never be able to return a non-primitive.
// ─────────────────────────────────────────────────────────────────────────

/**
 * The display label for a schema field, guaranteed renderable.
 *
 * Accepts either a field object ('{ key, label, placeholder }') or a bare
 * string, because both shapes are passed by the property flows.
 *
 * @param {{label?: string, key?: string}|string|null|undefined} field
 * @returns {string} never an object, never null
 */
export function fieldLabel(field) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  if (typeof field !== "object") return String(field);

  // Prefer an explicit label, then the key, then nothing. Trimmed so a
  // whitespace-only label is treated as absent rather than rendering blank.
  const label = typeof field.label === "string" ? field.label.trim() : "";
  if (label) return label;

  const key = typeof field.key === "string" ? field.key.trim() : "";
  if (key) return key;

  // Deliberately an empty string, not the object and not a placeholder like
  // "Unknown field" — an invented label is a fabricated fact about a listing
  // (Rule 3), and rendering the object is the crash this exists to stop.
  return "";
}

export default fieldLabel;
