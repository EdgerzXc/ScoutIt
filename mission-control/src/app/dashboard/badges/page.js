import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { createBadge, setBadgeActive, awardBadge, revokeBadge } from "./actions";
import { Award, Plus } from "lucide-react";

export default async function BadgesPage() {
  const staff = await getCurrentStaff();
  const canManageCatalog = staff.tier >= TIERS.SUPER_ADMIN;
  const canRevoke = staff.tier >= TIERS.OPS_MANAGER;

  const admin = createAdminClient();

  const [{ data: badges, error: badgesError }, { data: grants, error: grantsError }] =
    await Promise.all([
      admin
        .from("badge_definitions")
        .select("id, name, description, rarity, category, max_slots, color, is_active")
        .order("category")
        .order("name"),
      admin
        .from("user_badges")
        .select("user_id, badge_id, granted_by, earned_at")
        .order("earned_at", { ascending: false })
        .limit(25),
    ]);

  const claimedCounts = {};
  if (!grantsError) {
    const { data: allGrants } = await admin.from("user_badges").select("badge_id");
    for (const row of allGrants ?? []) {
      claimedCounts[row.badge_id] = (claimedCounts[row.badge_id] || 0) + 1;
    }
  }

  const badgesById = Object.fromEntries((badges ?? []).map((b) => [b.id, b]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Badges</h1>
      </div>

      <div className="text-xs text-white/40 bg-[#121212] border border-white/5 rounded-xl p-4">
        Badges created or edited here don&apos;t automatically appear on the public site yet —
        scoutit.ph still reads its badge catalog from <code>src/lib/badges.js</code> and{" "}
        <code>src/lib/BadgeEngine.js</code>. This screen manages the catalog and who&apos;s been
        awarded what; wiring the public site to read from this table is a follow-up main-app
        change.
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-wide">
          Award a badge
        </h2>
        <form action={awardBadge} className="bg-[#121212] border border-white/5 rounded-xl p-5 flex flex-wrap gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="user@email.com"
            className="flex-1 min-w-[180px] bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
          <select
            name="badgeId"
            required
            defaultValue=""
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="" disabled>
              Choose a badge...
            </option>
            {(badges ?? [])
              .filter((b) => b.is_active)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
          <button className="px-4 py-2 bg-[#E8AE3C] text-black rounded-lg text-sm font-medium hover:bg-[#F7C64E] transition-colors whitespace-nowrap">
            Award
          </button>
        </form>
        <p className="text-xs text-white/30">
          Looks up a real Supabase Auth account by email — the user must have signed in at least
          once. This is a different id space than User CRM&apos;s user_profiles search.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-wide">Catalog</h2>
        {badgesError && (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
            Failed to load badge catalog: {badgesError.message}
          </div>
        )}
        <div className="bg-[#121212] border border-white/5 rounded-xl divide-y divide-white/5">
          {(badges ?? []).map((badge) => {
            const claimed = claimedCounts[badge.id] || 0;
            return (
              <div key={badge.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${badge.color || "#888"}22` }}
                  >
                    <Award className="w-4 h-4" style={{ color: badge.color || "#888" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      {badge.name}
                      {!badge.is_active && (
                        <span className="text-[10px] uppercase tracking-wide bg-white/5 text-white/40 border border-white/10 rounded-full px-2 py-0.5">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 truncate">
                      {badge.rarity} - {badge.category}
                      {badge.max_slots != null && ` - ${claimed}/${badge.max_slots} claimed`}
                      {badge.max_slots == null && claimed > 0 && ` - ${claimed} awarded`}
                    </div>
                  </div>
                </div>
                {canManageCatalog && (
                  <form action={setBadgeActive}>
                    <input type="hidden" name="id" value={badge.id} />
                    <input type="hidden" name="nextActive" value={(!badge.is_active).toString()} />
                    <button className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors whitespace-nowrap">
                      {badge.is_active ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {canManageCatalog && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            Create a new badge type
          </h2>
          <form action={createBadge} className="bg-[#121212] border border-white/5 rounded-xl p-5 grid grid-cols-2 gap-3">
            <label className="text-xs text-white/50">
              Badge id (slug)
              <input
                name="id"
                required
                placeholder="early_bird"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-white/50">
              Display name
              <input
                name="name"
                required
                placeholder="Early Bird"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-white/50 col-span-2">
              Description
              <input
                name="description"
                placeholder="What does earning this mean?"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-white/50">
              Rarity
              <select
                name="rarity"
                defaultValue="common"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </label>
            <label className="text-xs text-white/50">
              Category
              <select
                name="category"
                defaultValue="custom"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="achievement">Achievement (unlimited)</option>
                <option value="pioneer_cohort">Pioneer cohort (slot-limited)</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="text-xs text-white/50">
              Max slots (blank = unlimited)
              <input
                name="maxSlots"
                type="number"
                min="1"
                placeholder="20"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-white/50">
              Color (hex)
              <input
                name="color"
                placeholder="#E8AE3C"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>
            <button className="col-span-2 justify-self-start px-4 py-2 bg-[#E8AE3C] text-black rounded-lg text-sm font-medium hover:bg-[#F7C64E] transition-colors">
              Create badge
            </button>
          </form>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-wide">
          Recent grants
        </h2>
        {grantsError && (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
            Failed to load recent grants: {grantsError.message}
          </div>
        )}
        <div className="bg-[#121212] border border-white/5 rounded-xl divide-y divide-white/5">
          {(grants ?? []).map((g) => (
            <div key={`${g.user_id}-${g.badge_id}`} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="text-xs text-white/60 min-w-0 truncate">
                <span className="text-white">{badgesById[g.badge_id]?.name || g.badge_id}</span>
                {" -> "}
                <span className="font-mono text-white/40">{g.user_id.slice(0, 8)}...</span>
                <span className="text-white/30"> via {g.granted_by}</span>
              </div>
              {canRevoke && (
                <form action={revokeBadge}>
                  <input type="hidden" name="userId" value={g.user_id} />
                  <input type="hidden" name="badgeId" value={g.badge_id} />
                  <button className="px-3 py-1.5 rounded-lg text-xs bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 transition-colors whitespace-nowrap">
                    Revoke
                  </button>
                </form>
              )}
            </div>
          ))}
          {grants && grants.length === 0 && (
            <div className="text-sm text-white/50 p-8 text-center">No badges awarded yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
