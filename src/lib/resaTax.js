// ═══════════════════════════════════════════════════════════════
// PHILIPPINE PROPERTY TRANSFER TAX REFERENCE  (NEW_IDEAS.md §5)
//
// Powers the RESA tax block on the Broker Field Briefing. A broker hands
// this sheet to a client, so every figure here has to be defensible.
//
// ── THE RULE THAT BREAKS NAIVE CALCULATORS ──────────────────────────
// CGT and DST are NOT computed on the selling price. They're computed on
// the HIGHEST of:
//     1. gross selling price
//     2. BIR zonal value
//     3. fair market value per the tax declaration
//
// Zonal value frequently exceeds the asking price. So "6% of the listed
// price" systematically UNDERSTATES the bill, and a broker who quotes it
// as final has misled their client. Every figure this module returns is
// therefore labelled a FLOOR, not an estimate — the real number can only
// go up from here, never down.
//
// ── WHAT THIS MODULE WILL NOT DO ────────────────────────────────────
// • It will not guess a zonal value. That's a BIR lookup per location.
// • It will not compute registration fees — those follow a graduated LRA
//   schedule, and inventing a number is worse than saying "look it up".
// • It will not decide capital vs ordinary asset. Ordinary assets (e.g.
//   developer inventory) attract Creditable Withholding Tax and 12% VAT
//   INSTEAD of CGT — completely different math. The briefing states the
//   assumption rather than silently picking one.
//
// Rates verified 2026-07-29 against BIR guidance and current practice.
// Statutory basis: NIRC §24(D)(1) (CGT), NIRC §196 (DST), Local Government
// Code §135 and §151 (transfer tax).
// ═══════════════════════════════════════════════════════════════

export const TAX_RATES = {
  cgt: {
    key: "cgt",
    label: "Capital Gains Tax",
    rate: 0.06,
    rateLabel: "6%",
    basis: "Highest of selling price, BIR zonal value, or FMV per tax declaration",
    customaryPayer: "Seller",
    statute: "NIRC §24(D)(1)",
    note: "Applies to real property held as a CAPITAL asset. Ordinary assets (developer inventory, dealer stock) attract Creditable Withholding Tax plus 12% VAT instead.",
  },
  dst: {
    key: "dst",
    label: "Documentary Stamp Tax",
    rate: 0.015,
    rateLabel: "1.5%",
    basis: "Highest of selling price, BIR zonal value, or FMV — ₱15 per ₱1,000",
    customaryPayer: "Negotiable — commonly the seller, often shifted to the buyer by contract",
    statute: "NIRC §196",
    note: "Allocation is set by the deed, not by law. Confirm which party the contract assigns it to.",
  },
  transfer: {
    key: "transfer",
    label: "Local Transfer Tax",
    // A RANGE, not a rate. Provinces cap at 0.5%; cities and municipalities
    // inside Metro Manila may go to 0.75% (LGC §151 allows +50% over §135).
    rate: 0.0075,
    rateMin: 0.005,
    rateLabel: "0.5% – 0.75%",
    basis: "Set by the local government unit — verify with the city or provincial treasurer",
    customaryPayer: "Buyer",
    statute: "LGC §135, §151",
    note: "0.75% is the Metro Manila ceiling. Outside Metro Manila the cap is 0.5%. Do not quote a single figure without checking the LGU.",
  },
  registration: {
    key: "registration",
    label: "Registration Fee",
    rate: null, // graduated schedule — deliberately not computed
    rateLabel: "Per LRA schedule",
    basis: "Graduated by value under the Land Registration Authority schedule",
    customaryPayer: "Buyer",
    statute: "LRA Circular",
    note: "Graduated, not a flat percentage. Look up the current LRA table rather than estimating.",
  },
};

/** Peso formatter matching MonthlyCostCalculator. */
export function peso(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}

/**
 * First usable number out of a messy price string ("₱45,000,000" → 45000000).
 * Rejects per-sqm and monthly quotes — a lease rate is not a transfer value,
 * and running transfer taxes on one would be nonsense.
 *
 * @param {string|number} raw
 * @returns {number|null}
 */
export function parseTransferValue(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : null;

  const str = String(raw);
  // A monthly or per-sqm figure is a lease rate, not a sale consideration.
  if (/\/\s*mo|per\s*month|\/\s*sqm|per\s*sqm/i.test(str)) return null;

  const match = str.replace(/,/g, "").match(/\d+(\.\d+)?/);
  const n = match ? Number(match[0]) : null;
  return n && n > 0 ? n : null;
}

/**
 * Indicative transfer-cost floor for a sale.
 *
 * Returns null when there's no usable sale value — the briefing then prints
 * the statutory rates with no peso figures, which is the honest output for a
 * lease listing or a "price on request" record.
 *
 * @param {string|number} listedPrice
 * @param {{ isMetroManila?: boolean }} [options]
 * @returns {{
 *   base: number,
 *   lines: Array<{key,label,rateLabel,amount,amountLabel,payer,basis,statute,note}>,
 *   totalMin: number,
 *   totalMax: number,
 *   isFloor: true
 * }|null}
 */
export function computeTransferCosts(listedPrice, options = {}) {
  const base = parseTransferValue(listedPrice);
  if (!base) return null;

  const { isMetroManila = true } = options;
  const transferRate = isMetroManila ? TAX_RATES.transfer.rate : TAX_RATES.transfer.rateMin;

  const lines = [
    {
      ...TAX_RATES.cgt,
      amount: base * TAX_RATES.cgt.rate,
      amountLabel: peso(base * TAX_RATES.cgt.rate),
      payer: TAX_RATES.cgt.customaryPayer,
    },
    {
      ...TAX_RATES.dst,
      amount: base * TAX_RATES.dst.rate,
      amountLabel: peso(base * TAX_RATES.dst.rate),
      payer: TAX_RATES.dst.customaryPayer,
    },
    {
      ...TAX_RATES.transfer,
      amount: base * transferRate,
      amountLabel: peso(base * transferRate),
      rateLabel: isMetroManila ? "0.75% (Metro Manila)" : "0.5% (outside Metro Manila)",
      payer: TAX_RATES.transfer.customaryPayer,
    },
    {
      ...TAX_RATES.registration,
      amount: null,
      amountLabel: null, // graduated — never invented
      payer: TAX_RATES.registration.customaryPayer,
    },
  ];

  const computed = lines.filter((l) => Number.isFinite(l.amount));
  const totalMin = computed.reduce((sum, l) => sum + l.amount, 0);

  return {
    base,
    lines,
    totalMin,
    // Registration fees and incidental costs sit on top, so the ceiling is
    // genuinely unknown. Exposed as equal to the floor and labelled as such
    // rather than padded with a made-up buffer.
    totalMax: totalMin,
    isFloor: true,
  };
}

/**
 * The disclaimer that must appear wherever computed figures do. Not
 * decorative — quoting these numbers as final is how a broker ends up
 * liable, and the "highest of" rule is the specific trap.
 */
export const TAX_DISCLAIMER =
  "Indicative floor only. CGT and DST are assessed on the HIGHEST of selling price, BIR zonal value, or FMV per tax declaration — where zonal value exceeds the asking price, the actual tax is higher than shown. Local transfer tax varies by LGU. Registration fees follow a graduated LRA schedule and are not included. Assumes the property is a capital asset. Not tax advice — confirm with the BIR, the LGU treasurer, and counsel before relying on any figure.";

/** RA 9646 (RESA) footer. Non-removable on the briefing by design. */
export const RESA_FOOTER =
  "Prepared under Republic Act No. 9646 (Real Estate Service Act of the Philippines). Real estate service practice is limited to licensed professionals. ScoutIt is a neutral technology provider and is not a party to any transaction, does not broker deals, and makes no representation as to the accuracy of listing data supplied by owners or advisors.";

export default computeTransferCosts;
