import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/rbac";
import MfaClient from "./MfaClient";

export const metadata = {
  title: "Staff MFA Assurance | Mission Control",
};

export default async function StaffMfaPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");

  const posture = {
    email: staff.email,
    displayName: staff.display_name,
    tier: staff.tier,
    isFinance: staff.is_finance,
    aal: staff.aal || "aal1",
    nextAal: staff.nextAal || "aal1",
    mfaRequired: Boolean(staff.mfaRequired),
    enrolledMfa: Boolean(staff.enrolledMfa),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Security & Multi-Factor Access</h1>
        <p className="text-sm text-white/60">
          Authenticator Assurance Level 2 (AAL2) posture, TOTP enrollment, and identity verification.
        </p>
      </div>

      <MfaClient initialPosture={posture} />
    </div>
  );
}
