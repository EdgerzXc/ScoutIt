import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { loadBrokers } from "./actions";
import BrokersClient from "./BrokersClient";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BrokersPage() {
  const staff = await getCurrentStaff();
  if (!staff || staff.tier < TIERS.AGENT) {
    redirect("/dashboard?error=Unauthorized");
  }

  const { brokers, error } = await loadBrokers();
  const canMutate = staff.tier >= TIERS.OPS_MANAGER;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="h-6 w-6 text-[#E8AE3C]" />
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
              Broker Directory Administration
            </h1>
          </div>
          <p className="mt-1 text-xs text-white/60">
            A-256 · Manage public advisor profiles in Airtable BROKERS_CMS, takedowns, and PRC compliance.
          </p>
        </div>
      </div>

      <BrokersClient
        initialBrokers={brokers}
        initialError={error}
        canMutate={canMutate}
      />
    </div>
  );
}
