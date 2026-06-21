"use client";

import { useState } from "react";
import { reportError } from "@/lib/reportError";

/**
 * Always-available "Report a problem" control. Lets any user flag an issue;
 * the message is logged to Supabase `error_reports` (kind = user_report) so we see it.
 */
export default function ReportButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    await reportError({ kind: "user_report", message: text.trim() });
    setSending(false);
    setSent(true);
    setText("");
    setTimeout(() => { setSent(false); setOpen(false); }, 2200);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Report a problem"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[70] bg-surface/90 backdrop-blur-md border border-surface-variant text-text-secondary hover:text-gold-accent hover:border-gold-accent text-xs font-working-title px-3 py-2 rounded-full transition-colors"
      >
        ⚑ Report a problem
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md bg-surface border border-surface-variant rounded-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            {sent ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">✅</div>
                <p className="font-working-title text-on-surface">Thank you — we got it.</p>
              </div>
            ) : (
              <>
                <h3 className="font-headline-editorial text-xl text-on-surface mb-1">Report a problem</h3>
                <p className="text-xs text-text-secondary mb-4">Tell us what went wrong or felt off. This goes straight to the team.</p>
                <textarea
                  className="w-full bg-surface-alt border border-surface-variant rounded px-4 py-3 text-on-surface text-sm min-h-[120px] focus:outline-none focus:border-gold-accent transition-colors"
                  placeholder="What happened?"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button type="button" className="flex-1 border border-surface-variant text-text-secondary hover:text-on-surface font-working-title text-sm py-3 rounded transition-colors" onClick={() => setOpen(false)}>Cancel</button>
                  <button type="button" className="flex-1 bg-gold-accent text-background font-working-title font-bold text-sm py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50" disabled={!text.trim() || sending} onClick={submit}>{sending ? "Sending…" : "Send report"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
