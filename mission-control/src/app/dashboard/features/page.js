import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { toggleFeatureFlag, togglePaywallGate, createFeatureFlag } from "./actions";
import { Flag, Lock, Unlock } from "lucide-react";

// Wired to the LIVE `feature_flags` table (id TEXT pk, is_enabled, description) —
// the one the public site is allowed to read. The old feature_gates/site_banners
// tables this page used to query were never created on the live database.
export default async function FeatureFlagsPage() {
  const staff = await getCurrentStaff();

  if (staff.tier < TIERS.SUPER_ADMIN) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const admin = createAdminClient();
  const { data: flags, error } = await admin
    .from("feature_flags")
    .select("id, is_enabled, description, updated_at")
    .order("id");

  const flagMap = Object.fromEntries((flags ?? []).map((f) => [f.id, Boolean(f.is_enabled)]));
  const isPaywallEnforced =
    flagMap.monetization_enforced === true || flagMap.pre_launch_free_mode === false;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
        <span className="text-xs text-white/70">Public site reads these live</span>
      </div>

      {/* 1-Click Master Paywall Gate Card */}
      <section className="bg-[#121212] border border-[#E8AE3C]/40 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E8AE3C]/40 bg-[#E8AE3C]/10 text-xs font-mono uppercase tracking-wider text-[#E8AE3C]">
              {isPaywallEnforced ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>
                {isPaywallEnforced
                  ? "PAYWALL ON // PRODUCTION ENFORCED (₱2,499/MO)"
                  : "PIONEER ACCESS // FREE FOR LAUNCH (ZERO-PAYWALL)"}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">
              Phased Paywall Gate — Master 1-Click Switch
            </h2>
            <p className="text-xs text-white/70 max-w-2xl">
              {isPaywallEnforced
                ? "Commercial paywall is currently ACTIVE (production_enforced). Click below to switch back to North Star Zero-Paywall mode."
                : "North Star Zero-Paywall mode is currently ACTIVE (pilot_zero_paywall). Click below to enforce Universe tier subscriptions (₱2,499/mo), listing caps (1/5/20/∞), and paid Connects."}
            </p>
          </div>

          <form action={togglePaywallGate} className="shrink-0">
            <input type="hidden" name="enforcePaywall" value={(!isPaywallEnforced).toString()} />
            <button
              type="submit"
              className="min-h-11 px-5 py-2.5 rounded-lg bg-[#E8AE3C] hover:bg-[#F7C64E] text-black text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              {isPaywallEnforced ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>
                {isPaywallEnforced
                  ? "Turn Paywall OFF (Free Launch)"
                  : "Turn Paywall ON (Enforce Billing)"}
              </span>
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
            Failed to load feature flags: {error.message}
          </div>
        )}

        <div className="bg-[#121212] border border-white/5 rounded-xl divide-y divide-white/5">
          {(flags ?? []).map((flag) => (
            <div key={flag.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white font-mono">{flag.id}</div>
                {flag.description && (
                  <div className="text-xs text-white/70">{flag.description}</div>
                )}
              </div>
              <form action={toggleFeatureFlag}>
                <input type="hidden" name="id" value={flag.id} />
                <input type="hidden" name="nextEnabled" value={(!flag.is_enabled).toString()} />
                <button
                  className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${
                    flag.is_enabled ? "bg-[#E8AE3C]" : "bg-white/10"
                  }`}
                  aria-pressed={flag.is_enabled}
                  title={flag.is_enabled ? "Enabled — click to disable" : "Disabled — click to enable"}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-black transition-transform ${
                      flag.is_enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </form>
            </div>
          ))}
          {flags && flags.length === 0 && !error && (
            <div className="text-sm text-white/70 p-8 text-center">
              No feature flags yet. Create one below.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/70 uppercase tracking-wide flex items-center gap-2">
          <Flag className="w-4 h-4" />
          Add a flag
        </h2>
        <form
          action={createFeatureFlag}
          className="bg-[#121212] border border-white/5 rounded-xl p-5 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block text-xs text-white/70 md:col-span-1">
              Key (lowercase_snake)
              <input
                name="id"
                required
                pattern="[a-z0-9_]+"
                placeholder="e.g. deep_intel"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/70"
              />
            </label>
            <label className="block text-xs text-white/70 md:col-span-2">
              Description
              <input
                name="description"
                placeholder="What this flag controls on the public site."
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/70"
              />
            </label>
          </div>
          <button className="px-4 py-2 bg-[#E8AE3C] text-black rounded-lg text-sm font-medium hover:bg-[#F7C64E] transition-colors">
            Create flag (starts disabled)
          </button>
        </form>
      </section>
    </div>
  );
}
