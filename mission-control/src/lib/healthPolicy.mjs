/**
 * Pure policy rules for Unified System Health Status Panel (A-265).
 * Zero I/O, no server-only imports, 100% testable.
 */

export const HEALTH_STATUS = Object.freeze({
  OPERATIONAL: "operational",
  DEGRADED: "degraded",
  OUTAGE: "outage",
  CONFIG_MISSING: "config_missing",
});

/**
 * Returns a performance grade string for a latency measurement in ms.
 * @param {number} latencyMs
 * @returns {"optimal" | "acceptable" | "degraded" | "unresponsive"}
 */
export function getLatencyGrade(latencyMs) {
  if (typeof latencyMs !== "number" || latencyMs < 0) return "unresponsive";
  if (latencyMs < 250) return "optimal";
  if (latencyMs < 800) return "acceptable";
  if (latencyMs < 2000) return "degraded";
  return "unresponsive";
}

/**
 * Evaluates composite system posture from individual subsystem probes.
 *
 * @param {Array<{ key: string, status: string, latencyMs?: number }>} probes
 * @param {number} [cronFailures24h=0]
 * @returns {{ overall: "operational" | "degraded" | "outage", summary: string }}
 */
export function evaluateCompositeHealth(probes = [], cronFailures24h = 0) {
  const isAnyDown = probes.some((p) => p.status === HEALTH_STATUS.OUTAGE);
  const isAnyDegraded = probes.some(
    (p) => p.status === HEALTH_STATUS.DEGRADED || (p.latencyMs && p.latencyMs > 1500)
  );

  if (isAnyDown) {
    return {
      overall: HEALTH_STATUS.OUTAGE,
      summary: "Critical subsystem failure detected. Immediate on-call triage required.",
    };
  }

  if (isAnyDegraded || cronFailures24h > 0) {
    return {
      overall: HEALTH_STATUS.DEGRADED,
      summary: cronFailures24h > 0
        ? `System operational with ${cronFailures24h} background job failure(s) in the past 24 hours.`
        : "Elevated latency or degraded performance observed across external dependencies.",
    };
  }

  return {
    overall: HEALTH_STATUS.OPERATIONAL,
    summary: "All infrastructure subsystems reporting normal latency and zero job failures.",
  };
}
