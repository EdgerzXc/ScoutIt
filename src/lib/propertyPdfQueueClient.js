import { supabase } from "@/lib/supabaseClient";
import { PRIVATE_QUEUE_BUCKET, PROPERTY_PDF_MAX_BYTES } from "@/lib/propertyQueueStorage";

const MAX_RELAY_BYTES = 4 * 1024 * 1024;
const UPLOAD_ROUTE = "/api/properties/queue/upload";
const activeUploads = new WeakMap();
const queuedDrafts = new WeakMap();

function uploadRequest(authedFetch, method, body) {
  return authedFetch(UPLOAD_ROUTE, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(60_000) : undefined,
  });
}

async function uploadDirectly(file, authedFetch) {
  let intent = activeUploads.get(file);
  if (!intent) {
    const response = await uploadRequest(authedFetch, "POST", { filename: file.name, size: file.size });
    const reservation = await response.json().catch(() => null);
    if (!response.ok || !reservation?.uploadId || !reservation.path || !reservation.token) {
      throw new Error(reservation?.error || "Could not start the PDF upload.");
    }
    intent = { ...reservation, stored: false };
    activeUploads.set(file, intent);
  }

  if (!intent.stored) {
    const pdf = file.slice(0, file.size, "application/pdf");
    const { error } = await supabase.storage.from(PRIVATE_QUEUE_BUCKET)
      .uploadToSignedUrl(intent.path, intent.token, pdf, { upsert: false });
    intent.stored = !error;
  }

  // A dropped storage response can leave a complete object, so ask the server before retrying the transfer.
  const response = await uploadRequest(authedFetch, "PATCH", { uploadId: intent.uploadId });
  const queued = await response.json().catch(() => null);
  if (!response.ok || !queued?.propertyId) {
    if ([404, 415, 422].includes(response.status)) activeUploads.delete(file);
    throw new Error(queued?.error || "Could not queue the PDF. Try again.");
  }
  activeUploads.delete(file);
  return queued.propertyId;
}

async function relayPdf(file, authedFetch) {
  const form = new FormData();
  form.append("file", file);
  const response = await authedFetch("/api/properties/queue/intake", {
    method: "POST",
    body: form,
  });
  const queued = await response.json().catch(() => ({}));
  if (response.status === 413) {
    throw new Error(queued.error || "The PDF exceeds the upload limit. Choose a smaller file.");
  }
  if (!response.ok) throw new Error(queued.error || "Could not queue the PDF.");
  if (!queued.propertyId) throw new Error("The queue did not return a property ID. Try again.");
  return queued.propertyId;
}

export async function submitPropertyPdfDraft(file, authedFetch) {
  const existing = queuedDrafts.get(file);
  if (existing) return existing;
  if (file.size > PROPERTY_PDF_MAX_BYTES) throw new Error("Choose a PDF up to 25 MB.");

  const propertyId = file.size > MAX_RELAY_BYTES
    ? await uploadDirectly(file, authedFetch)
    : await relayPdf(file, authedFetch);
  queuedDrafts.set(file, propertyId);
  return propertyId;
}

export async function requestPropertyPdfProcessing(propertyId, authedFetch) {
  const response = await authedFetch("/api/properties/queue/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ propertyId }),
  });
  const processed = await response.json().catch(() => null);
  if (response.ok && processed?.done) return "pending";
  if (response.status === 422 && processed?.quarantined) return "quarantined";

  const status = await authedFetch(`/api/properties/queue/status?propertyId=${encodeURIComponent(propertyId)}`);
  const current = status.ok ? await status.json() : null;
  return current?.isDone ? current.pipelineStatus : "queued";
}
