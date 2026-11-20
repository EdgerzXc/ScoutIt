"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Shield } from "lucide-react";
import { DEAL_SUPPORT_CATEGORIES, MAX_DEAL_SUPPORT_MESSAGE } from "@/lib/dealSupport";

export default function DealSupportDialog({ dealId, resolveAuth }) {
  const dialog = useRef(null);
  const sending = useRef(false);
  const pendingRequest = useRef(null);
  const receiptButton = useRef(null);
  const id = useId();
  const [category, setCategory] = useState("glitch");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ticketId, setTicketId] = useState("");

  useEffect(() => {
    if (ticketId && dialog.current?.open) receiptButton.current?.focus();
  }, [ticketId]);

  function open(event) {
    event.currentTarget.focus();
    dialog.current.showModal();
  }

  function resetReceipt() {
    if (!ticketId) return;
    setTicketId("");
    setCategory("glitch");
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    if (sending.current) return;
    const text = message.trim();
    if (!text) {
      setError("Enter a description of the issue.");
      event.currentTarget.elements.namedItem("message").focus();
      return;
    }

    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const { token } = await resolveAuth();
      if (!token) {
        setError("Sign in again to send your support request.");
        return;
      }
      if (pendingRequest.current?.category !== category || pendingRequest.current?.message !== text) {
        pendingRequest.current = { requestId: crypto.randomUUID(), category, message: text };
      }
      const response = await fetch(`/api/deals/${encodeURIComponent(dealId)}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(pendingRequest.current),
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.ticketId !== pendingRequest.current.requestId) {
        if (response.status === 409) pendingRequest.current = null;
        setError(body?.error || "We could not confirm your request. Please try again.");
        return;
      }
      setTicketId(body.ticketId);
      pendingRequest.current = null;
    } catch {
      setError("We could not confirm your request. Please try again.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-controls={id}
        onClick={open}
        className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded border border-gold-accent/30 px-3 py-2 font-mono text-xs uppercase tracking-widest text-gold-accent transition-colors hover:bg-gold-accent/10"
      >
        <Shield size={14} aria-hidden="true" />
        Staff support
      </button>
      <dialog
        id={id}
        ref={dialog}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-privacy`}
        onClose={resetReceipt}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border border-gold-accent/25 bg-surface p-5 text-on-surface backdrop:bg-background/85 sm:p-6"
      >
        <h3 id={`${id}-title`} className="font-working-title text-lg">Staff support</h3>
        <p id={`${id}-privacy`} className="mt-1 text-sm text-text-secondary">
          Your request goes privately to ScoutIt staff. Staff can reply to your account email.
        </p>
        {ticketId ? (
          <div className="mt-4 space-y-3">
            <div role="status" className="space-y-1">
              <p className="font-semibold">Support request saved</p>
              <p className="break-all text-sm text-text-secondary">Reference {ticketId}</p>
            </div>
            <button ref={receiptButton} type="button" onClick={() => dialog.current.close()} className="min-h-11 rounded border border-surface-variant px-4 font-mono text-xs uppercase tracking-wider">
              Done
            </button>
          </div>
        ) : (
          <form aria-labelledby={`${id}-title`} aria-busy={busy} onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label htmlFor={`${id}-category`} className="mb-1 block font-mono text-xs uppercase tracking-wider">Category</label>
              <select
                id={`${id}-category`} name="category" value={category} disabled={busy}
                onChange={(event) => setCategory(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-surface-variant bg-surface px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-gold-accent"
              >
                {Object.entries(DEAL_SUPPORT_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-message`} className="mb-1 block font-mono text-xs uppercase tracking-wider">Describe the issue</label>
              <textarea
                id={`${id}-message`} name="message" value={message} disabled={busy}
                onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={MAX_DEAL_SUPPORT_MESSAGE} required
                className="w-full rounded-lg border border-surface-variant bg-surface px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-gold-accent"
              />
            </div>
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => dialog.current.close()} className="min-h-11 rounded border border-surface-variant px-2 font-mono text-xs uppercase tracking-wider">
                Close
              </button>
              <button type="submit" disabled={busy} className="min-h-11 rounded border border-gold-accent/40 bg-gold-accent/15 px-2 font-mono text-xs font-bold uppercase tracking-wider text-gold-accent disabled:opacity-50">
                {busy ? "Sending…" : "Send request"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
