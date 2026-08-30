import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { ScrollText, ShieldAlert, FileText, AlertTriangle, Gavel } from "lucide-react";

import { loadClaimQueue } from "./actions";
import ClaimDecisionForm from "@/components/claims/ClaimDecisionForm";
import {
  RELATIONSHIP_LABELS,
  describeConflict,
} from "@/lib/propertyClaimPolicy.mjs";

// Ownership claims — the queue that did not exist.
//
// `property_claims` shipped with `reviewer_id` and `decision_reason_code` and
// nothing ever wrote to them. Somebody could assert they own a property another
// person listed, and no surface in either app could answer. This is the answer.

export const dynamic = "force-dynamic";

const CONFLICT_STYLE = {
  direct: "text-red-300 border-red-400/30 bg-red-400/10",
  differs: "text-[#F7C64E] border-[rgba(232,174,60,0.3)] bg-[rgba(232,174,60,0.08)]",
  expected: "text-white/70 border-white/10 bg-white/5",
  unknown: "text-white/70 border-white/10 bg-white/5",
};

export default async function ClaimsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const { claims, error } = await loadClaimQueue();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Gavel className="w-5 h-5 text-[#E8AE3C]" />
          Ownership Claims
        </h1>
        <p className="text-sm text-white/60 mt-1 max-w-3xl">
          Someone asserting they own — or are authorised to market — a property another person
          listed. Approving a claim moves the listing to them, so approval is Super Admin and needs
          a written reason. Everything else here is Ops Manager.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          Could not read the claims queue: {error}
        </div>
      )}

      {claims.length === 0 && !error ? (
        <div className="bg-[#121212] border border-white/5 rounded-xl p-8 text-center text-sm text-white/70 flex flex-col items-center gap-2">
          <ScrollText className="w-5 h-5 text-white/70" />
          No open claims. Anything filed from a property page appears here the moment it is
          submitted.
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const conflict = describeConflict({
              listerRelationship: claim.property?.lister_relationship,
              claimedRelationship: claim.claimed_relationship,
            });
            const unscanned = claim.documents.filter(
              (d) => d.malware_scan_status !== "clean"
            ).length;

            return (
              <section
                key={claim.id}
                className="bg-[#121212] border border-white/5 rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-medium text-white/90">
                      {claim.property?.title || "A property that no longer exists"}
                    </h2>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-white/60">
                      {claim.property?.location && <span>{claim.property.location}</span>}
                      {claim.property?.slug && (
                        <span className="font-mono">{claim.property.slug}</span>
                      )}
                      <span>filed {new Date(claim.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-[12px] uppercase tracking-wide border border-white/10 bg-white/5 rounded-full px-2 py-0.5 text-white/70">
                    {claim.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* The comparison the decision turns on. */}
                <div className={`text-xs rounded-lg border p-3 ${CONFLICT_STYLE[conflict.level]}`}>
                  <div className="flex items-start gap-2">
                    {conflict.level === "direct" ? (
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p>{conflict.text}</p>
                      <p className="mt-1.5 text-white/60">
                        Claimant asserts:{" "}
                        <span className="text-white/80">
                          {RELATIONSHIP_LABELS[claim.claimed_relationship] ||
                            claim.claimed_relationship}
                        </span>
                        {claim.property?.owner_id && (
                          <>
                            {" · "}currently held by{" "}
                            <span className="font-mono text-white/80">
                              {claim.property.owner_id}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evidence */}
                <div>
                  <h3 className="text-[12px] uppercase tracking-wide text-white/70 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Documents ({claim.documents.length})
                  </h3>
                  {claim.documents.length === 0 ? (
                    <p className="text-xs text-white/60">
                      Nothing attached. A claim with no evidence is not a reason to reject it out of
                      hand — ask for what is missing.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {claim.documents.map((d) => (
                        <li
                          key={d.id}
                          className="text-xs text-white/70 flex flex-wrap items-center gap-x-3 gap-y-1"
                        >
                          <span className="text-white/85">{d.original_filename}</span>
                          <span className="font-mono text-[12px]">{d.document_type}</span>
                          <span
                            className={
                              d.malware_scan_status === "clean"
                                ? "text-white/60"
                                : "text-red-300"
                            }
                          >
                            scan: {d.malware_scan_status || "unknown"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {unscanned > 0 && (
                    <p className="text-xs text-red-300 mt-2">
                      {unscanned} document{unscanned === 1 ? "" : "s"} not confirmed clean. Do not
                      open them.
                    </p>
                  )}
                </div>

                {/* What has happened so far */}
                {claim.events.length > 0 && (
                  <details>
                    <summary className="text-[12px] text-white/60 hover:text-white/80 cursor-pointer select-none">
                      History ({claim.events.length})
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {claim.events.map((e) => (
                        <li key={e.id} className="text-xs text-white/70">
                          <span className="font-mono text-[12px] text-white/60">
                            {new Date(e.created_at).toLocaleString()}
                          </span>{" "}
                          {e.event_type}
                          {e.payload?.note ? ` — ${e.payload.note}` : ""}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                <ClaimDecisionForm
                  claimId={claim.id}
                  status={claim.status}
                  canApprove={staff.tier >= TIERS.SUPER_ADMIN}
                />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
