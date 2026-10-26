import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import WalletClient from "./WalletClient";
import { Coins } from "lucide-react";

export const metadata = {
  title: "Connects Wallet & Ledger | Mission Control",
};

export default async function WalletPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-gold" />
            Connects Wallet &amp; Ledger
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Account ledger lookup, balance auditing, and system-error refund processing (§38.3).
          </p>
        </div>
      </div>

      <WalletClient staffTier={staff.tier} />
    </div>
  );
}
