import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { loadPrivacyConsoleData } from "./actions";
import PrivacyClient from "./PrivacyClient";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const staff = await getCurrentStaff();
  if (!staff || staff.mfaRequired || staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=Unauthorized");
  }

  const { deletionLogs, dsrQueue, deletionError, reviewError } = await loadPrivacyConsoleData();

  return (
    <div className="min-w-0 space-y-6 p-2 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-[#E8AE3C]" />
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
              Data Privacy &amp; SLA Oversight
            </h1>
          </div>
          <p className="mt-1 text-xs text-white/60">
            Review data subject requests and check account deletion evidence.
          </p>
        </div>
      </div>

      <PrivacyClient
        initialDeletions={deletionLogs}
        initialDsrQueue={dsrQueue}
        canVerifyClosedAccount={staff.tier >= TIERS.SUPER_ADMIN}
        reviewError={reviewError}
        deletionError={deletionError}
      />
    </div>
  );
}
