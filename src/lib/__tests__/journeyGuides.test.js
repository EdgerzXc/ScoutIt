import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  PUBLIC_JOURNEYS,
  guideForVerifiedRole,
  normalizeJourneyRole,
} from "@/lib/journeyGuides";
import { MASTER_FLOW_NODES } from "@/data/masterFlowGraphData";

const ROOT = process.cwd();
const nodeById = new Map(MASTER_FLOW_NODES.map((node) => [node.id, node]));

describe("A-020 public Master Flow guide adapter", () => {
  it("maps only server-supported roles", () => {
    expect(normalizeJourneyRole("buyer")).toBe("seeker");
    expect(normalizeJourneyRole("owner")).toBe("owner");
    expect(normalizeJourneyRole("broker")).toBe("broker");
    expect(normalizeJourneyRole("photographer")).toBeNull();
    expect(guideForVerifiedRole(null)).toBeNull();
  });

  it("exposes verified graph nodes with shipped page routes and stable targets", () => {
    for (const journey of Object.values(PUBLIC_JOURNEYS)) {
      expect(journey.steps.length).toBeGreaterThan(1);
      for (const step of journey.steps) {
        expect(nodeById.get(step.nodeId)?.implementationStatus).toBe("VERIFIED");
        expect(step.route).toMatch(/^\/(?!api\/)/);
        expect(step.route).not.toContain("[");
        expect(step.target).toMatch(/^[a-z0-9-]+$/);
      }
    }
  });

  it("grounds every public target in the shipped UI", () => {
    const files = [
      "src/app/page.js",
      "src/app/discover/DiscoverClient.js",
      "src/app/property/DirectoryClient.js",
      "src/components/dashboard/OwnerMode.js",
      "src/components/dashboard/BrokerMode.js",
      "src/components/dashboard/ChatBox.js",
      "src/components/professionals/ProfessionalDirectory.js",
    ].map((file) => readFileSync(path.join(ROOT, file), "utf8")).join("\n");
    for (const journey of Object.values(PUBLIC_JOURNEYS)) {
      for (const step of journey.steps) {
        expect(files).toContain(`data-scoutit-guide="${step.target}"`);
      }
    }
  });

  it("keeps role choice server-derived and guide state non-authoritative", () => {
    const toolbox = readFileSync(path.join(ROOT, "src/components/ui/FloatingToolbox.js"), "utf8");
    expect(toolbox).toContain('fetch("/api/profile/me/role")');
    expect(toolbox).not.toMatch(/setRole\([^)]*localStorage/);
    expect(toolbox).not.toMatch(/subscription|entitlement|active_roles/);
  });

  it("supports the complete non-blocking journey lifecycle", () => {
    const toolbox = readFileSync(path.join(ROOT, "src/components/ui/FloatingToolbox.js"), "utf8");
    for (const contract of [
      "scoutit_journey_guide_v1",
      "Resume guided journey",
      "Skip step",
      "Finish ✓",
      "Dismiss guide",
      "Restart journey",
      'aria-modal="false"',
      'e.key === "Escape"',
      "previousFocusRef.current?.focus",
    ]) expect(toolbox).toContain(contract);
  });
});
