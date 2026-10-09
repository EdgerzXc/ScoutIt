import { describe, it, expect } from "vitest";
import { cleanPropertyUrl, buildShareUrl } from "@/lib/shareAttribution";

describe("VIA Share Modal & Studio URL Building (A-186 Phase 2)", () => {
  function computeViaBaseUrl(rawUrl, promoterSlug) {
    const cleanRaw = cleanPropertyUrl(rawUrl);
    if (!cleanRaw) return "";
    const cleanPromoter = promoterSlug ? promoterSlug.trim().toLowerCase() : "";
    if (cleanPromoter && !cleanRaw.includes("/via/")) {
      const propMatch = cleanRaw.match(/^(https?:\/\/[^\/]+)?(\/property\/[^\/\?\#]+)/i);
      if (propMatch) {
        return `${propMatch[0]}/via/${encodeURIComponent(cleanPromoter)}`;
      }
    }
    return cleanRaw;
  }

  it("appends /via/[promoterSlug] to standard property URLs", () => {
    const url = "https://scoutit.space/property/one-ecom-center";
    const withPromoter = computeViaBaseUrl(url, "marco-polo");
    expect(withPromoter).toBe("https://scoutit.space/property/one-ecom-center/via/marco-polo");

    const shareUrl = buildShareUrl(withPromoter, { channel: "whatsapp" });
    expect(shareUrl).toContain("https://scoutit.space/property/one-ecom-center/via/marco-polo");
    expect(shareUrl).toContain("utm_medium=share");
  });

  it("leaves already-attributed VIA URLs intact without duplication", () => {
    const existingViaUrl = "https://scoutit.space/property/one-ecom-center/via/existing-broker";
    const result = computeViaBaseUrl(existingViaUrl, "new-broker");
    expect(result).toBe("https://scoutit.space/property/one-ecom-center/via/existing-broker");
  });

  it("returns base property URL unchanged if promoterSlug is empty", () => {
    const url = "https://scoutit.space/property/one-ecom-center";
    expect(computeViaBaseUrl(url, "")).toBe("https://scoutit.space/property/one-ecom-center");
    expect(computeViaBaseUrl(url, "   ")).toBe("https://scoutit.space/property/one-ecom-center");
    expect(computeViaBaseUrl(url, null)).toBe("https://scoutit.space/property/one-ecom-center");
  });
});
