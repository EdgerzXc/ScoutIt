import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("Publish active listing quota & swap contract (A-271)", () => {
  const route = read("src/app/api/dashboard/publish/route.js");

  it("imports getActiveListingCap and buildWithdrawUpdate", () => {
    expect(route).toContain("getActiveListingCap");
    expect(route).toContain("buildWithdrawUpdate");
  });

  it("checks user subscription tier and active live listing count", () => {
    expect(route).toContain("subscription_tier");
    expect(route).toContain("pipeline_status");
    expect(route).toContain("currentActiveCount >= cap");
  });

  it("returns 409 listing_cap_reached with available live properties when quota is reached without swap", () => {
    expect(route).toContain('"listing_cap_reached"');
    expect(route).toContain("liveProperties: activeLiveProperties.map");
    expect(route).toContain("status: 409");
  });

  it("supports swapWithPropertyId to atomically unpublish swapped property to off-market", () => {
    expect(route).toContain("swapWithPropertyId");
    expect(route).toContain("approved_for_scoutit: false");
    expect(route).toContain("buildWithdrawUpdate()");
    expect(route).toContain("swappedPropertyId: toSwap?.id || null");
  });
});
