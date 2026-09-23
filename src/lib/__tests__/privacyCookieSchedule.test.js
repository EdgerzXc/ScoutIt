import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// A-151 — the /privacy notice must name what the browser actually stores and
// who else processes data (RA 10173 right to be informed), and GA4-grade
// tracking must sit behind Consent Mode v2 default-denied.
//
// (Rule 19: written first and watched failing — /privacy named no cookie and
// four active processors were undisclosed; the GA snippet configured storage
// with no consent default.)

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("A-151 — cookie schedule and processor disclosure", () => {
  it("renders a cookie schedule naming the real identifiers", () => {
    const src = read("src/app/privacy/page.js");
    expect(src).toContain("Cookie");
    expect(src).toContain("scout_did");
    // scout_did mirrors to a cookie for one year, SameSite=Lax
    // (src/lib/deviceTracker.js) — the schedule must say so, not less.
    expect(src).toMatch(/31536000|1 year|one year/i);
    expect(src).toContain("SameSite");
    expect(src).toContain("Supabase");
    expect(src).toContain("localStorage");
  });

  it("discloses the processors package.json actually ships", () => {
    const src = read("src/app/privacy/page.js");
    for (const vendor of ["Sentry", "Turnstile", "CARTO", "Analytics"]) {
      expect(src).toContain(vendor);
    }
  });

  it("GA4 sits behind Consent Mode v2 default-denied", () => {
    const src = read("src/components/analytics/GoogleAnalytics.js");
    expect(src).toContain("consent");
    expect(src).toContain("denied");
  });

  it("the consent banner exists, stays silent without GA, and persists choice", () => {
    const src = read("src/components/analytics/CookieConsent.js");
    expect(src).toContain("NEXT_PUBLIC_GA_ID");
    expect(src).toContain("process.env.NEXT_PUBLIC_GA_ID");
    expect(src).toContain("return null");
    // The key lives in one module; the banner must reference it by name, not
    // by a second literal that can drift from the helper.
    expect(src).toContain("COOKIE_CONSENT_KEY");
    expect(src).toContain("localStorage.getItem(COOKIE_CONSENT_KEY)");
    expect(src).toContain("/privacy");
  });

  it("the consent helper defaults to denied and round-trips a choice", async () => {
    const store = {};
    const localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v);
      },
    };
    vi.stubGlobal("localStorage", localStorage);
    const { getCookieConsent, setCookieConsent } = await import(
      "@/lib/cookieConsent.js"
    );
    expect(getCookieConsent()).toBe("denied");
    setCookieConsent("granted");
    expect(getCookieConsent()).toBe("granted");
    setCookieConsent("nonsense");
    expect(getCookieConsent()).toBe("denied");
    vi.unstubAllGlobals();
  });

  it("contrast verification runs inside npm run verify", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.scripts["verify:contrast"]).toContain("verify-contrast");
    expect(pkg.scripts.verify).toContain("verify:contrast");
  });
});
