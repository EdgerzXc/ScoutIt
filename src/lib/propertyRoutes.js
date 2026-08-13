export function unitDetailPath(propertyId, unitId) {
  const propertySegment = encodeURIComponent(String(propertyId ?? "").trim());
  const unitSegment = encodeURIComponent(String(unitId ?? "").trim());
  return `/property/${propertySegment}/unit/${unitSegment}`;
}
