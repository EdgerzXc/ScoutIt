import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../../next.config.mjs";
import { recoveryContentSecurityPolicy } from "../siteContentSecurityPolicy.mjs";

async function siteHeaders() {
  const rule = (await nextConfig.headers()).find(({ source }) => source === "/(.*)");
  return Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]));
}

describe("Preview content security policy", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("blocks script attributes on the enforced policy while keeping the framework bootstrap available", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    const policy = (await siteHeaders())["Content-Security-Policy"];
    const directives = policy.split(";").map((directive) => directive.trim());
    expect(directives).toContain("script-src-attr 'none'");
    expect(directives.find((directive) => directive.startsWith("script-src "))).toContain("'unsafe-inline'");
  });

  it("enforces removal of script evaluation and alternate base URLs on Preview", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    const headers = await siteHeaders();
    const enforced = headers["Content-Security-Policy"];
    expect(enforced).not.toContain("'unsafe-eval'");
    expect(enforced).toContain("base-uri 'none'");
    expect(enforced).toContain("worker-src 'self' blob:");
    expect(enforced).toContain("frame-ancestors 'none'");
    expect(enforced).toContain("script-src-attr 'none'");
    expect(headers["Content-Security-Policy-Report-Only"]).toBeUndefined();
  });

  it("limits the recovery script directive to its nonce and the three pre-paint bootstraps", async () => {
    const policy = recoveryContentSecurityPolicy("c29tZW5vbmNl");
    const script = policy.split(";").find((line) => line.trim().startsWith("script-src "));
    expect(script).toContain("'nonce-c29tZW5vbmNl' 'strict-dynamic'");
    expect(script).not.toMatch(/'unsafe-(inline|eval)'/);
    expect(script.match(/'sha256-[A-Za-z0-9+/=]+'/g)).toHaveLength(3);
    expect(policy).toContain("frame-src 'self'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("https://challenges.cloudflare.com");
    const rule = (await nextConfig.headers()).find(({ source }) => source === "/reset-password");
    expect(rule.headers).toContainEqual({ key: "Referrer-Policy", value: "no-referrer" });
    expect(rule.headers).toContainEqual({ key: "Cache-Control", value: "private, no-store" });
  });

  it.each([
    ["production", "production"],
    ["production", undefined],
    ["development", "preview"],
  ])("keeps the regular policy under NODE_ENV=%s and VERCEL_ENV=%s", async (nodeEnv, vercelEnv) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("VERCEL_ENV", vercelEnv);
    const policy = (await siteHeaders())["Content-Security-Policy"];
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("base-uri 'self'");
  });
});
