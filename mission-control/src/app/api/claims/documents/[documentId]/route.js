import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { assertTier, getCurrentStaff, logActionStrict, TIERS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { OPEN_CLAIM_STATUSES } from "@/lib/propertyClaimPolicy.mjs";
import {
  CLAIM_DOCUMENT_BUCKET, CLAIM_MULTIPART_FILE_MAX_BYTES, claimDocumentFilename, hasVerifiedClaimScan,
} from "@/lib/claimDocumentPath.mjs";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const respond = (error, status) => NextResponse.json({ error }, { status, headers: PRIVATE_HEADERS });

export async function GET(_request, { params }) {
  let staff;
  try {
    staff = await getCurrentStaff();
    assertTier(staff, TIERS.OPS_MANAGER);
  } catch {
    return respond("Use an authorized staff session to download claim evidence.", 403);
  }

  const { documentId } = await params;
  if (!UUID.test(documentId || "")) return respond("Claim evidence not found.", 404);

  try {
    const admin = createAdminClient();
    const { data: doc, error } = await admin.from("property_claim_documents")
      .select("id, claim_id, private_storage_path, mime_type, file_size_bytes, checksum, malware_scan_status, malware_scan_engine, malware_scan_object_version")
      .eq("id", documentId).maybeSingle();
    if (error) throw error;
    if (!doc) return respond("Claim evidence not found.", 404);

    const { data: claim, error: claimError } = await admin.from("property_claims")
      .select("id, status, claimant_user_id, property_id").eq("id", doc.claim_id).maybeSingle();
    if (claimError) throw claimError;
    if (!claim || !OPEN_CLAIM_STATUSES.includes(claim.status)) return respond("Claim evidence not found.", 404);

    const { data: property, error: propertyError } = await admin.from("properties")
      .select("id, slug, canonical_slug").eq("id", claim.property_id).maybeSingle();
    if (propertyError) throw propertyError;
    const propertyIds = property ? [property.id, property.slug, property.canonical_slug] : [];
    const unavailable = "A verified scan of the current file is required before download.";
    if (!hasVerifiedClaimScan(doc, claim.claimant_user_id, propertyIds)) return respond(unavailable, 409);
    const bytes = Number(doc.file_size_bytes);
    if (!Number.isInteger(bytes) || bytes < 1 || bytes > CLAIM_MULTIPART_FILE_MAX_BYTES) return respond(unavailable, 409);

    const { data: bucketDetails, error: bucketError } = await admin.storage.getBucket(CLAIM_DOCUMENT_BUCKET);
    if (bucketError || bucketDetails?.public !== false) throw new Error("Private claim storage unavailable");
    const bucket = admin.storage.from(CLAIM_DOCUMENT_BUCKET);
    const snapshotMatches = ({ data, error: metadataError }) => !metadataError &&
      data?.version === doc.malware_scan_object_version && data?.contentType === doc.mime_type && data?.size === bytes;
    if (!snapshotMatches(await bucket.info(doc.private_storage_path))) return respond(unavailable, 409);

    const { data: file, error: downloadError } = await bucket.download(doc.private_storage_path);
    if (downloadError || !file || file.size !== bytes) return respond(unavailable, 409);
    const buffer = await file.arrayBuffer();
    if (createHash("sha256").update(new Uint8Array(buffer)).digest("hex") !== doc.checksum ||
        !snapshotMatches(await bucket.info(doc.private_storage_path))) return respond(unavailable, 409);

    await logActionStrict({
      staff, action: "claim.document.download", targetTable: "property_claim_documents",
      targetId: documentId, metadata: { claim_id: claim.id },
    });
    const filename = claimDocumentFilename(doc.private_storage_path, claim.claimant_user_id, propertyIds);
    return new NextResponse(buffer, {
      headers: {
        ...PRIVATE_HEADERS, "Content-Type": "application/octet-stream", "Content-Length": String(bytes),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Security-Policy": "sandbox; default-src 'none'",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return respond("Could not securely download the evidence. Try again.", 503);
  }
}
