"use client";

import React, { useState } from "react";
import { computeTransferCosts, TAX_DISCLAIMER, RESA_FOOTER, peso } from "@/lib/resaTax";

/**
 * SettlementTaxSchedule (A-192)
 * Renders the statutory Philippine Real Estate Settlement Tax breakdown (RESA RA 9646)
 * for purchase listings. Displays statutory seller and buyer liabilities based on
 * official NIRC and Local Government Code standards.
 */
export default function SettlementTaxSchedule({ listedPrice, location = "" }) {
  const isMetroManila = !location.toLowerCase().includes("province") &&
    !location.toLowerCase().includes("cebu") &&
    !location.toLowerCase().includes("davao") &&
    !location.toLowerCase().includes("siargao");

  const [expanded, setExpanded] = useState(false);
  const data = computeTransferCosts(listedPrice, { isMetroManila });

  if (!data) return null;

  const sellerLines = data.lines.filter((l) => l.payer?.toLowerCase().includes("seller"));
  const buyerLines = data.lines.filter((l) => l.payer?.toLowerCase().includes("buyer") || l.payer?.toLowerCase().includes("negotiable"));

  return (
    <div className="mt-6 p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--border)]">
        <div>
          <span className="font-mono text-xs tracking-[0.14em] uppercase text-[var(--accent)] font-semibold">
            RESA RA 9646 · Statutory Settlement Floor
          </span>
          <h4 className="font-display text-lg mt-0.5 text-[var(--text-primary)]">
            Estimated Closing Taxes & Fees
          </h4>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs tracking-wider uppercase text-[var(--text-muted)] block">
            Baseline Base
          </span>
          <span className="font-mono text-sm text-[var(--accent-bright)]">
            {peso(data.base)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {/* Seller Statutory Floor */}
        <div className="p-3.5 rounded-sm border border-[var(--border)] bg-[var(--surface-alt,rgba(255,255,255,0.02))]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)] font-medium">
              Seller Customary Liability
            </span>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-[var(--accent-muted,rgba(232,174,60,0.15))] text-[var(--accent)]">
              Capital Asset
            </span>
          </div>

          <div className="space-y-2">
            {sellerLines.map((line) => (
              <div key={line.key} className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="font-medium text-[var(--text-primary)]">{line.label}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)] ml-1.5">({line.rateLabel})</span>
                </div>
                <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                  {line.amountLabel || "Per schedule"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex justify-between items-baseline font-mono text-xs">
            <span className="text-[var(--text-muted)]">Seller Est. Floor:</span>
            <span className="text-[var(--accent)] font-bold">
              {peso(sellerLines.reduce((acc, l) => acc + (l.amount || 0), 0))}
            </span>
          </div>
        </div>

        {/* Buyer Statutory Floor */}
        <div className="p-3.5 rounded-sm border border-[var(--border)] bg-[var(--surface-alt,rgba(255,255,255,0.02))]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)] font-medium">
              Buyer Transfer & Registration
            </span>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-[var(--accent-muted,rgba(232,174,60,0.15))] text-[var(--accent)]">
              Title Transfer
            </span>
          </div>

          <div className="space-y-2">
            {buyerLines.map((line) => (
              <div key={line.key} className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="font-medium text-[var(--text-primary)]">{line.label}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)] ml-1.5">({line.rateLabel})</span>
                </div>
                <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                  {line.amountLabel || "Per LRA table"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex justify-between items-baseline font-mono text-xs">
            <span className="text-[var(--text-muted)]">Buyer Est. Floor:</span>
            <span className="text-[var(--accent)] font-bold">
              {peso(buyerLines.reduce((acc, l) => acc + (l.amount || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Statutory Guidance Accordion */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="font-mono text-xs tracking-wide text-[var(--accent)] hover:text-[var(--accent-bright)] transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none"
        >
          <span>{expanded ? "▾ Hide Legal & Statutory Notes" : "▸ View Legal & Statutory Notes (NIRC & LGC Basis)"}</span>
        </button>

        {expanded && (
          <div className="mt-2.5 p-3 rounded-sm bg-[var(--bg,#0e0e0e)] border border-[var(--border)] text-xs leading-relaxed text-[var(--text-secondary)] space-y-2">
            <p>{TAX_DISCLAIMER}</p>
            <p className="font-mono text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
              {RESA_FOOTER}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
