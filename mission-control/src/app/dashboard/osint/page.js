import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/rbac";
import OSINTControlCenter from "@/components/osint/OSINTControlCenter";

export const metadata = {
  title: "Spatial OSINT Control Center | ScoutIt Mission Control",
};

export default async function OSINTDashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#E8AE3C]">
            <span className="w-2 h-2 rounded-full bg-[#E8AE3C] animate-pulse" />
            Spatial Intelligence Operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            OSINT Signal Radar & 1-Click AI Synthesis Hub
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-3xl">
            Ingest raw filings (PSE EDGE, DENR, LGU Gazettes), generate 1-click master AI prompts for ChatGPT/Claude, stage &quot;Our Take&quot; briefings, and publish live to the ScoutIt 3D Spatial Radar Map.
          </p>
        </div>
      </div>

      {/* Main Interactive Control Center */}
      <OSINTControlCenter staffEmail={staff.email} />
    </div>
  );
}
