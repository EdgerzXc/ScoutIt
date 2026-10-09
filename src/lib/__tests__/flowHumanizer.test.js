import { describe, it, expect } from "vitest";
import {
  humanizeText,
  humanizeDataContract,
  buildNodeLogicStages,
  humanizeNode
} from "../flow/flowHumanizer";
import { MASTER_FLOW_NODES } from "@/data/masterFlowGraphData";

describe("flowHumanizer", () => {
  const nodeMap = new Map(MASTER_FLOW_NODES.map(n => [n.id, n]));

  describe("humanizeText", () => {
    it("cleans robotic and inflated AI phrases into plain English", () => {
      const input = "Serves as the root landing environment. Directs visitors to the 6-layer altitude descent.";
      const result = humanizeText(input);
      expect(result).toContain("This is the main landing page.");
      expect(result).toContain("interactive 6-layer exploration guide");
      expect(result).not.toContain("Serves as the root landing environment");
    });

    it("cleans technical buzzwords like blast radius, deterministic compiler, etc.", () => {
      expect(humanizeText("topological blast radius down the directed acyclic graph")).toBe("chain of other features that stop working if this step fails");
      expect(humanizeText("zero-hallucination deterministic compiler")).toBe("rule-based search engine that answers strictly from verified database records");
    });

    it("handles empty or non-string input safely", () => {
      expect(humanizeText("")).toBe("");
      expect(humanizeText(null)).toBe("");
      expect(humanizeText(undefined)).toBe("");
    });
  });

  describe("humanizeDataContract", () => {
    it("clearly identifies Airtable as public read-only without private records", () => {
      const summary = humanizeDataContract("Airtable", "public");
      expect(summary).toContain("Reads public property information directly from Airtable");
      expect(summary).toContain("No private personal data");
    });

    it("clearly identifies Supabase as private and securely protected", () => {
      const summary = humanizeDataContract("Supabase", "authenticated");
      expect(summary).toContain("Securely stored in Supabase with strict privacy rules");
    });

    it("clearly identifies client-only browser state", () => {
      const summary = humanizeDataContract("None", "public");
      expect(summary).toContain("Runs entirely in your web browser");
    });
  });

  describe("buildNodeLogicStages", () => {
    it("generates 5 logic stages for hero landing node", () => {
      const hero = nodeMap.get("hero");
      const stages = buildNodeLogicStages(hero, nodeMap);

      expect(stages).toHaveLength(5);
      expect(stages[0].id).toBe("trigger");
      expect(stages[1].id).toBe("rules");
      expect(stages[2].id).toBe("execution");
      expect(stages[3].id).toBe("output");
      expect(stages[4].id).toBe("recovery");

      expect(stages[0].title).toBe("How You Get Here");
      expect(stages[2].title).toBe("What Happens Here");
      expect(stages[4].title).toBe("If Something Breaks");
    });

    it("accurately reports incoming parent count and child count", () => {
      const hero = nodeMap.get("hero");
      const stages = buildNodeLogicStages(hero, nodeMap);

      // Hero is root, so 0 parents
      expect(stages[0].technicalDetails.parentCount).toBe(0);
      expect(stages[0].badge).toBe("Starting Point");

      // Hero has multiple outgoing children
      expect(stages[3].technicalDetails.childCount).toBeGreaterThan(0);
      expect(stages[3].badge).toContain("Destinations");
    });

    it("includes exception and recovery information when node specifies them", () => {
      const hero = nodeMap.get("hero");
      const stages = buildNodeLogicStages(hero, nodeMap);
      const recoveryStage = stages[4];

      expect(recoveryStage.technicalDetails.exceptions.length).toBeGreaterThan(0);
      expect(recoveryStage.technicalDetails.recoveryProtocols.length).toBeGreaterThan(0);
      expect(recoveryStage.simpleExplanation).toContain("Solution:");
    });
  });

  describe("humanizeNode", () => {
    it("returns a comprehensive humanized dossier for any node in the catalog", () => {
      const hero = nodeMap.get("hero");
      const dossier = humanizeNode(hero, nodeMap);

      expect(dossier).toBeDefined();
      expect(dossier.name).toBe(hero.name);
      expect(dossier.typeLabel).toBe("Front Door / Starting Point");
      expect(dossier.domainLabel).toBe("Platform Core & Navigation");
      expect(dossier.plainSummary).toBeDefined();
      expect(dossier.whyItMatters).toBeDefined();
      expect(dossier.dataSafety).toContain("browser");
      expect(dossier.logicStages).toHaveLength(5);
    });

    it("humanizes publishing pipeline nodes with correct domain and audience", () => {
      const pubNode = nodeMap.get("api_publish_listing");
      if (pubNode) {
        const dossier = humanizeNode(pubNode, nodeMap);
        expect(dossier.domainLabel).toContain("Owner Listing & Management");
        expect(dossier.logicStages.length).toBe(5);
      }
    });

    it("handles missing or null node gracefully without throwing", () => {
      expect(humanizeNode(null)).toBeNull();
      expect(humanizeNode(undefined)).toBeNull();
    });
  });
});
