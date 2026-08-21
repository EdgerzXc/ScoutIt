"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSession } from "@/lib/authClient";
import { extractFacts } from "@/lib/shareBriefing";
import {
  computeTransferCosts,
  peso,
  TAX_DISCLAIMER,
  RESA_FOOTER,
} from "@/lib/resaTax";

// ─────────────────────────────────────────────────────────────────────────
// BROKER FIELD BRIEFING  (NEW_IDEAS.md §5)
//
// An A4-printable sheet a broker carries into a walkthrough. Competitors
// hand out a photo and a price; this is the spec sheet plus the money
// mechanics plus the objection scripts.
//
// HONEST BLANK RULE, enforced hard. Every row renders only if the listing
// actually holds that field. A briefing with six rows of real data beats
// one with twenty rows of "—", and a broker who reads a fabricated ceiling
// height off a ScoutIt sheet in front of a client is a liability event.
//
// TAX BLOCK: shows a FLOOR, never an estimate. CGT and DST are assessed on
// the highest of price / zonal value / FMV, so a figure derived from the
// asking price can only be too low. See src/lib/resaTax.js.
//
// PRINT: `@media print` strips the app chrome and forces A4 with page-break
// control. Screen view is mobile-first — a broker previews this on a phone
// before sending it to print.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

// Objection scripts. These are NEGOTIATION FRAMING, not factual claims
// about the property — they tell the broker how to redirect, and every one
// ends by pointing at verifiable data rather than a promise.
const OBJECTION_SCRIPTS = [
  {
    objection: "“The price is too high.”",
    response:
      "Ask what they're comparing against, then move to price per sqm. A headline figure means nothing without area, and per-sqm is where a premium either justifies itself or doesn't. If it doesn't, say so.",
  },
  {
    objection: "“We need to think about it.”",
    response:
      "Find the specific unknown. “What's the one thing you'd need answered to decide?” Then answer it on the spot or commit to a date. Vague hesitation is almost always one concrete gap.",
  },
  {
    objection: "“The dues are higher than the last unit we saw.”",
    response:
      "Break down what the dues actually cover here versus there — security, common-area power, water, amenities. Dues are only comparable when the inclusions are.",
  },
  {
    objection: "“What are the total costs on top of the price?”",
    response:
      "Walk the transfer-cost table below. Be explicit that CGT and DST are assessed on the higher of price or BIR zonal value, so the figure can rise. Never quote a total as final.",
  },
  {
    objection: "“Can we get it cheaper if we pay cash?”",
    response:
      "Don't answer for the owner. Take the offer, note the terms, bring it back. Committing to a discount you can't authorise is how a deal dies at signing.",
  },
];

/** One spec row. Renders nothing when the value is absent. */
function Row({ label, value }) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  return (
    <div className="bfb-row">
      <span className="bfb-row__k">{label}</span>
      <span className="bfb-row__v">{value}</span>
    </div>
  );
}

/** A section that disappears entirely when it has no populated rows. */
function Section({ title, children }) {
  const hasContent = Array.isArray(children)
    ? children.some((c) => c !== null && c !== false && c !== undefined)
    : Boolean(children);
  if (!hasContent) return null;
  return (
    <section className="bfb-section">
      <h3 className="bfb-section__t">{title}</h3>
      {children}
    </section>
  );
}

export default function BrokerFieldBriefing({ listing, brokerName, onClose }) {
  const sheetRef = useRef(null);
  const [logged, setLogged] = useState(false);

  const facts = useMemo(() => extractFacts(listing || {}), [listing]);
  const details = useMemo(() => {
    const raw = listing?.details;
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  }, [listing]);

  const priceSource = listing?.listed_price ?? listing?.price ?? null;
  const taxes = useMemo(() => computeTransferCosts(priceSource), [priceSource]);

  // Price per sqm — only when BOTH a sale value and an area exist. This is
  // the single most useful number on the sheet and the most tempting to fake.
  const pricePerSqm = useMemo(() => {
    const sqm = Number(String(facts.sqm ?? "").replace(/[^0-9.]/g, ""));
    if (!taxes?.base || !sqm || sqm <= 0) return null;
    return peso(taxes.base / sqm);
  }, [taxes, facts.sqm]);

  // Log the generation once per mount, best-effort. A failed log must never
  // block a broker who's standing in a lobby about to show a unit.
  useEffect(() => {
    if (logged || !listing?.slug) return;
    setLogged(true);
    (async () => {
      try {
        const { data: { session } } = await getSession();
        if (!session?.access_token) return;
        await fetch("/api/broker/briefing-log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ propertyId: listing.slug }),
        });
      } catch {
        /* best-effort only */
      }
    })();
  }, [logged, listing?.slug]);

  if (!listing) return null;

  const generatedAt = new Date().toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="bfb-overlay">
      <style jsx global>{`
        /* ── SCREEN, MOBILE FIRST ─────────────────────────────────────── */
        .bfb-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(8, 8, 8, 0.94);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 12px;
        }
        .bfb-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .bfb-btn {
          flex: 1;
          min-height: 46px;
          border-radius: 3px;
          font-family: ${MONO};
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .bfb-btn--gold  { background: var(--accent-fill); border: none; color: var(--on-accent); font-weight: bold; }
        .bfb-btn--ghost { background: var(--surface); border: 0.5px solid var(--border-solid); color: var(--text-secondary); }

        .bfb-sheet {
          background: #ffffff;
          color: #111111;
          border-radius: 3px;
          padding: 20px 18px;
          max-width: 210mm;
          margin: 0 auto;
          font-family: var(--font-display);
        }
        .bfb-head { border-bottom: 2px solid var(--border-solid); padding-bottom: 12px; margin-bottom: 16px; }
        .bfb-brand {
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--accent-muted);
          margin-bottom: 7px;
        }
        .bfb-title { font-size: 20px; line-height: 1.25; margin: 0 0 6px; font-weight: 600; }
        .bfb-sub {
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          line-height: 1.7;
          text-transform: uppercase;
        }

        .bfb-section { margin-bottom: 16px; break-inside: avoid; }
        .bfb-section__t {
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent-muted);
          border-bottom: 1px solid var(--border-solid);
          padding-bottom: 4px;
          margin: 0 0 8px;
        }
        .bfb-row {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 5px 0;
          border-bottom: 1px dotted var(--border-solid);
          font-size: 12.5px;
          line-height: 1.5;
        }
        .bfb-row__k { color: var(--text-muted); flex-shrink: 0; }
        .bfb-row__v { text-align: right; font-weight: 600; overflow-wrap: anywhere; }

        .bfb-tax { width: 100%; border-collapse: collapse; font-size: 11.5px; }
        .bfb-tax th {
          font-family: ${MONO};
          font-size: 8px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          text-align: left;
          padding: 4px 6px 4px 0;
          border-bottom: 1px solid var(--border-solid);
        }
        .bfb-tax td { padding: 6px 6px 6px 0; border-bottom: 1px dotted var(--border-solid); vertical-align: top; }
        .bfb-tax .num { text-align: right; font-weight: 600; white-space: nowrap; }
        .bfb-tax tfoot td { border-top: 2px solid var(--border-solid); border-bottom: none; font-weight: 700; padding-top: 7px; }
        .bfb-tax__note { font-size: 9.5px; color: var(--text-muted); line-height: 1.5; font-style: italic; }

        .bfb-warn {
          background: #fff8e6;
          border-left: 3px solid var(--accent-muted);
          padding: 9px 11px;
          font-size: 10px;
          line-height: 1.6;
          color: #4a3c10;
          margin-top: 9px;
        }
        .bfb-obj { padding: 8px 0; border-bottom: 1px dotted var(--border-solid); break-inside: avoid; }
        .bfb-obj__q { font-size: 12.5px; font-weight: 700; margin-bottom: 3px; }
        .bfb-obj__a { font-size: 11.5px; line-height: 1.6; color: #333; }

        .bfb-foot {
          margin-top: 18px;
          padding-top: 10px;
          border-top: 2px solid var(--border-solid);
          font-size: 8.5px;
          line-height: 1.65;
          color: #444;
        }
        .bfb-foot strong { color: #111; }

        /* ── DESKTOP ──────────────────────────────────────────────────── */
        @media (min-width: 700px) {
          .bfb-overlay { padding: 28px; }
          .bfb-bar { max-width: 210mm; margin: 0 auto 14px; }
          .bfb-btn { flex: 0 0 auto; padding: 0 26px; }
          .bfb-sheet { padding: 26mm 20mm; }
          .bfb-title { font-size: 24px; }
        }

        /* ── PRINT: A4 ────────────────────────────────────────────────── */
        @page { size: A4 portrait; margin: 14mm; }

        @media print {
          /* Hide the entire app, then re-show only the sheet. Printing from
             inside a dashboard otherwise drags nav and sidebars onto page 1. */
          body * { visibility: hidden !important; }
          .bfb-sheet, .bfb-sheet * { visibility: visible !important; }

          .bfb-overlay {
            position: static !important;
            inset: auto !important;
            background: #fff !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .bfb-bar { display: none !important; }
          .bfb-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            padding: 0 !important;
            border-radius: 0;
            box-shadow: none;
          }
          /* Keep a section and its heading together across a page break. */
          .bfb-section, .bfb-obj, .bfb-tax tr { break-inside: avoid; page-break-inside: avoid; }
          .bfb-section__t { break-after: avoid; page-break-after: avoid; }
          .bfb-foot { break-inside: avoid; page-break-inside: avoid; }
          .bfb-warn { border-left: 3px solid #000; background: #f4f4f4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="bfb-bar">
        <button className="bfb-btn bfb-btn--gold" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <button className="bfb-btn bfb-btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="bfb-sheet" ref={sheetRef}>
        <header className="bfb-head">
          <div className="bfb-brand">ScoutIt · Broker Field Briefing</div>
          <h1 className="bfb-title">{facts.title}</h1>
          <div className="bfb-sub">
            {[facts.category, facts.location].filter(Boolean).join(" · ")}
            <br />
            {brokerName ? `Prepared by ${brokerName} · ` : ""}{generatedAt}
          </div>
        </header>

        <Section title="Commercials">
          <Row label="Asking price" value={taxes ? peso(taxes.base) : (priceSource || null)} />
          <Row label="Price per sqm" value={pricePerSqm} />
          <Row label="Tenure" value={listing?.tenure} />
          <Row label="Association dues" value={details.assocDues || listing?.assocDues} />
          <Row label="CUSA / CAMC" value={details.camc || listing?.camc || details.rstDues} />
        </Section>

        <Section title="The Space">
          <Row label="Floor area" value={facts.sqm ? `${facts.sqm} sqm` : null} />
          <Row label="Bedrooms" value={facts.beds} />
          <Row label="Bathrooms" value={facts.baths} />
          <Row label="Building grade" value={facts.buildingGrade} />
          <Row label="Ceiling height" value={details.DI_Ceiling || details.ceiling_height} />
          <Row label="A/C type" value={details.DI_AC_Type || details.ac_type} />
          <Row label="A/C charges" value={details.DI_AC_Charges} />
          <Row label="Orientation" value={details.DI_Orientation || details.orientation} />
          <Row label="Seating capacity" value={facts.seatingCapacity} />
          <Row label="Standing capacity" value={facts.standingCapacity} />
        </Section>

        <Section title="Title & Parking">
          <Row label="Title status" value={listing?.title_status} />
          <Row label="CCT / TCT allocation" value={details.DI_CCT || details.cct_allocation} />
          <Row label="Parking slots" value={details.DI_Parking || details.parking_slots} />
          <Row label="Parking ratio" value={details.DI_Parking_Ratio} />
          <Row label="Reserved parking" value={details.DI_Reserved_Park} />
        </Section>

        {taxes ? (
          <section className="bfb-section">
            <h3 className="bfb-section__t">Transfer Costs — Indicative Floor</h3>
            <table className="bfb-tax">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Rate</th>
                  <th>Customary payer</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {taxes.lines.map((line) => (
                  <tr key={line.key}>
                    <td>
                      {line.label}
                      <div className="bfb-tax__note">{line.basis}</div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{line.rateLabel}</td>
                    <td>{line.payer}</td>
                    <td className="num">{line.amountLabel || "See schedule"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Floor, excluding registration fees</td>
                  <td className="num">{peso(taxes.totalMin)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="bfb-warn">
              <strong>Read this before quoting a total.</strong> {TAX_DISCLAIMER}
            </div>
          </section>
        ) : (
          <section className="bfb-section">
            <h3 className="bfb-section__t">Transfer Costs</h3>
            <div className="bfb-tax__note">
              N/A — no published sale value on this listing. Transfer taxes are not
              computed for lease rates or price-on-request records.
            </div>
          </section>
        )}

        <section className="bfb-section">
          <h3 className="bfb-section__t">Objection Handling</h3>
          {OBJECTION_SCRIPTS.map((s) => (
            <div className="bfb-obj" key={s.objection}>
              <div className="bfb-obj__q">{s.objection}</div>
              <div className="bfb-obj__a">{s.response}</div>
            </div>
          ))}
        </section>

        <footer className="bfb-foot">
          <strong>RA 9646 Compliance.</strong> {RESA_FOOTER}
          <br />
          <br />
          Figures are drawn from data supplied by the listing owner or advisor and are
          unverified by ScoutIt. Fields with no published data are omitted rather than
          estimated. Confirm every material fact on site and in writing before relying on it.
        </footer>
      </div>
    </div>
  );
}
