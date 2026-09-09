import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { ShieldAlert, ShieldBan, ShieldCheck, Activity, Radar, DatabaseZap } from "lucide-react";
import SecuritySpatialMap from "@/components/security/SecuritySpatialMap";
import { getDatabaseSecurityReadiness } from "@/lib/databaseSecurityReadiness";

// A7 Phase 1 — Security Center (Ops Manager+). A HUD over the masked-IP
// anomaly log (security_access_logs, populated by the Phase-2 middleware
// guard) and the blocked_access ban list. Raw IPs never exist anywhere in
// this system — only salted hashes (`ip_anon_…`).

async function safe(promise) {
  try {
    const result = await promise;
    if (result.error) throw new Error(result.error.message);
    return { data: result.data ?? [], error: null };
  } catch (err) {
    return { data: [], error: err.message || String(err) };
  }
}

async function fetchLogsResilient(admin, queryGeoFn, queryBaseFn) {
  const res = await safe(queryGeoFn(admin));
  if (res.error && (res.error.includes("city") || res.error.includes("column"))) {
    return safe(queryBaseFn(admin));
  }
  return res;
}

export default async function SecurityCenterPage() {
  const staff = await getCurrentStaff();
  if (!staff || staff.tier < TIERS.OPS_MANAGER) redirect("/dashboard");

  let databaseReadiness = null;
  let databaseReadinessError = null;
  try { databaseReadiness = await getDatabaseSecurityReadiness(); }
  catch (error) { databaseReadinessError = error.message || "Database security evidence failed."; }

  const admin = createAdminClient();
  const since30d = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [flagged, velocity, history30d, blocked] = await Promise.all([
    fetchLogsResilient(
      admin,
      (a) => a.from("security_access_logs").select("id, masked_ip, route_accessed, request_count, is_flagged, flag_reason, last_request_at, city, country, latitude, longitude").eq("is_flagged", true).order("last_request_at", { ascending: false }).limit(50),
      (a) => a.from("security_access_logs").select("id, masked_ip, route_accessed, request_count, is_flagged, flag_reason, last_request_at").eq("is_flagged", true).order("last_request_at", { ascending: false }).limit(50)
    ),
    fetchLogsResilient(
      admin,
      (a) => a.from("security_access_logs").select("id, masked_ip, route_accessed, request_count, is_flagged, last_request_at, city, country, latitude, longitude").order("request_count", { ascending: false }).limit(50),
      (a) => a.from("security_access_logs").select("id, masked_ip, route_accessed, request_count, is_flagged, last_request_at").order("request_count", { ascending: false }).limit(50)
    ),
    fetchLogsResilient(
      admin,
      (a) => a.from("security_access_logs").select("id, masked_ip, route_accessed, request_count, is_flagged, last_request_at, city, country, latitude, longitude").gte("last_request_at", since30d).order("last_request_at", { ascending: false }).limit(1000),
      (a) => a.from("security_access_logs").select("id, masked_ip, route_accessed, request_count, is_flagged, last_request_at").gte("last_request_at", since30d).order("last_request_at", { ascending: false }).limit(1000)
    ),
    safe(
      admin
        .from("blocked_access")
        .select("id, type, value, reason, created_at")
        .eq("type", "ip")
        .order("created_at", { ascending: false })
        .limit(100)
    ),
  ]);

  const blockedSet = new Set(blocked.data.map((b) => b.value));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Radar className="w-5 h-5 text-[#E8AE3C]" />
            Traffic &amp; Access Log
          </h1>
          <p className="text-[12px] uppercase tracking-wide text-white/70 mt-1">
            Masked-session activity · no raw IPs are ever stored
          </p>
        </div>
        <span className="text-xs text-white/70">
          {flagged.data.length} flagged · {blocked.data.length} blocked
        </span>
      </div>

      <section className="rounded-xl border border-white/5 bg-[#121212] p-6" aria-labelledby="database-readiness-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 id="database-readiness-title" className="flex items-center gap-2 text-lg font-medium"><DatabaseZap className="h-4 w-4 text-gold" />Database policy evidence</h2>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-white/70">Fixed read-only evidence from pg_policies, RLS flags, storage.objects, and migration history. This surface cannot execute SQL.</p></div>
          <span className={`rounded-full border px-2.5 py-1 text-xs ${databaseReadiness?.evidence?.ready ? "border-ok/25 bg-ok/10 text-ok" : "border-warn/25 bg-warn/10 text-warn"}`}>{databaseReadiness?.evidence?.ready ? "Verified" : "Evidence required"}</span>
        </div>
        {databaseReadinessError && <p role="alert" className="mt-4 rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">{databaseReadinessError}</p>}
        {!databaseReadinessError && !databaseReadiness?.configuration?.ready && <p className="mt-4 rounded-lg border border-warn/25 bg-warn/10 p-3 text-xs text-white/65">Add the server-only {databaseReadiness?.configuration?.missing.join(", ")} to Mission Control. Service-role credentials cannot inspect system catalogs, so the two master-plan policy checks remain unverified.</p>}
        {databaseReadiness?.evidence && <>
          <dl className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-line bg-black/25 p-3"><dt className="label-mono text-white/70">RLS gaps</dt><dd className="mt-2 text-xl">{databaseReadiness.evidence.missingRls.length}</dd></div>
            <div className="rounded-lg border border-line bg-black/25 p-3"><dt className="label-mono text-white/70">Unsafe policies</dt><dd className="mt-2 text-xl">{databaseReadiness.evidence.unsafePolicies.length}</dd></div>
            <div className="rounded-lg border border-line bg-black/25 p-3"><dt className="label-mono text-white/70">Anonymous photo uploads</dt><dd className="mt-2 text-xl">{databaseReadiness.evidence.anonymousPropertyPhotoUploads.length}</dd></div>
            <div className="rounded-lg border border-line bg-black/25 p-3"><dt className="label-mono text-white/70">Replacement migrations</dt><dd className="mt-2 text-xl">{databaseReadiness.evidence.replacementApplied ? "Present" : "Missing"}</dd></div>
          </dl>
          {!databaseReadiness.evidence.ready && <p role="alert" className="mt-4 text-xs text-warn">Policy evidence is not green. Review the named policies and use an approved, checksum-locked Mission Control migration before human testing.</p>}
        </>}
      </section>

      {/* A-080, owner decision 2026-09-04 — say what this page is, before any number on it.
          The previous copy called this a Security Center and told staff "the ban list below
          already works". Neither was true: the log is product telemetry, and the middleware
          guard that would have read the ban list was deleted because it had never been wired.
          A console that overstates its own reach is the defect A-070 closed elsewhere. */}
      <div className="text-xs leading-5 text-white/80 bg-warn/10 border border-warn/25 rounded-xl p-4">
        <strong className="text-warn">This page reports traffic. It does not block anything.</strong>{" "}
        Rows come from the product telemetry endpoint, so most of them are ordinary anonymous
        visitors, and &ldquo;flagged&rdquo; here means a product event was recorded — not that an
        attack was detected. <strong>Blocking an entry has no effect on the public site:</strong> the
        middleware guard that would have enforced it was never wired up and was removed on
        2026-09-04. Treat this as a usage log until a real security feed exists.
      </div>

      {(flagged.error || velocity.error) && (
        <div className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-xl p-4">
          Traffic log unavailable ({flagged.error || velocity.error}).
        </div>
      )}

      {/* Sentinel Eye Spatial Heatmap & Location Trends */}
      <SecuritySpatialMap
        velocityData={velocity.data}
        flaggedData={flagged.data}
        history30dData={history30d.data}
        blockedHashes={Array.from(blockedSet)}
      />

      {/* Flagged anomalies */}
      <section className="bg-[#121212] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4 text-orange-400" />
          Flagged Anomalies
        </h2>
        {flagged.data.length === 0 ? (
          <p className="text-xs text-white/70">No flagged traffic. Quiet skies.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {flagged.data.map((row) => (
              <TrafficRow key={row.id} row={row} isBlocked={blockedSet.has(row.masked_ip)} />
            ))}
          </div>
        )}
      </section>

      {/* High-velocity traffic */}
      <section className="bg-[#121212] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#E8AE3C]" />
          Highest-Velocity Sources
        </h2>
        {velocity.data.length === 0 ? (
          <p className="text-xs text-white/70">No traffic recorded yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {velocity.data.map((row) => (
              <TrafficRow key={row.id} row={row} isBlocked={blockedSet.has(row.masked_ip)} />
            ))}
          </div>
        )}
      </section>

      {/* Ban list */}
      <section className="bg-[#121212] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
          <ShieldBan className="w-4 h-4 text-red-400" />
          Blocked Access
        </h2>

        {/* A-105, 2026-09-09 — the manual Block form is retired with the
            A-080 enforcement retirement. This section is a read-only log now:
            adding rows to a list nothing reads invites exactly the punitive
            rows below to recur. Do NOT re-add a writer here — re-wiring
            enforcement is a deliberate owner decision, not a form. */}
        {/* LIVE-DATA BOUNDARY: `blocked_access` still holds the two rows that
            banned one visitor for abandoning an inquiry modal. Deleting or
            annotating them is a live-database write with no agent gate — it
            needs the owner through the O-004 lane, not a commit. */}

        {blocked.data.length === 0 ? (
          <p className="text-xs text-white/70">No active blocks.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {blocked.data.map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-2.5 text-sm">
                <ShieldBan className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="font-mono text-xs text-white/80 truncate">{b.value}</span>
                <span className="text-xs text-white/70 truncate flex-1">
                  {b.reason} · {new Date(b.created_at).toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Read-only
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TrafficRow({ row, isBlocked }) {
  return (
    <div className="flex items-center gap-3 py-2.5 text-sm">
      <span className="font-mono text-xs text-white/80 truncate max-w-[200px]">{row.masked_ip}</span>
      <span className="text-xs text-white/70 truncate">{row.route_accessed}</span>
      <span className="text-xs text-[#E8AE3C] font-mono whitespace-nowrap">
        {row.request_count} req
      </span>
      {row.flag_reason && (
        <span className="text-[12px] text-orange-400/80 truncate">{row.flag_reason}</span>
      )}
      <span className="ml-auto text-[12px] text-white/70 whitespace-nowrap">
        {row.last_request_at ? new Date(row.last_request_at).toLocaleString() : "—"}
      </span>
      {isBlocked ? (
        <span className="text-[12px] uppercase tracking-wide text-red-400 border border-red-400/20 bg-red-400/10 rounded-full px-2 py-0.5">
          blocked
        </span>
      ) : (
        <span className="text-[12px] uppercase tracking-wide text-white/70 border border-white/10 rounded-full px-2 py-0.5">
          logged
        </span>
      )}
    </div>
  );
}
