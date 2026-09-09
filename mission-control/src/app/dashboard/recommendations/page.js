import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { decideRecommendation } from "./actions";
import {
  MODERATION_DECISIONS,
  publicStateLabel,
  publicationBlocker,
  verificationLabel,
} from "@/lib/recommendationModerationPolicy.mjs";
import { MessageSquareQuote, ShieldCheck, ShieldAlert, Check, X, Inbox } from "lucide-react";

// A-038 — client recommendation moderation.
//
// The main site accepts a recommendation only from a client who completed a
// two-sided handshake, and always writes it `pending`. Before this page the
// only way out of `pending` was hand-editing Supabase, which is why every
// recommendation currently on a dossier was written by an operator rather
// than by a client.
//
// The queue shows the client's exact words. It does not summarise them, and
// it does not score them — a moderator is deciding whether ScoutIt publishes
// this statement, and a paraphrase is not the thing being published.

async function safe(promise) {
  try {
    const result = await promise;
    if (result.error) throw new Error(result.error.message);
    return { data: result.data ?? [], error: null };
  } catch (err) {
    return { data: [], error: err.message || String(err) };
  }
}

const ATTRIBUTION_LABELS = {
  full_name: "Full name",
  initials: "Initials",
  role_only: "Role only",
  anonymous: "Anonymous",
};

function when(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

/** How this entry will read on the dossier if it is published. */
function AttributionPreview({ row }) {
  const mode = row.attribution_mode;
  const name = row.author_display_name?.trim();
  const role = row.relationship_type?.trim();

  let credited = "Anonymous client";
  if (mode === "full_name" && name) credited = name;
  else if (mode === "initials" && name) {
    credited = name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => `${part[0].toUpperCase()}.`)
      .join(" ");
  } else if (mode === "role_only" && role) credited = role;

  return (
    <span className="text-white/80">
      {credited}
      <span className="text-white/60"> · {ATTRIBUTION_LABELS[mode] || mode}</span>
    </span>
  );
}

function DecisionForm({ row, canDecide }) {
  const blocker = publicationBlocker(row);

  if (!canDecide) {
    return (
      <p className="text-[12px] text-white/70">
        Ops Manager (Tier 2) or higher decides whether this is published.
      </p>
    );
  }

  return (
    <form action={decideRecommendation} className="space-y-2">
      <input type="hidden" name="recommendationId" value={row.id} />
      <textarea
        name="note"
        rows={2}
        placeholder="Moderation note — required to reject"
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 placeholder:text-white/70 focus:border-[#E8AE3C]/50 focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          name="decision"
          value={MODERATION_DECISIONS.APPROVE}
          disabled={Boolean(blocker)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8AE3C]/40 bg-[#E8AE3C]/10 px-3 py-1.5 text-[12px] uppercase tracking-wide text-[#E8AE3C] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          Publish
        </button>
        <button
          type="submit"
          name="decision"
          value={MODERATION_DECISIONS.REJECT}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[12px] uppercase tracking-wide text-white/70 hover:border-white/30 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
          Reject
        </button>
      </div>
      {blocker && (
        <p className="flex items-start gap-1.5 text-[12px] text-warn">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {blocker} It can be rejected, never published.
        </p>
      )}
    </form>
  );
}

function RecommendationCard({ row, canDecide, showDecision }) {
  const verified = Boolean(row.qualifying_handshake_id);

  return (
    <article className="bg-[#121212] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p
            className={`inline-flex items-center gap-1.5 text-[12px] uppercase tracking-wide ${
              verified ? "text-[#E8AE3C]" : "text-white/70"
            }`}
          >
            {verified ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            {verificationLabel(row)}
          </p>
          <p className="text-xs text-white/60">
            About advisor <span className="font-mono text-white/80">{row.broker_id}</span>
          </p>
        </div>
        <span className="text-[12px] uppercase tracking-wide text-white/70 whitespace-nowrap">
          {publicStateLabel(row)}
        </span>
      </div>

      {/* The client's exact words. Never summarised on this surface. */}
      <blockquote className="border-l-2 border-[#E8AE3C]/40 pl-3 text-sm text-white/90 whitespace-pre-wrap">
        {row.body}
      </blockquote>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-white/60 sm:grid-cols-4">
        <div>
          <dt className="uppercase tracking-wide text-white/60">Will publish as</dt>
          <dd>
            <AttributionPreview row={row} />
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-white/60">Satisfaction</dt>
          <dd className="text-white/80">{row.satisfaction_level || "—"}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-white/60">Consent recorded</dt>
          <dd className="text-white/80">{when(row.consent_recorded_at)}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-white/60">Submitted</dt>
          <dd className="text-white/80">{when(row.submitted_at)}</dd>
        </div>
      </dl>

      {row.moderation_note && (
        <p className="text-[12px] text-white/70">
          <span className="uppercase tracking-wide text-white/60">Note · </span>
          {row.moderation_note}
        </p>
      )}

      {showDecision && <DecisionForm row={row} canDecide={canDecide} />}
    </article>
  );
}

export default async function RecommendationsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");
  const canDecide = staff.tier >= TIERS.OPS_MANAGER;

  const admin = createAdminClient();

  const COLUMNS =
    "id, broker_id, author_display_name, attribution_mode, relationship_type, satisfaction_level, body, " +
    "consent_granted, consent_recorded_at, moderation_state, moderation_note, moderated_at, " +
    "withdrawn_at, disputed_at, redacted_at, qualifying_handshake_id, submitted_at";

  const pending = await safe(
    admin
      .from("broker_recommendations")
      .select(COLUMNS)
      .eq("moderation_state", "pending")
      .order("submitted_at", { ascending: true })
      .limit(50),
  );

  const decided = await safe(
    admin
      .from("broker_recommendations")
      .select(COLUMNS)
      .in("moderation_state", ["approved", "rejected"])
      .order("moderated_at", { ascending: false })
      .limit(20),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-[#E8AE3C]" />
            Client Recommendations
          </h1>
          <p className="text-[12px] uppercase tracking-wide text-white/70 mt-1">
            Consent-gated moderation · nothing publishes itself
          </p>
        </div>
        <span className="text-xs text-white/70 whitespace-nowrap">
          {pending.data.length} awaiting review
        </span>
      </div>

      <div className="bg-black/60 border border-[rgba(232,174,60,0.25)] rounded-xl p-5 space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-widest text-[#E8AE3C]">
          What this queue publishes
        </h3>
        <p className="text-[12px] text-white/70">
          A client who completed a two-sided ScoutIt handshake wrote these about an advisor. The
          site accepts them only as <span className="text-white/90">pending</span>; approval here is
          what puts them on a dossier, under the attribution the client chose.
        </p>
        <p className="text-[12px] text-white/70">
          Consent gates publication. A withdrawn or never-consented entry can be rejected but never
          approved, and rejecting retains the row so the consent record and the audit trail survive
          the decision. No entry is published as a star, a score, or an average.
        </p>
      </div>

      {pending.error && (
        <div className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-xl p-4">
          Recommendations unavailable ({pending.error}).
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/90 flex items-center gap-2">
          <Inbox className="w-4 h-4 text-[#E8AE3C]" />
          Awaiting review
        </h2>

        {!pending.error && pending.data.length === 0 ? (
          <p className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-xl p-4">
            Nothing is waiting. Recommendations arrive here only after a client completes a
            two-sided handshake and chooses to write one — an empty queue is the normal state, not
            a fault.
          </p>
        ) : (
          pending.data.map((row) => (
            <RecommendationCard key={row.id} row={row} canDecide={canDecide} showDecision />
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
            <RecommendationCard key={row.id} row={row} canDecide={canDecide} showDecision={false} />
          ))
        )}
      </section>
    </div>
  );
}
