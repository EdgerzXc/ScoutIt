import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { reviewFaqAppeal } from "./actions";
import { ACTION_LABELS, APPEAL_ACTIONS } from "@/lib/faqAppealReviewPolicy.mjs";
import { Check, X, Play, Inbox, ShieldAlert, ShieldCheck } from "lucide-react";

// A-133 — FAQ block-appeal review queue.
//
// An owner whose FAQ text trips the contact-leak preflight can appeal with
// fresh block evidence; the main site lands it `pending` and can do nothing
// else with it. This page is the only staff path out of `pending`, and it
// calls the same RPC the main-site PATCH route calls.
//
// Honest scope, stated on the surface: recording approval writes a verdict
// (status + reviewer + notes). It does NOT publish the blocked answer —
// nothing on this screen inserts into property_faqs. Rejection retains the
// row so the explanation and the audit trail survive the decision.

async function safe(promise) {
  try {
    const result = await promise;
    if (result.error) throw new Error(result.error.message);
    return { data: result.data ?? [], error: null };
  } catch (err) {
    return { data: [], error: err.message || String(err) };
  }
}

const COLUMNS =
  "id, user_id, property_id, faq_id, preflight_key, rule_code, block_context, " +
  "explanation, status, reviewer_id, reviewer_notes, reviewed_at, created_at";

function when(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

function openAge(createdAt) {
  if (!createdAt) return null;
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  const label = days <= 0 ? "opened today" : `open ${days}d`;
  return { label, overdue: days >= 7 };
}

function ReviewForm({ row, canDecide }) {
  if (!canDecide) {
    return (
      <p className="text-[12px] text-white/70">
        Ops Manager (Tier 2) or higher records appeal decisions.
      </p>
    );
  }

  const underReview = row.status === "under_review";
  return (
    <form action={reviewFaqAppeal} className="space-y-2">
      <input type="hidden" name="appealId" value={row.id} />
      <input type="hidden" name="renderedStatus" value={row.status} />
      <textarea
        name="notes"
        rows={2}
        placeholder="Reviewer note — required to reject"
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 placeholder:text-white/70 focus:border-[#E8AE3C]/50 focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        {!underReview && (
          <button
            type="submit"
            name="action"
            value={APPEAL_ACTIONS.START_REVIEW}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[12px] uppercase tracking-wide text-white/70 hover:border-white/30 hover:text-white"
          >
            <Play className="w-3.5 h-3.5" />
            {ACTION_LABELS[APPEAL_ACTIONS.START_REVIEW]}
          </button>
        )}
        <button
          type="submit"
          name="action"
          value={APPEAL_ACTIONS.APPROVE}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8AE3C]/40 bg-[#E8AE3C]/10 px-3 py-1.5 text-[12px] uppercase tracking-wide text-[#E8AE3C]"
        >
          <Check className="w-3.5 h-3.5" />
          {ACTION_LABELS[APPEAL_ACTIONS.APPROVE]}
        </button>
        <button
          type="submit"
          name="action"
          value={APPEAL_ACTIONS.REJECT}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[12px] uppercase tracking-wide text-white/70 hover:border-white/30 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
          {ACTION_LABELS[APPEAL_ACTIONS.REJECT]}
        </button>
      </div>
    </form>
  );
}

function AppealCard({ row, canDecide, showDecision }) {
  const age = openAge(row.created_at);
  return (
    <article className="bg-[#121212] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-[#E8AE3C]">
          {row.status === "under_review" ? (
            <ShieldCheck className="w-3.5 h-3.5" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5" />
          )}
          {row.status === "under_review" ? "Under review" : row.status}
        </p>
        <span className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-white/70 whitespace-nowrap">
          {age && (
            <span
              className={`border rounded-full px-2 py-0.5 ${
                age.overdue ? "text-warn border-warn/25 bg-warn/10" : "text-white/60 border-line"
              }`}
            >
              {age.label}
            </span>
          )}
          <span className="font-mono">{row.rule_code}</span>
        </span>
      </div>

      {/* The owner's exact explanation. Never summarised on this surface. */}
      <blockquote className="border-l-2 border-[#E8AE3C]/40 pl-3 text-sm text-white/90 whitespace-pre-wrap">
        {row.explanation}
      </blockquote>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-white/60 sm:grid-cols-4">
        <div>
          <dt className="uppercase tracking-wide text-white/60">Blocked context</dt>
          <dd className="text-white/80">{row.block_context}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-white/60">Property</dt>
          <dd className="font-mono text-white/80">{row.property_id}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-white/60">Owner</dt>
          <dd className="font-mono text-white/80">{row.user_id}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-white/60">Submitted</dt>
          <dd className="text-white/80">{when(row.created_at)}</dd>
        </div>
      </dl>

      {row.reviewer_notes && (
        <p className="text-[12px] text-white/70">
          <span className="uppercase tracking-wide text-white/60">Reviewer note · </span>
          {row.reviewer_notes}
        </p>
      )}

      {showDecision && <ReviewForm row={row} canDecide={canDecide} />}
    </article>
  );
}

export default async function FaqAppealsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");
  const canDecide = staff.tier >= TIERS.OPS_MANAGER;

  const admin = createAdminClient();

  // Degrades to an empty hub when the appeals tables are not applied yet —
  // same contract as the disputes hub (A-061 pattern).
  const open = await safe(
    admin
      .from("faq_block_appeals")
      .select(COLUMNS)
      .in("status", ["pending", "under_review"])
      .order("created_at", { ascending: true })
      .limit(50),
  );

  const decided = await safe(
    admin
      .from("faq_block_appeals")
      .select(COLUMNS)
      .in("status", ["approved", "rejected"])
      .order("reviewed_at", { ascending: false })
      .limit(20),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">FAQ Appeals</h1>
          <p className="text-[12px] uppercase tracking-wide text-white/70 mt-1">
            Block-evidence review · verdicts only, nothing self-publishes
          </p>
        </div>
        <span className="text-xs text-white/70 whitespace-nowrap">
          {open.data.length} awaiting review
        </span>
      </div>

      <div className="bg-black/60 border border-[rgba(232,174,60,0.25)] rounded-xl p-5 space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-widest text-[#E8AE3C]">
          What a decision does
        </h3>
        <p className="text-[12px] text-white/70">
          Recording approval writes a verdict — the block was wrong here. It does not publish
          the blocked answer and does not touch the listing. A rejection keeps the block and
          keeps this row, so the owner&apos;s explanation and the audit trail survive.
        </p>
        <p className="text-[12px] text-white/70">
          Two reviewers opening the same appeal cannot overwrite each other: a decision made
          on a stale view is refused — reload and decide again.
        </p>
      </div>

      {open.error && (
        <div className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-xl p-4">
          FAQ appeals unavailable ({open.error}).
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/90 flex items-center gap-2">
          <Inbox className="w-4 h-4 text-[#E8AE3C]" />
          Awaiting review
        </h2>

        {!open.error && open.data.length === 0 ? (
          <p className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-xl p-4">
            Nothing is waiting. Appeals arrive only when an owner contests a blocked FAQ answer
            — an empty queue is the normal state, not a fault.
          </p>
        ) : (
          open.data.map((row) => (
            <AppealCard key={row.id} row={row} canDecide={canDecide} showDecision />
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/90">Recently decided</h2>
        {decided.data.length === 0 ? (
          <p className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-xl p-4">
            No decisions recorded yet.
          </p>
        ) : (
          decided.data.map((row) => (
            <AppealCard key={row.id} row={row} canDecide={canDecide} showDecision={false} />
          ))
        )}
      </section>
    </div>
  );
}
