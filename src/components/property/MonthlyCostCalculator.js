"use client";

import { useMemo, useState } from "react";

// ── Monthly Cost Calculator ("Bring Your Own Data") ─────────────────────────
// RA 9646-safe by design: the ONLY prefilled figures are ones the owner/manager
// actually put on the listing (rent, association dues, CAMC, CUSA). ScoutIt
// never estimates a buyer's utilities or lifestyle costs — those inputs start
// empty and the user types their own bills. (Master Build Spec — "Bring Your
// Own Data" affordability sandbox.)

const peso = (v) => `₱${Math.round(v).toLocaleString("en-PH")}`;

const fieldLabel = { fontFamily: "'Courier New',monospace", fontSize: "9px", color: "#c8c8c8", letterSpacing: "0.1em", textTransform: "uppercase" };
const fieldInput = { background: "#0e0e0e", border: "0.5px solid #262626", borderRadius: "2px", padding: "8px 10px", color: "#f0ede8", fontFamily: "Georgia,serif", fontSize: "14px", width: "100%" };
const outputRow = { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 0", borderBottom: "1px solid #262626", gap: "16px" };
const outputLabel = { fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#c8c8c8", letterSpacing: "0.1em", textTransform: "uppercase" };

// First number in a messy price-ish string ("₱1,200 / sqm / mo" → 1200).
function parseNum(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return isFinite(raw) && raw > 0 ? raw : null;
  const m = String(raw).replace(/,/g, "").match(/\d+(\.\d+)?/);
  const n = m ? Number(m[0]) : null;
  return n && n > 0 ? n : null;
}

// Build the "from this listing" rows strictly from fields the listing holds.
function listingCosts(d) {
  const rows = [];
  const sqm = parseNum(d.sqm || d.Floor_Area_Sqm || d.floor_sqm || d.CM_Total_GLA);
  const tenure = (d.tenure || "").toLowerCase();
  const isLease = tenure.includes("lease") || tenure.includes("rent");

  // Monthly rent — only when the listed price is clearly a monthly figure.
  const priceStr = String(d.listed_price || "");
  const isMonthly = /\/\s*mo/i.test(priceStr);
  const isPerSqm = /\/\s*sqm/i.test(priceStr);
  const priceNum = parseNum(priceStr);
  if (isLease && priceNum && isMonthly) {
    if (isPerSqm && sqm) {
      rows.push({ key: "rent", label: `Rent (${peso(priceNum)}/sqm × ${sqm} sqm)`, value: priceNum * sqm });
    } else if (!isPerSqm) {
      rows.push({ key: "rent", label: "Monthly rent", value: priceNum });
    }
  }

  // Restaurant flat rent (RST_Rent is a plain monthly number).
  const rstRent = parseNum(d.rstRent);
  if (!rows.some((r) => r.key === "rent") && rstRent) {
    rows.push({ key: "rent", label: "Monthly rent", value: rstRent });
  }

  // Association dues (residential, ₱/mo).
  const dues = parseNum(d.assocDues);
  if (dues) rows.push({ key: "dues", label: "Association dues", value: dues });

  // CAMC (commercial, quoted per sqm — compute only when area is known).
  const camc = parseNum(d.camc);
  if (camc && sqm) rows.push({ key: "camc", label: `CAMC (${peso(camc)}/sqm × ${sqm} sqm)`, value: camc * sqm });

  // CUSA dues (restaurant/retail, ₱/mo).
  const cusa = parseNum(d.rstDues);
  if (cusa) rows.push({ key: "cusa", label: "CUSA dues", value: cusa });

  return rows;
}

const OWN_COST_FIELDS = [
  { key: "electricity", label: "Electricity" },
  { key: "water", label: "Water" },
  { key: "internet", label: "Internet" },
  { key: "groceries", label: "Groceries" },
  { key: "other", label: "Other monthly costs" },
];

export default function MonthlyCostCalculator({ d }) {
  const fromListing = useMemo(() => listingCosts(d || {}), [d]);
  const [own, setOwn] = useState({ electricity: "", water: "", internet: "", groceries: "", other: "" });

  const ownTotal = OWN_COST_FIELDS.reduce((sum, f) => sum + (Number(own[f.key]) || 0), 0);
  const listingTotal = fromListing.reduce((sum, r) => sum + r.value, 0);
  const total = listingTotal + ownTotal;
  const hasAnything = fromListing.length > 0 || ownTotal > 0;

  const setField = (key, raw) => {
    // digits only, capped to something sane so a stray keypress can't blow up the total
    const clean = raw === "" ? "" : Math.max(0, Math.min(10000000, Number(raw) || 0));
    setOwn((prev) => ({ ...prev, [key]: clean }));
  };

  return (
    <div data-testid="monthly-cost-sandbox" style={{ marginTop: "24px", padding: "22px 24px", background: "#161616", border: "0.5px solid #262626", borderRadius: "4px" }}>
      <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "6px" }}>
        Monthly Cost Sandbox
      </div>
      <p style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#a0a0a0", lineHeight: 1.6, margin: "0 0 18px", maxWidth: "480px" }}>
        What would a month here actually cost you? Listing-verified charges are filled in below — add your own bills to complete the picture.
      </p>

      {/* From the listing — owner/manager-provided figures only */}
      {fromListing.length > 0 ? (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ ...outputLabel, color: "#6E531A", marginBottom: "4px" }}>From this listing</div>
          {fromListing.map((row) => (
            <div key={row.key} style={outputRow}>
              <span style={outputLabel}>{row.label}</span>
              <span style={{ fontFamily: "Georgia,serif", fontSize: "14px", color: "#f0ede8" }}>{peso(row.value)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#5a5a5a", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 18px" }}>
          No recurring charges on record for this listing — ask the representative.
        </p>
      )}

      {/* The user's own numbers — always empty until they type them */}
      <div style={{ ...outputLabel, color: "#6E531A", marginBottom: "10px" }}>Your own estimates</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "14px", marginBottom: "20px" }}>
        {OWN_COST_FIELDS.map((f) => (
          <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={fieldLabel}>{f.label} ₱/mo</span>
            <input
              type="number"
              min={0}
              placeholder="0"
              data-testid={`mcs-input-${f.key}`}
              value={own[f.key]}
              onChange={(e) => setField(f.key, e.target.value)}
              style={fieldInput}
            />
          </label>
        ))}
      </div>

      <div style={{ ...outputRow, borderBottom: "none", borderTop: "1px solid #262626", paddingTop: "14px" }}>
        <span style={outputLabel}>Est. total per month</span>
        <span data-testid="mcs-total" style={{ fontFamily: "Georgia,serif", fontSize: "22px", color: hasAnything ? "#E8AE3C" : "#5a5a5a" }}>
          {hasAnything ? peso(total) : "—"}
        </span>
      </div>

      <p style={{ fontFamily: "system-ui,-apple-system,sans-serif", fontSize: "11px", color: "#5a5a5a", lineHeight: 1.6, marginTop: "14px" }}>
        Listing charges are provided by the owner or property manager and shown as-is. Utility and lifestyle figures are your own inputs — ScoutIt does not estimate, verify, or advise on personal costs.
      </p>
    </div>
  );
}
