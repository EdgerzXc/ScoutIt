import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cmsCache", () => ({
  getCmsBundle: vi.fn(async () => ({ source: "empty_fallback_on_error", properties: [] })),
}));

const { GET } = await import("@/app/api/preload/public/route");

describe("U-042 anonymous first-visit preload", () => {
  it("does not cache or mark a failed CMS read as a successful empty catalogue", async () => {
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(await response.json()).not.toHaveProperty("properties");
  });
});
