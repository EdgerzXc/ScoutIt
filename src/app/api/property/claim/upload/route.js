import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyFileFamily } from "@/lib/fileTypeCheck";
import { sanitizeError } from "@/lib/sanitizeError";
import { findProperty } from "@/lib/propertyLookup";
import { isClaimable } from "@/lib/listerRelationship";
import {
  CLAIM_DOCUMENT_BUCKET, CLAIM_MULTIPART_FILE_MAX_BYTES, CLAIM_DOCUMENT_MIMES, CLAIM_DOCUMENT_TYPES,
} from "@/lib/claimDocumentPath.mjs";

async function ensurePrivateClaimBucket(storage) {
  let bucket = await storage.getBucket(CLAIM_DOCUMENT_BUCKET);
  if (Number(bucket.error?.statusCode || bucket.error?.status) === 404) {
    await storage.createBucket(CLAIM_DOCUMENT_BUCKET, {
      public: false,
      fileSizeLimit: CLAIM_MULTIPART_FILE_MAX_BYTES,
      allowedMimeTypes: [...new Set(Object.values(CLAIM_DOCUMENT_MIMES))],
    });
    bucket = await storage.getBucket(CLAIM_DOCUMENT_BUCKET);
  }
  return !bucket.error && bucket.data?.public === false;
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to upload claim documents" },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: "Invalid upload form." }, { status: 400 });
    const file = formData.get("file");
    const documentType = String(formData.get("documentType") || "supporting_document").trim();
    const propertyId = String(formData.get("propertyId") || "").trim();

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file provided for upload" }, { status: 400 });
    }

    if (file.size > CLAIM_MULTIPART_FILE_MAX_BYTES) {
      return NextResponse.json(
        { error: "Choose a document up to 4 MB. Compress the scan or photo and try again." },
        { status: 413 }
      );
    }

    const rawName = String(file.name || "document").split(/[\/\\]/).pop() || "document";
    const originalFilename = rawName.replace(/\.\.+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180);
    const ext = originalFilename.split(".").pop().toLowerCase();
    if (!Object.hasOwn(CLAIM_DOCUMENT_MIMES, ext)) {
      return NextResponse.json(
        { error: "Choose a PDF, JPG, PNG, or WebP file." },
        { status: 415 }
      );
    }
    if (!CLAIM_DOCUMENT_TYPES.has(documentType) || !propertyId || propertyId.length > 200) {
      return NextResponse.json({ error: "Choose a claim document type and a valid listing." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify magic bytes (protects against malicious disguises)
    const check = verifyFileFamily(new Uint8Array(bytes.slice(0, 64)), ["image", "application/pdf"]);
    if (!check.ok || check.realMime !== CLAIM_DOCUMENT_MIMES[ext]) {
      return NextResponse.json({ error: "The file contents do not match the selected format." }, { status: 415 });
    }

    const { property, error } = await findProperty(supabaseAdmin, propertyId, ["id", "owner_id", "lister_relationship", "verified"]);
    if (error) throw error;
    if (!property) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    if (property.owner_id === userId || !isClaimable({
      lister_relationship: property.lister_relationship, owner_verified: property.verified === true,
    })) {
      return NextResponse.json({ error: "This listing is unavailable for a claim." }, { status: 409 });
    }
    const storagePath = `${userId}/${property.id}/${randomUUID()}_${originalFilename}`;
    if (!(await ensurePrivateClaimBucket(supabaseAdmin.storage))) {
      return NextResponse.json({ error: "Private claim uploads are temporarily unavailable." }, { status: 503 });
    }

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(CLAIM_DOCUMENT_BUCKET)
      .upload(storagePath, buffer, {
        contentType: check.realMime,
        upsert: false,
      });

    if (uploadErr) {
      console.error("[CLAIM UPLOAD] Storage upload error:", uploadErr);
      return NextResponse.json(
        { error: sanitizeError(uploadErr, "Could not upload document to secure storage.") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      storagePath,
      originalFilename,
      documentType,
      mimeType: check.realMime,
      fileSizeBytes: file.size,
    });
  } catch (err) {
    console.error("[CLAIM UPLOAD] Unhandled error:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Failed to upload document.") },
      { status: 500 }
    );
  }
}
