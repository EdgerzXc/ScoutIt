import { describe, it, expect, vi, beforeEach } from "vitest";

const resolveUserId = vi.fn();
const findProperty = vi.fn();
const getStatus = vi.fn(async () => ({ status: "READY" }));
let profile = null;

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: (...a) => resolveUserId(...a) }));
vi.mock("@/lib/propertyLookup", () => ({ findProperty: (...a) => findProperty(...a) }));
vi.mock("@/lib/serverSpatialStudio", () => ({ getSpatialPropertyStatus: (...a) => getStatus(...a) }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile }) }) }),
    }),
  },
}));

import { GET } from "@/app/api/spatial/status/route";

const req = () => new Request("http://localhost/api/spatial/status?property_id=p1");

describe("A-299 spatial status auth gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profile = null;
  });

  it("returns 401 for anonymous callers", async () => {
    resolveUserId.mockResolvedValue(null);
    expect((await GET(req())).status).toBe(401);
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("returns the owner their own status", async () => {
    resolveUserId.mockResolvedValue("u1");
    findProperty.mockResolvedValue({ property: { id: "p1", owner_id: "u1" } });
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("READY");
  });

  it("returns 404 to a non-owner non-staff user", async () => {
    resolveUserId.mockResolvedValue("u2");
    findProperty.mockResolvedValue({ property: { id: "p1", owner_id: "u1" } });
    expect((await GET(req())).status).toBe(404);
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("lets staff read any property", async () => {
    resolveUserId.mockResolvedValue("u3");
    profile = { role: "staff", active_roles: [] };
    findProperty.mockResolvedValue({ property: { id: "p1", owner_id: "u1" } });
    expect((await GET(req())).status).toBe(200);
  });
});
