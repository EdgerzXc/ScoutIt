"use client";

import { useId, useState } from "react";
import { UserCheck, HelpCircle, XCircle, CheckCircle2 } from "lucide-react";

import { decideClaim } from "@/app/dashboard/claims/actions";
import {
  DECISION_REASON_CODES,
  REVIEW_TRANSITIONS,
  canTransition,
} from "@/lib/propertyClaimPolicy.mjs";

const ICONS = {
  take: UserCheck,
  request_information: HelpCircle,
  reject: XCircle,
  approve: CheckCircle2,
};

const TONE = {
  take: "bg-white/5 hover:bg-white/10 text-white/85 border-white/10",
  request_information: "bg-white/5 hover:bg-white/10 text-white/85 border-white/10",
  reject: "bg-red-400/10 hover:bg-red-400/20 text-red-300 border-red-400/25",
  approve:
    "bg-[rgba(232,174,60,0.10)] hover:bg-[rgba(232,174,60,0.18)] text-[#F7C64E] border-[rgba(232,174,60,0.30)]",
};

/**
 * The decision controls for one claim.
 *
 * The reason and the note are collected BEFORE the button is pressed rather
 * than in a confirmation dialog afterwards. A dialog invites the reviewer to
 * decide first and justify second; this way the justification is part of
 * deciding. The server validates all of it again regardless — this only saves
 * the reviewer a round trip.
 */
export default function ClaimDecisionForm({ claimId, status, revision, canApprove }) {
  const [transition, setTransition] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [current, setCurrent] = useState({ status, revision });
  const reasonId = useId();
  const noteId = useId();

  const available = Object.keys(REVIEW_TRANSITIONS).filter((t) => canTransition(current.status, t));
  const rule = transition ? REVIEW_TRANSITIONS[transition] : null;
  const reasons = rule?.requiresReason ? DECISION_REASON_CODES[rule.to] || [] : [];

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("claimId", claimId);
      form.append("revision", current.revision || "");
      form.append("transition", transition);
      form.append("reasonCode", reasonCode);
      form.append("note", note);
      const res = await decideClaim(form);
      setResult(res);
      if (res.ok) {
        setCurrent({ status: res.status, revision: res.updatedAt });
        setTransition("");
        setReasonCode("");
        setNote("");
      }
    } catch {
      setResult({ ok: false, message: "Could not confirm the decision. Refresh the queue before retrying." });
    } finally {
      setBusy(false);
    }
  }

  if (available.length === 0) {
    return (
      <p role="status" className="text-sm text-[var(--accent-bright)] border-t border-white/5 pt-3">
        {result?.message || "This claim has been decided."}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="border-t border-white/5 pt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {available.map((t) => {
          const Icon = ICONS[t];
          const disabled = busy || (REVIEW_TRANSITIONS[t].transfersListing && !canApprove);
          return (
            <button
              key={t}
              type="button"
              disabled={disabled}
              onClick={() => {
                setTransition(t);
                setReasonCode("");
              }}
              title={REVIEW_TRANSITIONS[t].transfersListing && !canApprove ? "A Super Admin must approve a transfer." : undefined}
              className={`min-h-11 px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 transition-colors ${
                TONE[t]
              } ${transition === t ? "ring-1 ring-[#E8AE3C]/40" : ""} ${
                disabled ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {REVIEW_TRANSITIONS[t].label}
            </button>
          );
        })}
      </div>

      {rule?.requiresReason && (
        <div className="space-y-2">
          {rule.transfersListing && (
            <p className="text-xs text-[#F7C64E] bg-[rgba(232,174,60,0.08)] border border-[rgba(232,174,60,0.25)] rounded-lg p-3">
              Approval transfers the listing to the claimant. The decision records the previous holder and your reason.
            </p>
          )}

          <div>
            <label htmlFor={reasonId} className="block text-[12px] uppercase tracking-wide text-white/70">Reason</label>
            <select
              id={reasonId}
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              disabled={busy}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 normal-case tracking-normal"
            >
              <option value="">Choose a reason…</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={noteId} className="block text-[12px] uppercase tracking-wide text-white/70">Review note</label>
            <div className="mt-1 flex flex-wrap gap-1.5 mb-2">
              {transition === "approve" && (
                <>
                  <button
                    type="button"
                    onClick={() => setNote("The title document matches the claimant's identification.")}
                    className="text-[12px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  >
                    + Title &amp; ID match
                  </button>
                  <button
                    type="button"
                    onClick={() => setNote("Authority to Sell (ATS) and active PRC Broker credentials verified.")}
                    className="text-[12px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  >
                    + ATS &amp; PRC verified
                  </button>
                  <button
                    type="button"
                    onClick={() => setNote("Contract to Sell & developer turnover notice verified.")}
                    className="text-[12px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  >
                    + CTS &amp; Turnover verified
                  </button>
                </>
              )}
              {transition === "request_information" && (
                <>
                  <button
                    type="button"
                    onClick={() => setNote("Please upload a valid government ID matching the name on the title.")}
                    className="text-[12px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  >
                    + Missing Gov ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setNote("Tax Declaration requires accompanying current year Official RPT Tax Receipt.")}
                    className="text-[12px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  >
                    + Need Tax Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setNote("Authority to Sell requires active PRC Real Estate Broker ID.")}
                    className="text-[12px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  >
                    + Need PRC Broker ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setNote("Document scan unreadable. Please re-upload a clear, high-resolution photo.")}
                    className="text-[12px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  >
                    + Re-upload clear scan
                  </button>
                </>
              )}
              {transition === "reject" && (
                <>
                  <button
                    type="button"
                    onClick={() => setNote("Documentation does not match registered title holder or authorized agent.")}
                    className="text-[12px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  >
                    + Unmatched authority
                  </button>
                  <button
                    type="button"
                    onClick={() => setNote("Utility bills or informal receipts are insufficient to claim property title.")}
                    className="text-[12px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  >
                    + Insufficient proof
                  </button>
                </>
              )}
            </div>
            <textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={busy}
              maxLength={2000}
              placeholder="At least a sentence. This is kept on the claim permanently."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 normal-case tracking-normal"
            />
          </div>
        </div>
      )}

      {transition && (
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 px-4 py-2 rounded-lg text-xs bg-[rgba(232,174,60,0.12)] hover:bg-[rgba(232,174,60,0.2)] text-[var(--accent-bright)] border border-[rgba(232,174,60,0.3)] disabled:opacity-50 transition-colors"
        >
          {busy ? "Recording…" : `Confirm: ${REVIEW_TRANSITIONS[transition].label}`}
        </button>
      )}

      <p role="status" className="empty:hidden text-sm text-[var(--accent-bright)]">{result?.ok ? result.message : ""}</p>
      <p role="alert" className="empty:hidden text-sm text-red-300">{result && !result.ok ? result.message : ""}</p>
    </form>
  );
}
