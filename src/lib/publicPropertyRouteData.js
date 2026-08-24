import { getCmsBundle } from "@/lib/cmsCache";

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

export function resolvePublicChildSpace(property, unitId) {
  if (!property || !Array.isArray(property.units_inventory)) return null;
  return property.units_inventory.find(
    (unit) => String(unit?.id || "") === String(unitId || ""),
  ) || null;
}

export async function loadPublicProperty(idOrSlug) {
  return resolvePublicProperty(await getCmsBundle(), idOrSlug);
}
