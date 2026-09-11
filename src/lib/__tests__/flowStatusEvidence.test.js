import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from "@/data/masterFlowGraphData";

// A-139 — a status is a claim. VERIFIED and PARTIAL both say "code exists", so
// both must point at code that exists. Before this, only VERIFIED was checked:
// the planned AI council and arbiter were drawn PARTIAL / LIMITED_LIVE with a
// Brain note as their only evidence, and the staff viewer painted every
// NOT_STARTED node with the green "Verified" badge because it had no style for
// that status and fell back to VERIFIED.

const CODE_EVIDENCE_KINDS = new Set(["CODE", "COMPONENT", "API", "TEST", "SCRIPT", "ROUTE"]);
const BUILT_STATUSES = new Set(["VERIFIED", "PARTIAL"]);

const citesExistingCode = (node) =>
  (node.evidence || []).some(
    (ev) =>
      CODE_EVIDENCE_KINDS.has(ev.kind) &&
      typeof ev.path === "string" &&
      !ev.path.startsWith("_SCOUTIT_BRAIN/") &&
      fs.existsSync(ev.path)
  );

function codeOf(file) {
  return fs
    .readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/(^|\s)\/\/.*/, "$1"))
    .join("\n");
}

describe("A-139 · every graph status is backed by what it claims", () => {
  it("a node marked VERIFIED or PARTIAL cites at least one repository file that exists", () => {
    const unbacked = MASTER_FLOW_NODES
      .filter((node) => BUILT_STATUSES.has(node.implementationStatus) && !citesExistingCode(node))
      .map((node) => `${node.id} (${node.implementationStatus})`);
    expect(unbacked, "Cite the code, or mark the node NOT_STARTED").toEqual([]);
  });

  it("no transition is VERIFIED while either end of it is not built", () => {
    const status = new Map(MASTER_FLOW_NODES.map((node) => [node.id, node.implementationStatus]));
    const overclaimed = MASTER_FLOW_EDGES
      .filter((edge) => edge.implementationStatus === "VERIFIED")
      .filter((edge) => status.get(edge.source) === "NOT_STARTED" || status.get(edge.target) === "NOT_STARTED")
      .map((edge) => edge.id);
    expect(overclaimed).toEqual([]);
  });

  it("every evidence commit is a real 40-character SHA, never a placeholder", () => {
    const entities = [...MASTER_FLOW_NODES, ...MASTER_FLOW_EDGES];
    const placeholders = entities.flatMap((entity) =>
      (entity.evidence || [])
        .filter((ev) => ev.commitSha !== undefined && !/^[0-9a-f]{40}$/.test(ev.commitSha))
        .map((ev) => `${entity.id}: ${ev.commitSha}`)
    );
    expect(placeholders).toEqual([]);
  });

  it("the staff viewer styles every status the graph uses and never defaults to Verified", () => {
    const viewer = codeOf("src/components/flow/MasterFlowGraph.js");
    const config = viewer.match(/const STATUS_CONFIG = \{([\s\S]*?)\n\};/);
    expect(config, "STATUS_CONFIG block not found").not.toBeNull();
    const styled = new Set([...config[1].matchAll(/^\s*([A-Z_]+):/gm)].map((m) => m[1]));

    const used = new Set(MASTER_FLOW_NODES.map((node) => node.implementationStatus));
    const unstyled = [...used].filter((status) => !styled.has(status));
    expect(unstyled).toEqual([]);
    expect(viewer).not.toMatch(/STATUS_CONFIG\[[^\]]+\]\s*\|\|\s*STATUS_CONFIG\.VERIFIED/);
  });
});
