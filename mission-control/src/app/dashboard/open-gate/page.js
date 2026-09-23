import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { setOpenGateEntitlement } from "./actions";

export default async function OpenGateControlPage() {
  const staff = await getCurrentStaff();
  if (!staff || staff.tier < TIERS.SUPER_ADMIN) redirect("/dashboard?error=InsufficientTier");
  const admin = createAdminClient();
  const [brokers, others] = await Promise.all([
    admin.from("open_gate_entitlements").select("broker_id, enabled, expires_at, reason, updated_at")
      .order("updated_at", { ascending: false }).limit(100),
    admin.from("open_gate_role_entitlements").select("account_id, role, enabled, expires_at, reason, updated_at")
      .order("updated_at", { ascending: false }).limit(100),
  ]);
  const rows = [
    ...(brokers.data || []).map(row => ({ ...row, account_id: row.broker_id, role: "broker" })),
    ...(others.data || []),
  ].sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
  return <div className="space-y-8">
    <header>
      <h1 className="text-2xl font-semibold">Open Gate entitlements</h1>
      <p className="mt-2 text-sm text-white/70">After an Enterprise subscription is confirmed outside the app, grant a time-limited right to open free inbound contact. Owners choose their directly handled properties; brokers choose represented properties; operators choose delegated units.</p>
    </header>
    {(brokers.error || others.error) && <p className="rounded border border-red-400/30 p-4 text-red-300" role="alert">Schema unavailable. Apply the reviewed A-130 migrations before granting access.</p>}
    <form action={setOpenGateEntitlement} className="rounded-xl border border-white/10 bg-[#121212] p-6 space-y-4">
      <h2 className="font-mono text-xs uppercase tracking-widest text-gold">Grant or revoke</h2>
      <label className="block text-sm">Account ID<input name="accountId" required className="mt-1 w-full rounded bg-black p-3 text-white" /></label>
      <label className="block text-sm">Enterprise role<select name="role" className="mt-1 w-full rounded bg-black p-3 text-white">
        <option value="broker">Broker</option><option value="owner">Owner</option><option value="operator">Operator</option>
      </select></label>
      <label className="block text-sm">Subscription expiry (UTC)<input name="expiresAt" type="datetime-local" className="mt-1 w-full rounded bg-black p-3 text-white" /></label>
      <label className="block text-sm">Invoice / decision reference<input name="reason" required className="mt-1 w-full rounded bg-black p-3 text-white" /></label>
      <div className="flex gap-3">
        <button name="enabled" value="true" className="rounded bg-gold px-5 py-3 font-mono text-xs uppercase tracking-wider text-black">Grant access</button>
        <button name="enabled" value="false" className="rounded border border-white/20 px-5 py-3 font-mono text-xs uppercase tracking-wider">Revoke access</button>
      </div>
    </form>
    <section className="space-y-2">
      <h2 className="font-mono text-xs uppercase tracking-widest text-gold">Recent entitlements</h2>
      {rows.map(row => <div key={`${row.role}:${row.account_id}`} className="rounded border border-white/10 bg-[#121212] p-4 text-sm">
        <strong className="font-mono">{row.account_id}</strong> · {row.role} · {row.enabled ? "Granted until expiry" : "Revoked"}
        <p className="mt-1 text-white/70">Expires: {row.expires_at || "—"} · {row.reason}</p>
      </div>)}
    </section>
  </div>;
}
