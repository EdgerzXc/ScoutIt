import { describe, it, expect, vi } from "vitest";

// A-146: unitsSync denormalized user_profiles.display_name into the PUBLIC
// Units_JSON with no is_profile_public gate — a private name reaching the
// public bundle. The gate is affirmative (=== true, never a negative check).

const updateProperty = vi.fn(async () => ({}));
vi.mock("@/lib/airtable", () => ({
  updateProperty: (...args) => updateProperty(...args),
  insertProperty: vi.fn(async () => ({})),
}));

process.env.AIRTABLE_API_KEY = "keyTest";
process.env.AIRTABLE_BASE_ID = "appTest";

const { syncPropertyUnitsToAirtable } = await import("@/lib/unitsSync");

const units = [
  {
    id: "u-1",
    name: "Suite A",
    size_sqm: 120,
    floor: "10",
    features: [],
    photos: [],
    image: "",
    price: "",
    operator_id: "op-1",
    details: {},
    subdivision_scenarios: [],
  },
];

function serviceClientWith(profileRow) {
  return {
    from: (table) => {
      if (table === "property_units") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: units, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          in: async () => ({ data: [profileRow], error: null }),
        }),
      };
    },
  };
}

const property = {
  id: "p-1",
  pipeline_status: "approved",
  slug: "tower-one",
  details: {},
};

describe("A-146 — unit operator names respect profile visibility", () => {
  it("withholds the name of a private profile from public Units_JSON", async () => {
    updateProperty.mockClear();
    await syncPropertyUnitsToAirtable(
      serviceClientWith({ id: "op-1", display_name: "Secret Name", is_profile_public: false }),
      property,
    );
    const airtableUnits = updateProperty.mock.calls[0][4];
    expect(airtableUnits[0].operator_id).toBe("op-1");
    expect(airtableUnits[0].operator_display_name).toBeNull();
  });

  it("keeps the name of a public profile", async () => {
    updateProperty.mockClear();
    await syncPropertyUnitsToAirtable(
      serviceClientWith({ id: "op-1", display_name: "Public Name", is_profile_public: true }),
      property,
    );
    expect(updateProperty.mock.calls[0][4][0].operator_display_name).toBe("Public Name");
  });
});

// A-146 (B4): the insert fallback persisted slug but not canonical_slug —
// the same drift the publish and approve paths already close.
describe("unitsSync insert path adopts Airtable truth", () => {
  it("adopts slug and canonical when none is locked", async () => {
    const { insertProperty } = await import("@/lib/airtable");
    const updates = [];
    const client = {
      from: (table) => {
        if (table === "property_units") {
          return { select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }) };
        }
        if (table === "user_profiles") {
          return { select: () => ({ in: async () => ({ data: [], error: null }) }) };
        }
        return { update: (obj) => { updates.push(obj); return { eq: async () => ({ error: null }) }; } };
      },
    };
    insertProperty.mockResolvedValue({ id: "rec9", fields: { Slug: "fresh-tower" } });
    const { syncPropertyUnitsToAirtable } = await import("@/lib/unitsSync");
    await syncPropertyUnitsToAirtable(client, {
      id: "p-9", pipeline_status: "approved", slug: null, canonical_slug: null, details: {},
    });
    expect(updates[0]).toMatchObject({ slug: "fresh-tower", canonical_slug: "fresh-tower" });
    insertProperty.mockReset();
  });
});
