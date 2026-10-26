import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { loadPrcProfiles } from "./actions";
import PrcClient from "./PrcClient";
import { Award } from "lucide-react";

export const metadata = {
  title: "PRC Broker Licensing | Mission Control",
};

export default async function PrcPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");

  const { profiles = [] } = await loadPrcProfiles();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-gold" />
            PRC Broker Licensing Console
          </h1>
          <p className="text-sm text-white/60 mt-1">
            RA 9646 regulatory verification queue. Validating licenses enables verified practitioner badges on public directory.
          </p>
        </div>
      </div>

      <PrcClient initialProfiles={profiles} staffTier={staff.tier} />
    </div>
  );
}
