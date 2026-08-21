"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────
// CONNECTS RECEIPT  (NEW_IDEAS.md §38.2, built §40.13)
//
// §38's headline rule: "Every Connect spent must produce a visible,
// confirmable event. Silence after spending is a broken promise."
//
// This is that event. It existed only as a spec until 2026-08-05 — §38.7
// ticked it, but no such component was ever written, so a user spent real
// currency and got a generic "Connection Established" panel that quoted no
// figure at all.
//
// EVERY NUMBER HERE COMES FROM THE SERVER. `connects_spent` and
// `connects_remaining` are read straight off the /api/deals/initiate
// response, which reads them off the `spend_connects` RPC's return — the same
// transaction that moved the balance. Nothing on this screen is derived,
// defaulted, or computed client-side. If a field is missing it is omitted,
// never filled with a plausible-looking number: this is a receipt for money,
// and a wrong receipt is worse than no receipt.
// ─────────────────────────────────────────────────────────────────────────

const pulseTransition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] };

export default function ConnectsReceipt({ receipt, propertyTitle, recipientLabel, onDismiss }) {
  if (!receipt) return null;

  const spent = Number.isFinite(receipt.connects_spent) ? receipt.connects_spent : null;
  const remaining = Number.isFinite(receipt.connects_remaining) ? receipt.connects_remaining : null;

  return (
    <motion.div
      className="text-center py-6 flex flex-col items-center gap-1"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={pulseTransition}
    >
      {/* The gold pulse §38.2 asks for — an event, not a toast. Kept to a
          single 300ms ring rather than a full-screen takeover: this renders
          inside the modal the user is already looking at, and covering the
          screen would hide the figures they came here to read. */}
      <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border border-gold-accent/60"
          initial={{ scale: 0.6, opacity: 0.9 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        <div className="w-16 h-16 rounded-full bg-gold-accent/10 border border-gold-accent/40 flex items-center justify-center text-2xl">
          🤝
        </div>
      </div>

      <p className="font-mono text-[12px] tracking-[0.12em] uppercase text-gold-accent">
        Connect sent
      </p>

      {spent !== null && (
        <p className="font-data-tabular text-4xl text-gold-bright leading-tight mt-1">
          {spent}
          <span className="font-mono text-xs tracking-widest uppercase text-gold-accent/70 ml-2">
            {spent === 1 ? "Connect" : "Connects"}
          </span>
        </p>
      )}

      <div className="w-full max-w-xs mt-5 border-t border-white/10 pt-4 text-left space-y-2">
        <ReceiptRow label="To" value={propertyTitle} />
        <ReceiptRow label="Via" value={recipientLabel} />
        {/* Omitted rather than zero-filled when the server didn't send it.
            A balance of "0" that is actually "unknown" would send someone to
            support over a wallet that is fine. */}
        {remaining !== null && (
          <ReceiptRow
            label="Balance left"
            value={`${remaining} ${remaining === 1 ? "Connect" : "Connects"}`}
            mono
          />
        )}
      </div>

      {/* §38.3: the request is DELIVERED, not accepted. This used to read
          "your chatbox is now open," which will be flatly untrue the moment
          the §40.9 migration lands — and is misleading even today, because
          the recipient has not agreed to anything yet. */}
      {/* No deadline is quoted, because there isn't one (§40.15). Requests
          stay open until answered or withdrawn. Never reintroduce a countdown
          here without a real mechanism behind it. */}
      <p className="text-xs text-[#f0ede8]/60 leading-relaxed max-w-xs mt-5">
        Your request stays open until they reply — there&apos;s no deadline. You
        can withdraw it from your inbox at any time. Connects are spent on
        sending and aren&apos;t returned.
      </p>

      <Link
        href="/dashboard/inbox"
        onClick={onDismiss}
        className="mt-5 w-full max-w-xs py-3 rounded-lg bg-gold-accent text-background font-mono text-xs uppercase tracking-widest font-bold hover:bg-gold-bright transition-colors"
      >
        View pending conversation →
      </Link>
    </motion.div>
  );
}

function ReceiptRow({ label, value, mono = false }) {
  if (!value) return null; // Honest Blank Rule — no "—" placeholders on a receipt.
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="font-mono text-[12px] uppercase tracking-widest text-[#f0ede8]/40 shrink-0">
        {label}
      </span>
      <span className={`text-sm text-white text-right ${mono ? "font-data-tabular" : ""}`}>
        {value}
      </span>
    </div>
  );
}
