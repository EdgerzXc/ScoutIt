"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { LIFECYCLE_REVIEW_ACTIONS } from "@/lib/propertyLifecycleReview.mjs";
import { reconcileLifecycleCandidate, retryLifecycleCache } from "./actions";

const FIELD = "mt-1 min-h-11 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-white";
const BUTTON = "min-h-11 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-gold-bright disabled:opacity-45";
const STATUS_LABELS = {
  ambiguous: "Conflicting matches",
  binding_conflict: "Record already bound elsewhere",
  canonical_conflict: "Canonical address differs",
  details_conflict: "Listing details differ",
  invalid_public_address: "Invalid public address",
  missing_supabase: "No matching Supabase listing",
  permanently_removed: "Permanently removed",
  protected_unbound: "Protected listing without a binding",
  publication_pending: "Publication update pending",
  publication_unverified: "Publication evidence incomplete",
  reserved_address: "Historical address reserved",
  restorable: "Supabase lifecycle needs repair",
  routing_unavailable: "Inquiry routing could not be verified",
  staff_suspended: "Staff suspended",
  unbound: "Airtable binding missing",
  withdrawn: "Withdrawn listing still public",
};

function CatalogueRefreshButton({ intentId, onComplete }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    setResult(null);
    try {
      const answer = await retryLifecycleCache(intentId);
      setResult(answer);
      if (answer.ok) onComplete?.(answer);
    } catch {
      setResult({ ok: false, message: "Could not confirm the catalogue refresh. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {!result?.ok && <button type="button" disabled={busy} onClick={refresh} className={BUTTON}>Retry catalogue refresh</button>}
      <p role="status" className="empty:hidden text-sm text-ok">{result?.ok ? result.message : ""}</p>
      <p role="alert" className="empty:hidden text-sm text-danger">{result && !result.ok ? result.message : ""}</p>
    </div>
  );
}

function CandidateForm({ candidate }) {
  const router = useRouter();
  const id = useId();
  const [result, setResult] = useState(null);
  const [cacheRetryId, setCacheRetryId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const decision = candidate.actions[0];
  const policy = LIFECYCLE_REVIEW_ACTIONS[decision];

  async function submit(event) {
    event.preventDefault();
    if (busy || saved || !policy) return;
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    setResult(null);
    try {
      const answer = await reconcileLifecycleCandidate(formData);
      setResult(answer);
      if (answer.ok) {
        setSaved(true);
        setCacheRetryId(answer.cacheRetryId);
      }
    } catch {
      setResult({ ok: false, message: "Could not confirm the resolution. Refresh the review before retrying." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="min-w-0 space-y-4 rounded-lg border border-line bg-black/25 p-4" aria-labelledby={id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={id} className="break-words font-medium text-white">{candidate.title}</h3>
          <p className="mt-1 break-all font-mono text-xs text-white/70">{candidate.slug || "No public address"}</p>
        </div>
        <span className="label-mono rounded border border-warn/30 bg-warn/10 px-2 py-1 text-warn">
          {STATUS_LABELS[candidate.state]}
        </span>
      </div>
      <dl className="grid gap-3 text-sm text-white/75 sm:grid-cols-2">
        <div className="min-w-0"><dt className="font-medium text-white/90">Airtable record</dt>
          <dd className="break-all font-mono text-xs">{candidate.airtableRecordId}</dd>
          {candidate.location && <dd className="break-words">{candidate.location}</dd>}
        </div>
        <div className="min-w-0"><dt className="font-medium text-white/90">Supabase listing</dt>
          <dd className="break-words">{candidate.privateTitle || (candidate.state === "ambiguous" ? "Multiple possible matches" : "No confirmed match")}</dd>
          {candidate.privateLocation && <dd className="break-words">{candidate.privateLocation}</dd>}
          {candidate.propertyId && <dd className="break-all font-mono text-xs">{candidate.propertyId}</dd>}
        </div>
        <div className="min-w-0"><dt className="font-medium text-white/90">Canonical address</dt>
          <dd className="break-all">{candidate.canonicalSlug || "Unconfirmed"}</dd>
        </div>
        <div><dt className="font-medium text-white/90">Inquiry routing</dt>
          <dd>{candidate.routing === "present" ? "Recipient verified" : "Recipient unconfirmed"}</dd>
        </div>
      </dl>

      {policy && !saved && (
        <form onSubmit={submit} className="space-y-3">
          <input type="hidden" name="airtableRecordId" value={candidate.airtableRecordId} />
          <input type="hidden" name="reviewHash" value={candidate.reviewHash} />
          <input type="hidden" name="decision" value={decision} />
          <div>
            <label htmlFor={id + "-reason"} className="text-sm text-white/85">Review reason</label>
            <textarea id={id + "-reason"} name="reason" required minLength={12} maxLength={500} rows={2} disabled={busy} className={FIELD} />
          </div>
          <div>
            <label htmlFor={id + "-confirm"} className="block text-sm text-white/85">Confirmation phrase</label>
            <p id={id + "-phrase"} className="break-words font-mono text-sm text-gold">{policy.confirmation}</p>
            <input id={id + "-confirm"} name="confirmation" required autoComplete="off" spellCheck={false}
              aria-describedby={id + "-phrase"} disabled={busy} className={FIELD} />
          </div>
          <button type="submit" disabled={busy} className={BUTTON}>
            {busy ? "Verifying…" : policy.label}
          </button>
        </form>
      )}
      {saved && (
        <div className="flex flex-wrap gap-2">
          {cacheRetryId && <CatalogueRefreshButton intentId={cacheRetryId} onComplete={(answer) => {
            setCacheRetryId(null);
            setResult(answer);
          }} />}
          <button type="button" disabled={busy} onClick={() => router.refresh()} className="min-h-11 rounded-lg border border-line px-4 py-2 text-sm text-white">Refresh review</button>
        </div>
      )}
      <p role="status" className="empty:hidden text-sm text-ok">{result?.ok ? result.message : ""}</p>
      <p role="alert" className="empty:hidden text-sm text-danger">{result && !result.ok ? result.message : ""}</p>
    </article>
  );
}

export default function LifecycleReconciliationForms({ issues, pending }) {
  return (
    <div className="space-y-5">
      {issues.length ? <div className="grid min-w-0 gap-4 xl:grid-cols-2">{issues.map((candidate) => (
        <CandidateForm key={candidate.airtableRecordId + candidate.reviewHash} candidate={candidate} />
      ))}</div> : <p className="rounded-lg border border-ok/25 bg-ok/10 p-4 text-sm text-ok">No public listings need reconciliation.</p>}
      {!pending.available && <p role="alert" className="text-sm text-warn">Recent catalogue refreshes could not be loaded.</p>}
      {pending.entries.length > 0 && (
        <section aria-label="Pending catalogue refreshes" className="space-y-3 rounded-lg border border-line p-4">
          <h3 className="font-medium text-white">Pending catalogue refreshes</h3>
          {pending.entries.map(({ intentId, slug }) => (
            <article key={intentId} aria-label={slug} className="space-y-2">
              <p className="break-all font-mono text-xs text-white/75">{slug}</p>
              <CatalogueRefreshButton intentId={intentId} />
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
