import { DEFAULT_LIVE_CMS_URL, normalizeLiveCmsBundle } from "../cmsFallback";

describe("development live CMS fallback", () => {
  it("uses the canonical Vercel CMS endpoint", () => {
    expect(DEFAULT_LIVE_CMS_URL).toBe("https://scout-it.vercel.app/api/cms");
  });

  it("accepts an Airtable-backed public bundle", () => {
    const bundle = normalizeLiveCmsBundle({
      source: "airtable",
      properties: [{ slug: "cyber-sigma-tower-3" }],
      brokers: [{ id: "recBroker" }],
      intel: [],
      homepage: null,
    });

    expect(bundle.source).toBe("airtable_via_live_vercel");
    expect(bundle.properties).toHaveLength(1);
    expect(bundle.brokers).toHaveLength(1);
  });

  it("rejects mock, empty, and malformed bundles", () => {
    expect(() => normalizeLiveCmsBundle({ source: "local_mock", properties: [], brokers: [] })).toThrow(/not Airtable-backed/);
    expect(() => normalizeLiveCmsBundle({ source: "empty_fallback", properties: [], brokers: [] })).toThrow(/not Airtable-backed/);
    expect(() => normalizeLiveCmsBundle({ source: "airtable", properties: null, brokers: [] })).toThrow(/invalid bundle/);
  });
});
