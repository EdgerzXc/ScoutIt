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
  canonical_slug: "tower-one",
  publication_external_record_id: "recTower",
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

describe("unit inventory publication identity", () => {
  it("does not provision a public record for an unbound listing", async () => {
    const { insertProperty } = await import("@/lib/airtable");
    const client = { from: vi.fn() };
    updateProperty.mockClear();
    await expect(syncPropertyUnitsToAirtable(client, {
      id: "p-9", pipeline_status: "approved", slug: null, canonical_slug: null, details: {},
    })).rejects.toThrow("Publication identity needs reconciliation");
    expect(client.from).not.toHaveBeenCalled();
    expect(insertProperty).not.toHaveBeenCalled();
    expect(updateProperty).not.toHaveBeenCalled();
  });
});
