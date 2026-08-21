import { describe, it, expect } from "vitest";
import { articlesForProperty, areaIntelHref } from "@/lib/propertyArticles";

// ─────────────────────────────────────────────────────────────────────────
// The failure that matters here is showing an article on a page it has no
// business being on. A missing article is a thin section; a wrong one is a
// claim ScoutIt did not make. So most of these are exclusions.
// ─────────────────────────────────────────────────────────────────────────

const article = (over = {}) => ({
  slug: "bgc-spatial-movement",
  title: "BGC Spatial Movement",
  city: "Taguig",
  region: "NCR",
  date: "2026-08-01",
  ...over,
});

const property = (over = {}) => ({
  id: "rec7fH6C0M8QELk9G",
  slug: "cyber-sigma-tower-3",
  city: "Taguig",
  region: "NCR",
  ...over,
});

describe("articlesForProperty — what gets in", () => {
  it("includes an article from the same city", () => {
    const out = articlesForProperty([article()], property());
    expect(out).toHaveLength(1);
    expect(out[0].slug).toBe("bgc-spatial-movement");
  });

  it("includes a different city in the same region, but only as a region match", () => {
    const out = articlesForProperty([article({ city: "Makati" })], property());
    expect(out).toHaveLength(1);
    expect(out[0].isAboutThisProperty).toBe(false);
  });

  it("excludes an article with no city and no region overlap", () => {
    const out = articlesForProperty(
      [article({ city: "Cebu City", region: "Central Visayas" })],
      property(),
    );
    expect(out).toEqual([]);
  });

  it("excludes an article missing a slug or title, however well it matches", () => {
    const out = articlesForProperty(
      [article({ slug: "" }), article({ title: "" })],
      property(),
    );
    expect(out).toEqual([]);
  });

  it("matches city case- and whitespace-insensitively", () => {
    const out = articlesForProperty([article({ city: "  taguig " })], property());
    expect(out).toHaveLength(1);
  });

  it("bridges article location to property location when city is blank", () => {
    const out = articlesForProperty(
      [article({ city: "", region: "", location: "Capitol Commons" })],
      property({ city: "", region: "", location: "Capitol Commons, Pasig City" }),
    );
    expect(out).toHaveLength(1);
  });

  it("bridges article city to a more specific property location", () => {
    const out = articlesForProperty(
      [article({ city: "Pasig", region: "" })],
      property({ city: "", region: "", location: "Capitol Commons, Pasig City" }),
    );
    expect(out).toHaveLength(1);
  });

  it("accepts a district field as a local market signal", () => {
    const out = articlesForProperty(
      [article({ city: "", region: "", district: "Ortigas Center" })],
      property({ city: "Pasig", region: "", location: "Ortigas Center, Pasig" }),
    );
    expect(out).toHaveLength(1);
  });
});

describe("articlesForProperty — real place-name shapes", () => {
  // These pairs are taken from the LIVE feed, not invented. Articles are
  // authored at district level and properties recorded at city level, so an
  // equality match returned nothing for every property in the inventory.
  // Standing Rule 4: it fails by showing nothing, and showing nothing looks
  // exactly like having nothing.
  it.each([
    ["BGC, Taguig", "Taguig"],
    ["Makati CBD", "Makati"],
    ["Poblacion, Makati", "Makati"],
    ["General Luna, Siargao", "Siargao"],
    ["El Nido, Palawan", "Palawan"],
  ])("matches article city %s to property city %s", (articleCity, propertyCity) => {
    const out = articlesForProperty(
      [article({ city: articleCity, region: "" })],
      property({ city: propertyCity, region: "" }),
    );
    expect(out).toHaveLength(1);
  });

  it("does NOT match two different cities that share only a stopword", () => {
    // "Cebu City" and "Quezon City" share the token "city". Matching on that
    // would be worse than not matching at all.
    const out = articlesForProperty(
      [article({ city: "Cebu City", region: "" })],
      property({ city: "Quezon City", region: "" }),
    );
    expect(out).toEqual([]);
  });

  it("does NOT match on 'Metro' or 'Manila' alone", () => {
    const out = articlesForProperty(
      [article({ city: "Metro Cebu", region: "" })],
      property({ city: "Metro Davao", region: "" }),
    );
    expect(out).toEqual([]);
  });

  it("does not match unrelated cities", () => {
    const out = articlesForProperty(
      [article({ city: "BGC, Taguig", region: "" })],
      property({ city: "Cebu City", region: "" }),
    );
    expect(out).toEqual([]);
  });

  it("ignores single-character tokens", () => {
    const out = articlesForProperty(
      [article({ city: "A Taguig", region: "" })],
      property({ city: "A Makati", region: "" }),
    );
    expect(out).toEqual([]);
  });
});

describe("articlesForProperty — ordering", () => {
  it("puts an article about THIS property above a same-city one", () => {
    const specific = article({
      slug: "inside-cyber-sigma",
      title: "Inside Cyber Sigma",
      city: "Taguig",
      date: "2020-01-01", // deliberately older: relevance beats recency
      relatedPropertyIds: ["rec7fH6C0M8QELk9G"],
    });
    const out = articlesForProperty([article(), specific], property());
    expect(out.map((a) => a.slug)).toEqual(["inside-cyber-sigma", "bgc-spatial-movement"]);
  });

  it("puts a city match above a region-only match", () => {
    const sameCity = article({ slug: "city", title: "City", city: "Taguig" });
    const sameRegion = article({ slug: "region", title: "Region", city: "Makati", region: "NCR" });
    const out = articlesForProperty([sameRegion, sameCity], property());
    expect(out.map((a) => a.slug)).toEqual(["city", "region"]);
  });

  it("sorts equally-ranked articles newest first", () => {
    const older = article({ slug: "older", title: "Older", date: "2026-01-01" });
    const newer = article({ slug: "newer", title: "Newer", date: "2026-08-01" });
    const out = articlesForProperty([older, newer], property());
    expect(out.map((a) => a.slug)).toEqual(["newer", "older"]);
  });

  it("sorts undated articles last rather than first", () => {
    const dated = article({ slug: "dated", title: "Dated", date: "2026-01-01" });
    const undated = article({ slug: "undated", title: "Undated", date: "" });
    const out = articlesForProperty([undated, dated], property());
    expect(out.map((a) => a.slug)).toEqual(["dated", "undated"]);
  });
});

describe("articlesForProperty — the property link field", () => {
  it("matches on Airtable record id", () => {
    const a = article({ relatedPropertyIds: ["rec7fH6C0M8QELk9G"], city: "Cebu City", region: "X" });
    const out = articlesForProperty([a], property());
    expect(out).toHaveLength(1);
    expect(out[0].isAboutThisProperty).toBe(true);
  });

  it("matches on slug too, for the Supabase OSINT briefings in the same feed", () => {
    const a = article({ relatedPropertyIds: ["cyber-sigma-tower-3"], city: "Cebu City", region: "X" });
    const out = articlesForProperty([a], property());
    expect(out[0].isAboutThisProperty).toBe(true);
  });

  it("does NOT match a different property's id", () => {
    const a = article({ relatedPropertyIds: ["recSOMEOTHERID"], city: "Cebu City", region: "X" });
    expect(articlesForProperty([a], property())).toEqual([]);
  });

  it("flags area matches as NOT about this property", () => {
    // The whole point of the flag: an area article must never be labelled as
    // being about this building.
    const out = articlesForProperty([article()], property());
    expect(out[0].isAboutThisProperty).toBe(false);
  });

  it("is unaffected by the field being absent, which is today's reality", () => {
    const out = articlesForProperty([article()], property());
    expect(out).toHaveLength(1);
    expect(out[0].isAboutThisProperty).toBe(false);
  });

  it("ignores a link field that is not an array", () => {
    const a = article({ relatedPropertyIds: "rec7fH6C0M8QELk9G", city: "Cebu City", region: "X" });
    expect(articlesForProperty([a], property())).toEqual([]);
  });
});

describe("articlesForProperty — defensive", () => {
  it("returns empty for missing inputs rather than throwing", () => {
    expect(articlesForProperty(null, property())).toEqual([]);
    expect(articlesForProperty([article()], null)).toEqual([]);
    expect(articlesForProperty(undefined, undefined)).toEqual([]);
  });

  it("survives null entries in the feed", () => {
    expect(() => articlesForProperty([null, article()], property())).not.toThrow();
    expect(articlesForProperty([null, article()], property())).toHaveLength(1);
  });

  it("does not match two properties that both have blank cities", () => {
    // Empty string equals empty string, which would put EVERY undated,
    // uncitied article on EVERY property with no city set.
    const out = articlesForProperty(
      [article({ city: "", region: "" })],
      property({ city: "", region: "" }),
    );
    expect(out).toEqual([]);
  });

  it("caps the list", () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      article({ slug: `a${i}`, title: `A${i}` }),
    );
    expect(articlesForProperty(many, property())).toHaveLength(8);
    expect(articlesForProperty(many, property(), { limit: 2 })).toHaveLength(2);
  });

  it("does not leak the internal rank onto the returned objects", () => {
    const out = articlesForProperty([article()], property());
    expect(out[0]._rank).toBeUndefined();
  });
});

describe("areaIntelHref", () => {
  it("points at the property's city when there is one", () => {
    expect(areaIntelHref(property())).toBe("/intel?q=Taguig");
  });

  it("falls back to the intel index rather than an empty query", () => {
    expect(areaIntelHref(property({ city: "" }))).toBe("/intel");
    expect(areaIntelHref(null)).toBe("/intel");
  });
});
