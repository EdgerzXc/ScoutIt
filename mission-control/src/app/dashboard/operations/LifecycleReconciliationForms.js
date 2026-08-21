"use client";

import { useActionState, useState } from "react";
import { reconcileLifecycleCandidate } from "./actions";

function CandidateForm({ candidate, operation }) {
  const canRestore = candidate.state === "restorable";
  const [decision, setDecision] = useState(canRestore ? "restore_live" : "unpublish");
  const [state, formAction, isPending] = useActionState(reconcileLifecycleCandidate, null);
  const confirmation = decision === "restore_live" ? operation.restoreConfirmation : operation.unpublishConfirmation;
  return (
    <form action={formAction} className="rounded-lg border border-line bg-black/25 p-4 space-y-4">
      <input type="hidden" name="airtableRecordId" value={candidate.airtableRecordId} />
      <input type="hidden" name="reviewHash" value={candidate.reviewHash} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-medium text-white">{candidate.title}</h3><p className="mt-1 font-mono text-[12px] text-white/70">{candidate.slug}</p></div>
        <span className="label-mono rounded border border-warn/30 bg-warn/10 px-2 py-1 text-warn">{candidate.state.replaceAll("_", " ")}</span>
      </div>
      <dl className="grid gap-2 text-xs text-white/70 sm:grid-cols-3">
        <div><dt className="text-white/70">Supabase</dt><dd>{candidate.propertyId ? candidate.lifecycle : "Missing"}</dd></div>
        <div><dt className="text-white/70">Canonical URL</dt><dd>{candidate.canonicalSlug || "Not locked"}</dd></div>
        <div><dt className="text-white/70">Recipient routing</dt><dd>{candidate.routingState}</dd></div>
      </dl>
      <label className="block text-sm text-white/75">Reviewed resolution
        <select name="decision" value={decision} onChange={(event) => setDecision(event.target.value)}
          className="mt-2 w-full rounded-lg border border-line bg-black px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
          {canRestore && <option value="restore_live">Keep public — restore reviewed Supabase lifecycle</option>}
          <option value="unpublish">Remove from public Airtable discovery</option>
        </select>
      </label>
      <label className="block text-sm text-white/75">Decision reason
        <textarea name="reason" required minLength={12} rows={2}
          className="mt-2 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
      </label>
      <label className="block text-sm text-white/75">Type <span className="font-mono text-gold">{confirmation}</span>
        <input name="confirmation" required autoComplete="off"
          className="mt-2 w-full rounded-lg border border-line bg-black/40 px-3 py-2 font-mono text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
      </label>
      <div aria-live="polite" aria-atomic="true">{state?.message && <p role={state.ok ? "status" : "alert"}
        className={`rounded-lg border p-3 text-sm ${state.ok ? "border-ok/30 bg-ok/10 text-ok" : "border-danger/30 bg-danger/10 text-danger"}`}>{state.message}</p>}</div>
      <button type="submit" disabled={isPending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-bright disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
        {isPending ? "Reconciling and verifying..." : "Apply reviewed resolution"}
      </button>
    </form>
  );
}

export default function LifecycleReconciliationForms({ issues, operation }) {
  if (!issues.length) return <p className="rounded-lg border border-ok/25 bg-ok/10 p-4 text-sm text-ok">Every Airtable-public property has a live Supabase lifecycle, canonical slug, owner, and resolved recipient.</p>;
  return <div className="grid gap-4 xl:grid-cols-2">{issues.map((candidate) => <CandidateForm key={candidate.airtableRecordId} candidate={candidate} operation={operation} />)}</div>;
}
