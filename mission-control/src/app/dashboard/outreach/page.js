import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { Compass } from "lucide-react";
import { loadOutreachProspects } from "./actions";
import OutreachClient from "./OutreachClient";

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/auth");
  if (staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const { prospects, source } = await loadOutreachProspects();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-amber-400">
          <Compass className="w-5 h-5 text-gold" />
          <h1 className="font-mono text-xs tracking-[0.12em] uppercase font-bold text-gold">
            Property Outreach CRM &amp; Lead Engine
          </h1>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <p className="text-sm text-neutral-400 max-w-3xl leading-relaxed">
            Ground-truth acquisition pipeline for commercial spaces, buildings, and luxury event
            venues discovered via Google Maps and physical signage. Tracks Replied vs. Non-Replied
            velocity with automated 72-hour aging alerts and 1-click claimable draft listing bridges.
          </p>
          {source === "mock_seed" && (
            <span className="self-start md:self-auto px-2.5 py-1 rounded bg-amber-950/40 border border-amber-600/40 text-xs font-mono text-amber-300">
              STAGED DATASET (O-004 REVIEW)
            </span>
          )}
        </div>
      </header>

      <OutreachClient initialProspects={prospects} staffEmail={staff.email} />
    </div>
  );
}
