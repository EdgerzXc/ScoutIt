import { beforeEach, describe, expect, it, vi } from "vitest";

const getCmsBundle = vi.fn();
vi.mock("@/lib/cmsCache", () => ({ getCmsBundle }));

const { default: sitemap } = await import("@/app/sitemap");

beforeEach(() => getCmsBundle.mockReset());

describe("U-042 catalogue-backed sitemap", () => {
  it("advertises only live, non-sample catalogue URLs from one bundle", async () => {
    getCmsBundle.mockResolvedValue({
      source: "upstash_redis",
      properties: [
        { slug: "real-space", is_sample: false },
        { slug: "sample-space", is_sample: true },
      ],
      intel: [{ slug: "real-briefing" }],
      brokers: [{ id: "real-broker", isExample: false }, { id: "demo-broker", isExample: true }],
    });

    const urls = (await sitemap()).map((entry) => entry.url);
    expect(getCmsBundle).toHaveBeenCalledTimes(1);
    expect(urls.some((url) => url.endsWith("/property/real-space"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/intel/real-briefing"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/brokers/real-broker"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/property/sample-space"))).toBe(false);
    expect(urls.some((url) => url.endsWith("/brokers/demo-broker"))).toBe(false);
  });

  it("does not claim published URLs disappeared during a cold CMS outage", async () => {
    getCmsBundle.mockResolvedValue({ source: "empty_fallback_on_error", properties: [], intel: [], brokers: [] });
    await expect(sitemap()).rejects.toThrow("public catalogue temporarily unavailable");
  });
});
