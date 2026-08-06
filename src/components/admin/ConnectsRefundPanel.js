"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { sanitizeError } from "@/lib/sanitizeError";

// ─────────────────────────────────────────────────────────────────────────
// SYSTEM-ERROR CONNECT REFUND PANEL  (NEW_IDEAS.md §38.3 / §40.16)
//
// §38.3's refund policy is locked: no refunds on decline, non-response or
// withdrawal. The single exception is a verifiable ScoutIt system error, and
// this is the only surface that can issue one.
//
// The design is deliberately slow. Every guard here exists because the
// alternative — hand-written SQL against connect_balances — moves a balance
// and records nothing: no who, no why, no incident. A refund path with no
// audit trail is indistinguishable from quietly topping up a friend's wallet.
//
// So: look up the wallet first, read the ledger, then credit with a written
// reason that goes into that ledger row alongside the staff id.
// ─────────────────────────────────────────────────────────────────────────

const MIN_REASON = 10;

export default function ConnectsRefundPanel() {
  const [userId, setUserId] = useState("");
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [refId, setRefId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type, text }

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
    };
  }

  async function lookup() {
    if (!userId.trim()) return;
    setBusy(true);
    setMsg(null);
    setWallet(null);
    try {
      const res = await fetch(`/api/admin/connects-refund?userId=${encodeURIComponent(userId.trim())}`, {
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed.");
      setWallet(data);
    } catch (err) {
      setMsg({ type: "error", text: sanitizeError(err, "Lookup failed.") });
    } finally {
      setBusy(false);
    }
  }

  async function issueRefund() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/connects-refund", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          userId: userId.trim(),
          amount: Number(amount),
          reason: reason.trim(),
          refId: refId.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refund failed.");
      setMsg({
        type: "success",
        text: `${amount} Connect${amount === 1 ? "" : "s"} credited. New balance: ${data.newBalance}. Ledger entry ${data.transactionId}.`,
      });
      setReason("");
      setRefId("");
      await lookup(); // re-read so the panel shows the ledger row it just wrote
    } catch (err) {
      setMsg({ type: "error", text: sanitizeError(err, "Refund failed.") });
    } finally {
      setBusy(false);
    }
  }

  const reasonOk = reason.trim().length >= MIN_REASON;
  const canSubmit = wallet && reasonOk && Number(amount) > 0 && !busy;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-error/30 bg-error/5 p-4">
        <h3 className="font-working-title text-sm text-error mb-1">
          System-error refunds only
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Connects are <strong>not</strong> refunded when a recipient declines, doesn&apos;t
          reply, or the sender withdraws — those are decisions, and the Connect paid for the
          attempt. Use this <strong>only</strong> when ScoutIt was at fault: a request that
          was charged but never created, a double charge, or a deduction with no
          conversation. Every credit is written to the ledger with your name and reason.
        </p>
      </div>

      {/* Step 1 — look before you credit */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID"
          className="flex-1 min-w-0 bg-surface border border-surface-variant rounded px-3 py-2.5 text-base sm:text-sm text-on-surface focus:outline-none focus:border-gold-accent/50"
        />
        <button
          onClick={lookup}
          disabled={busy || !userId.trim()}
          className="px-4 py-2.5 rounded bg-white/5 border border-white/15 text-on-surface text-xs font-mono uppercase tracking-widest hover:bg-white/10 disabled:opacity-50"
        >
          Look up wallet
        </button>
      </div>

      {wallet && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Total", wallet.balance.total_balance],
              ["Purchased", wallet.balance.purchased_balance],
              ["Granted", wallet.balance.granted_balance],
              ["Earned", wallet.balance.earned_balance],
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-surface-variant bg-surface p-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">{label}</p>
                <p className="font-data-tabular text-xl text-on-surface mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Repeated refunds usually mean an unfixed bug, not bad luck. */}
          {wallet.priorRefunds > 0 && (
            <p className="text-xs text-gold-accent">
              ⚠️ This user has had {wallet.priorRefunds} prior system-error refund
              {wallet.priorRefunds === 1 ? "" : "s"}. Check whether the underlying fault is
              still unfixed before issuing another.
            </p>
          )}

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
              Recent ledger
            </p>
            <div className="max-h-56 overflow-y-auto rounded border border-surface-variant divide-y divide-surface-variant">
              {wallet.ledger.length === 0 ? (
                <p className="p-3 text-xs text-text-secondary">No transactions.</p>
              ) : (
                wallet.ledger.map((t) => (
                  <div key={t.id} className="p-3 flex justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="text-on-surface truncate">{t.reason}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mt-0.5">
                        {t.kind} · {t.bucket} · {new Date(t.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`font-data-tabular shrink-0 ${
                        t.kind === "spend" ? "text-error" : "text-success"
                      }`}
                    >
                      {t.kind === "spend" ? "−" : "+"}
                      {t.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Step 2 — credit, with the reason that lands in the ledger */}
          <div className="space-y-3 rounded-lg border border-surface-variant p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
                  Connects to credit
                </span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-surface border border-surface-variant rounded px-3 py-2.5 text-base sm:text-sm text-on-surface focus:outline-none focus:border-gold-accent/50"
                />
              </label>
              <label className="flex-1">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
                  Related deal / incident ID (optional)
                </span>
                <input
                  value={refId}
                  onChange={(e) => setRefId(e.target.value)}
                  className="w-full bg-surface border border-surface-variant rounded px-3 py-2.5 text-base sm:text-sm text-on-surface focus:outline-none focus:border-gold-accent/50"
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
                What went wrong? (required, min {MIN_REASON} characters)
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. Connect charged on 2026-08-05 but create_routed_buyer_deal failed; no conversation was created. Verified in logs."
                className="w-full bg-surface border border-surface-variant rounded px-3 py-2.5 text-base sm:text-sm text-on-surface focus:outline-none focus:border-gold-accent/50"
              />
              <span
                className={`block text-[10px] font-mono mt-1 ${
                  reasonOk ? "text-text-muted" : "text-gold-accent"
                }`}
              >
                {reason.trim().length}/{MIN_REASON} — this text is written to the ledger permanently.
              </span>
            </label>

            <button
              onClick={issueRefund}
              disabled={!canSubmit}
              className="w-full py-3 rounded bg-gold-accent text-background font-mono text-xs uppercase tracking-widest font-bold hover:bg-gold-bright transition-colors disabled:opacity-40"
            >
              {busy ? "Working…" : `Credit ${amount} Connect${Number(amount) === 1 ? "" : "s"}`}
            </button>
          </div>
        </>
      )}

      {msg && (
        <p className={`text-xs ${msg.type === "error" ? "text-error" : "text-success"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
