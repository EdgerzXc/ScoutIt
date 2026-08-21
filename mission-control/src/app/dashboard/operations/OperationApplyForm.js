"use client";

import { useActionState } from "react";
import { applyOnboardingMigration, applyPilotCohortMigration, applyWishlistRevocationMigration } from "./actions";

const ACTIONS = { onboarding: applyOnboardingMigration, pilotCohort: applyPilotCohortMigration, wishlistRevocation: applyWishlistRevocationMigration };

export default function OperationApplyForm({ checksum, confirmationPhrase, disabled, operation = "onboarding" }) {
  const [state, formAction, isPending] = useActionState(ACTIONS[operation] || applyOnboardingMigration, null);

  return (
    <form action={formAction} className="space-y-4" aria-describedby="migration-execution-help">
      <input type="hidden" name="checksum" value={checksum} />
      <p id="migration-execution-help" className="text-sm text-white/70 leading-6">
        This is the only write control. Mission Control re-runs every preflight check immediately
        before sending the fixed, checksum-locked migration.
      </p>
      <label className="block text-sm text-white/75">
        Change reason
        <textarea
          name="reason"
          required
          minLength={12}
          rows={3}
          placeholder="Why this schema change is being applied now"
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        />
      </label>
      <label className="block text-sm text-white/75">
        Type <span className="font-mono text-gold">{confirmationPhrase}</span>
        <input
          name="confirmation"
          required
          autoComplete="off"
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        />
      </label>
      <div aria-live="polite" aria-atomic="true">
        {state?.message && (
          <p className={`rounded-lg border p-3 text-sm ${state.ok
            ? "border-ok/30 bg-ok/10 text-ok"
            : "border-danger/30 bg-danger/10 text-danger"}`} role={state.ok ? "status" : "alert"}>
            {state.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled || isPending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {isPending ? "Applying and verifying…" : "Apply verified migration"}
      </button>
    </form>
  );
}
