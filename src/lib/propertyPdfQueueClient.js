export async function submitPropertyPdfDraft(file, authedFetch) {
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
