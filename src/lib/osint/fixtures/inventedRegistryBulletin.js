import { createOsintSourceAdapter } from "@/lib/osint/feederContract";

export const INVENTED_OSINT_FIXTURE_DISCLOSURE =
  "SAMPLE ONLY — fictional publisher and invented bulletin for local contract testing.";

export function createInventedRegistryFixtureAdapter({ signals, error } = {}) {
  return createOsintSourceAdapter({
    id: "invented-registry-bulletin",
    version: "1.0.0",
    publisher: "Northstar Sample Registry",
    publisherKind: "invented_fixture",
    allowedHosts: ["northstar-registry.example"],
    isSample: true,
    sampleDisclosure: INVENTED_OSINT_FIXTURE_DISCLOSURE,
    async fetchSignals() {
      if (error) throw error;
      return signals || [];
    },
  });
}

export function inventedRegistrySignal(overrides = {}) {
  return {
    externalId: "sample-bulletin-001",
    title: "Sample corridor review notice",
    content: "Invented test content describing a fictional corridor review.",
    sourceUrl: "https://northstar-registry.example/notices/sample-bulletin-001?edition=1#summary",
    sourcePublishedAt: "2026-08-22T03:00:00.000Z",
    geography: {
      city: "Sample City",
      region: "Sample Region",
      lat: 14.55,
      lng: 121.02,
    },
    ...overrides,
  };
}
