// ═══════════════════════════════════════════════════════════════
// Affordability / Mortgage Calculator — pure math, no backend.
// Master Build Spec §7. Stateless by design (no saving, no auth, no Supabase
// table, no income/DTI check, no lender integration) — an information tool,
// not financial advice, not a loan offer, not pre-qualification.
// ═══════════════════════════════════════════════════════════════

// ⚠️ PLACEHOLDER rate — Open Question #5 in the Master Build Spec: real current
// PH mortgage rates (Pag-IBIG, major banks) haven't been supplied yet. This is
// an illustrative default only, editable by the user in the UI. Swap for real
// `CONFIG_MORTGAGE_DEFAULTS` (Airtable) once real rates are confirmed — never
// present this number as an actual bank's published rate.
export const MORTGAGE_DEFAULTS = {
  downPaymentPercent: 20,
  minDownPaymentPercent: 10,
  annualRatePercent: 6.5,
  termYears: 20,
  maxTermYears: 30,
};

/**
 * Strip currency symbols/commas/text from a displayed price string and return
 * a clean positive number, or null if nothing usable is present. Honest-blank
 * rule: no clean number → the caller renders nothing, never a guess.
 */
export function parsePriceToNumber(displayPrice) {
  if (!displayPrice) return null;
  const cleaned = String(displayPrice).replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Standard amortized monthly payment: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Returns null if inputs can't produce a meaningful result (e.g. price <= 0).
 */
export function calculateMortgage({ price, downPaymentPercent, annualRatePercent, termYears }) {
  if (!(price > 0) || !(termYears > 0)) return null;

  const downPayment = price * (downPaymentPercent / 100);
  const principal = Math.max(price - downPayment, 0);
  const monthlyRate = (annualRatePercent / 100) / 12;
  const numPayments = termYears * 12;

  const monthlyPayment = monthlyRate === 0
    ? principal / numPayments
    : (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

  const totalOfPayments = monthlyPayment * numPayments;

  return {
    downPayment,
    principal,
    monthlyPayment,
    totalInterest: totalOfPayments - principal,
    totalPaid: totalOfPayments + downPayment,
  };
}
