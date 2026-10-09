import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function codeWithoutComments(path) {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join(" ");
}

const DIAGRAM_SOURCE = codeWithoutComments("src/components/flow/NodeLogicDiagram.js");
const BANNER_SOURCE = codeWithoutComments("src/components/flow/IncidentSignalBanner.js");
const GRAPH_SOURCE = codeWithoutComments("src/components/flow/MasterFlowGraph.js");

describe("Master Flow Graph Interactive Components Contract", () => {
  describe("NodeLogicDiagram structural contract", () => {
    it("renders the 5-stage logic blueprint with humanized summary", () => {
      expect(DIAGRAM_SOURCE).toContain("Logic Blueprint");
      expect(DIAGRAM_SOURCE).toContain("In Plain Words:");
      expect(DIAGRAM_SOURCE).toContain("buildNodeLogicStages");
      expect(DIAGRAM_SOURCE).toContain("humanizeNode");
    });

    it("supports toggling between Simple view and Technical Blueprint view", () => {
      expect(DIAGRAM_SOURCE).toContain('setViewMode("simple")');
      expect(DIAGRAM_SOURCE).toContain('setViewMode("technical")');
      expect(DIAGRAM_SOURCE).toContain("Node ID:");
      expect(DIAGRAM_SOURCE).toContain("Database:");
      expect(DIAGRAM_SOURCE).toContain("Auth Gate:");
    });

    it("provides interactive navigation buttons to jump to connected nodes", () => {
      expect(DIAGRAM_SOURCE).toContain("onNavigateToNode");
      expect(DIAGRAM_SOURCE).toContain("Jump to Previous Step:");
      expect(DIAGRAM_SOURCE).toContain("Jump to Next Step:");
    });

    it("provides an interactive recovery fault simulator button", () => {
      expect(DIAGRAM_SOURCE).toContain("onSimulateFault");
      expect(DIAGRAM_SOURCE).toContain("Test Fault Signal On This Node");
    });
  });

  describe("IncidentSignalBanner structural contract", () => {
    it("subscribes to real-time incident signals on mount", () => {
      expect(BANNER_SOURCE).toContain("subscribeToSignals");
      expect(BANNER_SOURCE).toContain("computeSignalHealthSummary");
    });

    it("renders nominal status indicator when all signals are nominal", () => {
      expect(BANNER_SOURCE).toContain("ALL SIGNALS NOMINAL");
    });

    it("renders alarm indicator and Locate Fault button when faults are present", () => {
      expect(BANNER_SOURCE).toContain("SIGNAL ALERT");
      expect(BANNER_SOURCE).toContain("Locate Fault");
      expect(BANNER_SOURCE).toContain("onFocusNode");
    });

    it("provides instant test signal buttons for known operational scenarios", () => {
      expect(BANNER_SOURCE).toContain("Dual-CMS Airtable 429");
      expect(BANNER_SOURCE).toContain("Sentinel Bot Quarantine");
      expect(BANNER_SOURCE).toContain("Connects Wallet Empty");
      expect(BANNER_SOURCE).toContain("handleFireTestSignal");
    });
  });

  describe("MasterFlowGraph integration contract", () => {
    it("imports and mounts NodeLogicDiagram in the node inspector drawer", () => {
      expect(GRAPH_SOURCE).toContain("import NodeLogicDiagram from");
      expect(GRAPH_SOURCE).toContain("<NodeLogicDiagram");
    });

    it("imports and mounts IncidentSignalBanner on the canvas overlay", () => {
      expect(GRAPH_SOURCE).toContain("import IncidentSignalBanner from");
      expect(GRAPH_SOURCE).toContain("<IncidentSignalBanner");
    });

    it("initializes incidentSignalHub and parses URL parameters on load", () => {
      expect(GRAPH_SOURCE).toContain("initIncidentSignalHub");
      expect(GRAPH_SOURCE).toContain("parseUrlIncidentParams");
    });
  });
});
