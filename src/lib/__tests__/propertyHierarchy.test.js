import { describe, expect, it } from "vitest";
import { getChapterConfig } from "../../components/property/chapterConfig";
import {
  CHILD_SPACE_LEVEL_LABEL,
  PROPERTY_LEVEL_LABEL,
  childSpaceDisplayName,
  getPropertyHierarchy,
} from "../propertyHierarchy";

describe("property hierarchy labels", () => {
  it.each([
    ["Residential", "Units", "Unit"],
    ["Commercial Office", "Available Spaces", "Space"],
    ["Hospitality Resort", "Rooms & Facilities", "Room"],
    ["Culinary Restaurant", "Areas", "Area"],
    ["Event Venue", "Zones", "Zone"],
  ])("maps %s to category-natural child language", (category, collectionLabel, childLabel) => {
    expect(getPropertyHierarchy({ spaceCategory: category })).toMatchObject({ collectionLabel, childLabel });
  });

  it.each([
    ["Residential", "Units"],
    ["Commercial", "Available Spaces"],
    ["STR", "Rooms & Facilities"],
    ["Hospitality", "Rooms & Facilities"],
    ["Restaurants", "Areas"],
    ["Venues", "Zones"],
  ])("keeps the %s collection label in chapter navigation", (category, label) => {
    const chapter = getChapterConfig({ spaceCategory: category }).find((item) => item.id === "units");
    expect(chapter.navLabel).toBe(label);
    expect(chapter.chapterLabel).toBe(label);
  });

  it("uses explicit, stable level labels", () => {
    expect(PROPERTY_LEVEL_LABEL).toBe("Property level");
    expect(CHILD_SPACE_LEVEL_LABEL).toBe("Child-space level");
  });

  it("corrects only generic sample child names", () => {
    const sampleVenue = { spaceCategory: "Event Venue", is_sample: true };
    expect(childSpaceDisplayName("Unit 03", 0, sampleVenue)).toBe("Zone 03");
    expect(childSpaceDisplayName("test-unit-2", 0, { spaceCategory: "Commercial", slug: "one-ecom-center" })).toBe("Space 2");
    expect(childSpaceDisplayName("12321321312312", 3, { spaceCategory: "Venues", slug: "the-foundry-warehouse-district-bgc" })).toBe("Zone 04");
    expect(childSpaceDisplayName("Grand Ballroom", 0, sampleVenue)).toBe("Grand Ballroom");
    expect(childSpaceDisplayName("Unit 03", 0, { ...sampleVenue, is_sample: false })).toBe("Unit 03");
  });

  it("generates a category-natural fallback", () => {
    expect(childSpaceDisplayName("", 1, { spaceCategory: "Hospitality" })).toBe("Room 02");
  });
});
