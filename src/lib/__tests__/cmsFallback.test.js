import { DEFAULT_LIVE_CMS_URL, normalizeLiveCmsBundle } from "../cmsFallback";

describe("development live CMS fallback", () => {
  // Inverted with the source change 2026-08-08 (Standing Rule 14: a change that
  // makes an existing test obsolete inverts the test in the SAME commit).
  it("points at a domain we own, not a Vercel-generated host", () => {
    expect(DEFAULT_LIVE_CMS_URL).toBe("https://www.scoutit.space/api/cms");
    expect(DEFAULT_LIVE_CMS_URL).not.toMatch(/vercel\.app/);
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
