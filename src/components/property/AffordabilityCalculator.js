"use client";

import { useMemo, useState } from "react";
import { calculateMortgage, parsePriceToNumber, MORTGAGE_DEFAULTS } from "@/lib/affordability";
import SettlementTaxSchedule from "./SettlementTaxSchedule";

const peso = (v) => `₱${Math.round(v).toLocaleString("en-PH")}`;

const fieldLabel = { fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase" };
const fieldInput = { background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "2px", padding: "8px 10px", color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "14px", width: "100%" };
const outputRow = { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "11px 0", borderBottom: "1px solid var(--border)", gap: "16px" };
const outputLabel = { fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase" };

// Only meaningful for a purchase (not a lease/rental) — mortgage math doesn't
// apply to renting a space.
function isPurchaseTenure(tenure) {
  const t = (tenure || "").toLowerCase();
  if (!t) return true; // unknown tenure — don't block on a missing field
  return !t.includes("lease") && !t.includes("rent");
}

export default function AffordabilityCalculator({ listedPrice, priceStatus, tenure }) {
  const price = useMemo(() => parsePriceToNumber(listedPrice), [listedPrice]);
  const [downPaymentPercent, setDownPaymentPercent] = useState(MORTGAGE_DEFAULTS.downPaymentPercent);
  const [termYears, setTermYears] = useState(MORTGAGE_DEFAULTS.termYears);
  const [annualRatePercent, setAnnualRatePercent] = useState(MORTGAGE_DEFAULTS.annualRatePercent);

  // Honest-blank rule: no real published price → render nothing, never a guess.
  // Never render against "Price on request" (Master Build Spec §7.1).
  if (!price || priceStatus !== "Published" || !isPurchaseTenure(tenure)) return null;

  const result = calculateMortgage({ price, downPaymentPercent, annualRatePercent, termYears });
  if (!result) return null;

  return (
    <div style={{ marginTop: "24px", padding: "22px 24px", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "4px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
        Affordability Estimate
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", marginBottom: "22px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={fieldLabel}>Down payment %</span>
          <input
            type="number"
            min={MORTGAGE_DEFAULTS.minDownPaymentPercent}
            max={90}
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Math.min(90, Math.max(MORTGAGE_DEFAULTS.minDownPaymentPercent, Number(e.target.value) || 0)))}
            style={fieldInput}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={fieldLabel}>Loan term (years)</span>
          <input
            type="number"
            min={1}
            max={MORTGAGE_DEFAULTS.maxTermYears}
            value={termYears}
            onChange={(e) => setTermYears(Math.min(MORTGAGE_DEFAULTS.maxTermYears, Math.max(1, Number(e.target.value) || 1)))}
            style={fieldInput}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={fieldLabel}>Interest rate % / yr</span>
          <input
            type="number"
            step="0.1"
            min={0}
            max={20}
            value={annualRatePercent}
            onChange={(e) => setAnnualRatePercent(Math.max(0, Number(e.target.value) || 0))}
            style={fieldInput}
          />
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={outputRow}>
          <span style={outputLabel}>Est. monthly payment</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--accent)" }}>{peso(result.monthlyPayment)}</span>
        </div>
        <div style={outputRow}>
          <span style={outputLabel}>Down payment</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "14px", color: "var(--text-primary)" }}>{peso(result.downPayment)}</span>
        </div>
        <div style={{ ...outputRow, borderBottom: "none" }}>
          <span style={outputLabel}>Total interest over term</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "14px", color: "var(--text-primary)" }}>{peso(result.totalInterest)}</span>
        </div>
      </div>

      <p style={{ fontFamily: "system-ui,-apple-system,sans-serif", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "18px" }}>
        Illustrative estimate only — not a loan offer, pre-qualification, or financial advice. Rates and terms shown are editable placeholders for reference; confirm actual terms with a licensed lender. ScoutIt does not arrange, broker, or process financing.
      </p>

      {/* Statutory Philippine Real Estate Transfer Taxes (RESA RA 9646) */}
      <SettlementTaxSchedule listedPrice={listedPrice} />
    </div>
  );
}
