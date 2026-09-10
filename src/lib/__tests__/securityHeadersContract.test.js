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

  // ── A-123 — browser source maps are not shipped ───────────────────────────
  //
  // `productionBrowserSourceMaps: true` emitted 178 `.js.map` files: **44 MB of
  // a 57 MB build**, against ~13 MB of actual JavaScript. They were deployed on
  // every release and addressable by anyone who guessed the path — the original
  // source of a public site, served from the site.
  //
  // Sentry does not need them. Its build plugin generates and uploads its own
  // maps (gated on SENTRY_AUTH_TOKEN, not on this flag), so stack traces stay
  // de-minified. `hideSourceMaps` only removed the `sourceMappingURL` comment;
  // the files still shipped, which is why the problem survived that setting.
  //
  // Verified by rebuild on 2026-09-10: 181 new `.js` files, **0 new `.js.map`**.
  describe("A-123 source maps", () => {
    it("does not emit browser source maps in production builds", () => {
      expect(nextConfig).toContain("productionBrowserSourceMaps: false");
      expect(nextConfig).not.toMatch(/productionBrowserSourceMaps:\s*true/);
    });

    it("deletes any map that is generated anyway, after Sentry has uploaded it", () => {
      // Belt and braces: if the flag above is ever flipped back, or the Sentry
      // plugin emits its own, the client output still must not carry them.
      expect(nextConfig).toContain("deleteSourcemapsAfterUpload: true");
    });

    it("keeps hideSourceMaps, so a re-enable does not silently re-expose them", () => {
      expect(nextConfig).toContain("hideSourceMaps: true");
    });
  });
});
