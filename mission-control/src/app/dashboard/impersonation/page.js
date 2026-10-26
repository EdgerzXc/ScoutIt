import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import ImpersonationClient from "./ImpersonationClient";
import { UserCheck } from "lucide-react";

export const metadata = {
  title: "Read-Only Impersonation | Mission Control",
};

export default async function ImpersonationPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");
  if (staff.tier < TIERS.SUPER_ADMIN) {
    redirect("/dashboard?error=InsufficientTier");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-gold" />
            Read-Only Impersonation Console
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Time-boxed &ldquo;View-As-User&rdquo; debugging environment for Tier 3 Super Admins (Spec §7).
          </p>
        </div>
      </div>

      <ImpersonationClient staffTier={staff.tier} />
    </div>
  );
}
