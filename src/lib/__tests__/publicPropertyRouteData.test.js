import { vi } from "vitest";

const getCmsBundle = vi.fn();
vi.mock("@/lib/cmsCache", () => ({ getCmsBundle }));

const {
  PublicCmsUnavailableError,
  resolveE2ePublicProperty,
  loadPublicProperty,
  resolvePublicChildSpace,
  resolvePublicProperty,
} = await import("@/lib/publicPropertyRouteData");

describe("public nested property route resolution", () => {
  const property = {
    id: "record-1",
    slug: "One-Ecom-Center",
    units_inventory: [{ id: "unit-1", name: "Unit 1" }],
  };

  it("resolves public properties by case-insensitive slug or exact id", () => {
    const bundle = { source: "airtable", properties: [property] };
    expect(resolvePublicProperty(bundle, "one-ecom-center")).toBe(property);
    expect(resolvePublicProperty(bundle, "record-1")).toBe(property);
    expect(resolvePublicProperty(bundle, "missing")).toBeNull();
  });

  it("does not mislabel an unavailable CMS fallback as a missing property", () => {
    expect(() => resolvePublicProperty(
      { source: "empty_fallback_on_error", properties: [] },
      "missing",
    )).toThrow(PublicCmsUnavailableError);
  });

  it("resolves a requested child only inside the validated parent", () => {
    expect(resolvePublicChildSpace(property, "unit-1")).toBe(property.units_inventory[0]);
    expect(resolvePublicChildSpace(property, "missing-unit")).toBeNull();
  });

  it("loads through the shared cached CMS bundle", async () => {
    getCmsBundle.mockResolvedValue({ source: "upstash_redis", properties: [property] });
    await expect(loadPublicProperty("one-ecom-center")).resolves.toBe(property);
  });

  it("exposes LR-02 route fixtures only when both explicit E2E flags are enabled", () => {
    expect(resolveE2ePublicProperty("lr02-property", {
      e2eFlag: "1",
      publicE2eFlag: "1",
    })).toMatchObject({ id: "lr02-property", slug: "lr02-property" });
    expect(resolveE2ePublicProperty("lr02-unrepresented", {
      e2eFlag: "1",
      publicE2eFlag: "1",
    })).toMatchObject({ id: "lr02-unrepresented", slug: "lr02-unrepresented" });
    expect(resolveE2ePublicProperty("lr02-property", { e2eFlag: "1" })).toBeNull();
    expect(resolveE2ePublicProperty("real-property", { e2eFlag: "1", publicE2eFlag: "1" })).toBeNull();
  });
});
