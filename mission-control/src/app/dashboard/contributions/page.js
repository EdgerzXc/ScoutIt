import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { creditContribution, retractContribution } from "./actions";
import {
  CONTRIBUTION_KIND_LABELS,
  CONTRIBUTION_STATES,
  MAX_TITLE_LENGTH,
  creditLabel,
} from "@/lib/brokerContributionPolicy.mjs";
import { ExternalLink, Inbox, Plus, ShieldAlert, Stamp, Undo2 } from "lucide-react";

// A-069 — the staff producer for broker contributions.
//
// `/api/broker/contributions` was implemented, guarded and tested, and had no
// caller anywhere; the dossier's "ScoutIt Contributions" section read a table
// nothing wrote. The three rows in it were typed straight into Supabase by an
// operator. Rule 13: an endpoint with no producer is a plan, not a feature.
//
// There is deliberately no broker-facing form. A contribution is ScoutIt
// crediting a broker for work ScoutIt published, so a self-serve version would
// be a self-declared claim wearing a platform-credited label.

async function safe(promise) {
  try {
    const result = await promise;
    if (result.error) throw new Error(result.error.message);
    return { data: result.data ?? [], error: null };
  } catch (err) {
    return { data: [], error: err.message || String(err) };
  }
}

function when(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

const STATE_LABELS = {
  [CONTRIBUTION_STATES.PUBLISHED]: "On the dossier",
  [CONTRIBUTION_STATES.DRAFT]: "Held — not on the dossier",
  [CONTRIBUTION_STATES.RETRACTED]: "Withdrawn",
};

function ContributionRow({ row, canDecide }) {
  const isRetracted = row.status === CONTRIBUTION_STATES.RETRACTED;

  return (
    <article className="bg-[#121212] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-[12px] uppercase tracking-wide text-[#E8AE3C]">
            {creditLabel(row.kind) || row.kind}
          </p>
          <h2 className="text-sm text-white/90 break-words">{row.title}</h2>
        </div>
        <span
          className={`text-[12px] uppercase tracking-wide whitespace-nowrap ${
            row.status === CONTRIBUTION_STATES.PUBLISHED ? "text-[#E8AE3C]" : "text-white/60"
          }`}
        >
          {STATE_LABELS[row.status] || row.status}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-[12px] text-white/70 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="uppercase tracking-wide text-white/60">Work credited</dt>
          <dd className="truncate">
            <a
              href={row.artifact_path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-white/90 underline underline-offset-4 hover:text-[#E8AE3C]"
            >
              {row.artifact_path}
              <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
            </a>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="uppercase tracking-wide text-white/60">Broker</dt>
          <dd className="font-mono text-white/90 truncate">{row.broker_id}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-white/60">Credited</dt>
          <dd className="text-white/90">{when(row.published_at || row.created_at)}</dd>
        </div>
      </dl>

      {canDecide && !isRetracted && (
        <form action={retractContribution} className="flex flex-col sm:flex-row gap-2">
          <input type="hidden" name="contributionId" value={row.id} />
          <input
            name="reason"
            required
            placeholder="Reason to withdraw this credit"
            className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-lg px-3 py-2 min-h-[44px] text-sm text-white placeholder:text-white/70 focus:border-[#E8AE3C]/50 focus:outline-none"
          />
          <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium border border-white/15 text-white/70 hover:border-white/30 hover:text-white transition-colors whitespace-nowrap">
            <Undo2 className="w-4 h-4" aria-hidden="true" />
            Withdraw credit
          </button>
        </form>
      )}
      {isRetracted && (
        <p className="text-[12px] text-white/60">
          Withdrawn from the dossier. The record of the credit is kept.
        </p>
      )}
    </article>
  );
}

export default async function ContributionsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/");

  const canDecide = staff.tier >= TIERS.OPS_MANAGER;

  const admin = createAdminClient();
  const contributions = await safe(
    admin
      .from("broker_contributions")
      .select("id, broker_id, kind, title, artifact_path, status, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
  );

  const live = contributions.data.filter((row) => row.status !== CONTRIBUTION_STATES.RETRACTED);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Stamp className="w-5 h-5 text-[#E8AE3C]" aria-hidden="true" />
            ScoutIt Contributions
          </h1>
          <p className="text-[12px] uppercase tracking-wide text-white/70 mt-1">
            Credit a broker for work ScoutIt published
          </p>
        </div>
        <span className="text-xs text-white/70 whitespace-nowrap">{live.length} credited</span>
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-white/70 bg-white/5 border border-white/10 rounded-xl p-4">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#E8AE3C]" aria-hidden="true" />
        <span>
          A contribution is ScoutIt&rsquo;s own credit for work ScoutIt published &mdash; an
          answered question, an approved correction, a briefing, credited intel. Brokers cannot
          create these, by design: a self-serve version would be a self-declared claim wearing a
          platform-credited label. The work must be openable on the site, or it is not credited at
          all.
        </span>
      </p>

      {canDecide ? (
        <form
          action={creditContribution}
          className="bg-[#121212] border border-white/10 rounded-xl p-4 space-y-3"
        >
          <h2 className="text-[12px] uppercase tracking-wide text-white/70">
            Credit a contribution
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[12px] uppercase tracking-wide text-white/60">
                Broker Auth UUID
              </span>
              <input
                name="brokerId"
                required
                placeholder="00000000-0000-0000-0000-000000000000"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 min-h-[44px] font-mono text-sm text-white/90 placeholder:text-white/70 focus:border-[#E8AE3C]/50 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[12px] uppercase tracking-wide text-white/60">Kind</span>
              <select
                name="kind"
                required
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 min-h-[44px] text-sm text-white/90 focus:border-[#E8AE3C]/50 focus:outline-none"
              >
                {Object.entries(CONTRIBUTION_KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-[12px] uppercase tracking-wide text-white/60">Title</span>
            <input
              name="title"
              required
              maxLength={MAX_TITLE_LENGTH}
              placeholder="What ScoutIt published"
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 min-h-[44px] text-sm text-white/90 placeholder:text-white/70 focus:border-[#E8AE3C]/50 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[12px] uppercase tracking-wide text-white/60">
              Path to the work on ScoutIt
            </span>
            <input
              name="artifactPath"
              required
              placeholder="/intel/some-briefing"
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 min-h-[44px] font-mono text-sm text-white/90 placeholder:text-white/70 focus:border-[#E8AE3C]/50 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              name="publish"
              value="true"
              defaultChecked
              className="w-4 h-4 accent-[#E8AE3C]"
            />
            Put it on the broker&rsquo;s dossier now
          </label>
          <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-[#E8AE3C]/10 hover:bg-[#E8AE3C]/20 text-[#E8AE3C] border border-[#E8AE3C]/30 transition-colors">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Credit contribution
          </button>
        </form>
      ) : (
        <p className="text-[12px] text-white/70">
          Ops Manager (Tier 2) or higher credits and withdraws contributions.
        </p>
      )}

      {contributions.error ? (
        <div className="flex items-start gap-2 text-xs text-white/70 bg-white/5 border border-white/10 rounded-xl p-4">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-warn" aria-hidden="true" />
          <span>
            The contributions ledger could not be read ({contributions.error}). Nothing has been
            changed &mdash; this is a read failure, not an empty ledger.
          </span>
        </div>
      ) : contributions.data.length === 0 ? (
        <div className="flex items-start gap-2 text-xs text-white/70 bg-white/5 border border-white/10 rounded-xl p-4">
          <Inbox className="w-4 h-4 shrink-0 mt-0.5 text-white/60" aria-hidden="true" />
          <span>
            No contributions credited yet. That is a normal state, not a fault &mdash; nothing is
            credited until ScoutIt publishes a broker&rsquo;s work and someone records it here.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {contributions.data.map((row) => (
            <ContributionRow key={row.id} row={row} canDecide={canDecide} />
          ))}
        </div>
      )}
    </div>
  );
}
