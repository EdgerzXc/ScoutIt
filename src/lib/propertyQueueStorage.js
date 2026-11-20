export const PRIVATE_QUEUE_BUCKET = "property-documents-temp";
export const PRIVATE_QUEUE_PREFIX = "source_queue_docs";
export const PROPERTY_PDF_MAX_BYTES = 25 * 1024 * 1024;

export function propertyPdfUploadPath(ownerId, uploadId) {
  return `${PRIVATE_QUEUE_PREFIX}/${ownerId}/${uploadId}.pdf`;
}

export function resolveQueueDocument(property) {
  const path = property.pdf_source_url;
  if (typeof path !== "string" || !property.owner_id) return null;

  const [prefix, ownerId, filename, ...rest] = path.split("/");
  if (ownerId !== property.owner_id || rest.length || !/^\w[\w.-]{0,150}$/.test(filename || "")) return null;

  if (prefix === PRIVATE_QUEUE_PREFIX) return { bucket: PRIVATE_QUEUE_BUCKET, path };
  if (prefix === "temp_queue_docs") return { bucket: "property_photos", path };
  return null;
}

export function removeReviewedQueueDocument(client, property) {
  if (!property.pdf_verified) return false;
  return removeQueueDocument(client, property, "pdf_verified", true);
}

export function removeQuarantinedQueueDocument(client, property) {
  if (property.pipeline_status !== "quarantined" || property.pdf_verified) return false;
  return removeQueueDocument(client, property, "pipeline_status", "quarantined");
}

async function removeQueueDocument(client, property, guardColumn, guardValue) {
  const document = resolveQueueDocument(property);
  if (!document) return false;

  try {
    const { error: storageError } = await client.storage.from(document.bucket).remove([document.path]);
    if (storageError) {
      console.error("[pdf-review] Storage cleanup failed:", property.id, storageError.code || storageError.statusCode);
      return false;
    }

    const { error: updateError } = await client
      .from("properties")
      .update({ pdf_source_url: null })
      .eq("id", property.id)
      .eq(guardColumn, guardValue)
      .eq("pdf_source_url", document.path);
    if (updateError) {
      console.error("[pdf-review] Failed to clear the removed document reference:", property.id, updateError.code);
      return false;
    }
    return true;
  } catch {
    console.error("[pdf-review] Could not complete document cleanup:", property.id);
    return false;
  }
}
