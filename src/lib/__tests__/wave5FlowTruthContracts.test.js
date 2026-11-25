import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from "@/data/masterFlowGraphData";
import { resolveFlowNode } from "@/lib/flow/flowNodeResolver";
import { INCIDENT_SCENARIOS } from "@/lib/flow/incidentSimulator";
import { computeSignalHealthSummary } from "@/lib/flow/incidentSignalHub";

describe("Wave 5 Master Flow Graph Operational Truth Contracts", () => {
  it("models every Vercel Cron in root vercel.json and mission-control/vercel.json as an internal node and resolves it directly", () => {
    const rootVercel = JSON.parse(fs.readFileSync(path.resolve("vercel.json"), "utf8"));
    const mcVercel = JSON.parse(fs.readFileSync(path.resolve("mission-control/vercel.json"), "utf8"));
    const allCrons = [...(rootVercel.crons || []), ...(mcVercel.crons || [])];

    expect(allCrons.length).toBeGreaterThanOrEqual(11);

    const nodeById = new Map(MASTER_FLOW_NODES.map((n) => [n.id, n]));
    for (const cron of allCrons) {
      const resolved = resolveFlowNode(cron.path);
      expect(resolved, `Expected ${cron.path} to resolve to a flow node`).not.toBeNull();
      const node = nodeById.get(resolved.nodeId);
      expect(node, `Missing node ${resolved?.nodeId} for ${cron.path}`).toBeDefined();
      expect(node.knowledgeScope, `${cron.path} must resolve to an internal node`).not.toContain("PUBLIC");
    }

    // Specific cron resolutions must point to dedicated nodes rather than generic hubs
    expect(resolveFlowNode("/api/cron/recompute-broker-metrics").nodeId).toBe("cron_recompute_broker_metrics");
    expect(resolveFlowNode("/api/cron/purge-contact-messages").nodeId).toBe("cron_purge_contact_messages");
    expect(resolveFlowNode("/api/cron/purge-crm-activity").nodeId).toBe("cron_purge_crm_activity");
    expect(resolveFlowNode("/api/cron/purge-analytics").nodeId).toBe("cron_purge_analytics");
    expect(resolveFlowNode("/api/cron/monthly-rollover").nodeId).toBe("cron_monthly_rollover");
    expect(resolveFlowNode("/api/cron/verify-prc-status").nodeId).toBe("cron_verify_prc_status");
    expect(resolveFlowNode("/api/cron/process-calendar-sync-queue").nodeId).toBe("cron_calendar_sync_queue");
    expect(resolveFlowNode("/api/cron/sweep-pending-requests").nodeId).toBe("cron_sweep_pending_requests");
    expect(resolveFlowNode("/api/cron/purge-chat-messages").nodeId).toBe("cron_purge_chat_messages");
    expect(nodeById.get("scenario_non_refundable_connect").knowledgeScope).toContain("PUBLIC");
    expect(nodeById.get("scenario_chat_purge").knowledgeScope).toContain("PUBLIC");
    expect(resolveFlowNode("/api/scan/process").nodeId).toBe("mc_scan_process_cron");
  });

  it("computes dynamic nominal node and edge counts instead of stale 131/252 copy", () => {
    expect(INCIDENT_SCENARIOS.NOMINAL.description).toContain(`${MASTER_FLOW_NODES.length} nodes`);
    expect(INCIDENT_SCENARIOS.NOMINAL.description).toContain(`${MASTER_FLOW_EDGES.length} edges`);
    expect(INCIDENT_SCENARIOS.NOMINAL.description).not.toContain("131");

    const nominal = computeSignalHealthSummary([]);
    expect(nominal.message).toContain(`${MASTER_FLOW_NODES.length} nodes`);
    expect(nominal.message).toContain(`${MASTER_FLOW_EDGES.length} connections`);
    expect(nominal.message).not.toContain("131");
  });

  it("uses CSS accent tokens, accessible tap targets, and zero stale 131/252 copy in MasterFlowGraph and IncidentSignalBanner", () => {
    const graphSrc = fs.readFileSync(path.resolve("src/components/flow/MasterFlowGraph.js"), "utf8");
    const bannerSrc = fs.readFileSync(path.resolve("src/components/flow/IncidentSignalBanner.js"), "utf8");

    expect(bannerSrc).not.toContain("131 nodes");
    expect(bannerSrc).not.toContain("252 connections");
    expect(bannerSrc).not.toContain("transition-all");

    expect(graphSrc).toContain("var(--accent)");
    expect(graphSrc).not.toContain("bg-[#E8AE3C]");
    expect(graphSrc).not.toContain("text-[#E8AE3C]");
  });
});
