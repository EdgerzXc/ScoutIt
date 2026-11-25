import fs from "node:fs";
import path from "node:path";

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("emergency read-only operational contract", () => {
  it("keeps the proxy response and operator confirmation aligned", () => {
    const proxy = read("src/proxy.js");
    const panel = read("src/components/admin/FeatureConsolePanel.js");
    const staff = read("mission-control/src/app/dashboard/features/page.js");
    const flags = read("src/app/api/admin/feature-flags/route.js");

    expect(proxy).toContain("flags.global_read_only === true");
    expect(proxy).toContain("status: 503");
    expect(panel).toContain("HTTP 503 Service Unavailable");
    for (const control of [panel, staff, flags]) {
      expect(control).toContain("Direct Supabase writes");
      expect(control).toContain("scheduled jobs");
    }
    expect(panel).not.toContain("HTTP 423 Locked");
  });

  it("freezes mutations while preserving reads and authentication", () => {
    const proxy = read("src/proxy.js");
    expect(proxy).toContain("['GET', 'HEAD', 'OPTIONS']");
    expect(proxy).toContain("!path.startsWith('/api/auth/')");
    expect(proxy).toContain("This action is paused for maintenance.");
  });
});
