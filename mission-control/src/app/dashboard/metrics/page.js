import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { Building2, Users, Coins, Activity } from "lucide-react";
import MetricsCharts from "./MetricsCharts";

const DAY_MS = 24 * 60 * 60 * 1000;

async function safe(promise) {
  try {
    const result = await promise;
    if (result.error) throw new Error(result.error.message);
    return { data: result.data, count: result.count, error: null };
  } catch (err) {
    return { data: null, count: null, error: err.message || String(err) };
  }
}

function tally(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    if (key === null || key === undefined || key === "") continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function average(numbers) {
  const valid = numbers.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (valid.length === 0) return null;
  return valid.reduce((sum, n) => sum + n, 0) / valid.length;
}

export default async function MetricsPage() {
  const staff = await getCurrentStaff();
  if (staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const admin = createAdminClient();
  const since365d = new Date(Date.now() - 365 * DAY_MS).toISOString();
  const since30d = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const since7d = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const since24h = new Date(Date.now() - DAY_MS).toISOString();

  const [properties, profiles, subscriptions, connectBalances, connectTx, actions7d, actions24h, txSeries, actionSeries] =
    await Promise.all([
      safe(
        admin
          .from("properties")
          .select("moderation_status, type, completeness_score, verified, created_at, rejection_reason")
          .limit(5000)
      ),
      safe(admin.from("user_profiles").select("active_roles, subscription_tier").limit(5000)),
      safe(admin.from("subscriptions").select("cosmic_tier, status, user_type").limit(5000)),
      safe(
        admin
          .from("connect_balances")
          .select("granted_balance, earned_balance, purchased_balance")
          .limit(5000)
      ),
      safe(
        admin
          .from("connect_transactions")
          .select("kind, amount")
          .gte("created_at", since30d)
          .limit(5000)
      ),
      safe(
        admin
          .from("mission_control_actions")
          .select("action, created_at")
          .gte("created_at", since7d)
          .limit(5000)
      ),
      safe(
        admin
          .from("mission_control_actions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since24h)
      ),
      // Chart series (A6): timestamps only, 12-month window so the Monthly
      // toggle has data; same 5,000-row cap discipline as everything else.
      safe(
        admin
          .from("connect_transactions")
          .select("created_at, amount")
          .gte("created_at", since365d)
          .limit(5000)
      ),
      safe(
        admin
          .from("mission_control_actions")
          .select("created_at")
          .gte("created_at", since365d)
          .limit(5000)
      ),
    ]);

  const propertyRows = properties.data ?? [];
  const statusCounts = tally(propertyRows, (p) => p.moderation_status);
  const typeCounts = tally(propertyRows, (p) => p.type);
  const verifiedCount = propertyRows.filter((p) => p.verified).length;
  const avgCompleteness = average(propertyRows.map((p) => p.completeness_score));
  const pendingAges = propertyRows
    .filter((p) => p.moderation_status === "pending")
    .map((p) => (Date.now() - new Date(p.created_at).getTime()) / DAY_MS);
  const rejectionReasons = tally(
    propertyRows.filter((p) => p.moderation_status === "rejected"),
    (p) => p.rejection_reason?.split(" — ")[0] || "No reason recorded"
  );

  const profileRows = profiles.data ?? [];
  const roleCounts = tally(profileRows.flatMap((p) => p.active_roles || []), (r) => r);
  const subTierCounts = tally(profileRows, (p) => p.subscription_tier);

  const subscriptionRows = subscriptions.data ?? [];
  const subStatusCounts = tally(subscriptionRows, (s) => s.status);

  const balanceRows = connectBalances.data ?? [];
  const totalConnects = balanceRows.reduce(
    (sum, b) => sum + (b.granted_balance || 0) + (b.earned_balance || 0) + (b.purchased_balance || 0),
    0
  );

  const txRows = connectTx.data ?? [];
  const txByKind = {};
  for (const tx of txRows) {
    txByKind[tx.kind] = (txByKind[tx.kind] || 0) + (tx.amount || 0);
  }

  const actionRows = actions7d.data ?? [];
  const actionsByType = tally(actionRows, (a) => a.action);

  // Serializable chart series for the client component.
  const series = {
    properties: propertyRows.map((p) => p.created_at).filter(Boolean),
    connects: (txSeries.data ?? []).map((t) => ({ t: t.created_at, amount: t.amount || 0 })),
    actions: (actionSeries.data ?? []).map((a) => a.created_at).filter(Boolean),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Metrics</h1>
      </div>
      <p className="text-xs text-white/30 -mt-4">
        Computed live from the current tables, capped at 5,000 rows per query for now — fine at
        today&apos;s volume, worth moving to real SQL aggregates once any of these tables grow
        past that.
      </p>

      <MetricsCharts series={series} />

      <MetricSection icon={Building2} title="Supply — properties" error={properties.error}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card label="Pending" value={statusCounts.pending || 0} />
          <Card label="Approved" value={statusCounts.approved || 0} />
          <Card label="Rejected" value={statusCounts.rejected || 0} />
          <Card label="Archived" value={statusCounts.archived || 0} />
          <Card label="Verified" value={verifiedCount} />
          <Card
            label="Avg completeness"
            value={avgCompleteness != null ? `${avgCompleteness.toFixed(0)}%` : "—"}
          />
          <Card
            label="Avg pending age"
            value={pendingAges.length ? `${average(pendingAges).toFixed(1)}d` : "—"}
          />
          <Card
            label="Oldest pending"
            value={pendingAges.length ? `${Math.max(...pendingAges).toFixed(1)}d` : "—"}
          />
        </div>
        <BreakdownList title="By category" counts={typeCounts} />
      </MetricSection>

      <MetricSection icon={Users} title="Demand — users &amp; subscriptions" error={profiles.error}>
        <BreakdownList title="By active role" counts={roleCounts} />
        <BreakdownList title="By subscription_tier (user_profiles cache)" counts={subTierCounts} />
        {subscriptions.error ? (
          <p className="text-xs text-white/30">subscriptions table: {subscriptions.error}</p>
        ) : (
          <BreakdownList title="Subscriptions by status" counts={subStatusCounts} />
        )}
      </MetricSection>

      <MetricSection icon={Coins} title="Monetization — connects" error={connectBalances.error}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label="Total connects in system" value={totalConnects.toLocaleString()} />
          <Card
            label="Transactions, 30d"
            value={connectTx.error ? "—" : txRows.length.toLocaleString()}
          />
        </div>
        {connectTx.error ? (
          <p className="text-xs text-white/30">connect_transactions table: {connectTx.error}</p>
        ) : (
          <BreakdownList
            title="Volume by kind, 30d"
            counts={Object.fromEntries(Object.entries(txByKind).map(([k, v]) => [k, Math.round(v)]))}
          />
        )}
      </MetricSection>

      <MetricSection icon={Activity} title="Ops health" error={null}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card
            label="Staff actions, 24h"
            value={actions24h.error ? "—" : (actions24h.count ?? 0)}
          />
          <Card
            label="Staff actions, 7d"
            value={actions7d.error ? "—" : actionRows.length}
          />
        </div>
        {actions7d.error ? (
          <p className="text-xs text-white/30">mission_control_actions: {actions7d.error}</p>
        ) : (
          <BreakdownList title="By action type, 7d" counts={actionsByType} />
        )}
        <BreakdownList title="Rejection reasons" counts={rejectionReasons} />
      </MetricSection>
    </div>
  );
}

function MetricSection({ icon: Icon, title, error, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h2>
      {error && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-3">
          Some data here is unavailable: {error}
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-[#121212] border border-white/5 rounded-xl p-4">
      <div className="text-[10.5px] text-white/40 mb-2">{label}</div>
      <div className="text-xl font-medium text-white">{value}</div>
    </div>
  );
}

function BreakdownList({ title, counts }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  const max = Math.max(...entries.map(([, v]) => v));

  return (
    <div className="bg-[#121212] border border-white/5 rounded-xl p-4">
      <div className="text-xs text-white/50 mb-3">{title}</div>
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-white/60 w-40 truncate shrink-0">{key}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E8AE3C] rounded-full"
                style={{ width: `${max ? (value / max) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-white/40 w-8 text-right shrink-0">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
