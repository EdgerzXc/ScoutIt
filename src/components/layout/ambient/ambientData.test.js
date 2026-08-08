import { describe, expect, it } from "vitest";
import { airQualityLabel, greetingForHour, weatherCondition } from "./ambientData";

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
});
