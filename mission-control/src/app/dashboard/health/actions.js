"use server";

import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  HEALTH_STATUS,
  getLatencyGrade,
  evaluateCompositeHealth,
} from "@/lib/healthPolicy.mjs";

export async function probeAllSubsystems() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const probes = [];

  // 1. Supabase Database Probe
  const admin = createAdminClient();
  const sbStart = Date.now();
  try {
    const { error: sbErr } = await admin
      .from("admin_users")
      .select("id", { count: "exact", head: true })
      .limit(1);

    const sbLatency = Date.now() - sbStart;
    probes.push({
      key: "supabase",
      name: "Supabase Postgres & Auth",
      role: "Private user submissions & IAM database",
      status: sbErr ? HEALTH_STATUS.DEGRADED : HEALTH_STATUS.OPERATIONAL,
      latencyMs: sbLatency,
      grade: getLatencyGrade(sbLatency),
      error: sbErr?.message || null,
    });
  } catch (err) {
    probes.push({
      key: "supabase",
      name: "Supabase Postgres & Auth",
      role: "Private user submissions & IAM database",
      status: HEALTH_STATUS.OUTAGE,
      latencyMs: Date.now() - sbStart,
      grade: "unresponsive",
      error: err.message,
    });
  }

  // 2. Airtable Public CMS Probe
  const airtableKey = process.env.AIRTABLE_API_KEY;
  const airtableBase = process.env.AIRTABLE_BASE_ID;
  if (!airtableKey || !airtableBase) {
    probes.push({
      key: "airtable",
      name: "Airtable PROPERTIES_CMS",
      role: "Public read-only property directory",
      status: HEALTH_STATUS.CONFIG_MISSING,
      latencyMs: 0,
      grade: "unresponsive",
      error: "AIRTABLE_API_KEY or AIRTABLE_BASE_ID not configured.",
    });
  } else {
    const atStart = Date.now();
    try {
      const atRes = await fetch(
        `https://api.airtable.com/v0/${airtableBase}/PROPERTIES_CMS?maxRecords=1`,
        {
          headers: { Authorization: `Bearer ${airtableKey}` },
          signal: AbortSignal.timeout(4000),
        }
      );
      const atLatency = Date.now() - atStart;
      const rateLimitRemaining = atRes.headers.get("x-ratelimit-remaining");

      probes.push({
        key: "airtable",
        name: "Airtable PROPERTIES_CMS",
        role: "Public read-only property directory",
        status: atRes.ok ? HEALTH_STATUS.OPERATIONAL : HEALTH_STATUS.DEGRADED,
        latencyMs: atLatency,
        grade: getLatencyGrade(atLatency),
        rateLimitRemaining: rateLimitRemaining ? Number(rateLimitRemaining) : null,
        error: atRes.ok ? null : `HTTP ${atRes.status}`,
      });
    } catch (atErr) {
      probes.push({
        key: "airtable",
        name: "Airtable PROPERTIES_CMS",
        role: "Public read-only property directory",
        status: HEALTH_STATUS.DEGRADED,
        latencyMs: Date.now() - atStart,
        grade: "unresponsive",
        error: atErr.message,
      });
    }
  }

  // 3. Upstash Redis Cache Probe
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    probes.push({
      key: "upstash",
      name: "Upstash Redis Cache",
      role: "Global Edge catalogue & quota caching",
      status: HEALTH_STATUS.CONFIG_MISSING,
      latencyMs: 0,
      grade: "unresponsive",
      error: "UPSTASH_REDIS_REST_URL not configured.",
    });
  } else {
    const rdStart = Date.now();
    try {
      const rdRes = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        signal: AbortSignal.timeout(3000),
      });
      const rdLatency = Date.now() - rdStart;
      probes.push({
        key: "upstash",
        name: "Upstash Redis Cache",
        role: "Global Edge catalogue & quota caching",
        status: rdRes.ok ? HEALTH_STATUS.OPERATIONAL : HEALTH_STATUS.DEGRADED,
        latencyMs: rdLatency,
        grade: getLatencyGrade(rdLatency),
        error: rdRes.ok ? null : `HTTP ${rdRes.status}`,
      });
    } catch (rdErr) {
      probes.push({
        key: "upstash",
        name: "Upstash Redis Cache",
        role: "Global Edge catalogue & quota caching",
        status: HEALTH_STATUS.DEGRADED,
        latencyMs: Date.now() - rdStart,
        grade: "unresponsive",
        error: rdErr.message,
      });
    }
  }

  // 4. Mapbox Geocoding & Tiles Probe
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    probes.push({
      key: "mapbox",
      name: "Mapbox Geocoding & Spatial Tiles",
      role: "Geographic positioning & 3D maps",
      status: HEALTH_STATUS.CONFIG_MISSING,
      latencyMs: 0,
      grade: "unresponsive",
      error: "Mapbox token not configured.",
    });
  } else {
    const mbStart = Date.now();
    try {
      const mbRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/Taguig.json?access_token=${mapboxToken}&limit=1`,
        { signal: AbortSignal.timeout(3000) }
      );
      const mbLatency = Date.now() - mbStart;
      probes.push({
        key: "mapbox",
        name: "Mapbox Geocoding & Spatial Tiles",
        role: "Geographic positioning & 3D maps",
        status: mbRes.ok ? HEALTH_STATUS.OPERATIONAL : HEALTH_STATUS.DEGRADED,
        latencyMs: mbLatency,
        grade: getLatencyGrade(mbLatency),
        error: mbRes.ok ? null : `HTTP ${mbRes.status}`,
      });
    } catch (mbErr) {
      probes.push({
        key: "mapbox",
        name: "Mapbox Geocoding & Spatial Tiles",
        role: "Geographic positioning & 3D maps",
        status: HEALTH_STATUS.DEGRADED,
        latencyMs: Date.now() - mbStart,
        grade: "unresponsive",
        error: mbErr.message,
      });
    }
  }

  // 5. Cron & Scheduled Workers Telemetry
  let cronRuns24h = 0;
  let cronFailures24h = 0;
  let recentCrons = [];
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cronEvents } = await admin
      .from("system_events")
      .select("id, event, source, severity, summary, occurred_at")
      .gte("occurred_at", oneDayAgo)
      .ilike("event", "%cron%")
      .order("occurred_at", { ascending: false })
      .limit(20);

    if (cronEvents) {
      cronRuns24h = cronEvents.length;
      cronFailures24h = cronEvents.filter((e) => e.severity === "error" || e.severity === "warning").length;
      recentCrons = cronEvents.slice(0, 5);
    }
  } catch (_cronErr) {
    // Non-blocking
  }

  const composite = evaluateCompositeHealth(probes, cronFailures24h);

  return {
    checkedAt: new Date().toISOString(),
    composite,
    probes,
    cronTelemetry: {
      runs24h: cronRuns24h,
      failures24h: cronFailures24h,
      recentCrons,
    },
  };
}

export async function runDiagnosticHealthCheck() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const report = await probeAllSubsystems();

  await logActionStrict({
    staff,
    action: "STAFF_SYSTEM_HEALTH_DIAGNOSTIC",
    targetTable: "system_events",
    targetId: staff.id,
    reason: `System health probe executed: ${report.composite.overall.toUpperCase()}`,
    metadata: {
      composite_status: report.composite.overall,
      probe_count: report.probes.length,
      cron_failures: report.cronTelemetry.failures24h,
    },
  });

  return report;
}
