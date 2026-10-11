import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanPropertyUrl, buildShareUrl, computeViaBaseUrl } from "@/lib/shareAttribution";

describe("VIA Share Modal & Studio URL Building (A-186 Phase 2, A-193 gating)", () => {
  const url = "https://scoutit.space/property/one-ecom-center";

  it("appends /via/[promoterSlug] only when the server-verified slug is supplied", () => {
    const withPromoter = computeViaBaseUrl(url, "marco-polo");
    expect(withPromoter).toBe("https://scoutit.space/property/one-ecom-center/via/marco-polo");

    const shareUrl = buildShareUrl(withPromoter, { channel: "whatsapp" });
    expect(shareUrl).toContain("https://scoutit.space/property/one-ecom-center/via/marco-polo");
    expect(shareUrl).toContain("utm_medium=share");
  });

  it("returns the clean public canonical URL when there is no verified slug", () => {
    expect(computeViaBaseUrl(url, "")).toBe(url);
    expect(computeViaBaseUrl(url, "   ")).toBe(url);
    expect(computeViaBaseUrl(url, null)).toBe(url);
    expect(computeViaBaseUrl(url)).toBe(url);
  });

  it("A-193 tier 4: a visitor on someone else's VIA page re-shares the public link, not that person's Position Zero", () => {
    const existingViaUrl = "https://scoutit.space/property/one-ecom-center/via/existing-broker";
    expect(computeViaBaseUrl(existingViaUrl, null)).toBe(url);
  });

  it("an eligible sharer's own slug replaces any inherited one — never stacks", () => {
    const inherited = "https://scoutit.space/property/one-ecom-center/via/existing-broker";
    expect(computeViaBaseUrl(inherited, "my-slug")).toBe(
      "https://scoutit.space/property/one-ecom-center/via/my-slug"
    );
  });

  it("strips query/hash and rejects unsafe slug shapes", () => {
    expect(computeViaBaseUrl(`${url}?utm_source=x#top`, "ok-slug")).toBe(`${url}/via/ok-slug`);
    for (const bad of ["../admin", "a/b", "A B", "x?y=1", "<script>"]) {
      expect(computeViaBaseUrl(url, bad), bad).toBe(url);
    }
  });

  it("works with a relative path and leaves non-property URLs untouched", () => {
    expect(computeViaBaseUrl("/property/abc", "s1")).toBe("/property/abc/via/s1");
    expect(computeViaBaseUrl("https://scoutit.space/intel/x", "s1")).toBe(cleanPropertyUrl("https://scoutit.space/intel/x"));
    expect(computeViaBaseUrl("", "s1")).toBe("");
  });
});

describe("A-193 ShareModal source contract", () => {
  const src = readFileSync(join(process.cwd(), "src/components/property/ShareModal.js"), "utf8");

  it("no longer offers a free-text promoter slug input", () => {
    expect(src).not.toMatch(/aria-label="VIA Promoter Slug"/);
    expect(src).not.toMatch(/Add broker slug/);
    expect(src).not.toMatch(/setPromoterSlug/);
  });

  it("auto-detects eligibility from the server and shows the verified badge", () => {
    expect(src).toContain("/via/eligibility");
    expect(src).toContain("Verified VIA Priority Link");
    expect(src).toContain("computeViaBaseUrl");
  });

  it("defaults to the public canonical link and never renders an error gate", () => {
    expect(src).toMatch(/PUBLIC_VIA/);
    expect(src).not.toMatch(/not authori[sz]ed/i);
  });
});
