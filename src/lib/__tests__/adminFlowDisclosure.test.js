import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const read = (path) => fs.readFileSync(path, "utf8");
let staffCheck;

vi.mock("@/lib/adminGuard", () => ({ requireAdmin: (...args) => staffCheck(...args) }));

const flow = await import("@/app/api/admin/flow/route");
const access = await import("@/app/api/admin/access/route");
const request = new Request("https://scoutit.space/api/admin/flow");

describe("staff flow delivery", () => {
  beforeEach(() => { staffCheck = vi.fn(); });

  it.each([401, 403, 503])("returns %i with no graph for a failed staff check", async (status) => {
    staffCheck.mockResolvedValue({ error: "Denied", status });
    for (const route of [flow, access]) {
      const response = await route.GET(request);
      expect(response.status).toBe(status);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(await response.json()).toEqual({ error: "Denied" });
    }
  });

  it("serves the internal dataset only after the staff check and never caches it", async () => {
    staffCheck.mockResolvedValue({ userId: "staff" });
    const response = await flow.GET(request);
    expect(staffCheck).toHaveBeenCalledWith(request, { label: "ADMIN FLOW" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const data = await response.json();
    expect(data.nodes.some(({ id }) => id === "rec_manual_approval_queue")).toBe(true);
    expect(data.edges.length).toBeGreaterThan(0);
    expect(await (await access.GET(request)).json()).toEqual({ allowed: true });
  });
});

describe("browser guide and telemetry projection", () => {
  it("gives browser telemetry only route and node identifiers for non-staff routes", () => {
    const routes = JSON.parse(read("src/data/flow/browserFlowRoutes.json"));
    const keys = new Set(["id", "route", "canonicalId", "domain", "actorRoles"]);
    expect(routes.some(({ id }) => id === "deal_room")).toBe(true);
    for (const entry of routes) {
      expect(entry.route).not.toMatch(/^\/(?:api\/)?admin(?:\/|$)/);
      expect(Object.keys(entry).every((key) => keys.has(key))).toBe(true);
    }
  });

  it("keeps guide help lazy and passes the verified staff response into the viewer", () => {
    const toolbox = read("src/components/ui/FloatingToolbox.js");
    expect(toolbox).toContain('fetch("/api/profile/me/role",');
    expect(toolbox).toContain("scoutit_journey_guide_v1");
    expect(toolbox).toContain('import("@/lib/journeyGuides")');
    expect(read("src/app/admin/flow/page.js")).toContain('useStaffRead("/api/admin/flow")');
    expect(read("src/app/admin/flow/page.js")).toContain("<MasterFlowGraph nodes={data.nodes} edges={data.edges}");
    for (const file of ["src/lib/journeyGuides.js", "src/lib/reportError.js", "src/components/flow/MasterFlowGraph.js"]) {
      expect(read(file)).not.toContain("masterFlowGraphData");
    }
  });
});
