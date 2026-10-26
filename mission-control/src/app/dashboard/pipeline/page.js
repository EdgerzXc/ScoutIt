import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { loadPipelineData } from "./actions";
import PipelineClient from "./PipelineClient";
import { TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const staff = await getCurrentStaff();
  if (!staff || staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=Unauthorized");
  }

  const { waitlist, viewings, contacts, bounties, errors } = await loadPipelineData();

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-6 w-6 text-[#E8AE3C]" />
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
              Operational Pipeline Demand
            </h1>
          </div>
          <p className="mt-1 text-xs text-white/60">
            A-261 · Operational oversight across Founding Waitlist, viewing bookings, inbound leads, and QuestIT bounties.
          </p>
        </div>
      </div>

      <PipelineClient
        initialWaitlist={waitlist}
        initialViewings={viewings}
        initialContacts={contacts}
        initialBounties={bounties}
        errors={errors}
      />
    </div>
  );
}
