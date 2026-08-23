import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildInternalOsintRetrievalChunks,
  createOsintSourceAdapter,
  runOsintFixtureDryRun,
} from "@/lib/osint/feederContract";
import {
  createInventedRegistryFixtureAdapter,
  inventedRegistrySignal,
} from "@/lib/osint/fixtures/inventedRegistryBulletin";

const NOW = "2026-08-23T08:00:00.000Z";

describe("F-002 OSINT feeder contract", () => {
  it("keeps the operational ingest route staff-gated, empty, and unscheduled", () => {
    const route = readFileSync(join(process.cwd(), "src/app/api/cron/osint-scraper/route.js"), "utf8");
    const vercel = readFileSync(join(process.cwd(), "vercel.json"), "utf8");

    expect(route).toContain("const OSINT_FEEDS = [];");
    expect(route).toMatch(/await requireAdmin\(req/);
    expect(vercel).not.toContain("/api/cron/osint-scraper");
  });

  it("normalizes a disclosed fictional fixture without writing or claiming persistence readiness", async () => {
    const adapter = createInventedRegistryFixtureAdapter({ signals: [inventedRegistrySignal()] });
    const result = await runOsintFixtureDryRun({ adapter, now: NOW });

    expect(result.status).toBe("ready_for_review");
    expect(result.persistence).toMatchObject({ writes: 0, ready: false });
    expect(result.persistence.missingColumns).toEqual(expect.arrayContaining([
      "adapter_version",
      "captured_at",
      "content_hash",
      "review_state",
      "source_published_at",
    ]));
    expect(result.accepted[0]).toMatchObject({
      publisher: "Northstar Sample Registry",
      sourceUrl: "https://northstar-registry.example/notices/sample-bulletin-001?edition=1",
      capturedAt: NOW,
      sourcePublishedAt: "2026-08-22T03:00:00.000Z",
      reviewState: "pending_review",
      isSample: true,
      adapter: { id: "invented-registry-bulletin", version: "1.0.0" },
    });
    expect(result.accepted[0].sampleDisclosure).toMatch(/sample only|fictional/i);
    expect(result.accepted[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is idempotent and emits a reviewable revision when known content changes", async () => {
    const firstAdapter = createInventedRegistryFixtureAdapter({ signals: [inventedRegistrySignal()] });
    const first = await runOsintFixtureDryRun({ adapter: firstAdapter, now: NOW });

    const unchanged = await runOsintFixtureDryRun({
      adapter: firstAdapter,
      existingSignals: first.accepted,
      now: "2026-08-23T09:00:00.000Z",
    });
    expect(unchanged.status).toBe("unchanged");
    expect(unchanged.accepted).toHaveLength(0);
    expect(unchanged.unchanged).toHaveLength(1);

    const changedAdapter = createInventedRegistryFixtureAdapter({
      signals: [inventedRegistrySignal({ content: "Invented revised sample content." })],
    });
    const changed = await runOsintFixtureDryRun({
      adapter: changedAdapter,
      existingSignals: first.accepted,
      now: "2026-08-23T10:00:00.000Z",
    });
    expect(changed.accepted[0].revision).toBe(2);
    expect(changed.accepted[0].contentHash).not.toBe(first.accepted[0].contentHash);
  });

  it("quarantines malformed, off-host, and duplicate batch signals", async () => {
    const adapter = createInventedRegistryFixtureAdapter({
      signals: [
        inventedRegistrySignal({ sourcePublishedAt: "not-a-date" }),
        inventedRegistrySignal({ externalId: "off-host", sourceUrl: "https://real-source.test/item" }),
        inventedRegistrySignal({ externalId: "duplicate" }),
        inventedRegistrySignal({ externalId: "duplicate" }),
      ],
    });
    const result = await runOsintFixtureDryRun({ adapter, now: NOW });

    expect(result.status).toBe("ready_for_review");
    expect(result.accepted).toHaveLength(1);
    expect(result.quarantined).toHaveLength(3);
    expect(result.quarantined.map((item) => item.reason).join(" ")).toMatch(/valid timestamp|allowlist|duplicate signal/i);
  });

  it("quarantines duplicate content carried under another identity", async () => {
    const adapter = createInventedRegistryFixtureAdapter({
      signals: [
        inventedRegistrySignal(),
        inventedRegistrySignal({ externalId: "sample-bulletin-002", sourceUrl: "https://northstar-registry.example/notices/002" }),
      ],
    });
    const result = await runOsintFixtureDryRun({ adapter, now: NOW });

    expect(result.accepted).toHaveLength(1);
    expect(result.quarantined[0].reason).toMatch(/duplicate content/i);
  });

  it("reports safe empty and adapter-error states", async () => {
    const empty = await runOsintFixtureDryRun({
      adapter: createInventedRegistryFixtureAdapter(),
      now: NOW,
    });
    expect(empty).toMatchObject({ status: "empty", persistence: { writes: 0 } });

    const failed = await runOsintFixtureDryRun({
      adapter: createInventedRegistryFixtureAdapter({ error: new Error("fixture unavailable") }),
      now: NOW,
    });
    expect(failed).toMatchObject({ status: "error", persistence: { writes: 0 } });
    expect(failed.failures[0]).toMatchObject({ stage: "adapter_fetch", reason: "fixture unavailable" });
  });

  it("rejects undisclosed or non-reserved fixture sources", () => {
    expect(() => createOsintSourceAdapter({
      id: "unsafe-fixture",
      version: "1",
      publisher: "Real-sounding agency",
      publisherKind: "real",
      allowedHosts: ["agency.gov"],
      isSample: true,
      fetchSignals: async () => [],
    })).toThrow(/invented_fixture/i);
  });

  it("produces staff-only internal retrieval chunks with complete provenance", async () => {
    const result = await runOsintFixtureDryRun({
      adapter: createInventedRegistryFixtureAdapter({ signals: [inventedRegistrySignal()] }),
      now: NOW,
    });
    const [chunk] = buildInternalOsintRetrievalChunks(result.accepted);

    expect(chunk).toMatchObject({
      corpus: "internal",
      sourceSystem: "scoutit_osint_feeder",
      sourceType: "raw_osint_signal",
      allowedRoles: ["admin", "staff"],
      isSample: true,
      provenance: {
        publisher: "Northstar Sample Registry",
        capturedAt: NOW,
        reviewState: "pending_review",
        adapter: { id: "invented-registry-bulletin", version: "1.0.0" },
      },
    });
    expect(() => buildInternalOsintRetrievalChunks(result.accepted, { allowedRoles: ["public"] }))
      .toThrow(/recognized ScoutIt staff role/i);
  });
});
