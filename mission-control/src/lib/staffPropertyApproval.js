import { publicationProvider } from "./airtable";
import { approvePropertyPublication } from "./propertyPublication.mjs";
import { getPdfPublicationBlock } from "./propertyPdfReview";
import { logAction, logActionStrict } from "./rbac";
import { recordSystemEvent } from "./systemEvents";
import { EVENTS } from "./systemEventPolicy.mjs";

async function isReserved(admin, slug, propertyId) {
  const results = await Promise.all([
    admin.from("properties").select("id").eq("canonical_slug", slug).neq("id", propertyId).limit(1),
    admin.from("property_slug_redirects").select("old_slug").eq("old_slug", slug).limit(1),
    admin.from("property_slug_history").select("old_slug").eq("old_slug", slug).limit(1),
  ]);
  if (results.some(({ data, error }) => error || !Array.isArray(data))) {
    throw new Error("Could not verify public URL reservations.");
  }
  return results.some(({ data }) => data.length > 0);
}

export async function approveStaffProperty({ admin, staff, propertyId, action, reason }) {
  const { data: property, error } = await admin.from("properties").select("*").eq("id", propertyId).maybeSingle();
  if (error || !property) return { error: "Could not load the property draft." };
  if (getPdfPublicationBlock(property)) return { error: "Only a verified PDF-assisted draft can be published." };

  const audit = { staff, action, targetTable: "properties", targetId: propertyId, reason };
  let intentId;
  const result = await approvePropertyPublication({
    admin, property, provider: publicationProvider, isReserved,
    recordIntent: async () => { intentId = await logActionStrict({ ...audit, action: `${action}.intent` }); },
  });

  if (!intentId) return result;
  await logAction({
    ...audit,
    metadata: {
      intent_id: intentId, slug: result.slug || null, recordId: result.recordId || null,
      success: Boolean(result.success), reconciliationRequired: Boolean(result.reconciliationRequired),
      publicCachePending: Boolean(result.publicCachePending),
    },
  });
  await recordSystemEvent({
    event: result.success ? EVENTS.AIRTABLE_PUBLISH_OK : EVENTS.AIRTABLE_PUBLISH_FAILED,
    severity: result.reconciliationRequired ? "error" : !result.success || result.publicCachePending ? "warning" : "info",
    subjectTable: "properties",
    subjectId: propertyId,
    summary: result.success ? "Staff publication confirmed" : "Staff publication did not complete",
    detail: { intentId, slug: result.slug || null, recordId: result.recordId || null, publicCachePending: Boolean(result.publicCachePending) },
  });
  return result;
}
