import { describe, test, expect } from "vitest";

import {
  ARTICLES,
  EVENT_TYPES,
  SPACE_TYPES,
  getSignals,
  getTerritories,
  filterByInvestigation,
} from "./mockArticles";
import { INVESTIGATIONS, getInvestigation, hasInvestigation } from "./investigations";
import { distanceKm, articlesNear, formatDistance } from "@/lib/geo";

/*
 * Layer 02 — Stratosphere / Discover / Intel.
 *
 * These lock the contracts the three surfaces share. The layer previously
 * broke because two article datasets drifted apart and disagreed about the
 * same slug; the point of these tests is that such a drift fails loudly.
 */

describe("article dataset integrity", () => {
  test("every article carries both axes and coordinates", () => {
    for (const art of ARTICLES) {
      expect(art.slug, "slug").toBeTruthy();
      expect(art.event, `event on ${art.slug}`).toBeTruthy();
      expect(art.category, `category on ${art.slug}`).toBeTruthy();
      expect(typeof art.lat, `lat on ${art.slug}`).toBe("number");
      expect(typeof art.lng, `lng on ${art.slug}`).toBe("number");
    }
  });

  test("no article is tagged outside the declared taxonomies", () => {
    const strays = ARTICLES.filter(
      (a) => !EVENT_TYPES.includes(a.event) || !SPACE_TYPES.includes(a.category)
    );
    expect(strays.map((a) => a.slug)).toEqual([]);
  });

  test("slugs are unique", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("a signal is an article carrying a status badge", () => {
    const signals = getSignals();
    expect(signals.length).toBeGreaterThan(0);
    for (const s of signals) {
      expect(s.status).toBeTruthy();
      expect(ARTICLES).toContain(s);
    }
  });

  test("territories are derived from the data, never hardcoded", () => {
    const territories = getTerritories();
    for (const art of ARTICLES) {
      expect(territories).toContain(art.city);
    }
  });
});

describe("investigation dossiers", () => {
  test("every dossier joins onto a real article slug", () => {
    const slugs = new Set(ARTICLES.map((a) => a.slug));
    for (const d of INVESTIGATIONS) {
      expect(slugs.has(d.slug), `orphan dossier: ${d.slug}`).toBe(true);
    }
  });

  test("every dossier has all eight chapters plus its evidence", () => {
    for (const d of INVESTIGATIONS) {
      for (let n = 1; n <= 8; n += 1) {
        const key = `chapter0${n}`;
        expect(d.investigation[key], `${d.slug} ${key}`).toBeTruthy();
      }
      expect(Array.isArray(d.investigation.evidenceSources)).toBe(true);
    }
  });

  test("lookup returns null for an article with no dossier", () => {
    expect(getInvestigation("no-such-article")).toBeNull();
    expect(hasInvestigation("no-such-article")).toBe(false);
  });
});

describe("the shared investigation query", () => {
  test("an unset slot does not filter on that axis", () => {
    expect(filterByInvestigation(ARTICLES, {})).toHaveLength(ARTICLES.length);
  });

  test("event and place narrow together", () => {
    const hits = filterByInvestigation(ARTICLES, {
      event: "Zoning",
      place: "Makati CBD",
    });
    expect(hits.map((a) => a.slug)).toEqual(["green-office-demand"]);
  });

  test("space type filters on the other axis independently", () => {
    const hits = filterByInvestigation(ARTICLES, { space: "Commercial" });
    expect(hits.every((a) => a.category === "Commercial")).toBe(true);
  });

  test("a query matching nothing returns empty, not everything", () => {
    const hits = filterByInvestigation(ARTICLES, { place: "Nowhere City" });
    expect(hits).toEqual([]);
  });
});

describe("radar distance filtering", () => {
  // Makati CBD, the default radar centre.
  const CENTER = { lat: 14.5547, lng: 121.0244 };

  const within = (radiusKm) =>
    ARTICLES.filter(
      (a) => distanceKm(CENTER.lat, CENTER.lng, a.lat, a.lng) <= radiusKm
    ).map((a) => a.slug);

  test("distance to itself is zero", () => {
    expect(distanceKm(CENTER.lat, CENTER.lng, CENTER.lat, CENTER.lng)).toBeCloseTo(0, 5);
  });

  test("a tight radius keeps only the article at that point", () => {
    expect(within(1)).toEqual(["green-office-demand"]);
  });

  test("widening the radius only ever adds articles", () => {
    const small = within(5);
    const large = within(40);
    for (const slug of small) expect(large).toContain(slug);
    expect(large.length).toBeGreaterThanOrEqual(small.length);
  });

  test("a Metro Manila radius excludes Siargao and Palawan", () => {
    const hits = within(30);
    expect(hits).not.toContain("surf-front-land-rush");
    expect(hits).not.toContain("off-grid-island-living");
  });

  test("a national radius reaches everything", () => {
    expect(within(1200).length).toBe(ARTICLES.length);
  });

  test("Makati to BGC is roughly 3km", () => {
    const bgc = ARTICLES.find((a) => a.slug === "bgc-spatial-movement");
    const d = distanceKm(CENTER.lat, CENTER.lng, bgc.lat, bgc.lng);
    expect(d).toBeGreaterThan(1);
    expect(d).toBeLessThan(6);
  });
});

describe("articlesNear — the one function behind both directions", () => {
  const MAKATI = { lat: 14.5547, lng: 121.0244 };

  test("annotates each hit with its distance, nearest first", () => {
    const near = articlesNear(ARTICLES, MAKATI.lat, MAKATI.lng, 40);
    expect(near.length).toBeGreaterThan(1);
    for (let i = 1; i < near.length; i += 1) {
      expect(near[i].distanceKm).toBeGreaterThanOrEqual(near[i - 1].distanceKm);
    }
  });

  test("rows without coordinates are dropped, not treated as distance zero", () => {
    const withUntagged = [...ARTICLES, { slug: "no-coords", title: "Untagged" }];
    const near = articlesNear(withUntagged, MAKATI.lat, MAKATI.lng, 1200);
    expect(near.map((a) => a.slug)).not.toContain("no-coords");
  });

  test("a null radius means unbounded, still sorted nearest first", () => {
    const all = articlesNear(ARTICLES, MAKATI.lat, MAKATI.lng, null);
    expect(all.length).toBe(ARTICLES.length);
    expect(all[0].slug).toBe("green-office-demand");
  });

  test("a missing centre returns empty rather than throwing", () => {
    expect(articlesNear(ARTICLES, null, null, 10)).toEqual([]);
  });
});

describe("formatDistance", () => {
  test("sub-kilometre reads in metres", () => {
    expect(formatDistance(0.42)).toBe("420 m");
  });

  test("a kilometre and over reads in kilometres", () => {
    expect(formatDistance(4.24)).toBe("4.2 km");
  });

  test("nothing to format produces nothing, not NaN", () => {
    expect(formatDistance(null)).toBe("");
    expect(formatDistance(NaN)).toBe("");
  });
});

describe("ready to contain articles — growth without code edits", () => {
  /*
   * The map used to hardcode zone polygons and 3D footprints keyed to six
   * specific slugs, so a seventh article silently got no zone, no footprint
   * and no label. These lock the property that adding an article requires
   * editing nothing but the data.
   */
  const NEW_ARTICLE = {
    slug: "cebu-it-park-densification",
    title: "Cebu IT Park Vertical Densification Order",
    category: "Commercial",
    event: "Zoning",
    city: "Cebu IT Park",
    region: "Visayas",
    lat: 10.3272,
    lng: 123.9058,
    status: "ORDINANCE FILED",
    excerpt: "Height limits lifted across the IT Park perimeter blocks.",
  };

  const grown = [...ARTICLES, NEW_ARTICLE];

  test("a brand new article is reachable by both axes with no code change", () => {
    const byEvent = filterByInvestigation(grown, { event: "Zoning" });
    const bySpace = filterByInvestigation(grown, { space: "Commercial" });
    expect(byEvent.map((a) => a.slug)).toContain(NEW_ARTICLE.slug);
    expect(bySpace.map((a) => a.slug)).toContain(NEW_ARTICLE.slug);
  });

  test("a brand new article joins the radar by its own coordinates", () => {
    const near = articlesNear(grown, NEW_ARTICLE.lat, NEW_ARTICLE.lng, 5);
    expect(near[0].slug).toBe(NEW_ARTICLE.slug);
    expect(near[0].distanceKm).toBeLessThan(0.001);
  });

  test("a brand new territory appears without touching a territory list", () => {
    const derived = [...new Set(grown.map((a) => a.city))];
    expect(derived).toContain(NEW_ARTICLE.city);
  });

  test("an article with a status becomes a signal automatically", () => {
    const signals = grown.filter((a) => Boolean(a.status));
    expect(signals.map((a) => a.slug)).toContain(NEW_ARTICLE.slug);
  });

  test("an article with no dossier still resolves — the section just hides", () => {
    expect(hasInvestigation(NEW_ARTICLE.slug)).toBe(false);
    expect(getInvestigation(NEW_ARTICLE.slug)).toBeNull();
  });

  test("scales: a thousand articles filter without special-casing", () => {
    const many = Array.from({ length: 1000 }, (_, i) => ({
      slug: `bulk-${i}`,
      title: `Bulk signal ${i}`,
      category: SPACE_TYPES[i % SPACE_TYPES.length],
      event: EVENT_TYPES[i % EVENT_TYPES.length],
      city: `Territory ${i % 40}`,
      lat: 14 + (i % 100) / 100,
      lng: 121 + (i % 100) / 100,
    }));
    const zoning = filterByInvestigation(many, { event: "Zoning" });
    expect(zoning.length).toBe(250);
    const near = articlesNear(many, 14, 121, 5);
    expect(near.length).toBeGreaterThan(0);
    for (let i = 1; i < near.length; i += 1) {
      expect(near[i].distanceKm).toBeGreaterThanOrEqual(near[i - 1].distanceKm);
    }
  });
});
