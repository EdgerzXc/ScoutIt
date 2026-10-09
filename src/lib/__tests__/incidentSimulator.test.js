import { describe, it, expect } from "vitest";
import {
  INCIDENT_SCENARIOS,
  calculateBlastRadius,
  getNodeHealthStatus,
  getIncidentDossier
} from "@/lib/flow/incidentSimulator";
import { MASTER_FLOW_NODES } from "@/data/masterFlowGraphData";

describe("incidentSimulator", () => {
  const nodeMap = new Map(MASTER_FLOW_NODES.map(n => [n.id, n]));

  describe("INCIDENT_SCENARIOS", () => {
    it("defines valid scenarios where all faultedNodeIds exist in MASTER_FLOW_NODES", () => {
      expect(INCIDENT_SCENARIOS.NOMINAL).toBeDefined();
      expect(INCIDENT_SCENARIOS.CMS_BRIDGE_OUTAGE).toBeDefined();
      expect(INCIDENT_SCENARIOS.AUTH_SESSION_QUARANTINE).toBeDefined();
      expect(INCIDENT_SCENARIOS.CONNECTS_DEPLETED).toBeDefined();

      Object.values(INCIDENT_SCENARIOS).forEach(scenario => {
        expect(scenario.id).toBeDefined();
        expect(scenario.name).toBeDefined();
        expect(scenario.severity).toBeDefined();
        expect(scenario.description).toBeDefined();

        scenario.faultedNodeIds.forEach(id => {
          expect(nodeMap.has(id), `Node ID ${id} in scenario ${scenario.id} must exist in MASTER_FLOW_NODES`).toBe(true);
        });
      });
    });

    it("NOMINAL scenario has zero faulted nodes", () => {
      expect(INCIDENT_SCENARIOS.NOMINAL.faultedNodeIds).toEqual([]);
    });
  });

  describe("calculateBlastRadius", () => {
    it("returns empty result for empty faultedNodeIds", () => {
      const radius = calculateBlastRadius([], nodeMap);
      expect(radius.faultedNodeIds).toEqual([]);
      expect(radius.impactedNodeIds).toEqual([]);
      expect(radius.totalAffectedCount).toBe(0);
      expect(radius.blastRadiusSet.size).toBe(0);
      expect(radius.severedEdgeSet.size).toBe(0);
    });

    it("correctly traverses downstream children from a faulted node", () => {
      const radius = calculateBlastRadius(["exc_bot_quarantine"], nodeMap);
      expect(radius.faultedNodeIds).toEqual(["exc_bot_quarantine"]);
      // exc_bot_quarantine children are rec_turnstile_challenge and terminal_edge_blacklist
      expect(radius.impactedNodeIds).toContain("rec_turnstile_challenge");
      expect(radius.impactedNodeIds).toContain("terminal_edge_blacklist");
      expect(radius.blastRadiusSet.has("exc_bot_quarantine")).toBe(true);
      expect(radius.blastRadiusSet.has("rec_turnstile_challenge")).toBe(true);
      expect(radius.depthMap["exc_bot_quarantine"]).toBe(0);
      expect(radius.depthMap["rec_turnstile_challenge"]).toBe(1);
      expect(radius.severedEdgeSet.has("exc_bot_quarantine→rec_turnstile_challenge")).toBe(true);
    });

    it("captures severed roles and terminals across the cascade", () => {
      const radius = calculateBlastRadius(["exc_insufficient_connects"], nodeMap);
      expect(radius.severedRoles).toContain("seeker");
      expect(radius.totalAffectedCount).toBeGreaterThan(1);
    });

    it("handles multiple concurrent faulted nodes", () => {
      const radius = calculateBlastRadius(["exc_bot_quarantine", "exc_slot_conflict"], nodeMap);
      expect(radius.faultedNodeIds).toHaveLength(2);
      expect(radius.blastRadiusSet.has("exc_bot_quarantine")).toBe(true);
      expect(radius.blastRadiusSet.has("exc_slot_conflict")).toBe(true);
      expect(radius.blastRadiusSet.has("rec_propose_alt_slot")).toBe(true);
      expect(radius.blastRadiusSet.has("rec_turnstile_challenge")).toBe(true);
    });

    it("ignores unknown or nonexistent node IDs gracefully", () => {
      const radius = calculateBlastRadius(["non_existent_node_xyz"], nodeMap);
      expect(radius.faultedNodeIds).toEqual([]);
      expect(radius.totalAffectedCount).toBe(0);
    });
  });

  describe("getNodeHealthStatus", () => {
    it("returns FAULTED for nodes in the root faulted set", () => {
      const faultedSet = new Set(["node_a"]);
      const blastSet = new Set(["node_a", "node_b"]);
      expect(getNodeHealthStatus("node_a", faultedSet, blastSet)).toBe("FAULTED");
    });

    it("returns BLAST_RADIUS for downstream impacted nodes", () => {
      const faultedSet = new Set(["node_a"]);
      const blastSet = new Set(["node_a", "node_b"]);
      expect(getNodeHealthStatus("node_b", faultedSet, blastSet)).toBe("BLAST_RADIUS");
    });

    it("returns NOMINAL for untouched nodes", () => {
      const faultedSet = new Set(["node_a"]);
      const blastSet = new Set(["node_a", "node_b"]);
      expect(getNodeHealthStatus("node_c", faultedSet, blastSet)).toBe("NOMINAL");
    });
  });

  describe("getIncidentDossier", () => {
    it("returns null when node is undefined", () => {
      expect(getIncidentDossier(null, nodeMap)).toBeNull();
    });

    it("extracts comprehensive dossier with evidence files and recovery protocols", () => {
      const node = nodeMap.get("exc_slot_conflict");
      const blast = calculateBlastRadius(["exc_slot_conflict"], nodeMap);
      const dossier = getIncidentDossier(node, nodeMap, blast);

      expect(dossier).toBeDefined();
      expect(dossier.nodeId).toBe("exc_slot_conflict");
      expect(dossier.healthStatus).toBe("FAULTED");
      expect(dossier.depthInIncident).toBe(0);
      expect(dossier.connectedRecoveryNodes.length).toBeGreaterThan(0);
      expect(dossier.connectedRecoveryNodes[0].id).toBe("rec_propose_alt_slot");
      expect(Array.isArray(dossier.triageFiles)).toBe(true);
    });

    it("extracts downstream impact count correctly for a healthy node", () => {
      const node = nodeMap.get("hero");
      const dossier = getIncidentDossier(node, nodeMap, { faultedNodeIds: [], blastRadiusSet: new Set() });

      expect(dossier.healthStatus).toBe("NOMINAL");
      expect(dossier.downstreamImpactCount).toBeGreaterThan(10);
    });
  });
});
