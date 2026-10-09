import { describe, it, expect, beforeEach } from "vitest";
import {
  createSignal,
  recordSignal,
  getActiveSignals,
  clearAllSignals,
  acknowledgeSignal,
  removeSignal,
  subscribeToSignals,
  parseUrlIncidentParams,
  computeSignalHealthSummary
} from "../flow/incidentSignalHub";
import { MASTER_FLOW_NODES } from "@/data/masterFlowGraphData";

describe("incidentSignalHub", () => {
  const nodeMap = new Map(MASTER_FLOW_NODES.map(n => [n.id, n]));

  beforeEach(() => {
    clearAllSignals();
  });

  describe("createSignal", () => {
    it("creates a normalized signal object with time and node information", () => {
      const sig = createSignal({
        nodeId: "api_publish_listing",
        error: "Airtable monthly budget 429 rate limit",
        severity: "CRITICAL"
      });

      expect(sig.id).toMatch(/^sig_/);
      expect(sig.nodeId).toBe("api_publish_listing");
      expect(sig.severity).toBe("CRITICAL");
      expect(sig.error).toContain("429");
      expect(sig.formattedTime).toBeDefined();
      expect(sig.acknowledged).toBe(false);
    });

    it("falls back safely when given an unknown node", () => {
      const sig = createSignal({
        nodeId: "non_existent_node_xyz",
        error: "Mystery failure"
      });

      expect(sig.nodeId).toBe("non_existent_node_xyz");
      expect(sig.nodeName).toBe("non_existent_node_xyz");
      expect(sig.severity).toBe("HIGH");
    });
  });

  describe("recordSignal & lifecycle", () => {
    it("records a signal and retrieves it in active signals", () => {
      recordSignal({
        nodeId: "hero",
        error: "WebGL context lost"
      });

      const signals = getActiveSignals();
      expect(signals).toHaveLength(1);
      expect(signals[0].nodeId).toBe("hero");
      expect(signals[0].error).toContain("WebGL");
    });

    it("acknowledges a signal without deleting it from active records", () => {
      const sig = recordSignal({
        nodeId: "hero",
        error: "WebGL context lost"
      });

      acknowledgeSignal(sig.id);
      const signals = getActiveSignals();
      expect(signals[0].acknowledged).toBe(true);
    });

    it("removes a specific signal", () => {
      const sig = recordSignal({
        nodeId: "hero",
        error: "WebGL context lost"
      });

      removeSignal(sig.id);
      expect(getActiveSignals()).toHaveLength(0);
    });

    it("clears all signals cleanly", () => {
      recordSignal({ nodeId: "hero", error: "Err 1" });
      recordSignal({ nodeId: "api_publish_listing", error: "Err 2" });
      expect(getActiveSignals().length).toBeGreaterThanOrEqual(1);

      clearAllSignals();
      expect(getActiveSignals()).toHaveLength(0);
    });
  });

  describe("subscribeToSignals", () => {
    it("notifies subscribers when new signal is recorded", () => {
      let notifiedWith = [];
      const unsub = subscribeToSignals((list) => {
        notifiedWith = list;
      });

      recordSignal({
        nodeId: "exc_bot_quarantine",
        error: "Sentinel rate threshold exceeded"
      });

      expect(notifiedWith).toHaveLength(1);
      expect(notifiedWith[0].nodeId).toBe("exc_bot_quarantine");

      unsub();
    });
  });

  describe("parseUrlIncidentParams", () => {
    it("parses URL query params for on-call triage deep link", () => {
      const query = "?node=owner_publish&mode=incident&reason=Airtable%20timeout";
      const parsed = parseUrlIncidentParams(query);

      expect(parsed.hasParams).toBe(true);
      expect(parsed.nodeId).toBe("owner_publish");
      expect(parsed.isIncidentMode).toBe(true);
      expect(parsed.reason).toBe("Airtable timeout");
    });

    it("handles empty or irrelevant query gracefully", () => {
      expect(parseUrlIncidentParams("").hasParams).toBe(false);
      expect(parseUrlIncidentParams("?view=grid").hasParams).toBe(false);
    });
  });

  describe("computeSignalHealthSummary", () => {
    it("returns NOMINAL status when no signals exist", () => {
      const summary = computeSignalHealthSummary([], nodeMap);
      expect(summary.status).toBe("NOMINAL");
      expect(summary.activeCount).toBe(0);
      expect(summary.affectedTotalCount).toBe(0);
    });

    it("computes CRITICAL status and blast radius when a critical signal is present", () => {
      const sig = createSignal({
        nodeId: "api_publish_listing",
        error: "Bridge down",
        severity: "CRITICAL"
      });

      const summary = computeSignalHealthSummary([sig], nodeMap);
      expect(summary.status).toBe("CRITICAL");
      expect(summary.activeCount).toBe(1);
      expect(summary.faultedNodeIds).toContain("api_publish_listing");
      // api_publish_listing has downstream children
      expect(summary.affectedTotalCount).toBeGreaterThan(0);
      expect(summary.criticalSignal.nodeId).toBe("api_publish_listing");
    });
  });
});
