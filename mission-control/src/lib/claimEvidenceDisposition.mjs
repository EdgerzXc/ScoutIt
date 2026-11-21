import { CLAIM_DOCUMENT_BUCKET, claimDocumentFilename } from "./claimDocumentPath.mjs";

export const CLAIM_EVIDENCE_CONFIRMATION = "REMOVE FILE";
export const CLAIM_EVIDENCE_UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function isMissing(result) {
  return Number(result.error?.statusCode || result.error?.status) === 404;
}

export async function reviewClaimEvidence(admin, { requestId, documentId, actorId, revision, decision, note }) {
  async function record(action, lease = null) {
    const { data, error } = await admin.rpc("review_claim_evidence_disposition", {
      p_request: requestId, p_document: documentId, p_actor: actorId, p_revision: revision,
      p_action: action, p_notes: note, p_lease: lease,
    });
    return error ? { state: "unavailable" } : data;
  }

  const reservation = await record(decision);
  if (reservation?.state !== "reserved") return reservation?.state;

  const { path, version, lease, expiresAt } = reservation;
  if (typeof path !== "string" || !CLAIM_EVIDENCE_UUID.test(lease || "") || !version ||
      !Number.isFinite(Date.parse(expiresAt))) return "storage_unconfirmed";
  const [subject, listing] = path.split("/");
  if (!CLAIM_EVIDENCE_UUID.test(subject) || !claimDocumentFilename(path, subject, [listing])) return "storage_unconfirmed";

  try {
    const { data: details, error: bucketError } = await admin.storage.getBucket(CLAIM_DOCUMENT_BUCKET);
    if (!bucketError && details?.public === false) {
      const bucket = admin.storage.from(CLAIM_DOCUMENT_BUCKET);
      const before = await bucket.info(path);
      let absent = isMissing(before);
      if (!absent && !before.error && before.data?.version === version && Date.parse(expiresAt) > Date.now() + 10_000) {
        await bucket.remove([path]);
        absent = isMissing(await bucket.info(path));
      }
      if (absent && (await record("confirm", lease))?.state === "saved") return "saved";
    }
  } catch {
    // A provider or network error leaves the removal reservation available for verification.
  }

  try {
    await record("retry", lease);
  } catch {
    // The short reservation also expires on its own.
  }
  return "storage_unconfirmed";
}
