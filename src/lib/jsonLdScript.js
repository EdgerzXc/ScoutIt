// ---------------------------------------------------------------------------
// SAFE ld+json TRANSPORT -- U-008
//
// -- THE BUG THIS EXISTS TO CLOSE ------------------------------------------
// JSON.stringify escapes what JSON requires. It does NOT escape "<", because
// "<" is a perfectly legal character in a JSON string. That is correct for
// JSON and catastrophic for HTML: the moment that output is written inside a
// <script> element, the HTML parser -- which does not know or care that it is
// looking at JSON -- sees the closing script tag and ends the block. Every
// byte after it is parsed as markup.
//
// An owner types a listing title. That title reaches Airtable, comes back
// through /api/cms, lands in the property page's structured data, and
// executes. Stored, not reflected.
//
// -- WHY ESCAPING, NOT STRIPPING -------------------------------------------
// "<" is a valid JSON string escape, so JSON.parse returns the original
// character and Google reads exactly the structured data it always did.
// Nothing is lost. A listing legitimately named "<Tower>" still renders
// correctly. Stripping would have silently corrupted real data to fix what is
// only a transport problem.
//
// -- WHERE THIS MUST BE CALLED ---------------------------------------------
// At the SINK, never only in the builder. mergeFaqIntoOverride returns an
// operator's hand-written override untouched on several paths, so a builder-
// only escape would have left the override path exposed. Escaping where the
// string meets HTML is the only placement that cannot be routed around.
// ---------------------------------------------------------------------------

// ">" and "&" are not strictly required to close the hole, but they cost
// nothing and remove the "-->" and entity-decoding variants of the same trick.
// U+2028 and U+2029 are legal raw inside JSON and are line terminators in
// JavaScript -- inert in ld+json, escaped here so this helper stays correct if
// it is ever reused for a plain <script> payload.
const HTML_UNSAFE = /[<>&\u2028\u2029]/g;

const ESCAPES = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/**
 * Makes an already-serialized JSON string safe to place inside a
 * <script type="application/ld+json"> element.
 *
 * @param {string} json - output of JSON.stringify, or a hand-written override
 * @returns {string} the same JSON with HTML-significant characters escaped
 */
export function escapeJsonLd(json) {
  if (json === null || json === undefined) return "";
  return String(json).replace(HTML_UNSAFE, (char) => ESCAPES[char]);
}

export default escapeJsonLd;
