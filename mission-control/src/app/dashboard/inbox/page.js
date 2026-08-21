import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import {
  Inbox,
  CheckSquare,
  BadgeCheck,
  Scale,
  Radar,
  FileWarning,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// Mission Inbox — the single daily triage list. It does NOT own any data;
// it is a read-only aggregator that surfaces whatever is currently WAITING
// across every operational queue (approvals, verifications, disputes,
// security flags, quarantined uploads) and links straight into the module
// where staff act. Every query is wrapped in safe() so a table that does not
// exist yet (or a permissions hiccup) degrades to an empty lane instead of
// crashing the page — this is intentional so the Inbox works before the
// Verification / Disputes tables are applied.

async function safe(promise) {
  try {
    const result = await promise;
    if (result.error) throw new Error(result.error.message);
    return result.data ?? [];
  } catch {
    return [];
  }
}

export default async function MissionInboxPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");

  const admin = createAdminClient();
  const isOps = staff.tier >= TIERS.OPS_MANAGER;

  const [approvals, verifications, disputes, flags, quarantine] = await Promise.all([
    safe(
      admin
        .from("properties")
        .select("id, title, location, created_at")
        .eq("moderation_status", "pending")
        .order("created_at", { ascending: true })
        .limit(6)
    ),
    safe(
      admin
        .from("verification_requests")
        .select("id, subject_name, kind, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(6)
    ),
    safe(
      admin
        .from("disputes")
        .select("id, title, kind, priority, created_at")
        .in("status", ["open", "investigating"])
        .order("created_at", { ascending: true })
        .limit(6)
    ),
    isOps
      ? safe(
          admin
            .from("security_access_logs")
            .select("id, masked_ip, route_accessed, request_count, flag_reason, last_request_at")
            .eq("is_flagged", true)
            .order("last_request_at", { ascending: false })
            .limit(6)
        )
      : Promise.resolve([]),
    safe(
      admin
        .from("file_scans")
        .select("id, original_filename, scan_verdict, scan_status, created_at")
        .or("scan_verdict.eq.suspicious,scan_verdict.eq.infected")
        .order("created_at", { ascending: false })
        .limit(6)
    ),
  ]);

  const lanes = [
    {
      key: "approvals",
      title: "Awaiting approval",
      subtitle: "Properties not yet live on the public site",
      icon: <CheckSquare className="w-4 h-4 text-[#E8AE3C]" />,
      href: "/dashboard/cms",
      cta: "Open Approval Queue",
      count: approvals.length,
      items: approvals.map((p) => ({
        id: p.id,
        primary: p.title || "Untitled property",
        secondary: p.location || "—",
        at: p.created_at,
      })),
    },
    {
      key: "verifications",
      title: "Verification requests",
      subtitle: "PRC licenses & price verifications pending review",
      icon: <BadgeCheck className="w-4 h-4 text-emerald-400" />,
      href: "/dashboard/verification",
      cta: "Open Verification Center",
      count: verifications.length,
      items: verifications.map((v) => ({
        id: v.id,
        primary: v.subject_name || "Unnamed subject",
        secondary: labelize(v.kind),
        at: v.created_at,
      })),
    },
    {
      key: "disputes",
      title: "Open disputes",
      subtitle: "Broker & owner conflicts awaiting mediation",
      icon: <Scale className="w-4 h-4 text-orange-400" />,
      href: "/dashboard/disputes",
      cta: "Open Disputes Hub",
      count: disputes.length,
      items: disputes.map((d) => ({
        id: d.id,
        primary: d.title || "Untitled dispute",
        secondary: `${labelize(d.kind)}${d.priority ? ` · ${labelize(d.priority)}` : ""}`,
        at: d.created_at,
      })),
    },
    {
      key: "security",
      title: "Security flags",
      subtitle: isOps ? "Masked IPs flagged for anomalous traffic" : "Ops Manager access required",
      icon: <Radar className="w-4 h-4 text-red-400" />,
      href: "/dashboard/security",
      cta: "Open Security Center",
      count: flags.length,
      hidden: !isOps,
      items: flags.map((f) => ({
        id: f.id,
        primary: f.masked_ip,
        secondary: `${f.route_accessed} · ${f.request_count} req`,
        at: f.last_request_at,
        mono: true,
      })),
    },
    {
      key: "quarantine",
      title: "Quarantined uploads",
      subtitle: "Files flagged suspicious or infected by the scan pipeline",
      icon: <FileWarning className="w-4 h-4 text-red-400" />,
      href: "/dashboard/media",
      cta: "Open Concierge Ingest",
      count: quarantine.length,
      items: quarantine.map((f) => ({
        id: f.id,
        primary: f.original_filename || "unnamed file",
        secondary: labelize(f.scan_verdict || f.scan_status),
        at: f.created_at,
        mono: true,
      })),
    },
  ].filter((lane) => !lane.hidden);

  const total = lanes.reduce((sum, lane) => sum + lane.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Inbox className="w-5 h-5 text-[#E8AE3C]" />
            Mission Inbox
          </h1>
          <p className="text-[12px] uppercase tracking-wide text-white/70 mt-1">
            One list · everything waiting on the team right now
          </p>
        </div>
        <span className="text-xs text-white/70 whitespace-nowrap">
          {total} item{total === 1 ? "" : "s"} across {lanes.length} lanes
        </span>
      </div>

      {total === 0 && (
        <div className="bg-[#121212] border border-white/5 rounded-xl p-8 text-center">
          <Sparkles className="w-6 h-6 text-[#E8AE3C] mx-auto mb-3" />
          <p className="text-sm text-white/70">Inbox zero. Nothing is waiting on the team.</p>
          <p className="text-xs text-white/70 mt-1">
            New approvals, disputes, verifications and flags will surface here automatically.
          </p>
        </div>
      )}

      {/* Mobile-first: single column, becomes two columns on wide screens. */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {lanes.map((lane) => (
          <section
            key={lane.key}
            className="bg-[#121212] border border-white/5 rounded-xl p-5 flex flex-col"
          >
            <div className="flex items-center gap-2.5 mb-1">
              {lane.icon}
              <h2 className="text-base font-medium flex-1">{lane.title}</h2>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                  lane.count > 0
                    ? "text-[#F7C64E] border-[rgba(232,174,60,0.25)] bg-[rgba(232,174,60,0.10)]"
                    : "text-white/70 border-white/10"
                }`}
              >
                {lane.count}
              </span>
            </div>
            <p className="text-[12px] text-white/70 mb-3">{lane.subtitle}</p>

            <div className="flex-1">
              {lane.items.length === 0 ? (
                <p className="text-xs text-white/70 py-2">Clear.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {lane.items.map((item) => {
                    const ageHrs = item.at ? Math.round((Date.now() - new Date(item.at).getTime()) / 3600000) : 0;
                    const isSlaBreach = ageHrs > 24;

                    return (
                      <li key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm text-white/90 truncate ${item.mono ? "font-mono text-xs" : ""}`}>
                              {item.primary}
                            </span>
                            {isSlaBreach && (
                              <span className="text-[12px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                SLA &gt; 24h
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-white/70 truncate">{item.secondary}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[12px] text-white/70 font-mono">
                            {relTime(item.at)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <Link
              href={lane.href}
              className="mt-4 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border border-white/10 text-white/70 hover:text-[#F7C64E] hover:border-[rgba(232,174,60,0.25)] hover:bg-[rgba(232,174,60,0.06)] transition-colors"
            >
              {lane.cta}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}

function labelize(value) {
  if (!value) return "—";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function relTime(iso) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}
