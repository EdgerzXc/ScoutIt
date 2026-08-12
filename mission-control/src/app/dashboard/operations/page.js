import { redirect } from "next/navigation";
import { CheckCircle2, CircleAlert, DatabaseZap, FileLock2, RotateCcw, ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import {
  ONBOARDING_MIGRATION,
  ONBOARDING_ROLLBACK_PLAN,
  getOnboardingMigrationStatus,
} from "@/lib/onboardingMigrationOperation";
import OperationApplyForm from "./OperationApplyForm";
import {
  WISHLIST_REVOCATION_MIGRATION,
  WISHLIST_REVOCATION_ROLLBACK_PLAN,
  getWishlistRevocationMigrationStatus,
} from "@/lib/wishlistRevocationMigrationOperation";
import {
  PILOT_COHORT_MIGRATION,
  PILOT_COHORT_ROLLBACK_PLAN,
  getPilotCohortMigrationStatus,
} from "@/lib/pilotCohortMigrationOperation";
import { PILOT_CONFIRMATIONS, loadPilotCohortRegistry } from "@/lib/pilotCohortRegistry";
import PilotCohortRegistryForms from "./PilotCohortRegistryForms";
import SampleDataOperationForms from "./SampleDataOperationForms";
import SampleChildSpaceCleanupForm from "./SampleChildSpaceCleanupForm";
import { SAMPLE_CHILD_SPACE_OPERATION, getSampleChildSpaceOperationStatus } from "@/lib/sampleChildSpaceOperation";
import { SAMPLE_DATA_OPERATION, SAMPLE_PROPERTY_SLUGS, getSampleDataOperationStatus } from "@/lib/sampleDataOperation";
import MediaReviewForms from "./MediaReviewForms";
import { PROPERTY_MEDIA_OPERATION, getPropertyMediaOperationStatus } from "@/lib/propertyMediaOperation";
import LifecycleReconciliationForms from "./LifecycleReconciliationForms";
import { LIFECYCLE_RECONCILIATION_OPERATION, getLifecycleReconciliationStatus } from "@/lib/propertyLifecycleReconciliation";

function Status({ ok, label }) {
  const Icon = ok ? CheckCircle2 : CircleAlert;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${ok
      ? "border-ok/25 bg-ok/10 text-ok" : "border-warn/25 bg-warn/10 text-warn"}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-black/25 p-4">
      <dt className="label-mono text-white/45">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold text-white">{value ?? "—"}</dd>
    </div>
  );
}

export default async function SystemOperationsPage() {
  const staff = await getCurrentStaff();
  if (staff.tier < TIERS.SUPER_ADMIN) redirect("/dashboard?error=InsufficientTier");

  let status = null;
  let statusError = null;
  try { status = await getOnboardingMigrationStatus(); }
  catch (error) { statusError = error.message || "Preflight failed."; }
  let wishlistStatus = null;
  let wishlistStatusError = null;
  try { wishlistStatus = await getWishlistRevocationMigrationStatus(); }
  catch (error) { wishlistStatusError = error.message || "Wishlist revocation preflight failed."; }
  let pilotCohortStatus = null;
  let pilotCohortStatusError = null;
  try { pilotCohortStatus = await getPilotCohortMigrationStatus(); }
  catch (error) { pilotCohortStatusError = error.message || "Pilot cohort registry preflight failed."; }
  let sampleStatus = null;
  let sampleStatusError = null;
  try { sampleStatus = await getSampleDataOperationStatus(); }
  catch (error) { sampleStatusError = error.message || "Airtable sample-data preflight failed."; }
  let childSpaceStatus = null;
  let childSpaceStatusError = null;
  try { childSpaceStatus = await getSampleChildSpaceOperationStatus(); }
  catch (error) { childSpaceStatusError = error.message || "Sample child-space preflight failed."; }
  let mediaStatus = null;
  let mediaStatusError = null;
  try { mediaStatus = await getPropertyMediaOperationStatus(); }
  catch (error) { mediaStatusError = error.message || "Airtable property-media preflight failed."; }
  let lifecycleStatus = null;
  let lifecycleStatusError = null;
  try { lifecycleStatus = await getLifecycleReconciliationStatus(); }
  catch (error) { lifecycleStatusError = error.message || "Public lifecycle reconciliation preflight failed."; }

  const admin = createAdminClient();
  let pilotRegistry = null;
  let pilotRegistryError = null;
  if (pilotCohortStatus?.schema?.state === "applied") {
    try { pilotRegistry = await loadPilotCohortRegistry(admin); }
    catch (error) { pilotRegistryError = error.message || "Pilot cohort registry could not be loaded."; }
  }
  const { data: history } = await admin.from("mission_control_actions")
    .select("id, action, actor_id, reason, metadata, created_at")
    .eq("target_id", ONBOARDING_MIGRATION.id)
    .order("created_at", { ascending: false }).limit(8);

  const schemaState = status?.schema?.state;
  const isApplied = schemaState === "applied";
  const canApply = Boolean(status?.canApply);
  const counts = status?.counts ?? {};

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">System Operations</h1>
          <span className="label-mono rounded border border-gold-muted/60 px-2 py-1 text-gold">Super Admin</span>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-white/55">
          Audited, allowlisted infrastructure changes. This workspace has no SQL editor and accepts
          no uploaded or caller-provided query.
        </p>
      </header>

      {statusError && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{statusError}</div>}
      <section aria-labelledby="sample-data-title" className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-mono text-gold">Human-testing inventory</p>
            <h2 id="sample-data-title" className="mt-2 text-lg font-semibold">Sample-data contract</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Establishes the Airtable checkbox that drives sample labels, noindex metadata,
              sitemap and structured-data exclusion. It never removes the sample listings.
            </p>
          </div>
          <Status ok={Boolean(sampleStatus?.samples?.allMarked)} label={sampleStatus?.samples?.allMarked ? "Protected" : "Action required"} />
        </div>
        {sampleStatusError && <div role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{sampleStatusError}</div>}
        {!sampleStatusError && <>
          <dl className="my-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Field state" value={sampleStatus?.field?.state || "unavailable"} />
            <Metric label="Samples found" value={sampleStatus?.samples?.matched?.length ?? 0} />
            <Metric label="Samples marked" value={sampleStatus?.samples?.marked?.length ?? 0} />
          </dl>
          {sampleStatus?.samples?.missing?.length > 0 && <div role="alert" className="mb-5 rounded-lg border border-danger/25 bg-danger/10 p-4 text-sm text-danger">
            Missing allowlisted slugs: {sampleStatus.samples.missing.join(", ")}. The operation fails closed.
          </div>}
          <SampleDataOperationForms status={sampleStatus} operation={SAMPLE_DATA_OPERATION} />
          <details className="mt-5 rounded-lg border border-line bg-black/25 p-4">
            <summary className="cursor-pointer text-sm font-medium text-white/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">Review the fixed seven-listing allowlist</summary>
            <ul className="mt-4 grid gap-2 font-mono text-xs text-white/55 sm:grid-cols-2">
              {SAMPLE_PROPERTY_SLUGS.map((slug) => <li key={slug}>{slug}</li>)}
            </ul>
          </details>
        </>}
      </section>

      <section aria-labelledby="sample-child-space-title" className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="label-mono text-gold">Hierarchy hygiene</p><h2 id="sample-child-space-title" className="mt-2 text-lg font-semibold">Sample child-space cleanup</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">Reviews Units_JSON only for the fixed seven-property sample allowlist and removes empty or unmistakably placeholder child rows. Authored inventory remains untouched.</p></div>
          <Status ok={Boolean(childSpaceStatus && !childSpaceStatus.invalid.length)} label={childSpaceStatus?.invalid?.length ? `${childSpaceStatus.invalid.length} invalid` : childSpaceStatus ? "Clean" : "Unavailable"} />
        </div>
        {childSpaceStatusError && <div role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{childSpaceStatusError}</div>}
        {childSpaceStatus && <>
          <dl className="my-6 grid gap-3 sm:grid-cols-3"><Metric label="Sample properties" value={childSpaceStatus.records.length} /><Metric label="Invalid child rows" value={childSpaceStatus.invalid.length} /><Metric label="Blocked parses" value={childSpaceStatus.parseErrors.length} /></dl>
          {(childSpaceStatus.missing.length > 0 || childSpaceStatus.duplicates.length > 0 || childSpaceStatus.parseErrors.length > 0) && <div role="alert" className="mb-5 rounded-lg border border-danger/25 bg-danger/10 p-4 text-sm text-danger">The fixed allowlist or Units_JSON contract has drifted. This operation fails closed.</div>}
          {childSpaceStatus.invalid.length > 0 && <div className="mb-6 overflow-x-auto rounded-lg border border-line"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-black/35 text-white/45"><tr><th className="p-3">Property</th><th className="p-3">Current child name</th><th className="p-3">Reason</th><th className="p-3">Child ID</th></tr></thead><tbody className="divide-y divide-line">{childSpaceStatus.invalid.map((entry) => <tr key={`${entry.recordId}:${entry.index}`} className="bg-danger/5 text-danger"><td className="p-3"><span className="block text-white/80">{entry.title}</span><span className="font-mono text-[10px]">{entry.slug}</span></td><td className="p-3">{entry.name || "(empty)"}</td><td className="p-3 font-mono">{entry.reason}</td><td className="p-3 font-mono">{entry.unitId || "none"}</td></tr>)}</tbody></table></div>}
          <SampleChildSpaceCleanupForm status={childSpaceStatus} operation={SAMPLE_CHILD_SPACE_OPERATION} />
        </>}
      </section>

      <section aria-labelledby="media-review-title" className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-mono text-gold">Property trust</p>
            <h2 id="media-review-title" className="mt-2 text-lg font-semibold">Public media-field review</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">Reviews Video, Matterport, Luma, and drone heatmap fields with the same provider rules used by the public renderer.</p>
          </div>
          <Status ok={Boolean(mediaStatus && !mediaStatus.unsafe.length && mediaStatus.retained.length)} label={mediaStatus?.unsafe?.length ? `${mediaStatus.unsafe.length} invalid` : mediaStatus ? "Clean" : "Unavailable"} />
        </div>
        {mediaStatusError && <div role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{mediaStatusError}</div>}
        {mediaStatus && <>
          <dl className="my-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Values reviewed" value={mediaStatus.entries.length} />
            <Metric label="Invalid / misplaced" value={mediaStatus.unsafe.length} />
            <Metric label="Valid to attest" value={mediaStatus.retained.length} />
          </dl>
          {mediaStatus.missingFields.length > 0 && <div role="alert" className="mb-5 rounded-lg border border-danger/25 bg-danger/10 p-4 text-sm text-danger">Missing expected fields: {mediaStatus.missingFields.join(", ")}. The operation fails closed.</div>}
          <div className="mb-6 overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-black/35 text-white/45"><tr><th className="p-3">Property</th><th className="p-3">Field</th><th className="p-3">Classification</th><th className="p-3">Current value</th></tr></thead>
              <tbody className="divide-y divide-line">{mediaStatus.entries.map((entry) => <tr key={`${entry.recordId}:${entry.field}`} className={entry.safe ? "text-white/55" : "bg-danger/5 text-danger"}>
                <td className="p-3"><span className="block text-white/80">{entry.title}</span><span className="font-mono text-[10px]">{entry.slug || entry.recordId}</span></td>
                <td className="p-3 font-mono">{entry.field}</td><td className="p-3">{entry.actualKind} / expected {entry.expectedKind}</td><td className="max-w-md break-all p-3">{entry.value}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <MediaReviewForms status={mediaStatus} operation={PROPERTY_MEDIA_OPERATION} />
        </>}
      </section>
      <section aria-labelledby="lifecycle-review-title" className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="label-mono text-gold">Dual-CMS trust</p><h2 id="lifecycle-review-title" className="mt-2 text-lg font-semibold">Airtable / Supabase public lifecycle reconciliation</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">Compares every Airtable-public slug with its canonical Supabase lifecycle and server-resolved inquiry recipient. Mission Control never invents a missing property or recipient.</p></div>
          <Status ok={Boolean(lifecycleStatus && !lifecycleStatus.issues.length)} label={lifecycleStatus?.issues?.length ? `${lifecycleStatus.issues.length} review` : lifecycleStatus ? "Aligned" : "Unavailable"} />
        </div>
        {lifecycleStatusError && <div role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{lifecycleStatusError}</div>}
        {lifecycleStatus && <><dl className="my-6 grid gap-3 sm:grid-cols-3"><Metric label="Public records" value={lifecycleStatus.candidates.length} /><Metric label="Aligned" value={lifecycleStatus.ready.length} /><Metric label="Need review" value={lifecycleStatus.issues.length} /></dl>
          <LifecycleReconciliationForms issues={lifecycleStatus.issues} operation={LIFECYCLE_RECONCILIATION_OPERATION} />
        </>}
      </section>
      <section aria-labelledby="pilot-cohort-title" className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-mono text-gold">Human-testing identity</p>
            <h2 id="pilot-cohort-title" className="mt-2 text-lg font-semibold">Private pilot cohort registry</h2>
            <p className="mt-1 font-mono text-xs text-white/40">{PILOT_COHORT_MIGRATION.id}</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">Creates two service-role-only tables for cohort windows, verified tester user IDs, roles, offboarding, and account-deletion evidence. It stores no raw temporary email and adds no pilot flags to product tables.</p>
          </div>
          <Status ok={pilotCohortStatus?.schema?.state === "applied" || pilotCohortStatus?.canApply} label={pilotCohortStatus?.schema?.state === "applied" ? "Applied" : pilotCohortStatus?.canApply ? "Ready" : "Blocked"} />
        </div>
        {pilotCohortStatusError && <div role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{pilotCohortStatusError}</div>}
        {!pilotCohortStatusError && <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3"><Status ok={Boolean(pilotCohortStatus?.configuration.ready)} label={pilotCohortStatus?.configuration.ready ? "Management access" : "Credential needed"} /><Status ok={Boolean(pilotCohortStatus?.source.checksumMatches)} label={pilotCohortStatus?.source.checksumMatches ? "Checksum exact" : "Checksum drift"} /><Status ok={Boolean(pilotCohortStatus?.backup?.ready || pilotCohortStatus?.schema?.state === "applied")} label={pilotCohortStatus?.backup?.ready ? "Recovery point current" : pilotCohortStatus?.schema?.state === "applied" ? "Applied" : "Recovery evidence needed"} /></div>
          {!pilotCohortStatus?.configuration.ready && <div className="mt-5 rounded-lg border border-warn/25 bg-warn/10 p-4 text-sm text-white/70"><strong className="text-warn">Owner setup required:</strong> add {pilotCohortStatus?.configuration.missing.join(", ")} as a server-only Mission Control variable.</div>}
          {pilotCohortStatus?.schema?.state === "drift" && <div role="alert" className="mt-5 rounded-lg border border-danger/25 bg-danger/10 p-4 text-sm text-danger">Schema drift detected. This operation fails closed.</div>}
          <details className="mt-5 rounded-lg border border-line bg-black/25 p-4"><summary className="cursor-pointer text-sm font-medium text-white/75">Review recovery evidence</summary><pre className="mt-4 whitespace-pre-wrap text-xs leading-5 text-white/55">{PILOT_COHORT_ROLLBACK_PLAN}</pre></details>
          {pilotCohortStatus?.schema?.state === "applied" ? <div className="mt-5"><p className="text-sm text-ok">The private registry, RLS, client privilege revocation, and trace indexes passed. Every lifecycle write below requires Super Admin, exact confirmation, reason, immutable intent, and post-verification.</p>{pilotRegistryError && <div role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{pilotRegistryError}</div>}{pilotRegistry && <PilotCohortRegistryForms registry={pilotRegistry} confirmations={{ ...PILOT_CONFIRMATIONS }} />}</div>
            : <div className="mt-5"><OperationApplyForm operation="pilotCohort" checksum={PILOT_COHORT_MIGRATION.expectedChecksum} confirmationPhrase={PILOT_COHORT_MIGRATION.confirmationPhrase} disabled={!pilotCohortStatus?.canApply} /></div>}
        </>}
      </section>
      <section aria-labelledby="readiness-title" className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-mono text-gold">Database migration</p>
            <h2 id="readiness-title" className="mt-2 text-lg font-semibold">Onboarding completion contract</h2>
            <p className="mt-1 font-mono text-xs text-white/40">{ONBOARDING_MIGRATION.id}</p>
          </div>
          <Status ok={isApplied || canApply} label={isApplied ? "Applied" : canApply ? "Ready" : "Blocked"} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Status ok={Boolean(status?.configuration.ready)} label={status?.configuration.ready ? "Management access" : "Credential needed"} />
          <Status ok={Boolean(status?.source.checksumMatches)} label={status?.source.checksumMatches ? "Checksum exact" : "Checksum drift"} />
          <Status ok={schemaState === "pending" || isApplied} label={schemaState ? `Schema: ${schemaState}` : "Schema unknown"} />
          <Status ok={Boolean(status?.backup?.ready || isApplied)} label={status?.backup?.ready ? "Recovery point current" : isApplied ? "Applied" : "Recovery evidence needed"} />
        </div>

        {!status?.configuration.ready && (
          <div className="mt-5 rounded-lg border border-warn/25 bg-warn/10 p-4 text-sm text-white/70">
            <strong className="text-warn">Owner setup required:</strong> add the missing server-only
            variable {status?.configuration.missing.join(", ")}. Never place its value in chat or a public-site environment.
          </div>
        )}
        {status?.schema?.state === "drift" && (
          <div className="mt-5 rounded-lg border border-danger/25 bg-danger/10 p-4 text-sm text-danger" role="alert">
            Schema drift detected. The operation fails closed; no migration can be sent until engineering reviews the difference.
          </div>
        )}
      </section>

      <section aria-labelledby="wishlist-revocation-title" className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="label-mono text-gold">Privacy control</p><h2 id="wishlist-revocation-title" className="mt-2 text-lg font-semibold">Wishlist share-link revocation</h2>
            <p className="mt-1 font-mono text-xs text-white/40">{WISHLIST_REVOCATION_MIGRATION.id}</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">Adds a service-role-only revocation watermark so a member can deactivate every previously issued public Board link without storing bearer tokens.</p></div>
          <Status ok={wishlistStatus?.schema?.state === "applied" || wishlistStatus?.canApply} label={wishlistStatus?.schema?.state === "applied" ? "Applied" : wishlistStatus?.canApply ? "Ready" : "Blocked"} />
        </div>
        {wishlistStatusError && <div role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{wishlistStatusError}</div>}
        {!wishlistStatusError && <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3"><Status ok={Boolean(wishlistStatus?.configuration.ready)} label={wishlistStatus?.configuration.ready ? "Management access" : "Credential needed"} /><Status ok={Boolean(wishlistStatus?.source.checksumMatches)} label={wishlistStatus?.source.checksumMatches ? "Checksum exact" : "Checksum drift"} /><Status ok={Boolean(wishlistStatus?.backup?.ready || wishlistStatus?.schema?.state === "applied")} label={wishlistStatus?.backup?.ready ? "Recovery point current" : wishlistStatus?.schema?.state === "applied" ? "Applied" : "Recovery evidence needed"} /></div>
          {wishlistStatus?.schema?.state === "drift" && <div role="alert" className="mt-5 rounded-lg border border-danger/25 bg-danger/10 p-4 text-sm text-danger">Schema drift detected. This operation fails closed.</div>}
          <details className="mt-5 rounded-lg border border-line bg-black/25 p-4"><summary className="cursor-pointer text-sm font-medium text-white/75">Review recovery evidence</summary><pre className="mt-4 whitespace-pre-wrap text-xs leading-5 text-white/55">{WISHLIST_REVOCATION_ROLLBACK_PLAN}</pre></details>
          {wishlistStatus?.schema?.state === "applied" ? <p className="mt-5 text-sm text-ok">The revocation schema, RLS, and privilege checks passed. The control is inactive.</p>
            : <div className="mt-5"><OperationApplyForm operation="wishlistRevocation" checksum={WISHLIST_REVOCATION_MIGRATION.expectedChecksum} confirmationPhrase={WISHLIST_REVOCATION_MIGRATION.confirmationPhrase} disabled={!wishlistStatus?.canApply} /></div>}
        </>}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="impact-title" className="rounded-xl border border-line bg-surface p-6">
          <div className="flex items-center gap-2"><DatabaseZap className="h-4 w-4 text-gold" aria-hidden="true" /><h2 id="impact-title" className="font-semibold">Impact preview</h2></div>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Profiles" value={counts.total_profiles} />
            <Metric label={isApplied ? "Mode backfilled" : "Mode candidates"} value={isApplied ? counts.primary_mode_backfilled : counts.primary_mode_candidates} />
            <Metric label={isApplied ? "Completed" : "Completion candidates"} value={isApplied ? counts.onboarding_completed : counts.completion_candidates} />
            <Metric label="Underage excluded" value={counts.underage_excluded} />
          </dl>
          <p className="mt-4 text-xs leading-5 text-white/45">Adds three nullable columns, restores the one-role contract, and backfills only derivable, age-eligible accounts.</p>
        </section>

        <section aria-labelledby="recovery-title" className="rounded-xl border border-line bg-surface p-6">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" /><h2 id="recovery-title" className="font-semibold">Recovery &amp; privacy evidence</h2></div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-line pb-3"><dt className="text-white/50">Latest recovery point</dt><dd className="text-right text-white/80">{status?.backup?.latestBackup?.inserted_at || status?.backup?.pitrAt || "Unavailable"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-line pb-3"><dt className="text-white/50">PITR</dt><dd>{status?.backup?.pitrEnabled ? "Enabled" : "Not reported"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-white/50">Private fields in public views</dt><dd>{status?.privacySafe === true ? "None detected" : status?.privacySafe === false ? "Exposure detected" : "Not checked"}</dd></div>
          </dl>
          <details className="mt-5 rounded-lg border border-line bg-black/25 p-4">
            <summary className="cursor-pointer text-sm font-medium text-white/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">View rollback evidence</summary>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-white/55">{ONBOARDING_ROLLBACK_PLAN}</pre>
          </details>
        </section>
      </div>

      <section aria-labelledby="execution-title" className="rounded-xl border border-gold-muted/50 bg-surface p-6">
        <div className="flex items-center gap-2"><FileLock2 className="h-4 w-4 text-gold" aria-hidden="true" /><h2 id="execution-title" className="font-semibold">Execution</h2></div>
        {isApplied ? <p className="mt-4 text-sm text-ok">The approved schema and privacy checks are present. This control is permanently inactive for the applied state.</p>
          : <div className="mt-5"><OperationApplyForm checksum={ONBOARDING_MIGRATION.expectedChecksum} confirmationPhrase={ONBOARDING_MIGRATION.confirmationPhrase} disabled={!canApply} /></div>}
        <details className="mt-5 border-t border-line pt-4">
          <summary className="cursor-pointer text-xs font-medium text-white/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">Review immutable checksum</summary>
          <code className="mt-3 block break-all rounded bg-black/30 p-3 text-xs text-white/65">SHA-256 {status?.source.checksum || ONBOARDING_MIGRATION.expectedChecksum}</code>
        </details>
      </section>

      <section aria-labelledby="history-title" className="rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-gold" aria-hidden="true" /><h2 id="history-title" className="font-semibold">Operation history</h2></div>
        <div className="mt-4 divide-y divide-line">
          {(history ?? []).length ? history.map((event) => (
            <div key={event.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[13rem_1fr_auto] sm:gap-4">
              <span className="font-mono text-xs text-gold">{event.action}</span><span className="text-white/55">{event.reason || "No reason recorded"}</span><time className="text-xs text-white/35">{new Date(event.created_at).toLocaleString()}</time>
            </div>
          )) : <p className="py-4 text-sm text-white/45">No attempts recorded.</p>}
        </div>
      </section>
    </div>
  );
}
