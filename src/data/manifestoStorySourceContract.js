export const MANIFESTO_STORY_CONTRACT_VERSION = "1.0.0";

// F-009 may borrow only these public, VERIFIED, PUBLIC_LIVE Master Flow facts.
// The runtime component imports this small registry rather than bundling the
// complete graph or either retrieval corpus into the public page.
export const PUBLIC_LAYER_FLOW_SOURCES = Object.freeze([
  { layer: "orbit", chunkId: "fact_layer.orbit", canonicalPath: "/layer/orbit" },
  { layer: "stratosphere", chunkId: "fact_layer.stratosphere", canonicalPath: "/layer/stratosphere" },
  { layer: "metropolis", chunkId: "fact_layer.metropolis", canonicalPath: "/layer/metropolis" },
  { layer: "crust", chunkId: "fact_layer.crust", canonicalPath: "/layer/crust" },
  { layer: "mantle", chunkId: "fact_layer.mantle", canonicalPath: "/layer/mantle" },
  { layer: "core", chunkId: "fact_layer.core", canonicalPath: "/layer/core" },
]);

export const MANIFESTO_CANONICAL_SOURCES = Object.freeze({
  architecture: "_SCOUTIT_BRAIN/02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE.md",
  schema: "_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/DATA_DICTIONARY.md",
  userFlows: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
  retrievalBoundary: "src/lib/retrieval/corpusContract.js",
});

export const MANIFESTO_EXCLUDED_SCOPES = Object.freeze([
  "internal operations",
  "security controls",
  "staff-only workflow",
  "unreleased or unverified product claims",
]);

export function getPublicLayerFlowSource(layer) {
  return PUBLIC_LAYER_FLOW_SOURCES.find((source) => source.layer === layer) || null;
}
