"use client";

import { useActionState } from "react";
import { cleanInvalidSampleChildSpaces } from "./actions";

export default function SampleChildSpaceCleanupForm({ status, operation }) {
  const [state, formAction, isPending] = useActionState(cleanInvalidSampleChildSpaces, null);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="planHash" value={status?.planHash || ""} />
      <p className="text-sm leading-6 text-white/55">Removes only empty child rows and fixed placeholder-name patterns from the seven allowlisted sample properties. Authored spaces are retained.</p>
      <label className="block text-sm text-white/75">Review reason
        <textarea name="reason" required minLength={12} rows={2} className="mt-2 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
      </label>
      <label className="block text-sm text-white/75">Type <span className="font-mono text-gold">{operation.confirmationPhrase}</span>
        <input name="confirmation" required autoComplete="off" className="mt-2 w-full rounded-lg border border-line bg-black/40 px-3 py-2 font-mono text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
      </label>
      <div aria-live="polite" aria-atomic="true">{state?.message && <p role={state.ok ? "status" : "alert"} className={`rounded-lg border p-3 text-sm ${state.ok ? "border-ok/30 bg-ok/10 text-ok" : "border-danger/30 bg-danger/10 text-danger"}`}>{state.message}</p>}</div>
      <button type="submit" disabled={!status?.canClean || isPending} className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">{isPending ? "Removing and verifying..." : "Remove invalid sample spaces"}</button>
    </form>
  );
}

