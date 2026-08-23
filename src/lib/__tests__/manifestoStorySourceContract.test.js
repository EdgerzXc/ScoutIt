import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { publicRAGChunks } from "@/data/flow";
import {
  MANIFESTO_EXCLUDED_SCOPES,
  MANIFESTO_STORY_CONTRACT_VERSION,
  PUBLIC_LAYER_FLOW_SOURCES,
} from "@/data/manifestoStorySourceContract";
import { reconcileMasterFlowCorpus } from "@/lib/retrieval/corpusContract";

describe("F-009 Mantle and manifesto story source contract", () => {
  it("uses one versioned, public-safe Master Flow fact for every descent layer", () => {
    const publicCorpus = reconcileMasterFlowCorpus(publicRAGChunks, { corpus: "public" }).chunks;
    const acceptedByChunkKey = new Map(
      publicCorpus.map((chunk) => [decodeURIComponent(chunk.chunkId.split(":").at(-1)), chunk]),
    );

    expect(MANIFESTO_STORY_CONTRACT_VERSION).toBe("1.0.0");
    expect(PUBLIC_LAYER_FLOW_SOURCES.map(({ layer }) => layer)).toEqual([
      "orbit",
      "stratosphere",
      "metropolis",
      "crust",
      "mantle",
      "core",
    ]);

    for (const source of PUBLIC_LAYER_FLOW_SOURCES) {
      const accepted = acceptedByChunkKey.get(source.chunkId);
      expect(accepted, `${source.chunkId} must pass F-001's public corpus contract`).toBeDefined();
      expect(accepted.canonicalUrl).toBe(source.canonicalPath);
      expect(accepted.releaseStatus).toBe("PUBLIC_LIVE");
      expect(accepted.allowedRoles).not.toContain("staff");
      expect(accepted.allowedRoles).not.toContain("admin");
    }
  });

  it("keeps the public story qualified and free of the retired blanket-verification claim", () => {
    const source = [
      "src/components/about/ScoutItManifesto.js",
      "src/components/descent/MantleArchive.js",
    ].map((file) => fs.readFileSync(path.resolve(file), "utf8")).join("\n");

    expect(source).not.toMatch(/result of a verified lifecycle/i);
    expect(source).toMatch(/source-qualified lifecycle/i);
    expect(MANIFESTO_EXCLUDED_SCOPES).toEqual(expect.arrayContaining([
      "internal operations",
      "security controls",
      "staff-only workflow",
    ]));
  });
});
