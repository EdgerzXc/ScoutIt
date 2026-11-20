import { createHash } from "node:crypto";
import { removeQuarantinedQueueDocument, removeReviewedQueueDocument, resolveQueueDocument } from "./propertyQueueStorage.js";

const DISPOSITIONS = "property_pdf_source_dispositions";
const QUARANTINE_REASONS = new Map([
  ["max_retries_exceeded", "Automatic processing did not finish after three attempts."],
  ["pdf_oversize", "The PDF exceeds the file size limit."],
  ["corrupt_pdf", "The parser could not open this PDF."],
  ["no_readable_text", "The PDF did not contain readable text."],
  ["storage_download_failed", "The processor could not download this PDF."],
  ["storage_download_exception", "The processor could not read this PDF from Storage."],
]);

export function getPdfPublicationBlock(property) {
  if (property.creation_source !== "pdf_assisted") return null;
  if (property.pipeline_status === "quarantined") return "pdf_source_quarantined";
  return property.pdf_verified === true ? null : "pdf_verification_pending";
}

function reviewError(error, status) {
  return { error, status };
}

function sourceVersion(document) {
  return createHash("sha256").update(document.bucket + "/" + document.path).digest("hex");
}

async function findDraft(client, propertyId) {
  return client.from("properties")
    .select("id, owner_id, title, pdf_source_url, pdf_verified, pipeline_status, details")
    .eq("id", propertyId)
    .eq("creation_source", "pdf_assisted")
    .maybeSingle();
}

async function findDisposition(client, propertyId, path) {
  return client.from(DISPOSITIONS).select("property_id").eq("property_id", propertyId)
    .eq("source_path", path).maybeSingle();
}

export async function listPropertyPdfReviews(client, limit) {
  const { data, error } = await client.from("properties")
    .select("id, title, location, type, owner_id, created_at, pdf_source_url, pdf_verified, pipeline_status")
    .eq("creation_source", "pdf_assisted")
    .or("and(pdf_verified.eq.false,pipeline_status.eq.pending),and(pipeline_status.eq.quarantined,pdf_source_url.not.is.null),and(pdf_verified.eq.true,pdf_source_url.not.is.null)")
    .order("created_at", { ascending: true }).limit(limit);
  if (error) return { drafts: [], error: "Could not load the PDF review queue." };

  const quarantineIds = (data || []).filter((draft) => draft.pipeline_status === "quarantined").map(({ id }) => id);
  const { data: dispositions, error: dispositionError } = quarantineIds.length
    ? await client.from(DISPOSITIONS).select("property_id, source_path").in("property_id", quarantineIds)
    : { data: [] };
  if (dispositionError) return { drafts: [], error: "Could not load quarantined source decisions." };
  const approvedDiscards = new Set((dispositions || []).map(({ property_id, source_path }) => `${property_id}:${source_path}`));

  return { drafts: (data || []).map(({ pdf_source_url, owner_id, pdf_verified, pipeline_status, ...draft }) => ({
    ...draft,
    quarantined: pipeline_status === "quarantined",
    sourceAttached: Boolean(resolveQueueDocument({ owner_id, pdf_source_url })),
    cleanupPending: pdf_verified || approvedDiscards.has(`${draft.id}:${pdf_source_url}`),
  })) };
}

export async function loadPropertyPdfReview(client, propertyId) {
  const { data: draft, error } = await findDraft(client, propertyId);
  if (error) return reviewError("Could not load the draft.", 503);
  if (!draft || draft.pdf_verified || !["pending", "quarantined"].includes(draft.pipeline_status)) {
    return reviewError("That draft is unavailable for verification.", 404);
  }
  const document = resolveQueueDocument(draft);
  if (!document) return reviewError("This draft has no source PDF to review.", 409);

  if (draft.pipeline_status === "quarantined") {
    const { data: disposition, error: dispositionError } = await findDisposition(client, draft.id, document.path);
    if (dispositionError) return reviewError("Could not load the quarantine decision.", 503);
    if (disposition) return reviewError("Discard was recorded. Retry deletion from the queue.", 409);
    return {
      quarantined: true,
      sourceVersion: sourceVersion(document),
      quarantineReason: QUARANTINE_REASONS.get(draft.details?.quarantine_reason) || "Processing stopped before a draft could be verified.",
    };
  }

  const { data: reviewedDraft, error: factsError } = await client.rpc("read_property_pdf_review_facts", {
    p_property_id: draft.id,
    p_source_path: document.path,
  });
  if (factsError) return reviewError("Could not load the draft fields.", 503);
  if (!reviewedDraft) return reviewError("That draft changed. Refresh the review queue.", 409);

  const { data, error: signingError } = await client.storage.from(document.bucket)
    .createSignedUrl(document.path, 300, { download: "scoutit-source.pdf" });
  if (signingError || !data?.signedUrl) {
    return reviewError("Could not open the source PDF. Refresh the link or check the upload.", 503);
  }
  return { sourceUrl: data.signedUrl, sourceVersion: sourceVersion(document), reviewedDraft };
}

export async function verifyPropertyPdfDraft(client, input, staffId) {
  const propertyId = typeof input?.propertyId === "string" ? input.propertyId.trim() : "";
  if (!propertyId) return reviewError("A property ID is required.", 400);
  const { data: draft, error } = await findDraft(client, propertyId);
  if (error) return reviewError("Could not load the draft.", 503);
  if (!draft) return reviewError("PDF-assisted draft not found.", 404);

  if (draft.pipeline_status === "quarantined") return discardQuarantinedSource(client, draft, input, staffId);
  if (input.discard === true) return reviewError("Only a quarantined PDF can be discarded here.", 409);

  if (draft.pdf_verified) {
    const removed = !draft.pdf_source_url || await removeReviewedQueueDocument(client, draft);
    return { cleanupPending: !removed };
  }
  if (draft.pipeline_status !== "pending") {
    return reviewError("This draft is still being processed or needs a new PDF.", 409);
  }
  if (input.sourceReviewed !== true || !input.reviewedDraft || typeof input.reviewedDraft !== "object" || Array.isArray(input.reviewedDraft)) {
    return reviewError("Review the source and compare it with the draft before confirming.", 400);
  }

  const document = resolveQueueDocument(draft);
  if (!document) return reviewError("This draft has no source PDF to review.", 409);
  if (input.sourceVersion !== sourceVersion(document)) {
    return reviewError("The source PDF changed. Reopen the review and compare it with the draft again.", 409);
  }
  const { data: source, error: storageError } = await client.storage.from(document.bucket).info(document.path);
  if (storageError || !source) return reviewError("The source PDF is unavailable. Verification has not been recorded.", 409);

  const { data: recorded, error: recordError } = await client.rpc("record_property_pdf_review", {
    p_property_id: draft.id,
    p_source_path: document.path,
    p_staff_id: staffId,
    p_reviewed_draft: input.reviewedDraft,
  });
  if (recordError) {
    console.error("[pdf-review] Attestation failed:", draft.id, recordError.code);
    return reviewError("Could not record the verification.", 503);
  }
  if (!recorded) return reviewError("The draft changed. Reload it and compare it with the source again.", 409);

  const removed = await removeReviewedQueueDocument(client, { ...draft, pdf_verified: true });
  return { draft, cleanupPending: !removed };
}

async function discardQuarantinedSource(client, draft, input, staffId) {
  if (input.discard !== true || draft.pdf_verified) return reviewError("Review the quarantine before discarding this PDF.", 409);
  if (!draft.pdf_source_url) return { discarded: true, cleanupPending: false };
  const document = resolveQueueDocument(draft);
  if (!document) return reviewError("This draft has no source PDF to discard.", 409);

  if (input.sourceReviewed === true) {
    if (input.sourceVersion !== sourceVersion(document)) return reviewError("The source changed. Reopen the quarantine review.", 409);
    const { data: recorded, error } = await client.rpc("record_quarantined_property_pdf_disposition", {
      p_property_id: draft.id,
      p_source_path: document.path,
      p_staff_id: staffId,
    });
    if (error) return reviewError("Could not record the quarantine decision.", 503);
    if (!recorded) return reviewError("The source changed. Reopen the quarantine review.", 409);
  } else {
    const { data: disposition, error } = await findDisposition(client, draft.id, document.path);
    if (error) return reviewError("Could not load the quarantine decision.", 503);
    if (!disposition) return reviewError("Review the current quarantine before discarding its source.", 409);
  }

  const removed = await removeQuarantinedQueueDocument(client, draft);
  return { discarded: true, cleanupPending: !removed };
}
