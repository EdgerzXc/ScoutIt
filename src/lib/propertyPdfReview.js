import { createHash } from "node:crypto";
import { removeReviewedQueueDocument, resolveQueueDocument } from "./propertyQueueStorage.js";

function reviewError(error, status) {
  return { error, status };
}

function sourceVersion(document) {
  return createHash("sha256").update(document.bucket + "/" + document.path).digest("hex");
}

async function findDraft(client, propertyId) {
  return client.from("properties")
    .select("id, owner_id, title, pdf_source_url, pdf_verified, pipeline_status")
    .eq("id", propertyId)
    .eq("creation_source", "pdf_assisted")
    .maybeSingle();
}

export async function loadPropertyPdfReview(client, propertyId) {
  const { data: draft, error } = await findDraft(client, propertyId);
  if (error) return reviewError("Could not load the draft.", 503);
  if (!draft || draft.pdf_verified || draft.pipeline_status !== "pending") {
    return reviewError("That draft is unavailable for verification.", 404);
  }
  const document = resolveQueueDocument(draft);
  if (!document) return reviewError("This draft has no source PDF to review.", 409);

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
