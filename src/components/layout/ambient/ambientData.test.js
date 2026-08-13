import { describe, expect, it } from "vitest";
import {
  airQualityLabel,
  buildAmbientItems,
  cacheablePropertyLocation,
  compactPlaceName,
  greetingForHour,
  rainChanceFromForecast,
  weatherCondition,
} from "./ambientData";

describe("ambient information labels", () => {
  it.each([
    [5, "GOOD MORNING"],
    [11, "GOOD MORNING"],
    [12, "GOOD AFTERNOON"],
    [17, "GOOD AFTERNOON"],
    [18, "GOOD EVENING"],
    [4, "GOOD EVENING"],
  ])("uses the local-hour greeting boundary at %i", (hour, expected) => {
    expect(greetingForHour(hour)).toBe(expected);
  });

  it.each([
    [0, "GOOD"], [50, "GOOD"], [51, "MODERATE"],
    [101, "SENSITIVE GROUPS"], [151, "UNHEALTHY"],
    [201, "VERY UNHEALTHY"], [301, "HAZARDOUS"],
  ])("maps US AQI %i to its standard category", (aqi, expected) => {
    expect(airQualityLabel(aqi)).toBe(expected);
  });

  it("does not invent a condition for an unknown weather code", () => {
    expect(weatherCondition(0)).toBe("CLEAR");
    expect(weatherCondition(999)).toBeNull();
  });
  it("selects the current hour's rain probability", () => {
    expect(rainChanceFromForecast({
      current: { time: "2026-08-11T13:00" },
      hourly: {
        time: ["2026-08-11T12:00", "2026-08-11T13:00"],
        precipitation_probability: [20, 70],
      },
    })).toBe(70);
  });

  it("compacts familiar and long property locations", () => {
    expect(compactPlaceName("Bonifacio Global City, Taguig")).toBe("BGC");
    expect(compactPlaceName("Capitol Commons, Pasig City")).toBe("CAPITOL COMMONS");
  });

  it("prioritizes explicit property conditions over generic greeting content", () => {
    const items = buildAmbientItems({
      now: new Date("2026-08-11T05:00:00Z"),
      user: { firstName: "Ari" },
      ambient: {
        location: { source: "property", shortName: "BGC" },
        weather: {
          temperature: 31,
          feelsLike: 36,
          humidity: 74,
          rainChance: 70,
          condition: "PARTLY CLOUDY",
          timezone: "Asia/Manila",
        },
        air: { aqi: 32, label: "GOOD" },
      },
    });

    expect(items.map((entry) => entry.id)).not.toContain("greeting");
    expect(items.map((entry) => entry.id)).toEqual(expect.arrayContaining(["weather", "rain", "comfort", "air"]));
    expect(items.find((entry) => entry.id === "weather").mobileSegments.map((segment) => segment.text)).toEqual(["BGC", "31\u00B0C"]);
    expect(items.find((entry) => entry.id === "rain").mobileSegments.map((segment) => segment.text)).toEqual(["RAIN CHANCE", "70%"]);
    expect(items.find((entry) => entry.id === "air").mobileSegments.map((segment) => segment.text)).toEqual(["AIR GOOD", "AQI 32"]);
  });

  it("keeps generic time explicitly labelled outside property pages", () => {
    const items = buildAmbientItems({
      now: new Date("2026-08-11T05:00:00Z"),
      user: null,
      ambient: null,
    });

    expect(items[0].id).toBe("time");
    expect(items[0].mobileSegments[0].text).toBe("LOCAL TIME");
  });

  it("caches property identity without persisting coordinates", () => {
    const cached = cacheablePropertyLocation({
      contextKey: "property:ridgeline-capitol-commons",
      source: "property",
      latitude: 14.575,
      longitude: 121.06,
      shortName: "CAPITOL COMMONS",
    });

    expect(cached).toMatchObject({
      contextKey: "property:ridgeline-capitol-commons",
      source: "property",
      shortName: "CAPITOL COMMONS",
    });
    expect(cached).not.toHaveProperty("latitude");
    expect(cached).not.toHaveProperty("longitude");
  });
});
