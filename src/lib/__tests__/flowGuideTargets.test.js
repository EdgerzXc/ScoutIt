import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { MASTER_FLOW_NODES } from "@/data/masterFlowGraphData";
import { LINEAR_GUIDE_DEFINITIONS } from "@/lib/flow/subgraphExtractor";
import { collectUiGuideMarkers } from "@/lib/flow/graphValidator";

// A-139 — the graph named 36 on-screen markers for its nodes and only 2 were
// rendered by any component; the executable buyer guide pointed at 3 more that
// did not exist, and "guide safety" still reported 100% because it only checked
// that a string was present. A marker the UI does not render cannot guide anyone,
// and a browser test built on it would fail for a reason that is not the site.

const markers = collectUiGuideMarkers();
const nodeIds = new Set(MASTER_FLOW_NODES.map((node) => node.id));

// "#node-<id>" points at a card in the staff flow viewer, which renders
// id={`node-${node.id}`} for every node. It is a viewer anchor, not product UI.
const isViewerAnchor = (target) =>
  target.startsWith("#node-") && nodeIds.has(target.slice("#node-".length));

describe("A-139 · every guide marker the graph names is rendered by a component", () => {
  it("the marker scan sees the markers the shipped journeys rely on", () => {
    expect(markers.has("send-inquiry-modal-btn")).toBe(true);
    expect(markers.has("deal-room-negotiation-panel")).toBe(true);
    expect(markers.size).toBeGreaterThan(8);
  });

  it("the flow viewer renders the #node- anchors that nodes point at", () => {
    const viewer = fs.readFileSync("src/components/flow/MasterFlowGraph.js", "utf8");
    expect(viewer).toContain("id={`node-${node.id}`}");
  });

  it("each node's guide target is a rendered marker or a viewer anchor", () => {
    const unrendered = MASTER_FLOW_NODES
      .filter((node) => node.guide?.target)
      .filter((node) => !markers.has(node.guide.target) && !isViewerAnchor(node.guide.target))
      .map((node) => `${node.id} → ${node.guide.target}`);
    expect(unrendered).toEqual([]);
  });

  it("each guide step that names a target points at a rendered marker", () => {
    const unrendered = Object.values(LINEAR_GUIDE_DEFINITIONS).flatMap((guide) =>
      guide.steps
        .filter((step) => step.guideTarget && !markers.has(step.guideTarget))
        .map((step) => `${guide.id} step ${step.step} → ${step.guideTarget}`)
    );
    expect(unrendered).toEqual([]);
  });
});
