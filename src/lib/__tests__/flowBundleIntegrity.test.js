import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from "@/data/masterFlowGraphData";
import {
  getAtomicRAGChunks,
  WORKFLOW_DEFINITIONS,
  LINEAR_GUIDE_DEFINITIONS
} from "@/lib/flow/subgraphExtractor";
import { calculateGraphCoverage } from "@/lib/flow/graphValidator";

// A-139 — src/data/flow/* is generated from src/data/masterFlowGraphData.js by
// scripts/generateFlowBundle.mjs and is never edited by hand. The bundle fell
// behind the source twice without anything noticing: A-047 (6314c04) edited the
// source after its last regeneration, and A-127 (0f617dd) hand-edited three
// bundle files. The check this replaces asserted that checksums.json HAD
// entries, never that they matched. These compare content.

const FLOW_DIR = path.resolve("src/data/flow");
const REGENERATE =
  "Run `node scripts/generateFlowBundle.mjs` — never hand-edit src/data/flow/*.json";

const BUNDLE_FILES = [
  "schema.json",
  "masterFlowGraph.json",
  "masterFlowLayout.json",
  "atomicRAGChunks.json",
  "publicRAGChunks.json",
  "workflows.json",
  "linearGuides.json",
  "coverageReport.json",
  "auditReport.json",
  "index.js",
  "README.md"
];

const readBytes = (name) => fs.readFileSync(path.join(FLOW_DIR, name));
const readJson = (name) => JSON.parse(readBytes(name).toString("utf8"));
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

// Ids whose serialised form differs between what the source generates and
// what the bundle holds — a short list reads better than a 1 MB object diff.
function driftedIds(expected, actual, idOf) {
  const actualById = new Map(actual.map((item) => [idOf(item), item]));
  return expected
    .filter((item) => JSON.stringify(item) !== JSON.stringify(actualById.get(idOf(item))))
    .map(idOf);
}

describe("A-139 · the flow bundle is generated, never hand-edited", () => {
  it("every checksum matches the bytes of the file it names", () => {
    const manifest = readJson("checksums.json");
    expect(Object.keys(manifest.checksums).sort()).toEqual([...BUNDLE_FILES].sort());

    const stale = BUNDLE_FILES.filter((name) => sha256(readBytes(name)) !== manifest.checksums[name]);
    expect(stale, REGENERATE).toEqual([]);
  });

  it("the manifest and the graph carry the same generation stamp", () => {
    const manifest = readJson("checksums.json");
    const graph = readJson("masterFlowGraph.json");
    expect(manifest.dataRevision).toMatch(/^[0-9a-f]{40}$/);
    expect(graph.dataRevision).toBe(manifest.dataRevision);
    expect(graph.generatedAt).toBe(manifest.generatedAt);
  });

  it("masterFlowGraph.json holds exactly the nodes and edges the source defines", () => {
    // Mirrors generateFlowBundle.mjs step 2: coordinates move to the layout
    // file, and parents/children are derived from the edges.
    const children = new Map();
    const parents = new Map();
    MASTER_FLOW_EDGES.forEach((edge) => {
      children.set(edge.source, [...(children.get(edge.source) || []), edge.target]);
      parents.set(edge.target, [...(parents.get(edge.target) || []), edge.source]);
    });
    const expected = MASTER_FLOW_NODES.map(({ x, y, ...node }) => ({
      ...node,
      parents: parents.get(node.id) || [],
      children: children.get(node.id) || []
    }));
    const graph = readJson("masterFlowGraph.json");

    expect(graph.nodes.map((node) => node.id)).toEqual(expected.map((node) => node.id));
    expect(driftedIds(expected, graph.nodes, (node) => node.id), REGENERATE).toEqual([]);
    expect(JSON.stringify(graph.edges), REGENERATE).toBe(JSON.stringify(MASTER_FLOW_EDGES));
  });

  it("both retrieval corpora are exactly what the source generates", () => {
    const corpora = [
      ["atomicRAGChunks.json", { role: "admin", includePlanned: true }],
      ["publicRAGChunks.json", { role: "public", includePlanned: false }]
    ];
    corpora.forEach(([file, options]) => {
      const expected = getAtomicRAGChunks(MASTER_FLOW_NODES, MASTER_FLOW_EDGES, options);
      const actual = readJson(file);
      expect(actual.length, `${file}: ${REGENERATE}`).toBe(expected.length);
      expect(driftedIds(expected, actual, (chunk) => chunk.chunk_id), `${file}: ${REGENERATE}`).toEqual([]);
    });
  });

  it("workflows, guides and coverage are exactly what the source generates", () => {
    // auditReport.json is deliberately not compared: it crawls all of src/app,
    // so it is a snapshot of the whole repo at generation time and would fail
    // on every unrelated route change. The checksum above still pins it.
    expect(JSON.stringify(readJson("workflows.json")), REGENERATE).toBe(JSON.stringify(WORKFLOW_DEFINITIONS));
    expect(JSON.stringify(readJson("linearGuides.json")), REGENERATE).toBe(JSON.stringify(LINEAR_GUIDE_DEFINITIONS));
    expect(JSON.stringify(readJson("coverageReport.json")), REGENERATE).toBe(
      JSON.stringify(calculateGraphCoverage(MASTER_FLOW_NODES, MASTER_FLOW_EDGES))
    );
  });
});
