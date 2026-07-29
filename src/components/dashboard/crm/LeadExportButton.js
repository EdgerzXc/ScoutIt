"use client";

import { useState } from "react";
import {
  leadToText,
  leadToVCard,
  leadsToCsv,
  exportFilename,
} from "@/lib/leadExport";

// ─────────────────────────────────────────────────────────────────────────
// LEAD EXPORT BUTTON  (NEW_IDEAS.md §8, redesigned)
//
// Replaces the webhook dispatcher the spec originally called for. See the
// header of src/lib/leadExport.js for why — short version: a webhook makes
// ScoutIt a feeder into a competitor's system of record, and the strategy
// is for brokers to eventually not need one.
//
// Everything here is client-side. No API route, no keys, no cost, and
// nothing that can silently fail the way a webhook delivery can.
//
// THREE PATHS, because brokers work in three places:
//   Copy    → paste into any CRM note, email or chat
//   .csv    → import wizard in HubSpot / Salesforce / Zoho, or a spreadsheet
//   .vcf    → straight into a phone's contacts, which is where a broker in
//             the field actually is
//
// PRIVACY: renders nothing until the handshake is accepted. Contact details
// are gated in the UI for a reason and this must not become the side door.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

function download(content, filename, mime) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick — Safari cancels the download if the URL dies
  // synchronously after click().
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function LeadExportButton({ lead, leads, label = "Export", compact = false }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const isBulk = Array.isArray(leads);
  const items = isBulk ? leads : lead ? [lead] : [];
  if (items.length === 0) return null;

  const copy = async () => {
    setError(null);
    const text = isBulk ? leadsToCsv(items) : leadToText(items[0]);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API needs a secure context and can be blocked outright.
      // Fall back to the legacy path rather than leaving a dead button.
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setError("Couldn't copy — select the text manually.");
      }
    }
  };

  const downloadCsv = () => {
    const name = isBulk ? "scoutit-leads" : `lead-${items[0]?.name || "export"}`;
    download(leadsToCsv(items), exportFilename(name, "csv"), "text/csv");
  };

  const downloadVCard = () => {
    const vcard = leadToVCard(items[0]);
    if (!vcard) {
      setError("No contact details to save yet.");
      return;
    }
    download(vcard, exportFilename(`contact-${items[0]?.name || "lead"}`, "vcf"), "text/vcard");
  };

  return (
    <div className="lx-root">
      <style jsx global>{`
        /* ── MOBILE FIRST ─────────────────────────────────────────────── */
        .lx-root { display: flex; flex-direction: column; gap: 7px; }
        .lx-label {
          font-family: ${MONO};
          font-size: 9px;
          color: #6a6a6a;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .lx-btns { display: flex; flex-direction: column; gap: 7px; }
        .lx-btn {
          min-height: 44px;
          width: 100%;
          border-radius: 3px;
          background: transparent;
          border: 0.5px solid #262626;
          color: #c8c8c8;
          font-family: ${MONO};
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .lx-btn:hover { border-color: #6E531A; color: #E8AE3C; }
        .lx-btn--primary {
          background: rgba(232, 174, 60, 0.08);
          border-color: rgba(232, 174, 60, 0.32);
          color: #E8AE3C;
        }
        .lx-btn--ok { border-color: rgba(127,191,127,0.4); color: #7fbf7f; }
        .lx-hint {
          font-family: ${MONO};
          font-size: 8.5px;
          color: #4a4a4a;
          letter-spacing: 0.08em;
          line-height: 1.6;
        }
        .lx-error {
          font-family: ${MONO};
          font-size: 9px;
          color: #e06c6c;
          letter-spacing: 0.05em;
          line-height: 1.5;
        }

        @media (min-width: 700px) {
          .lx-btns { flex-direction: row; }
          .lx-btn { width: auto; flex: 1; padding: 0 14px; }
        }
      `}</style>

      {!compact && <div className="lx-label">{label}</div>}

      <div className="lx-btns">
        <button
          className={`lx-btn lx-btn--primary ${copied ? "lx-btn--ok" : ""}`}
          onClick={copy}
        >
          {copied ? "✓ Copied" : isBulk ? `Copy ${items.length} as CSV` : "Copy details"}
        </button>

        <button className="lx-btn" onClick={downloadCsv}>
          Download .csv
        </button>

        {!isBulk && (
          <button className="lx-btn" onClick={downloadVCard}>
            Save contact
          </button>
        )}
      </div>

      {error && <div className="lx-error">{error}</div>}

      {!compact && (
        <div className="lx-hint">
          {isBulk
            ? "CSV imports into HubSpot, Salesforce, Zoho or any spreadsheet."
            : "Paste into any CRM note, or save the contact to your phone."}
        </div>
      )}
    </div>
  );
}
