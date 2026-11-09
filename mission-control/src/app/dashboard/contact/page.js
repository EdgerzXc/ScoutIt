import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import {
  Inbox,
  Mail,
  Clock,
  Headphones,
  Award,
  AlertCircle,
  CheckCircle2,
  User,
  FileText,
  Sparkles,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { setContactStatus, saveStaffNotes } from "./actions";
import ContactReplyButton from "@/components/communications/ContactReplyButton";

// The staff end of the contact and direct support surface.
//
// /contact on the main site writes to contact_messages; this is where operational
// staff triage incoming tickets, respond via SendGrid/Mailto, and track internal notes.
//
// Access posture: RLS deny-all by design, reachable only through the service role,
// only here, and only at or above OPS_MANAGER tier.

export const dynamic = "force-dynamic";

const STATUS_STYLES = {
  new: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  in_progress: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  resolved: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  spam: "bg-white/5 text-white/70 border-white/10",
};

const NEXT_ACTIONS = {
  new: [["in_progress", "Pick up"], ["spam", "Spam"]],
  in_progress: [["resolved", "Resolve"], ["spam", "Spam"]],
  resolved: [["in_progress", "Reopen"]],
  spam: [["new", "Not spam"]],
};

function formatWhen(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

export default async function ContactQueuePage({ searchParams }) {
  const staff = await getCurrentStaff();

  if (!staff || staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const params = await searchParams;
  const currentTab = params?.tab || "all";

  const admin = createAdminClient();
  const { data: messages, error } = await admin
    .from("contact_messages")
    .select("id, created_at, name, email, subject, message, status, handled_at, handled_by, user_id, staff_notes")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = messages ?? [];

  // Enrich with user account profiles and badges if user_id is populated
  const userIds = [...new Set(rows.map((m) => m.user_id).filter(Boolean))];
  const userProfilesMap = {};
  const userBadgesMap = {};

  if (userIds.length > 0) {
    const [{ data: profiles }, { data: badges }] = await Promise.all([
      admin
        .from("user_profiles")
        .select("id, display_name, active_roles, subscription_tier")
        .in("id", userIds),
      admin
        .from("user_badges")
        .select("user_id, badge_id, seat_number")
        .in("user_id", userIds),
    ]);

    for (const p of profiles ?? []) {
      userProfilesMap[p.id] = p;
    }
    for (const b of badges ?? []) {
      if (!userBadgesMap[b.user_id]) userBadgesMap[b.user_id] = [];
      userBadgesMap[b.user_id].push(b);
    }
  }

  function isVipMessage(m) {
    const hasSubjectFlag = m.subject?.includes("[VIP PIONEER");
    const hasMessageFlag = m.message?.includes("VIP Tier:") || m.message?.includes("vip_support");
    const badges = m.user_id ? userBadgesMap[m.user_id] || [] : [];
    const hasPioneerBadge = badges.some((b) => b.badge_id?.toLowerCase().includes("pioneer"));
    return hasSubjectFlag || hasMessageFlag || hasPioneerBadge;
  }

  function isSupportMessage(m) {
    return (
      isVipMessage(m) ||
      m.subject?.includes("[DIRECT SUPPORT]") ||
      m.message?.includes("Topic: support")
    );
  }

  function isUrgentMessage(m) {
    return (
      m.message?.includes("Urgency: URGENT / BLOCKING SLA") ||
      m.subject?.toLowerCase().includes("urgent")
    );
  }

  function getPioneerCharterBadge(userId) {
    if (!userId) return null;
    const badges = userBadgesMap[userId] || [];
    return badges.find((b) => b.badge_id?.toLowerCase().includes("pioneer")) || null;
  }

  // Telemetry KPIs
  const totalCount = rows.length;
  const openCount = rows.filter((m) => m.status === "new" || m.status === "in_progress").length;
  const supportCount = rows.filter((m) => isSupportMessage(m) && m.status !== "spam").length;
  const vipCount = rows.filter((m) => isVipMessage(m) && m.status !== "spam").length;
  const resolvedCount = rows.filter((m) => m.status === "resolved").length;
  const spamCount = rows.filter((m) => m.status === "spam").length;

  const tabs = [
    { key: "all", label: "All Active", count: totalCount - spamCount },
    { key: "support", label: "Direct Support", count: supportCount },
    { key: "vip", label: "VIP Pioneer SLA", count: vipCount },
    { key: "general", label: "General", count: Math.max(0, totalCount - spamCount - supportCount) },
    { key: "resolved", label: "Resolved", count: resolvedCount },
    { key: "spam", label: "Spam", count: spamCount },
  ];

  const filteredRows = rows.filter((m) => {
    if (currentTab === "support") return isSupportMessage(m) && m.status !== "spam";
    if (currentTab === "vip") return isVipMessage(m) && m.status !== "spam";
    if (currentTab === "general") return !isSupportMessage(m) && m.status !== "spam";
    if (currentTab === "resolved") return m.status === "resolved";
    if (currentTab === "spam") return m.status === "spam";
    return m.status !== "spam";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Headphones className="w-5 h-5 text-[#E8AE3C]" />
            Operations &amp; Direct Support Desk
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Inbound public tickets from <span className="text-white/60">/contact</span> &amp; VIP Pioneer SLAs.
          </p>
        </div>
        {openCount > 0 && (
          <span className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {openCount} Open Desk Tickets
          </span>
        )}
      </div>

      {/* KPI Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121212] border border-white/5 rounded-xl p-4">
          <span className="text-[12px] font-mono uppercase tracking-wider text-white/70 block">Total Inbound</span>
          <span className="text-2xl font-semibold text-white/90 mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-[#121212] border border-sky-400/20 rounded-xl p-4">
          <span className="text-[12px] font-mono uppercase tracking-wider text-sky-400 block">Direct Support</span>
          <span className="text-2xl font-semibold text-sky-300 mt-1 block">{supportCount}</span>
        </div>
        <div className="bg-[#121212] border border-[#E8AE3C]/30 bg-[#E8AE3C]/5 rounded-xl p-4">
          <span className="text-[12px] font-mono uppercase tracking-wider text-[#F7C64E] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#E8AE3C]" /> VIP Pioneer SLA
          </span>
          <span className="text-2xl font-semibold text-[#F7C64E] mt-1 block">{vipCount}</span>
        </div>
        <div className="bg-[#121212] border border-emerald-400/20 rounded-xl p-4">
          <span className="text-[12px] font-mono uppercase tracking-wider text-emerald-400 block">Resolved</span>
          <span className="text-2xl font-semibold text-emerald-300 mt-1 block">{resolvedCount}</span>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex gap-1.5 bg-[#121212] border border-white/5 rounded-xl p-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/dashboard/contact?tab=${tab.key}`}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? "bg-[#E8AE3C] text-black font-semibold shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[12px] px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-black/20 text-black" : "bg-white/10 text-white/70"
                }`}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Failed to load the contact queue: {error.message}
        </div>
      )}

      {!error && filteredRows.length === 0 && (
        <div className="bg-[#121212] border border-white/5 rounded-xl text-sm text-white/70 p-12 text-center flex flex-col items-center gap-2">
          <Inbox className="w-6 h-6 text-white/60 mb-1" />
          <p className="font-medium text-white/90">No tickets in this view</p>
          <p className="text-xs text-white/60">
            Messages sent through the public contact form and direct support triage will appear here.
          </p>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {filteredRows.map((m) => {
          const isVip = isVipMessage(m);
          const isUrgent = isUrgentMessage(m);
          const userProfile = m.user_id ? userProfilesMap[m.user_id] : null;
          const pioneerBadge = getPioneerCharterBadge(m.user_id);
          const charterSeat = pioneerBadge?.seat_number;

          return (
            <div
              key={m.id}
              className={`bg-[#121212] border rounded-xl p-5 transition-colors ${
                isVip
                  ? "border-[#E8AE3C]/30 bg-gradient-to-r from-[#E8AE3C]/5 via-[#121212] to-[#121212]"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-white/5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white/90">{m.name}</span>
                    
                    {/* User Profile Badge if registered */}
                    {userProfile && (
                      <span className="text-[12px] uppercase font-mono px-2 py-0.5 rounded-full border border-sky-400/25 bg-sky-400/10 text-sky-300 flex items-center gap-1">
                        <User className="w-3 h-3 text-sky-400" />
                        {userProfile.active_roles?.[0] || "Member"}
                      </span>
                    )}

                    {/* Pioneer Charter Seat Badge */}
                    {isVip && (
                      <span className="text-[12px] uppercase font-mono px-2.5 py-0.5 rounded-full border border-[#E8AE3C]/40 bg-[#E8AE3C]/15 text-[#F7C64E] font-medium flex items-center gap-1 shadow-sm">
                        <Award className="w-3 h-3 text-[#E8AE3C]" />
                        {charterSeat ? `Charter #${String(charterSeat).padStart(3, "0")}` : "Pioneer Charter"}
                      </span>
                    )}

                    {/* Urgent Flag */}
                    {isUrgent && (
                      <span className="text-[12px] uppercase font-mono px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/15 text-red-400 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-red-400" />
                        Urgent SLA
                      </span>
                    )}

                    {/* Ticket Status */}
                    <span
                      className={`text-[12px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border ${
                        STATUS_STYLES[m.status] || STATUS_STYLES.spam
                      }`}
                    >
                      {m.status.replace("_", " ")}
                    </span>
                  </div>

                  <a
                    href={`mailto:${m.email}`}
                    className="text-xs text-white/70 hover:text-[#F7C64E] inline-flex items-center gap-1.5 mt-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-white/60" />
                    {m.email}
                  </a>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-white/60 inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatWhen(m.created_at)}
                  </span>
                </div>
              </div>

              {/* Subject Line */}
              {m.subject && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-white/90">{m.subject}</p>
                </div>
              )}

              {/* Message Content */}
              <p className="text-sm text-white/70 mt-2.5 whitespace-pre-wrap leading-relaxed font-sans bg-black/30 p-3.5 rounded-lg border border-white/5">
                {m.message}
              </p>

              {/* Internal Staff Notes Section */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <form action={saveStaffNotes} className="space-y-2">
                  <input type="hidden" name="id" value={m.id} />
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-mono uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-white/60" />
                      Staff Internal Notes
                    </label>
                    {m.staff_notes && (
                      <span className="text-[12px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Note logged
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <textarea
                      name="staff_notes"
                      defaultValue={m.staff_notes || ""}
                      rows={2}
                      placeholder="Add internal triage notes, client call log, or escalation details..."
                      className="w-full text-xs bg-black/40 border border-white/10 rounded-lg p-2.5 text-white/90 placeholder:text-white/60 focus:border-[#E8AE3C]/50 focus:outline-none transition-colors font-sans"
                    />
                    <button
                      type="submit"
                      className="shrink-0 text-xs font-mono uppercase tracking-wider px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      Save Note
                    </button>
                  </div>
                </form>
              </div>

              {/* Actions & Routing */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <ContactReplyButton message={m} />
                  <a
                    href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(
                      `Re: ${m.subject || "Your inquiry to ScoutIt"}`,
                    )}&body=${encodeURIComponent(
                      `\n\n— — —\nYou wrote to ScoutIt on ${formatWhen(m.created_at)}:\n\n${m.message}`,
                    )}`}
                    className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg border border-[#E8AE3C]/30 text-[#E8AE3C] hover:border-[#E8AE3C]/60 hover:text-[#F7C64E] bg-[#E8AE3C]/5 transition-colors"
                  >
                    Reply via Email
                  </a>
                  {(NEXT_ACTIONS[m.status] || []).map(([next, label]) => (
                    <form key={next} action={setContactStatus}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="status" value={next} />
                      <button
                        type="submit"
                        className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/25 transition-colors"
                      >
                        {label}
                      </button>
                    </form>
                  ))}
                </div>

                {m.handled_at && (
                  <span className="text-xs font-mono text-white/60">
                    Handled {formatWhen(m.handled_at)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
