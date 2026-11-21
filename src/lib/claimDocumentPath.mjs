export const CLAIM_DOCUMENT_BUCKET = "claim-documents";
export const CLAIM_DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;
export const CLAIM_MULTIPART_FILE_MAX_BYTES = 4 * 1024 * 1024;

export const CLAIM_DOCUMENT_TYPES = new Set([
  "title_deed", "tct_cct_title", "authority_to_sell", "management_agreement", "prc_license",
  "gov_id", "supporting_document",
]);

export const CLAIM_DOCUMENT_MIMES = Object.freeze({
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
});

export function claimDocumentFilename(path, userId, propertyIds) {
  if (typeof path !== "string" || path.length > 500 || !userId) return null;
  const parts = path.split("/");
  if (parts.length !== 3) return null;
  const [uploader, property, filename] = parts;
  if (uploader !== userId || !property || !propertyIds.includes(property)) return null;
  const name = /^(?:[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}|\d{13})_([a-z0-9._-]{1,180})$/i.exec(filename)?.[1];
  if (!name || name.includes("..") || !Object.hasOwn(CLAIM_DOCUMENT_MIMES, name.split(".").at(-1).toLowerCase())) {
    return null;
  }
  return name;
}

export function hasVerifiedClaimScan(document, userId, propertyIds) {
  return document.malware_scan_status === "clean" &&
    /^[a-f0-9]{64}$/i.test(document.checksum || "") &&
    Boolean(claimDocumentFilename(document.private_storage_path, userId, propertyIds));
}
