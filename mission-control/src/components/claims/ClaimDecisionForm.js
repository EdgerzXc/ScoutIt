"use client";

import { useState } from "react";
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
export default function ClaimDecisionForm({ claimId, status, canApprove }) {
  const [transition, setTransition] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const available = Object.keys(REVIEW_TRANSITIONS).filter((t) => canTransition(status, t));
  const rule = transition ? REVIEW_TRANSITIONS[transition] : null;
  const reasons = rule?.requiresReason ? DECISION_REASON_CODES[rule.to] || [] : [];

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("claimId", claimId);
      form.append("transition", transition);
      form.append("reasonCode", reasonCode);
      form.append("note", note);
      const res = await decideClaim(form);
      setResult(res);
      if (res.ok) {
        setTransition("");
        setReasonCode("");
        setNote("");
      }
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (available.length === 0) {
    return (
      <p className="text-xs text-white/60 border-t border-white/5 pt-3">
        Nothing to decide from this state.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="border-t border-white/5 pt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {available.map((t) => {
          const Icon = ICONS[t];
          const disabled = REVIEW_TRANSITIONS[t].transfersListing && !canApprove;
          return (
            <button
              key={t}
              type="button"
              disabled={disabled}
              onClick={() => {
                setTransition(t);
                setReasonCode("");
              }}
              title={disabled ? "Approving a claim transfers the listing — Super Admin only." : undefined}
              className={`px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 transition-colors ${
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
              This moves the listing to the claimant. Whoever holds it now loses it, and they are
              not in this room. Their identity is kept on the record so the transfer can be traced.
            </p>
          )}

          <label className="block text-[12px] uppercase tracking-wide text-white/70">
            Reason
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 normal-case tracking-normal"
            >
              <option value="">Choose a reason…</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[12px] uppercase tracking-wide text-white/70">
            What you decided, and why
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="At least a sentence. This is kept on the claim permanently."
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 normal-case tracking-normal"
            />
          </label>
        </div>
      )}

      {transition && (
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg text-xs bg-[rgba(232,174,60,0.12)] hover:bg-[rgba(232,174,60,0.2)] text-[#F7C64E] border border-[rgba(232,174,60,0.3)] disabled:opacity-50 transition-colors"
        >
          {busy ? "Recording…" : `Confirm: ${REVIEW_TRANSITIONS[transition].label}`}
        </button>
      )}

      {result && (
        <p className={`text-xs ${result.ok ? "text-[#F7C64E]" : "text-red-300"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
