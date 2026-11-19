import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../../next.config.mjs";

async function siteHeaders() {
  const rule = (await nextConfig.headers()).find(({ source }) => source === "/(.*)");
  return Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]));
}

describe("Preview CSP evaluation trial", () => {
  afterEach(() => vi.unstubAllEnvs());

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
