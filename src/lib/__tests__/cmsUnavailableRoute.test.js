import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cmsCache", () => ({
  getCmsBundle: vi.fn(async () => ({ source: "empty_fallback_on_error", properties: [] })),
}));
vi.mock("@/lib/serverAuth", () => ({ resolveServerTier: vi.fn() }));
vi.mock("@/lib/premiumFields", () => ({
  findPremiumLeak: vi.fn(),
  stripPremiumFields: vi.fn(),
}));

const { GET } = await import("@/app/api/cms/route");

describe("U-042 unavailable catalogue", () => {
  it("returns an uncacheable 503 rather than a successful empty inventory", async () => {
    const response = await GET(new Request("http://localhost/api/cms?scope=public"));
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Retry-After")).toBe("60");
    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body).not.toHaveProperty("properties");
  });
});
