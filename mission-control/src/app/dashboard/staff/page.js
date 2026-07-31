import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS, TIER_LABELS } from "@/lib/rbac";
import { inviteStaff, grantStaffByEmail, changeStaffTier, setStaffActive } from "./actions";
import { UserPlus, KeyRound } from "lucide-react";

export default async function StaffIamPage() {
  const staff = await getCurrentStaff();

  if (staff.tier < TIERS.SUPER_ADMIN) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const admin = createAdminClient();
  const { data: allStaff, error } = await admin
    .from("admin_users")
    .select("id, email, display_name, tier, is_finance, active, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Staff IAM</h1>
      </div>

      <section className="bg-[#121212] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Invite staff
        </h2>
        <form action={inviteStaff} className="flex flex-wrap gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="name@scoutit.com"
            className="flex-1 min-w-[200px] bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
          <select
            name="tier"
            defaultValue="1"
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="1">Tier 1 — Agent</option>
            <option value="2">Tier 2 — Ops Manager</option>
            <option value="3">Tier 3 — Super Admin</option>
          </select>
          <button className="px-4 py-2 bg-[#E8AE3C] text-black rounded-lg text-sm font-medium hover:bg-[#F7C64E] transition-colors whitespace-nowrap">
            Send invite
          </button>
        </form>
        <p className="text-xs text-white/30 mt-2">
          Sends a real Supabase Auth invite email and creates their admin_users row at the chosen
          tier immediately.
        </p>
      </section>

      <section className="bg-[#121212] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-4 flex items-center gap-2">
          <KeyRound className="w-4 h-4" />
          Grant access to an existing account
        </h2>
        <form action={grantStaffByEmail} className="flex flex-wrap gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="already-registered@email.com"
            className="flex-1 min-w-[200px] bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
          <input
            name="displayName"
            placeholder="Display name (optional)"
            className="flex-1 min-w-[160px] bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
          <select
            name="tier"
            defaultValue="1"
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="1">Tier 1 — Agent</option>
            <option value="2">Tier 2 — Ops Manager</option>
            <option value="3">Tier 3 — Super Admin</option>
          </select>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
            Grant access
          </button>
        </form>
        <p className="text-xs text-white/30 mt-2">
          For someone who already has a ScoutIt account (e.g. signed in with Google) — no invite
          email; their existing login becomes staff at the chosen tier.
        </p>
      </section>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          Failed to load staff: {error.message}
        </div>
      )}

      <section className="bg-[#121212] border border-white/5 rounded-xl divide-y divide-white/5">
        {(allStaff ?? []).map((member) => (
          <StaffRow key={member.id} member={member} isSelf={member.id === staff.id} />
        ))}
      </section>
    </div>
  );
}

function StaffRow({ member, isSelf }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white flex items-center gap-2">
          {member.display_name || member.email}
          {isSelf && (
            <span className="text-[10px] uppercase tracking-wide bg-white/5 text-white/40 border border-white/10 rounded-full px-2 py-0.5">
              You
            </span>
          )}
          {!member.active && (
            <span className="text-[10px] uppercase tracking-wide bg-red-400/10 text-red-400 border border-red-400/20 rounded-full px-2 py-0.5">
              Deactivated
            </span>
          )}
        </div>
        <div className="text-xs text-white/40">{member.email}</div>
      </div>

      {isSelf ? (
        <div className="text-xs text-white/40">
          {TIER_LABELS[member.tier]} · Tier {member.tier}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <form action={changeStaffTier} className="flex items-center gap-1.5">
            <input type="hidden" name="staffId" value={member.id} />
            <select
              name="tier"
              defaultValue={member.tier}
              className="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              <option value="1">Tier 1 — Agent</option>
              <option value="2">Tier 2 — Ops Manager</option>
              <option value="3">Tier 3 — Super Admin</option>
            </select>
            <button className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors">
              Update
            </button>
          </form>

          <form action={setStaffActive}>
            <input type="hidden" name="staffId" value={member.id} />
            <input type="hidden" name="nextActive" value={(!member.active).toString()} />
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                member.active
                  ? "bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20"
                  : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
              }`}
            >
              {member.active ? "Deactivate" : "Reactivate"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
