import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../../next.config.mjs";
import { recoveryContentSecurityPolicy } from "../siteContentSecurityPolicy.mjs";

async function siteHeaders() {
  const rule = (await nextConfig.headers()).find(({ source }) => source === "/(.*)");
  return Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]));
}

describe("Preview CSP evaluation trial", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("blocks script attributes on the enforced policy while keeping the framework bootstrap available", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    const policy = (await siteHeaders())["Content-Security-Policy"];
    const directives = policy.split(";").map((directive) => directive.trim());
    expect(directives).toContain("script-src-attr 'none'");
    expect(directives.find((directive) => directive.startsWith("script-src "))).toContain("'unsafe-inline'");
  });

  it("reports removal of script evaluation on Preview while keeping the current enforced policy", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    const headers = await siteHeaders();
    const enforced = headers["Content-Security-Policy"];
    const trial = headers["Content-Security-Policy-Report-Only"];
    expect(enforced).toMatch(/script-src[^;]*'unsafe-eval'/);
    expect(trial).toBe(enforced.replace(" 'unsafe-eval'", ""));
    expect(trial).toContain("worker-src 'self' blob:");
    expect(trial).toContain("frame-ancestors 'none'");
  });

  it("limits the recovery script directive to its nonce and the three pre-paint bootstraps", async () => {
    const policy = recoveryContentSecurityPolicy("c29tZW5vbmNl");
    const script = policy.split(";").find((line) => line.trim().startsWith("script-src "));
    expect(script).toContain("'nonce-c29tZW5vbmNl' 'strict-dynamic'");
    expect(script).not.toMatch(/'unsafe-(inline|eval)'/);
    expect(script.match(/'sha256-[A-Za-z0-9+/=]+'/g)).toHaveLength(3);
    expect(policy).toContain("frame-src 'self'");
    expect(policy).toContain("https://challenges.cloudflare.com");
    const rule = (await nextConfig.headers()).find(({ source }) => source === "/reset-password");
    expect(rule.headers).toContainEqual({ key: "Referrer-Policy", value: "no-referrer" });
    expect(rule.headers).toContainEqual({ key: "Cache-Control", value: "private, no-store" });
  });

  it.each([
    ["production", "production"],
    ["production", undefined],
    ["development", "preview"],
  ])("omits the report-only trial under NODE_ENV=%s and VERCEL_ENV=%s", async (nodeEnv, vercelEnv) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("VERCEL_ENV", vercelEnv);
    expect((await siteHeaders())["Content-Security-Policy-Report-Only"]).toBeUndefined();
  });
});
