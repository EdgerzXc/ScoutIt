"use client";

import { useActionState } from "react";
import { attestRetainedMedia, clearInvalidMediaFields } from "./actions";

function ReviewForm({ action, confirmation, planHash, disabled, label, pendingLabel, help }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="planHash" value={planHash || ""} />
      <p className="text-sm leading-6 text-white/70">{help}</p>
      <label className="block text-sm text-white/75">Review reason
        <textarea name="reason" required minLength={12} rows={2}
          className="mt-2 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
      </label>
      <label className="block text-sm text-white/75">Type <span className="font-mono text-gold">{confirmation}</span>
        <input name="confirmation" required autoComplete="off"
          className="mt-2 w-full rounded-lg border border-line bg-black/40 px-3 py-2 font-mono text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
      </label>
      <div aria-live="polite" aria-atomic="true">
        {state?.message && <p role={state.ok ? "status" : "alert"}
          className={`rounded-lg border p-3 text-sm ${state.ok ? "border-ok/30 bg-ok/10 text-ok" : "border-danger/30 bg-danger/10 text-danger"}`}>{state.message}</p>}
      </div>
      <button type="submit" disabled={disabled || isPending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
        {isPending ? pendingLabel : label}
      </button>
    </form>
  );
}

export default function MediaReviewForms({ status, operation }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ReviewForm action={clearInvalidMediaFields} confirmation={operation.cleanupConfirmation}
        planHash={status?.planHash} disabled={!status?.canClean} label="Clear verified invalid values"
        pendingLabel="Clearing and verifying..."
        help="Clears only values that the fixed classifier proves are placeholders, images in embed fields, invalid URLs, or unsupported providers." />
      <ReviewForm action={attestRetainedMedia} confirmation={operation.attestConfirmation}
        planHash={status?.planHash} disabled={!status?.canAttest} label="Attest retained provider URLs"
        pendingLabel="Recording attestation..."
        help="After invalid values are gone, records that the remaining provider URLs were reviewed and are owner-authorized. This does not change their values." />
    </div>
  );
}
