import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { probeAllSubsystems } from "./actions";
import HealthClient from "./HealthClient";
import { Activity } from "lucide-react";

export const metadata = {
  title: "System Health & Infrastructure | Mission Control",
};

export default async function HealthPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");
  if (staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const report = await probeAllSubsystems();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" />
            Infrastructure &amp; Subsystem Health
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Consolidated latency telemetry, external API budgets, and automated worker posture (Spec §7).
          </p>
        </div>
      </div>

      <HealthClient initialReport={report} staffTier={staff.tier} />
    </div>
  );
}
