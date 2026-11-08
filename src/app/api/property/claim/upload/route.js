import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyFileFamily } from "@/lib/fileTypeCheck";
import { sanitizeError } from "@/lib/sanitizeError";

const CLAIM_BUCKET = "claim-documents";
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"];

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

    const formData = await request.formData();
    const file = formData.get("file");
    const documentType = String(formData.get("documentType") || "supporting_document").trim();
    const propertyId = String(formData.get("propertyId") || "general").trim();

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file provided for upload" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 15MB limit. Please upload a compressed scan or photo." },
        { status: 413 }
      );
    }

    const rawName = String(file.name || "document").split(/[\/\\]/).pop() || "document";
    const originalFilename = rawName.replace(/\.\.+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = originalFilename.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type .${ext} is not supported. Please upload a PDF, JPG, PNG, or WebP.` },
        { status: 415 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify magic bytes (protects against malicious disguises)
    const check = verifyFileFamily(new Uint8Array(bytes.slice(0, 64)), ["image", "application/pdf"]);
    if (!check.ok) {
      return NextResponse.json({ error: `Rejected: ${check.reason}` }, { status: 415 });
    }

    const safePropertyId = propertyId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `${userId}/${safePropertyId}/${Date.now()}_${originalFilename}`;

    // Ensure bucket exists in Supabase storage
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (buckets && !buckets.some((b) => b.name === CLAIM_BUCKET)) {
        await supabaseAdmin.storage.createBucket(CLAIM_BUCKET, {
          public: false,
          fileSizeLimit: 25 * 1024 * 1024,
        });
      }
    } catch {
      // Graceful fallback if listBuckets is restricted
    }

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(CLAIM_BUCKET)
      .upload(storagePath, buffer, {
        contentType: check.realMime || file.type || "application/octet-stream",
        upsert: true,
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
      mimeType: check.realMime || file.type,
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
