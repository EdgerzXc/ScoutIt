import { redirect } from "next/navigation";
import {
  Shield, LayoutDashboard, Users, Database, Flag, Video, LogOut, Bell,
  ScrollText, KeyRound, Award, BarChart3, Radar, Inbox, BadgeCheck,
  Scale, BrainCircuit, Radio, Wrench, Crosshair, Mail, Cpu } from "lucide-react";
import { getCurrentStaff, TIER_LABELS, TIERS } from "@/lib/rbac";
import SidebarNav from "@/components/dashboard/SidebarNav";
import SensitiveWorkspaceGuard from "@/components/security/SensitiveWorkspaceGuard";

export default async function DashboardLayout({ children }) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");

  const sessionStartedAt = new Date().toISOString();
  const sessionReference = `MC-${String(staff.id).slice(0, 8)}-${sessionStartedAt.replace(/\D/g, "").slice(0, 12)}`;
  const iconClass = "w-4 h-4";
  const navigation = [
    { group: "Command", name: "Overview", href: "/dashboard", icon: <LayoutDashboard className={iconClass} />, minTier: TIERS.AGENT },
    { group: "Command", name: "Mission Inbox", href: "/dashboard/inbox", icon: <Inbox className={iconClass} />, minTier: TIERS.AGENT },
    { group: "Command", name: "Notifications", href: "/dashboard/notifications", icon: <Bell className={iconClass} />, minTier: TIERS.AGENT },

    { group: "Content & People", name: "CMS / Content", href: "/dashboard/cms", icon: <Database className={iconClass} />, minTier: TIERS.AGENT },
    { group: "Content & People", name: "User CRM", href: "/dashboard/crm", icon: <Users className={iconClass} />, minTier: TIERS.AGENT },
    { group: "Content & People", name: "Verification", href: "/dashboard/verification", icon: <BadgeCheck className={iconClass} />, minTier: TIERS.AGENT },
    { group: "Content & People", name: "Position Queue", href: "/dashboard/coordinates", icon: <Crosshair className={iconClass} />, minTier: TIERS.AGENT },
    { group: "Content & People", name: "Disputes", href: "/dashboard/disputes", icon: <Scale className={iconClass} />, minTier: TIERS.AGENT },
    { group: "Content & People", name: "Contact Queue", href: "/dashboard/contact", icon: <Mail className={iconClass} />, minTier: TIERS.OPS_MANAGER },
    { group: "Content & People", name: "Badges", href: "/dashboard/badges", icon: <Award className={iconClass} />, minTier: TIERS.AGENT },
    { group: "Content & People", name: "Concierge Ingest", href: "/dashboard/media", icon: <Video className={iconClass} />, minTier: TIERS.AGENT },

    { group: "Intelligence", name: "Spatial OSINT", href: "/dashboard/osint", icon: <Radio className={iconClass} />, minTier: TIERS.AGENT },
    { group: "Intelligence", name: "Team Brain", href: "/dashboard/brain", icon: <BrainCircuit className={iconClass} />, minTier: TIERS.AGENT },
    { group: "Intelligence", name: "Metrics", href: "/dashboard/metrics", icon: <BarChart3 className={iconClass} />, minTier: TIERS.OPS_MANAGER },

    { group: "Administration", name: "Security", href: "/dashboard/security", icon: <Radar className={iconClass} />, minTier: TIERS.OPS_MANAGER },
    { group: "Administration", name: "Audit Log", href: "/dashboard/audit", icon: <ScrollText className={iconClass} />, minTier: TIERS.OPS_MANAGER },
    { group: "Administration", name: "System Activity", href: "/dashboard/system", icon: <Cpu className={iconClass} />, minTier: TIERS.OPS_MANAGER },
    { group: "Administration", name: "System Operations", href: "/dashboard/operations", icon: <Wrench className={iconClass} />, minTier: TIERS.SUPER_ADMIN },
    { group: "Administration", name: "Feature Flags", href: "/dashboard/features", icon: <Flag className={iconClass} />, minTier: TIERS.SUPER_ADMIN },
    { group: "Administration", name: "Staff IAM", href: "/dashboard/staff", icon: <KeyRound className={iconClass} />, minTier: TIERS.SUPER_ADMIN },
  ].filter((item) => staff.tier >= item.minTier)
    .map(({ group, name, href, icon }) => ({ group, name, href, icon }));

  return (
    <SensitiveWorkspaceGuard staffEmail={staff.email} sessionReference={sessionReference} sessionStartedAt={sessionStartedAt}>
    <div className="flex h-screen overflow-hidden bg-background text-white font-sans">
      <a href="#main-content" className="sr-only z-50 rounded bg-gold px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
      <aside className="flex w-64 flex-col border-r border-line bg-surface" aria-label="Mission Control sidebar">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-line bg-black/50">
            <Shield className="h-4 w-4 text-gold" aria-hidden="true" />
          </div>
          <span className="font-semibold tracking-tight">Mission Control</span>
        </div>
        <SidebarNav items={navigation} />
        <div className="border-t border-line p-4">
          <div className="mb-2 px-3 py-2">
            <div className="truncate text-xs text-white/70">{staff.email}</div>
            <div className="mt-0.5 text-[12px] uppercase tracking-wide text-gold/80">
              {TIER_LABELS[staff.tier]} - Tier {staff.tier}{staff.is_finance ? " - Finance" : ""}
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              <LogOut className="h-4 w-4" aria-hidden="true" />Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="relative flex-1 overflow-y-auto bg-background">
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-gold opacity-5 blur-[150px]" />
        <main id="main-content" className="relative z-10 p-8">{children}</main>
      </div>
    </div>
    </SensitiveWorkspaceGuard>
  );
}