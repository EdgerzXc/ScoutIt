"use client";

import { useState } from "react";
import {
  leadToText,
  leadToVCard,
  leadsToCsv,
  exportFilename,
  requestLeadExportAudit,
  normalizeLeadIds,
  hasValidLeadExportReceipt,
} from "@/lib/leadExport";

// ─────────────────────────────────────────────────────────────────────────
// LEAD EXPORT BUTTON (NEW_IDEAS.md §8, audited)
//
// THREE PATHS:
//   Copy → paste into any CRM note, email or chat
//   .csv → import wizard in HubSpot / Salesforce / Zoho, or a spreadsheet
//   .vcf → straight into phone contacts
//
// PRIVACY & AUDIT:
// Server-side audit authorization is requested prior to PII release.
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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function LeadExportButton({ lead, leads, label = "Export", compact = false }) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const isBulk = Array.isArray(leads);
  const items = isBulk ? leads : lead ? [lead] : [];
  if (items.length === 0) return null;

  const leadIds = normalizeLeadIds(items);

  const auditAndExecute = async (format, releaseCallback) => {
    setError(null);
    setExporting(true);
    try {
      if (!leadIds) {
        setError("Export blocked: every selected lead needs a unique verified ID.");
        return;
      }
      const auditRes = await requestLeadExportAudit({ leadIds, format });

      if (!hasValidLeadExportReceipt(auditRes, leadIds.length, format)) {
        setError(auditRes?.data?.message || "Export authorization failed. No contact data was released.");
        return;
      }

      await releaseCallback();
    } catch (err) {
      setError(err?.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const copy = () => {
    auditAndExecute("clipboard_copy", async () => {
      const text = isBulk ? leadsToCsv(items) : leadToText(items[0]);
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
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
    });
  };

  const downloadCsv = () => {
    auditAndExecute("csv", () => {
      const name = isBulk ? "scoutit-leads" : `lead-${items[0]?.name || "export"}`;
      download(leadsToCsv(items), exportFilename(name, "csv"), "text/csv");
    });
  };

  const downloadVCard = () => {
    const vcard = leadToVCard(items[0]);
    if (!vcard) {
      setError("No contact details to save yet.");
      return;
    }
    auditAndExecute("vcard", () => {
      download(vcard, exportFilename(`contact-${items[0]?.name || "lead"}`, "vcf"), "text/vcard");
    });
  };

  return (
    <div className="lx-root">
      <style jsx global>{`
        .lx-root { display: flex; flex-direction: column; gap: 7px; }
        .lx-label {
          font-family: ${MONO};
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .lx-btns { display: flex; flex-direction: column; gap: 7px; }
        .lx-btn {
          min-height: 44px;
          width: 100%;
          border-radius: 3px;
          background: transparent;
          border: 0.5px solid var(--border-solid);
          color: var(--text-secondary);
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .lx-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .lx-btn:hover:not(:disabled) { border-color: var(--accent-muted); color: var(--accent); }
        .lx-btn--primary {
          background: rgba(232, 174, 60, 0.08);
          border-color: rgba(232, 174, 60, 0.32);
          color: var(--accent);
        }
        .lx-btn--ok { border-color: rgba(127,191,127,0.4); color: var(--green); }
        .lx-hint {
          font-family: ${MONO};
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          line-height: 1.6;
        }
        .lx-error {
          font-family: ${MONO};
          font-size: 12px;
          color: var(--red);
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
          disabled={exporting}
        >
          {copied ? "✓ Copied" : exporting ? "Authorizing..." : isBulk ? `Copy ${items.length} as CSV` : "Copy details"}
        </button>

        <button className="lx-btn" onClick={downloadCsv} disabled={exporting}>
          {exporting ? "Authorizing..." : "Download .csv"}
        </button>

        {!isBulk && (
          <button className="lx-btn" onClick={downloadVCard} disabled={exporting}>
            {exporting ? "Authorizing..." : "Save contact"}
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
