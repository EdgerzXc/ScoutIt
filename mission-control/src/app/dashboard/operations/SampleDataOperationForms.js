"use client";

import { useActionState } from "react";
import { createSampleField, markSampleListings } from "./actions";

function OperationForm({ action, confirmation, buttonLabel, pendingLabel, disabled, help }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm leading-6 text-white/70">{help}</p>
      <label className="block text-sm text-white/75">
        Change reason
        <textarea name="reason" required minLength={12} rows={2}
          className="mt-2 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
      </label>
      <label className="block text-sm text-white/75">
        Type <span className="font-mono text-gold">{confirmation}</span>
        <input name="confirmation" required autoComplete="off"
          className="mt-2 w-full rounded-lg border border-line bg-black/40 px-3 py-2 font-mono text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
      </label>
      <div aria-live="polite" aria-atomic="true">
        {state?.message && <p role={state.ok ? "status" : "alert"}
          className={`rounded-lg border p-3 text-sm ${state.ok ? "border-ok/30 bg-ok/10 text-ok" : "border-danger/30 bg-danger/10 text-danger"}`}>
          {state.message}
        </p>}
      </div>
      <button type="submit" disabled={disabled || isPending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
        {isPending ? pendingLabel : buttonLabel}
      </button>
    </form>
  );
}

export default function SampleDataOperationForms({ status, operation }) {
  const fieldReady = status?.field?.state === "ready";
  const allMarked = Boolean(status?.samples?.allMarked);
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <OperationForm action={createSampleField} confirmation={operation.createConfirmation}
        buttonLabel={fieldReady ? "Field already verified" : "Create verified checkbox"}
        pendingLabel="Creating and verifying..." disabled={!status?.canCreateField}
        help="Creates exactly one Is_Sample checkbox on PROPERTIES_CMS after confirming the field is absent. No other schema is accepted from the browser." />
      <OperationForm action={markSampleListings} confirmation={operation.markConfirmation}
        buttonLabel={allMarked ? "Seven samples verified" : "Mark seven fixed samples"}
        pendingLabel="Marking and verifying..." disabled={!status?.canMarkSamples}
        help="Marks only the seven allowlisted starter slugs. Mission Control reloads Airtable and requires all seven checkboxes to verify." />
    </div>
  );
}
