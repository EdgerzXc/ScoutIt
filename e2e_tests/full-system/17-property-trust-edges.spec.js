import { test, expect } from "@playwright/test";
import { PropertyTrustPage } from "../pages/PropertyTrustPage";

test.setTimeout(90_000);

test.describe("property trust edges", () => {
  test("classifies spatial media and renders an honest broker-roster state", async ({ page, request }) => {
    const feed = await request.get("/api/cms?type=properties");
    expect(feed.ok()).toBe(true);
    const payload = await feed.json();
    const properties = Array.isArray(payload) ? payload : payload.properties || payload.data || [];
    const property = properties.find((item) => item?.slug);
    expect(property?.slug).toBeTruthy();

    const pageErrors = [];
    const requestedUrls = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (outgoing) => requestedUrls.push(outgoing.url()));

    const trustPage = new PropertyTrustPage(page);
    await trustPage.open(property.slug);
    await trustPage.expectClassifiedSpatialMedia();

    expect(requestedUrls.some((url) => url.includes("images.unsplash.com") && url.includes("embed"))).toBe(false);
    expect(requestedUrls.some((url) => url.includes("YWayaXpaJyH"))).toBe(false);
    expect(requestedUrls.some((url) => url.includes("b86b7928-f130-40a5-8cac-8095f30eed54"))).toBe(false);
    expect(pageErrors.filter((message) => /Please log in again|localStorage.*Access is denied/i.test(message))).toEqual([]);

    await trustPage.openRoster(property.slug);
    await trustPage.expectHonestRosterState();
  });
});
