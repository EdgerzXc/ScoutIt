/**
 * Escape an Airtable formula string literal.
 *
 * Backslashes must be escaped before apostrophes; reversing the order would
 * double the escape characters introduced for apostrophes.
 */
export function escapeAirtableFormulaString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}
