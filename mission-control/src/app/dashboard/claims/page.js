import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import {
  ScrollText,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Gavel,
  ExternalLink,
  ShieldCheck,
  User,
  Eye,
  Search,
  Landmark,
  Award,
  Building2,
  MapPin,
} from "lucide-react";

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
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base font-semibold text-white/95">
                        {claim.property?.title || "A property that no longer exists"}
                      </h2>
                      {claim.property?.publicUrl && (
                        <a
                          href={claim.property.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider bg-[rgba(232,174,60,0.12)] hover:bg-[rgba(232,174,60,0.22)] text-[#F7C64E] border border-[rgba(232,174,60,0.3)] transition-colors"
                          title="Open public listing dossier on ScoutIt in a new tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Public Dossier
                        </a>
                      )}
                      <Link
                        href="/dashboard/verification"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors"
                        title="Inspect internal verification queue"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Verification Intel
                      </Link>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-white/60">
                      {claim.property?.location && <span>{claim.property.location}</span>}
                      {claim.property?.slug && (
                        <span className="font-mono text-white/40">{claim.property.slug}</span>
                      )}
                      <span>filed {new Date(claim.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-[12px] uppercase tracking-wide border border-white/10 bg-white/5 rounded-full px-2.5 py-1 text-white/70">
                    {claim.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Claimant profile summary */}
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-white/40 shrink-0" />
                    <div>
                      <span className="text-white/90 font-medium">
                        {claim.claimant?.full_name || `User ID: ${claim.claimant_user_id.slice(0, 8)}...`}
                      </span>
                      {claim.claimant?.email && (
                        <span className="text-white/50 ml-2 font-mono">({claim.claimant.email})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="uppercase text-[#F7C64E] bg-[rgba(232,174,60,0.1)] px-2 py-0.5 rounded border border-[rgba(232,174,60,0.25)]">
                      {claim.claimant?.subscription_tier || "STARRY"} PLAN
                    </span>
                    <span className="uppercase text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {claim.claimant?.role || "SEEKER"}
                    </span>
                  </div>
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

                {/* Evidence & Document Inspector */}
                <div>
                  <h3 className="text-[12px] uppercase tracking-wide text-white/70 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#E8AE3C]" />
                    Documents &amp; Verification Evidence ({claim.documents.length})
                  </h3>
                  {claim.documents.length === 0 ? (
                    <p className="text-xs text-white/60">
                      Nothing attached. A claim with no evidence is not a reason to reject it out of
                      hand — ask for what is missing using &ldquo;Request Information&rdquo;.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {claim.documents.map((d) => (
                        <li
                          key={d.id}
                          className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-[#E8AE3C] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-white/90 truncate">{d.original_filename}</p>
                              <p className="text-[11px] font-mono text-white/50 uppercase">
                                {d.document_type.replace(/_/g, " ")}{" "}
                                {d.file_size_bytes ? `· ${(d.file_size_bytes / 1024).toFixed(0)} KB` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                                d.malware_scan_status === "clean"
                                  ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                                  : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                              }`}
                            >
                              scan: {d.malware_scan_status || "unknown"}
                            </span>
                            {d.previewUrl ? (
                              <a
                                href={d.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F7C64E] hover:bg-[#E8AE3C] text-black font-semibold text-[11px] tracking-wider uppercase transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                Inspect Document
                              </a>
                            ) : (
                              <span className="text-[11px] text-white/40 italic">File on secure record</span>
                            )}
                          </div>
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

                {/* Staff Fast-Verification Toolbelt */}
                <div className="border border-white/5 rounded-lg p-3 bg-white/[0.015] space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-[#E8AE3C]" />
                    Staff Fast-Verification Toolbelt
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <a
                      href="https://online.lra.gov.ph"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
                      title="Verify land or condo title against Land Registration Authority registry"
                    >
                      <Landmark className="w-3.5 h-3.5 text-blue-400" />
                      LRA eTitle Portal
                      <ExternalLink className="w-2.5 h-2.5 text-white/40" />
                    </a>
                    <Link
                      href="/dashboard/prc"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
                      title="Look up broker PRC license in Mission Control"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      PRC Broker Console
                    </Link>
                    <a
                      href="https://online.prc.gov.ph/Verification"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
                      title="Official PRC verification portal"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      PRC Govt Portal
                    </a>
                    <a
                      href="https://checkwithsec.sec.gov.ph"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
                      title="Verify corporate registration for company-owned property"
                    >
                      <Building2 className="w-3.5 h-3.5 text-purple-400" />
                      SEC Company Registry
                      <ExternalLink className="w-2.5 h-2.5 text-white/40" />
                    </a>
                    {claim.property?.location && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(claim.property.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
                        title="Inspect location & satellite facade on Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        Satellite / Map
                        <ExternalLink className="w-2.5 h-2.5 text-white/40" />
                      </a>
                    )}
                  </div>
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
