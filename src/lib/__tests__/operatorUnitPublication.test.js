import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/dashboard/operator/units/route";

const db = vi.hoisted(() => ({
  updatedId: "unit-1",
  update: vi.fn(),
  match: vi.fn(),
  sync: vi.fn(),
  property: { id: "property-1", canonical_slug: "example", publication_external_record_id: "recBound" },
}));

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => "operator-1" }));
vi.mock("@/lib/unitsSync", () => ({ syncPropertyUnitsToAirtable: db.sync }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table) {
      return table === "properties"
        ? { select: () => ({ eq: () => ({ single: async () => ({ data: db.property }) }) }) }
        : { select: () => ({ eq: () => ({ eq: async () => ({ data: [{ id: "unit-1" }] }) }) }), update: db.update };
    },
  },
}));

function save() {
  return POST(new Request("https://scoutit.space/api/dashboard/operator/units", {
    method: "POST",
    body: JSON.stringify({
      propertyId: "property-1",
      units: [{ id: "unit-1", name: "Suite", details: { description: "<b>Fitted</b>" } }],
    }),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  db.updatedId = "unit-1";
  const query = {
    eq: db.match,
    select: () => ({ maybeSingle: async () => ({ data: db.updatedId ? { id: db.updatedId } : null }) }),
  };
  db.match.mockReturnValue(query);
  db.update.mockReturnValue(query);
  db.sync.mockResolvedValue({ publicCachePending: false });
});

describe("delegated unit publication", () => {
  it("scopes the saved unit to the current assignment and supplies the verified publication identity", async () => {
    expect((await save()).status).toBe(200);
    expect(db.match.mock.calls).toEqual([
      ["id", "unit-1"], ["property_id", "property-1"], ["operator_id", "operator-1"],
    ]);
    expect(db.update).toHaveBeenCalledWith(expect.objectContaining({ details: { description: "Fitted" } }));
    expect(db.sync).toHaveBeenCalledWith(expect.any(Object), db.property);
  });

  it("reports a changed assignment without confirming a public update", async () => {
    db.updatedId = null;
    expect((await save()).status).toBe(409);
    expect(db.sync).not.toHaveBeenCalled();
  });
});
