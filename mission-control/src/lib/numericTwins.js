// ═══════════════════════════════════════════════════════════════
// NUMERIC TWINS — keep the filterable number in step with the text
//
// THE BUG THIS FIXES
// Several commercial facts are stored twice in Airtable: once as a human
// display string, once as a number that powers filtering and sorting.
//
//   CM_Rent_Per_Sqm   "Php 850/sqm/mo"   ← what the page shows
//   CM_Rent_From      850                ← what the filter compares
//
// Until 2026-07-30 only the display string was writable from the app. So an
// owner changing rent from ₱850 to ₱1,200 updated the page but NOT the number.
// The listing then still matched a "rent under ₱1,000" filter. Nothing errored:
// the visible field was correct, so the bug was invisible.
//
// THE PARSING TRAP
// "Lowest number in the string" is the obvious approach and it is WRONG:
//
//   "Php 116/sqm/mo 12/7; Php 197 24/7"   → naive lowest = 7  ❌
//
// Those are operating-hour ratios (12/7, 24/7), not money. Writing 7 into a
// currency filter is far worse than writing nothing — it silently drags the
// listing into every cheap-rent search. So we anchor on the currency marker
// and strip ratio patterns before falling back.
//
// HONEST BLANK RULE
// When a string cannot be parsed with confidence we return null, which blanks
// the twin rather than guessing. A blank drops the listing out of numeric
// filters — visibly incomplete, and fixable. A wrong number is invisible and
// corrupts every search that touches it. Same doctrine as the rest of ScoutIt:
// never fabricate a value to fill a slot.
// ═══════════════════════════════════════════════════════════════

/** Ratios like 12/7, 24/7, 1/100 — hours or proportions, never amounts. */
const RATIO = /\b\d+\s*\/\s*\d+\b/g;

/** Units that follow a number without making it a different quantity. */
const TRAILING_UNIT = /\s*(?:\/\s*)?(?:sqm|sq\.?\s?m|mo|month|yr|year|day|slot|pax)\b/gi;

function toNumber(raw) {
  const n = Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Lowest amount that is explicitly marked as money.
 * Matches "Php 850", "PHP1,200", "₱ 95", "P 5,000" — and nothing else, so
 * hour ratios and floor numbers cannot be mistaken for prices.
 * @returns {number|null}
 */
export function lowestCurrencyAmount(text) {
  if (!text) return null;
  const found = [];
  const re = /(?:php|₱|\bp)\s*([\d,]+(?:\.\d+)?)/gi;
  let m;
  while ((m = re.exec(String(text))) !== null) {
    const n = toNumber(m[1]);
    if (n !== null && n > 0) found.push(n);
  }
  return found.length ? Math.min(...found) : null;
}

/**
 * Lowest plain number, for quantities that carry no currency marker
 * (e.g. a floor plate range "1,200 - 1,800 sqm" → 1200).
 * Ratio patterns are removed first so "12/F" style noise cannot win.
 * @returns {number|null}
 */
export function lowestPlainNumber(text) {
  if (!text) return null;
  const cleaned = String(text).replace(RATIO, " ").replace(TRAILING_UNIT, " ");
  const found = [];
  const re = /([\d,]+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    const n = toNumber(m[1]);
    if (n !== null && n > 0) found.push(n);
  }
  return found.length ? Math.min(...found) : null;
}

/**
 * Money value for a filter twin: currency-anchored, with a guarded fallback.
 *
 * The fallback only applies when the string contains NO currency marker at all
 * AND no ratio noise — i.e. a bare "850". If a string looks like money but we
 * cannot pin the amount, we return null rather than guess.
 * @returns {number|null}
 */
export function currencyTwin(text) {
  if (!text) return null;
  const anchored = lowestCurrencyAmount(text);
  if (anchored !== null) return anchored;
  const str = String(text);
  // A currency word was present but unparsed → refuse to guess.
  if (/php|₱/i.test(str)) return null;
  // Ratio noise with no currency anchor is too ambiguous to trust.
  if (RATIO.test(str)) return null;
  return lowestPlainNumber(str);
}

/**
 * Derive every numeric twin from the display strings in an editor payload.
 * Keys are Airtable field names, ready to Object.assign into a write map.
 *
 * Only emits a key when its source string was actually supplied, so a partial
 * edit never blanks a twin it wasn't touching.
 *
 * @param {object} details - the camelCase editor detail object
 * @returns {Record<string, number|null>}
 */
export function deriveNumericTwins(details) {
  const out = {};
  if (!details) return out;

  if (details.rentPerSqm !== undefined) {
    out.CM_Rent_From = currencyTwin(details.rentPerSqm);
  }
  if (details.camc !== undefined) {
    out.CM_CAMC_From = currencyTwin(details.camc);
  }
  if (details.acCharges !== undefined) {
    // The worst offender: "Php 116/sqm/mo 12/7; Php 197 24/7". Currency
    // anchoring picks 116, not the 7 from "24/7".
    out.CM_AC_Charge_From = currencyTwin(details.acCharges);
  }
  if (details.floorPlate !== undefined) {
    // Not money — a sqm range. Its description says "low end of the range".
    out.CM_Floor_Plate_From = lowestPlainNumber(details.floorPlate);
  }
  return out;
}
