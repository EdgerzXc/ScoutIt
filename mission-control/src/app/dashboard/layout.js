import { redirect } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  Database,
  Flag,
  Video,
  LogOut,
  Bell,
  ScrollText,
  KeyRound,
  Award,
  BarChart3,
  Radar,
  Inbox,
  BadgeCheck,
  Scale,
  BrainCircuit,
  Radio
} from "lucide-react";
import { getCurrentStaff, TIER_LABELS, TIERS } from "@/lib/rbac";
import SidebarNav from "@/components/dashboard/SidebarNav";

export default async function DashboardLayout({ children }) {
  const staff = await getCurrentStaff();

  if (!staff) {
    redirect("/?error=NotAuthorized");
  }

  // Tier gating stays HERE (server). Icons are pre-rendered to elements so
  // the client SidebarNav never receives a component/function across the RSC
  // boundary (the BulkSelectManager lesson).
  const iconClass = "w-4 h-4";
  const navigation = [
    { name: "Overview", href: "/dashboard", icon: <LayoutDashboard className={iconClass} />, minTier: TIERS.AGENT },
    { name: "Spatial OSINT", href: "/dashboard/osint", icon: <Radio className={iconClass} />, minTier: TIERS.AGENT },
    { name: "Mission Inbox", href: "/dashboard/inbox", icon: <Inbox className={iconClass} />, minTier: TIERS.AGENT },
    { name: "CMS / Content", href: "/dashboard/cms", icon: <Database className={iconClass} />, minTier: TIERS.AGENT },
    { name: "User CRM", href: "/dashboard/crm", icon: <Users className={iconClass} />, minTier: TIERS.AGENT },
    { name: "Verification", href: "/dashboard/verification", icon: <BadgeCheck className={iconClass} />, minTier: TIERS.AGENT },
    { name: "Disputes", href: "/dashboard/disputes", icon: <Scale className={iconClass} />, minTier: TIERS.AGENT },
    { name: "Team Brain", href: "/dashboard/brain", icon: <BrainCircuit className={iconClass} />, minTier: TIERS.AGENT },
    { name: "Badges", href: "/dashboard/badges", icon: <Award className={iconClass} />, minTier: TIERS.AGENT },
    { name: "Metrics", href: "/dashboard/metrics", icon: <BarChart3 className={iconClass} />, minTier: TIERS.OPS_MANAGER },
    { name: "Security", href: "/dashboard/security", icon: <Radar className={iconClass} />, minTier: TIERS.OPS_MANAGER },
    { name: "Audit Log", href: "/dashboard/audit", icon: <ScrollText className={iconClass} />, minTier: TIERS.OPS_MANAGER },
    { name: "Feature Flags", href: "/dashboard/features", icon: <Flag className={iconClass} />, minTier: TIERS.SUPER_ADMIN },
    { name: "Staff IAM", href: "/dashboard/staff", icon: <KeyRound className={iconClass} />, minTier: TIERS.SUPER_ADMIN },
    { name: "Concierge Ingest", href: "/dashboard/media", icon: <Video className={iconClass} />, minTier: TIERS.AGENT },
    { name: "Notifications", href: "/dashboard/notifications", icon: <Bell className={iconClass} />, minTier: TIERS.AGENT },
  ]
    .filter((item) => staff.tier >= item.minTier)
    .map(({ name, href, icon }) => ({ name, href, icon }));

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#121212] border-r border-white/10 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-black/50 border border-white/5 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#E8AE3C]" />
          </div>
          <span className="font-semibold tracking-tight">Mission Control</span>
        </div>

        <SidebarNav items={navigation} />

        <div className="p-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-white/70 truncate">{staff.email}</div>
            <div className="text-[10px] uppercase tracking-wide text-[#E8AE3C]/80 mt-0.5">
              {TIER_LABELS[staff.tier]} - Tier {staff.tier}
              {staff.is_finance ? " - Finance" : ""}
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#0d0d0d] relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E8AE3C] rounded-full blur-[150px] opacity-5 pointer-events-none" />
        <main className="p-8 relative z-10">{children}</main>
      </div>
    </div>
  );
}
