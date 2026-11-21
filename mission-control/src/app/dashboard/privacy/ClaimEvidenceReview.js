"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CLAIM_EVIDENCE_CONFIRMATION } from "@/lib/claimEvidenceDisposition.mjs";
import { changeClaimEvidence, loadClaimEvidence } from "./claimEvidenceActions";

const STATUS = { retained: "Retained", held: "On hold", removing: "Awaiting confirmation", erased: "Removed from active storage" };
const DECISIONS = {
  retained: [["hold", "Place hold"], ["remove", "Remove file"]],
  held: [["release", "Release hold"]],
  removing: [["remove", "Retry removal"]],
};
const controlClass = "min-h-11 rounded-lg border border-white/20 px-3 py-2 disabled:opacity-50";
const inputClass = `w-full bg-black/40 text-white ${controlClass}`;

export default function ClaimEvidenceReview({ requestId }) {
  const sectionId = useId();
  const [page, setPage] = useState(null);
  const [after, setAfter] = useState(null);
  const [selected, setSelected] = useState("");
  const [decision, setDecision] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadButton = useRef(null);
  const decisionSelect = useRef(null);

  useEffect(() => {
    if (selected) decisionSelect.current?.focus();
  }, [selected]);

  function reportError(text) {
    setError(text || "Could not confirm the evidence decision. Reload the evidence before retrying.");
  }

  async function readPage(cursor) {
    const nextPage = await loadClaimEvidence(requestId, cursor);
    if (nextPage.error) {
      reportError(nextPage.error);
      return;
    }
    setPage(nextPage);
    setAfter(cursor);
  }

  async function refresh(cursor) {
    setBusy(true);
    setError("");
    setMessage("");
    setSelected("");
    try {
      await readPage(cursor);
    } catch {
      reportError("Could not load claim evidence for this request.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event, document) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await changeClaimEvidence({
        requestId, documentId: document.id, revision: document.revision, decision,
        note: form.get("note"), confirmation: form.get("confirmation"),
      });
      if (result.error) {
        reportError(result.error);
        return;
      }
      setSelected("");
      setMessage("Evidence decision recorded. The privacy request remains open.");
      await readPage(after);
      loadButton.current?.focus();
    } catch {
      reportError();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 space-y-3 border-t border-white/10 pt-3 text-sm text-white" aria-label="Submitted claim evidence">
      <div className="flex flex-wrap gap-2">
        <button type="button" ref={loadButton} aria-disabled={busy} onClick={() => { if (!busy) refresh(null); }}
          className={`${controlClass} font-mono text-xs uppercase tracking-wide text-[var(--accent-bright)]`}>
          {page ? "Reload claim evidence" : "Load claim evidence"}
        </button>
        {page?.next && <button type="button" className={controlClass} disabled={busy}
          onClick={() => refresh(page.next)}>Next evidence page</button>}
      </div>
      <p role="status" className="text-white/80">{busy ? "Checking claim evidence…" : message}</p>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {page?.evidence.length === 0 && <p className="text-white/75">No claim evidence is available on this page.</p>}
      {page?.evidence.length > 0 && <ul className="space-y-2">
        {page.evidence.map((document) => {
          const options = DECISIONS[document.status];
          return <li key={document.id} className="space-y-2 rounded-lg border border-white/10 p-3">
            <p className="font-semibold text-white">{STATUS[document.status]}</p>
            <p className="break-all font-mono text-xs text-white/80">Evidence {document.id}</p>
            {document.claimId && <p className="break-all font-mono text-xs text-white/75">Claim {document.claimId} · Listing {document.propertyId}</p>}
            {options && selected !== document.id && <button type="button" className={controlClass} disabled={busy}
              aria-label={`Record decision for evidence ${document.id}`} onClick={() => {
                setSelected(document.id);
                setDecision(options[0][0]);
                setError("");
                setMessage("");
              }}>Record evidence decision</button>}
            {options && selected === document.id && <form onSubmit={(event) => submit(event, document)} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor={`${sectionId}-decision`}>Decision</label>
                <select ref={decisionSelect} id={`${sectionId}-decision`} className={inputClass} disabled={busy} value={decision}
                  onChange={(event) => setDecision(event.target.value)}>
                  {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor={`${sectionId}-note`}>Review note</label>
                <textarea id={`${sectionId}-note`} name="note" rows={3} required minLength={12} maxLength={1000}
                  disabled={busy} className={inputClass} />
              </div>
              {decision === "remove" && <div className="space-y-2">
                <p className="text-white/80">Removal permanently deletes this file from active storage. Check the evidence ID and confirm that no hold applies.</p>
                <label className="block" htmlFor={`${sectionId}-confirmation`}>Type {CLAIM_EVIDENCE_CONFIRMATION} to confirm</label>
                <input id={`${sectionId}-confirmation`} name="confirmation" className={inputClass} required
                  autoComplete="off" maxLength={CLAIM_EVIDENCE_CONFIRMATION.length} disabled={busy} />
              </div>}
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={busy}
                  className="min-h-11 rounded-lg bg-[var(--accent-bright)] px-3 font-mono text-xs uppercase tracking-wide text-black disabled:opacity-50">
                  Save evidence decision
                </button>
                <button type="button" className={controlClass} disabled={busy} onClick={() => {
                  setSelected("");
                  loadButton.current?.focus();
                }}>Cancel</button>
              </div>
            </form>}
          </li>;
        })}
      </ul>}
    </section>
  );
}
