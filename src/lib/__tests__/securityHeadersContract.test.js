import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const nextConfig = readFileSync("next.config.mjs", "utf8");

describe("A-055 transport security headers", () => {
  it("commits to HTTPS for a year, not a day", () => {
    // At max-age=86400 a visitor who did not return within a day was
    // unprotected again — which is exactly the window a downgrade attack
    // wants. The ramp to a year was documented and its condition (stable
    // HTTPS on the custom domain) is met.
    expect(nextConfig).toContain("'max-age=31536000; includeSubDomains'");
    expect(nextConfig).not.toContain("'max-age=86400'");
  });

  it("still does not preload", () => {
    // Preload is a submission to a browser-vendor list and is effectively
    // permanent. It needs its own decision, not a side effect.
    expect(nextConfig).not.toMatch(/Strict-Transport-Security[\s\S]{0,200}preload/);
  });

  it("keeps the other transport headers in place", () => {
    expect(nextConfig).toContain("X-Content-Type-Options");
    expect(nextConfig).toContain("X-Frame-Options");
    expect(nextConfig).toContain("Referrer-Policy");
    expect(nextConfig).toContain("Permissions-Policy");
  });
});
