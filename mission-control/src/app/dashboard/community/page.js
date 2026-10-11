import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { decideSignal } from "./actions";
import {
  SIGNAL_STATUSES,
  MODERATION_ACTIONS,
  signalStatusLabel,
  isPubliclyVisibleSignal,
} from "@/lib/signalModerationPolicy.mjs";
import {
  Radio,
  Check,
  AlertTriangle,
  EyeOff,
  Search,
  Filter,
  Inbox,
  ShieldAlert,
  Building,
  MapPin,
  Clock,
  User,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// A-145 P2a — Master Mission Control Community Signals Queue.
//
// Allows Tier 2 (Ops Manager)+ staff to review, approve, limit,
// request edit on, or remove member-posted Stratosphere signals.
// ═══════════════════════════════════════════════════════════════

async function safeQuery(promise) {
  try {
    const result = await promise;
    if (result.error) {
      const code = result.error.code;
      const msg = String(result.error.message || "");
      if (code === "42P01" || /relation .* does not exist/i.test(msg)) {
        return { data: [], missing: true, error: null };
      }
      return { data: [], missing: false, error: msg };
    }
    return { data: result.data ?? [], missing: false, error: null };
  } catch (err) {
    return { data: [], missing: false, error: err.message || String(err) };
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const STATUS_BADGE_STYLES = {
  [SIGNAL_STATUSES.LIVE]: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  [SIGNAL_STATUSES.UNDER_REVIEW]: "bg-amber-500/15 border-amber-500/30 text-amber-400",
  [SIGNAL_STATUSES.LIMITED]: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
  [SIGNAL_STATUSES.NEEDS_EDIT]: "bg-orange-500/15 border-orange-500/30 text-orange-400",
  [SIGNAL_STATUSES.REMOVED]: "bg-red-500/15 border-red-500/30 text-red-400",
  [SIGNAL_STATUSES.CLOSED]: "bg-zinc-800 border-zinc-700 text-zinc-400",
  [SIGNAL_STATUSES.EXPIRED]: "bg-zinc-800 border-zinc-700 text-zinc-400",
};

export default async function CommunitySignalsPage({ searchParams }) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");

  const resolvedParams = (await searchParams) || {};
  const activeStatus = resolvedParams.status || "under_review";
  const typeFilter = resolvedParams.type || "";
  const query = (resolvedParams.q || "").trim().toLowerCase();

  const admin = createAdminClient();

  // Load signals
  let baseQuery = admin
    .from("stratosphere_signals")
    .select(
      "id, author_account_id, scout_id_snapshot, public_identity_mode, signal_type, commercial_flag, status, title, body, relevant_count, saved_count, created_at, updated_at, last_confirmed_at, closed_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (activeStatus !== "all") {
    baseQuery = baseQuery.eq("status", activeStatus);
  }
  if (typeFilter) {
    baseQuery = baseQuery.eq("signal_type", typeFilter);
  }

  const { data: rawSignals, missing, error } = await safeQuery(baseQuery);

  // Fetch locations and requirements for these signals
  const signalIds = (rawSignals || []).map((s) => s.id);
  let locationsMap = new Map();
  let reqsMap = new Map();

  if (signalIds.length > 0) {
    const [locRes, reqRes] = await Promise.all([
      safeQuery(admin.from("signal_locations").select("*").in("signal_id", signalIds)),
      safeQuery(admin.from("signal_requirements").select("*").in("signal_id", signalIds)),
    ]);
    if (locRes.data) {
      locationsMap = new Map(locRes.data.map((l) => [l.signal_id, l]));
    }
    if (reqRes.data) {
      reqsMap = new Map(reqRes.data.map((r) => [r.signal_id, r]));
    }
  }

  // Filter client query in-memory
  const signals = (rawSignals || []).filter((s) => {
    if (!query) return true;
    const loc = locationsMap.get(s.id) || {};
    return (
      s.title?.toLowerCase().includes(query) ||
      s.body?.toLowerCase().includes(query) ||
      s.scout_id_snapshot?.toLowerCase().includes(query) ||
      loc.district?.toLowerCase().includes(query) ||
      loc.city?.toLowerCase().includes(query)
    );
  });

  const canDecide = staff.tier >= TIERS.OPS_MANAGER;

  const STATUS_TABS = [
    { id: "under_review", label: "Under Review" },
    { id: "live", label: "Live Feed" },
    { id: "limited", label: "Limited Reach" },
    { id: "needs_edit", label: "Needs Edit" },
    { id: "removed", label: "Removed" },
    { id: "all", label: "All Statuses" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-gold" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Community Signals Moderation
            </h1>
          </div>
          <p className="mt-1 text-xs text-white/70">
            Stratosphere Layer 02 signal queue. Ops Manager (Tier 2)+ may moderate, limit reach, or remove posts.
          </p>
        </div>
      </div>

      {missing && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200">
          <p className="font-semibold uppercase tracking-wider text-[12px]">
            Schema Notice (O-004 Row 11 Gate)
          </p>
          <p className="mt-1 text-white/80">
            The <code className="text-amber-300">stratosphere_signals</code> database table has not yet been applied in this environment. The moderation queue will populate automatically once the P1 migration lands.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          Failed to query community signals: {error}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/dashboard/community?status=${tab.id}${typeFilter ? `&type=${typeFilter}` : ""}${query ? `&q=${query}` : ""}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-gold text-black font-semibold shadow-sm"
                  : "bg-surface hover:bg-surface-deep text-white/70 hover:text-white border border-line"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form method="GET" action="/dashboard/community" className="relative flex-1">
          <input type="hidden" name="status" value={activeStatus} />
          {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/60" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by Scout ID, title, text, district, city…"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/60 focus:border-gold/50 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-white/60" />
          <select
            defaultValue={typeFilter}
            onChange={(e) => {
              const val = e.target.value;
              const url = new URL(window.location.href);
              if (val) url.searchParams.set("type", val);
              else url.searchParams.delete("type");
              window.location.href = url.toString();
            }}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-white/80 focus:border-gold/50 focus:outline-none"
          >
            <option value="">All Signal Types</option>
            <option value="LOOKING_FOR">Looking For</option>
            <option value="REPRESENTING_CLIENT">Representing Client</option>
            <option value="UPCOMING_SUPPLY">Upcoming Supply</option>
            <option value="BUSINESS_EXPANSION">Business Expansion</option>
            <option value="OPPORTUNITY">Opportunity</option>
            <option value="MARKET_OBSERVATION">Market Observation</option>
            <option value="COMMERCIAL_PROMOTION">Commercial Promotion</option>
          </select>
        </div>
      </div>

      {/* Signals Queue List */}
      <div className="space-y-4">
        {signals.length === 0 && !missing && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface/60 p-12 text-center">
            <Inbox className="h-10 w-10 text-white/60" />
            <h2 className="mt-4 text-sm font-semibold text-white/80">Queue Empty</h2>
            <p className="mt-1 text-xs text-white/60">
              No community signals match status <span className="text-gold font-mono uppercase">&quot;{activeStatus}&quot;</span>.
            </p>
          </div>
        )}

        {signals.map((sig) => {
          const loc = locationsMap.get(sig.id) || {};
          const reqs = reqsMap.get(sig.id) || {};
          const isLive = isPubliclyVisibleSignal(sig.status);
          const hasCoords = loc.lat != null && loc.lng != null;
          const statusBadge = STATUS_BADGE_STYLES[sig.status] || "bg-zinc-800 border-zinc-700 text-zinc-400";

          return (
            <div
              key={sig.id}
              className="rounded-xl border border-line bg-surface p-6 shadow-sm transition hover:border-white/20"
            >
              {/* Card Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-gold">
                    {sig.scout_id_snapshot}
                  </span>
                  <span className="text-xs text-white/60">·</span>
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[12px] uppercase tracking-wide text-white/70">
                    {sig.signal_type.replace(/_/g, " ")}
                  </span>
                  {sig.commercial_flag && (
                    <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[12px] font-semibold text-amber-300">
                      PROMO
                    </span>
                  )}
                  <span className="text-xs text-white/60">·</span>
                  <span className="flex items-center gap-1 text-[12px] text-white/60">
                    <User className="h-3 w-3" />
                    {sig.public_identity_mode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-wider ${statusBadge}`}
                  >
                    {signalStatusLabel(sig.status)}
                  </span>
                  <span className="text-[12px] text-white/60">
                    {isLive ? "● Publicly Visible" : "○ Hidden from Feed"}
                  </span>
                </div>
              </div>

              {/* Title & Body */}
              <div className="mt-4 space-y-2">
                <h3 className="text-base font-semibold text-white/95">{sig.title}</h3>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/80">
                  {sig.body}
                </p>
              </div>

              {/* Spatial and Requirement Diagnostics */}
              <div className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-line bg-surface-deep p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="h-3.5 w-3.5 text-gold/80" />
                  <span className="truncate">
                    {[loc.building_name, loc.district, loc.city].filter(Boolean).join(" · ") || "Unspecified location"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Building className="h-3.5 w-3.5 text-gold/80" />
                  <span className="truncate">
                    {reqs.space_type || "No space type declared"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="h-3.5 w-3.5 text-gold/80" />
                  <span>{formatDate(sig.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <span className="font-mono text-[12px] text-white/60">
                    {hasCoords ? "📍 PINNED (Exact/District)" : "○ UNPINNED (Dossier Only)"}
                  </span>
                </div>
              </div>

              {/* Moderation Controls */}
              <div className="mt-5 border-t border-line pt-4">
                {sig.status === SIGNAL_STATUSES.CLOSED ? (
                  <p className="text-[12px] text-white/60">
                    Signal was voluntarily closed by its author. Lifecycle is closed and locked.
                  </p>
                ) : sig.status === SIGNAL_STATUSES.EXPIRED ? (
                  <p className="text-[12px] text-white/60">
                    Signal decayed through 30-day freshness rule. Author may refresh via Stratosphere.
                  </p>
                ) : !canDecide ? (
                  <p className="text-[12px] text-white/60">
                    Ops Manager (Tier 2)+ required to execute moderation decisions on community signals.
                  </p>
                ) : (
                  <form action={decideSignal} className="space-y-3">
                    <input type="hidden" name="signalId" value={sig.id} />

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        name="reason"
                        placeholder="Staff reason (mandatory for Limit, Request Edit, or Remove)"
                        className="flex-1 rounded-lg border border-line bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-white/60 focus:border-gold/50 focus:outline-none"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status: UNDER_REVIEW */}
                        {sig.status === SIGNAL_STATUSES.UNDER_REVIEW && (
                          <>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.RESTORE_LIVE}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve to Live
                            </button>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.REQUEST_EDIT}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-amber-400 hover:bg-amber-500/20"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Request Edit
                            </button>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.REMOVE}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-red-400 hover:bg-red-500/20"
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </>
                        )}

                        {/* Status: LIVE */}
                        {sig.status === SIGNAL_STATUSES.LIVE && (
                          <>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.HOLD_FOR_REVIEW}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-amber-400 hover:bg-amber-500/20"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Hold for Review
                            </button>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.LIMIT}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-indigo-300 hover:bg-indigo-500/20"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Limit Reach
                            </button>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.REMOVE}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-red-400 hover:bg-red-500/20"
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </>
                        )}

                        {/* Status: LIMITED */}
                        {sig.status === SIGNAL_STATUSES.LIMITED && (
                          <>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.RESTORE_LIVE}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Restore Live
                            </button>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.HOLD_FOR_REVIEW}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-amber-400 hover:bg-amber-500/20"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Hold for Review
                            </button>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.REMOVE}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-red-400 hover:bg-red-500/20"
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </>
                        )}

                        {/* Status: NEEDS_EDIT */}
                        {sig.status === SIGNAL_STATUSES.NEEDS_EDIT && (
                          <>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.RESTORE_LIVE}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Restore Live
                            </button>
                            <button
                              type="submit"
                              name="action"
                              value={MODERATION_ACTIONS.REMOVE}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-red-400 hover:bg-red-500/20"
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </>
                        )}

                        {/* Status: REMOVED */}
                        {sig.status === SIGNAL_STATUSES.REMOVED && (
                          <button
                            type="submit"
                            name="action"
                            value={MODERATION_ACTIONS.RESTORE_LIVE}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Restore to Live
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
