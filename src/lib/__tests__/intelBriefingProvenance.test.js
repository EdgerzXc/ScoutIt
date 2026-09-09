import { beforeEach, describe, expect, it, vi } from "vitest";

// The rows the mocked database will return, and a record of every filter the
// query builder was asked to apply.
const briefingRows = { value: [] };
const queryCalls = { eq: [] };

vi.mock("@/lib/airtable", () => ({
  fetchProperties: async () => [],
  fetchIntel: async () => [],
  fetchBrokers: async () => [],
  fetchHomepageConfig: async () => ({}),
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => {
      const builder = {
        select: () => builder,
        eq: (column, value) => {
          queryCalls.eq.push([column, value]);
          briefingRows.value = briefingRows.value.filter((row) => row[column] === value);
          return builder;
        },
        order: () => Promise.resolve({ data: briefingRows.value }),
      };
      return builder;
    },
  },
}));
vi.mock("@/lib/mapboxToken", () => ({ getServerMapboxToken: () => "" }));
vi.mock("@/lib/systemEvents", () => ({
  recordSystemEvent: async () => ({}),
  EVENTS: new Proxy({}, { get: (_t, key) => String(key) }),
}));

const {
  isPublishedBriefing,
  mapBriefingToIntel,
  PUBLISHED_BRIEFING_FILTER,
} = await import("@/lib/intelBriefingMapper");
const cmsCache = await import("@/lib/cmsCache");

/** Run the real getCmsBundle over a given set of briefing rows. */
async function runCmsBundleWithBriefings(rows) {
  process.env.AIRTABLE_API_KEY = "keyTest";
  process.env.AIRTABLE_BASE_ID = "appTest";
  queryCalls.eq = [];
  briefingRows.value = rows.map((row) => ({ ...row }));
  await cmsCache.invalidateCmsBundle();
  const bundle = await cmsCache.getCmsBundle();
  return { calls: queryCalls, bundle };
}

// U-021 + A-082 — one function, one edit, so one suite.
//
// U-021: `cmsCache.js` read `intel_briefings` with `.select("*")` and NO
// publication filter, under a comment that said "Fetch published briefings".
// The write side sets `published_to_airtable` correctly and in exactly one
// place; the read side never consulted it. A safeguard with no reader.
//
// A-082: the same mapping block invented provenance for missing fields — a
// source name, a city, a pair of BGC coordinates, a stock cover photo and the
// date "Just Now". ScoutIt's whole Intel proposition is named provenance, and
// this manufactured it precisely when it was absent. Absent beats invented.

const published = (over = {}) => ({
  id: "b1",
  slug: "makati-office-vacancy",
  title: "Makati office vacancy",
  published_to_airtable: true,
  ...over,
});

describe("U-021 · only a published briefing reaches the public bundle", () => {
  it("admits a briefing whose publication flag is true", () => {
    expect(isPublishedBriefing(published())).toBe(true);
  });

  it("rejects an unpublished draft, which is the state the OSINT console writes", () => {
    expect(isPublishedBriefing(published({ published_to_airtable: false }))).toBe(false);
  });

  it("rejects a row where the flag is missing or null, rather than assuming published", () => {
    expect(isPublishedBriefing(published({ published_to_airtable: null }))).toBe(false);
    expect(isPublishedBriefing({ id: "b2", slug: "s", title: "t" })).toBe(false);
  });

  it("names the column the database query must filter on, so the read side cannot drift again", () => {
    expect(PUBLISHED_BRIEFING_FILTER).toEqual({ column: "published_to_airtable", value: true });
  });
});

describe("A-082 · provenance is reported, never invented", () => {
  it("leaves a missing source name absent instead of manufacturing one", () => {
    const mapped = mapBriefingToIntel(published());
    expect(mapped.sourceName).toBeFalsy();
    expect(JSON.stringify(mapped)).not.toMatch(/OSINT Public Filing/);
  });

  it("leaves a missing location absent instead of placing the briefing in BGC", () => {
    const mapped = mapBriefingToIntel(published());
    expect(mapped.city).toBeFalsy();
    expect(mapped.region).toBeFalsy();
    expect(mapped.lat).toBeNull();
    expect(mapped.lng).toBeNull();
    const serialized = JSON.stringify(mapped);
    expect(serialized).not.toMatch(/BGC, Taguig/);
    expect(serialized).not.toMatch(/Metro Manila/);
    expect(serialized).not.toMatch(/14\.5547/);
    expect(serialized).not.toMatch(/121\.0244/);
  });

  it("leaves a missing cover absent instead of presenting a stock photograph as the article's own", () => {
    const mapped = mapBriefingToIntel(published());
    expect(mapped.image).toBeFalsy();
    expect(JSON.stringify(mapped)).not.toMatch(/unsplash/i);
  });

  it("leaves an undated briefing undated instead of reading as breaking news", () => {
    const mapped = mapBriefingToIntel(published());
    expect(mapped.date).toBeFalsy();
    expect(JSON.stringify(mapped)).not.toMatch(/Just Now/);
  });

  it("keeps lat: 0 as 0 — the old `Number(b.lat) || 14.5547` rewrote a legitimate zero", () => {
    const mapped = mapBriefingToIntel(published({ lat: 0, lng: 0 }));
    expect(mapped.lat).toBe(0);
    expect(mapped.lng).toBe(0);
  });

  it("reports every value the row actually supplies, unchanged", () => {
    const mapped = mapBriefingToIntel(
      published({
        source_name: "PSE EDGE Disclosure",
        city: "Cebu Business Park",
        region: "Central Visayas",
        lat: 10.3157,
        lng: 123.8854,
        cover_image_url: "https://cdn.scoutit.space/briefing.jpg",
        published_at: "2026-08-14T00:00:00.000Z",
      })
    );

    expect(mapped.sourceName).toBe("PSE EDGE Disclosure");
    expect(mapped.city).toBe("Cebu Business Park");
    expect(mapped.region).toBe("Central Visayas");
    expect(mapped.lat).toBe(10.3157);
    expect(mapped.lng).toBe(123.8854);
    expect(mapped.image).toBe("https://cdn.scoutit.space/briefing.jpg");
    expect(mapped.date).toMatch(/2026/);
    expect(mapped.source).toBe("supabase_osint");
  });

  it("treats an unparseable coordinate as absent rather than as BGC", () => {
    const mapped = mapBriefingToIntel(published({ lat: "not-a-number", lng: "" }));
    expect(mapped.lat).toBeNull();
    expect(mapped.lng).toBeNull();
  });
});

describe("U-021 · the live read path actually applies the filter", () => {
  // A source grep is not a guard. An earlier version of this suite only
  // checked that cmsCache.js *mentioned* the filter constant, and removing
  // the `.eq()` from the real query left it green — the same vacuous-guard
  // failure U-021 was opened for. This exercises the query builder instead.
  it("asks the database for published briefings only, and drops a draft that slips past anyway", async () => {
    const { calls, bundle } = await runCmsBundleWithBriefings([
      published({ id: "live", slug: "published-briefing" }),
      published({ id: "draft", slug: "draft-briefing", published_to_airtable: false }),
    ]);

    expect(calls.eq).toContainEqual(["published_to_airtable", true]);

    const slugs = bundle.intel.map((item) => item.slug);
    expect(slugs).toContain("published-briefing");
    expect(slugs).not.toContain("draft-briefing");
  });
});
