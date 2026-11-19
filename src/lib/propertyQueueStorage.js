export const PRIVATE_QUEUE_BUCKET = "property-documents-temp";
export const PRIVATE_QUEUE_PREFIX = "source_queue_docs";

export function resolveQueueDocument(property) {
  const path = property.details?.temp_storage_path || property.pdf_source_url;
  if (typeof path !== "string" || !property.owner_id) return null;

  const [prefix, ownerId, filename, ...rest] = path.split("/");
  if (ownerId !== property.owner_id || rest.length || !/^\w[\w.-]{0,150}$/.test(filename || "")) return null;

  if (prefix === PRIVATE_QUEUE_PREFIX) return { bucket: PRIVATE_QUEUE_BUCKET, path };
  if (prefix === "temp_queue_docs") return { bucket: "property_photos", path };
  return null;
}
