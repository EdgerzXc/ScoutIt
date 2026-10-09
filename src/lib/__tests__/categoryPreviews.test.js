import { describe, it, expect, vi } from "vitest";
import {
  METROPOLIS_CATEGORIES,
  buildCategoryPreviews,
  getCategoryCounts,
  filterCategoryPreviews,
  loadCategoryPreviews,
} from "../categoryPreviews";

describe("Layer 03 Metropolis Category Previews Engine (A-179)", () => {
  const sampleProperties = [
    {
      id: "prop-res-1",
      slug: "one-roxas-triangle-makati",
      title: "One Roxas Triangle",
      spaceCategory: "Residential Condo",
      type: "High-Rise Luxury",
      city: "Makati City",
      bedrooms: 3,
      sqm: 310,
      image: "https://example.com/roxas.jpg",
    },
    {
      id: "prop-comm-1",
      slug: "one-ecom-center",
      title: "One E-Com Center",
      spaceCategory: "Commercial Office",
      type: "PEZA IT Facility",
      city: "Pasay City",
      building_grade: "Grade A",
      sqm: 1250,
      photos: ["https://example.com/one-ecom.jpg"],
    },
    {
      id: "prop-str-1",
      slug: "bgc-loft-penthouse",
      title: "BGC Loft Penthouse",
      spaceCategory: "Short-Term Rental",
      type: "Serviced Loft",
      city: "Taguig",
      guests: 6,
      bedrooms: 2,
    },
    {
      id: "prop-hosp-1",
      slug: "el-nido-cliffside-villa",
      title: "El Nido Cliffside Villa",
      spaceCategory: "Hospitality Resort",
      type: "Eco-Boutique Villa",
      city: "El Nido, Palawan",
      sqm: 450,
    },
    {
      id: "prop-rest-1",
      slug: "salcedo-bistro-space",
      title: "Salcedo Bistro Prime Space",
      spaceCategory: "Culinary / Restaurant",
      type: "Commercial Dining",
      city: "Makati City",
      seating_capacity: 85,
    },
    {
      id: "prop-venue-1",
      slug: "the-foundry-warehouse-district-bgc",
      title: "The Foundry BGC",
      spaceCategory: "Event Venue",
      type: "Industrial Creative",
      city: "Taguig",
      standing_capacity: 450,
    },
  ];

  it("exports the 6 canonical Metropolis categories in exact order", () => {
    expect(METROPOLIS_CATEGORIES).toEqual([
      "Residential",
      "Commercial",
      "STR",
      "Hospitality",
      "Restaurants",
      "Venues",
    ]);
  });

  it("builds category previews and routes properties to correct buckets", () => {
    const previews = buildCategoryPreviews(sampleProperties);

    expect(previews.Residential).toHaveLength(1);
    expect(previews.Residential[0].slug).toBe("one-roxas-triangle-makati");
    expect(previews.Residential[0].title).toBe("One Roxas Triangle");
    expect(previews.Residential[0].city).toBe("Makati City");
    expect(previews.Residential[0].image).toBe("https://example.com/roxas.jpg");

    expect(previews.Commercial).toHaveLength(1);
    expect(previews.Commercial[0].slug).toBe("one-ecom-center");
    expect(previews.Commercial[0].image).toBe("https://example.com/one-ecom.jpg");

    expect(previews.STR).toHaveLength(1);
    expect(previews.STR[0].slug).toBe("bgc-loft-penthouse");

    expect(previews.Hospitality).toHaveLength(1);
    expect(previews.Hospitality[0].slug).toBe("el-nido-cliffside-villa");

    expect(previews.Restaurants).toHaveLength(1);
    expect(previews.Restaurants[0].slug).toBe("salcedo-bistro-space");

    expect(previews.Venues).toHaveLength(1);
    expect(previews.Venues[0].slug).toBe("the-foundry-warehouse-district-bgc");
  });

  it("generates colon-separated tags compatible with Metropolis card splitting", () => {
    const previews = buildCategoryPreviews(sampleProperties);

    for (const cat of METROPOLIS_CATEGORIES) {
      const items = previews[cat];
      for (const item of items) {
        expect(item.tags.length).toBeGreaterThanOrEqual(1);
        for (const tag of item.tags) {
          const parts = tag.split(":");
          expect(parts.length).toBeGreaterThanOrEqual(2);
          const [label, ...val] = parts;
          expect(label.trim().length).toBeGreaterThan(0);
          expect(val.join(":").trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("formats key metrics per category accurately", () => {
    const previews = buildCategoryPreviews(sampleProperties);

    // Residential bedroom metric
    const res = previews.Residential[0];
    expect(res.tags).toContain("Beds: 3 BR");

    // Commercial grade metric
    const comm = previews.Commercial[0];
    expect(comm.tags).toContain("Grade: Grade A");

    // STR capacity metric
    const str = previews.STR[0];
    expect(str.tags).toContain("Guests: Up to 6");

    // Restaurant seating metric
    const rest = previews.Restaurants[0];
    expect(rest.tags).toContain("Seating: 85 seats");

    // Venue pax metric
    const venue = previews.Venues[0];
    expect(venue.tags).toContain("Capacity: 450 pax");
  });

  it("counts properties across all categories accurately", () => {
    const previews = buildCategoryPreviews(sampleProperties);
    const { counts, total } = getCategoryCounts(previews);

    expect(counts.Residential).toBe(1);
    expect(counts.Commercial).toBe(1);
    expect(counts.STR).toBe(1);
    expect(counts.Hospitality).toBe(1);
    expect(counts.Restaurants).toBe(1);
    expect(counts.Venues).toBe(1);
    expect(total).toBe(6);
  });

  it("filters properties by search query matching title, city, or tags", () => {
    const previews = buildCategoryPreviews(sampleProperties);

    // Filter by title
    const searchTitle = filterCategoryPreviews(previews, "Residential", "Roxas");
    expect(searchTitle).toHaveLength(1);
    expect(searchTitle[0].title).toBe("One Roxas Triangle");

    // Filter by city
    const searchCity = filterCategoryPreviews(previews, "Commercial", "Pasay");
    expect(searchCity).toHaveLength(1);

    // Filter by tag
    const searchTag = filterCategoryPreviews(previews, "Commercial", "PEZA");
    expect(searchTag).toHaveLength(1);

    // Non-matching query returns empty array
    const searchNone = filterCategoryPreviews(previews, "Residential", "Davao");
    expect(searchNone).toHaveLength(0);

    // Empty search query returns all
    const all = filterCategoryPreviews(previews, "Residential", "");
    expect(all).toHaveLength(1);
  });

  it("handles empty or malformed property arrays honestly without crashing", () => {
    const empty1 = buildCategoryPreviews([]);
    expect(getCategoryCounts(empty1).total).toBe(0);

    const empty2 = buildCategoryPreviews(null);
    expect(getCategoryCounts(empty2).total).toBe(0);

    const empty3 = buildCategoryPreviews([null, undefined, {}, { spaceCategory: "Unknown" }]);
    expect(getCategoryCounts(empty3).total).toBe(0);
  });
});
