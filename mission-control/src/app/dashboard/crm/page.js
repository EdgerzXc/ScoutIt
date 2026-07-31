import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { updateUserProfile, setShadowban, setArchived, bulkArchiveUsers } from "./actions";
import { ShieldOff, ShieldCheck, Archive, ArchiveRestore } from "lucide-react";
import { BulkSelectManager } from "@/components/dashboard/BulkSelectManager";

export default async function UserCrmPage({ searchParams }) {
  const staff = await getCurrentStaff();
  const params = await searchParams;
  const q = (params?.q ?? "").toString().trim();

  const admin = createAdminClient();
  let query = admin
    .from("user_profiles")
    .select(
      "id, display_name, headline, location, bio, active_roles, subscription_tier, is_shadowbanned, archived_at, moderation_note, member_since"
    )
    .order("member_since", { ascending: false })
    .limit(50);

  if (q) {
    query = query.or(`display_name.ilike.%${q}%,id.ilike.%${q}%`);
  }

  const { data: users, error } = await query;

  const canArchive = staff.tier >= TIERS.OPS_MANAGER;
  
  const bulkActions = [];
  if (canArchive) {
    bulkActions.push({
      label: "Archive Users",
      icon: <Archive className="w-4 h-4" />,
      requiresReason: true,
      className: "bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20",
      fn: bulkArchiveUsers,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">User CRM</h1>
      </div>

      <form className="flex gap-2" action="/dashboard/crm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by display name or user id..."
          className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E8AE3C]/50"
        />
        <button className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/80 transition-colors">
          Search
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          Failed to load users: {error.message}
        </div>
      )}

      {users && (
        <BulkSelectManager
          items={users.map((u) => ({
            key: u.id,
            content: <UserRow user={u} staff={staff} />,
          }))}
          itemName="users"
          bulkActions={bulkActions}
        />
      )}
    </div>
  );
}

function UserRow({ user, staff }) {
  const canArchive = staff.tier >= TIERS.OPS_MANAGER;

  return (
    <details className="bg-[#121212] border border-white/5 rounded-xl group transition-colors">
      <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white truncate">
              {user.display_name || user.id}
            </span>
            {user.is_shadowbanned && (
              <span className="text-[10px] uppercase tracking-wide bg-red-400/10 text-red-400 border border-red-400/20 rounded-full px-2 py-0.5">
                Shadowbanned
              </span>
            )}
            {user.archived_at && (
              <span className="text-[10px] uppercase tracking-wide bg-white/5 text-white/50 border border-white/10 rounded-full px-2 py-0.5">
                Archived
              </span>
            )}
          </div>
          <div className="text-xs text-white/40 truncate">
            {user.id} · {(user.active_roles || []).join(", ") || "no roles"} ·{" "}
            {user.subscription_tier || "no tier"}
          </div>
        </div>
        <span className="text-xs text-white/30 shrink-0 group-open:hidden">Manage</span>
      </summary>

      <div className="border-t border-white/5 p-5 space-y-5">
        <form action={updateUserProfile} className="grid grid-cols-2 gap-3">
          <input type="hidden" name="userId" value={user.id} />
          <label className="text-xs text-white/50 col-span-2">
            Display name
            <input
              name="display_name"
              defaultValue={user.display_name || ""}
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-white/50">
            Headline
            <input
              name="headline"
              defaultValue={user.headline || ""}
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-white/50">
            Location
            <input
              name="location"
              defaultValue={user.location || ""}
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-white/50 col-span-2">
            Bio
            <textarea
              name="bio"
              defaultValue={user.bio || ""}
              rows={2}
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>
          <button className="col-span-2 justify-self-start px-4 py-2 bg-[#E8AE3C] text-black rounded-lg text-sm font-medium hover:bg-[#F7C64E] transition-colors">
            Save changes
          </button>
        </form>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
          <form action={setShadowban} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="nextValue" value={(!user.is_shadowbanned).toString()} />
            {!user.is_shadowbanned && (
              <input
                name="reason"
                placeholder="Reason (required)"
                required
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white w-48"
              />
            )}
            <button
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                user.is_shadowbanned
                  ? "bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                  : "bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20"
              }`}
            >
              {user.is_shadowbanned ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <ShieldOff className="w-3.5 h-3.5" />
              )}
              {user.is_shadowbanned ? "Unshadowban" : "Shadowban"}
            </button>
          </form>

          {canArchive && (
            <form action={setArchived} className="flex items-center gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="nextValue" value={(!user.archived_at).toString()} />
              {!user.archived_at && (
                <input
                  name="reason"
                  placeholder="Reason (required)"
                  required
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white w-48"
                />
              )}
              <button className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors">
                {user.archived_at ? (
                  <ArchiveRestore className="w-3.5 h-3.5" />
                ) : (
                  <Archive className="w-3.5 h-3.5" />
                )}
                {user.archived_at ? "Unarchive" : "Archive (soft delete)"}
              </button>
            </form>
          )}
        </div>

        {user.moderation_note && (
          <div className="text-xs text-white/40 italic">Note: {user.moderation_note}</div>
        )}
      </div>
    </details>
  );
}
