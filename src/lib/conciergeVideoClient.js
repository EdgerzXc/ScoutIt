import { VIDEO_BUCKET } from "@/lib/conciergeVideo";

async function requestUpload(authedFetch, body) {
  const response = await authedFetch("/api/storage/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (response.ok && result?.success) return result;
  throw Object.assign(
    new Error("Video intake request failed"),
    { code: result?.code, userMessage: typeof result?.error === "string" ? result.error : undefined },
  );
}

export async function submitConciergeVideo({ authedFetch, storage, operation, file, onStage }) {
  const { id, propertyId, stylePreset } = operation;
  const complete = () => requestUpload(authedFetch, { action: "complete", id });

  if (operation.attempted) {
    onStage("Checking for your previous upload…");
    try {
      return await complete();
    } catch (error) {
      if (error.code !== "UPLOAD_INCOMPLETE" && error.code !== "NO_SESSION") throw error;
    }
  }
  operation.attempted = true;

  onStage("Preparing your upload…");
  const signed = await requestUpload(authedFetch, {
    action: "init", id, propertyId, stylePreset, filename: file.name, size: file.size,
  });
  if (signed.status === "pending_scan") return signed;
  if (!signed.path || !signed.token || !signed.contentType) throw new Error("Could not start the upload. Try again.");

  onStage("Uploading your video…");
  try {
    const video = file.slice(0, file.size, signed.contentType);
    await storage.from(VIDEO_BUCKET).uploadToSignedUrl(signed.path, signed.token, video, {
      contentType: signed.contentType,
      upsert: false,
    });
  } catch {
    // A lost response can follow a successful upload. The receipt comes from completion.
  }
  onStage("Registering your video for a safety scan…");
  return complete();
}
