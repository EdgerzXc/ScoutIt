import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { toggleFeatureFlag, createFeatureFlag } from "./actions";
import { Flag } from "lucide-react";

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
        <span className="text-xs text-white/40">Public site reads these live</span>
      </div>

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
                  <div className="text-xs text-white/40">{flag.description}</div>
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
            <div className="text-sm text-white/50 p-8 text-center">
              No feature flags yet. Create one below.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
          <Flag className="w-4 h-4" />
          Add a flag
        </h2>
        <form
          action={createFeatureFlag}
          className="bg-[#121212] border border-white/5 rounded-xl p-5 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block text-xs text-white/50 md:col-span-1">
              Key (lowercase_snake)
              <input
                name="id"
                required
                pattern="[a-z0-9_]+"
                placeholder="e.g. deep_intel"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/30"
              />
            </label>
            <label className="block text-xs text-white/50 md:col-span-2">
              Description
              <input
                name="description"
                placeholder="What this flag controls on the public site."
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
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
