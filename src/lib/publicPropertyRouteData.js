import { getCmsBundle } from "@/lib/cmsCache";

const E2E_PROPERTY_SLUGS = new Set(["lr02-property", "lr02-unrepresented"]);

const UNAVAILABLE_SOURCE = /^empty_fallback(?:_|$)/;

export class PublicCmsUnavailableError extends Error {
  constructor(source) {
    super(`Public property catalog unavailable (source: ${source || "missing"})`);
    this.name = "PublicCmsUnavailableError";
  }
}

export function resolvePublicProperty(bundle, idOrSlug) {
  const source = String(bundle?.source || "");
  if (!bundle || !Array.isArray(bundle.properties) || UNAVAILABLE_SOURCE.test(source)) {
    throw new PublicCmsUnavailableError(source);
  }

  const requested = String(idOrSlug || "").toLowerCase();
  return bundle.properties.find(
    (property) =>
      (property.slug && String(property.slug).toLowerCase() === requested) ||
      (property.id && String(property.id) === String(idOrSlug)),
  ) || null;
}

export function resolveE2ePublicProperty(idOrSlug, {
  e2eFlag = process.env.SCOUTIT_E2E,
  publicE2eFlag = process.env.NEXT_PUBLIC_SCOUTIT_E2E,
} = {}) {
  const slug = String(idOrSlug || "").toLowerCase();
  if (e2eFlag !== "1" || publicE2eFlag !== "1" || !E2E_PROPERTY_SLUGS.has(slug)) {
    return null;
  }
  return {
    id: slug,
    slug,
    title: "LR-02 Property Route Fixture",
    spaceCategory: "Commercial",
    is_sample: true,
    units_inventory: [],
  };
}

export function resolvePublicChildSpace(property, unitId) {
  if (!property || !Array.isArray(property.units_inventory)) return null;
  return property.units_inventory.find(
    (unit) => String(unit?.id || "") === String(unitId || ""),
  ) || null;
}

export async function loadPublicProperty(idOrSlug) {
  const fixture = resolveE2ePublicProperty(idOrSlug);
  if (fixture) return fixture;
  return resolvePublicProperty(await getCmsBundle(), idOrSlug);
}
