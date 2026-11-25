import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { verifyFileFamily } from "@/lib/fileTypeCheck";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { PROPERTY_PHOTO_MAX_BYTES, PROPERTY_PHOTO_MIME_TYPES } from "@/lib/propertyPhotoLimits";
import { randomUUID } from "crypto";

export const checkPhotoUploadRate = createRateLimiter({
  limit: 30,
  windowMs: 60_000,
  maxKeys: 10_000,
});

const BUCKET = "property_photos";

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid token" }, { status: 401 });
    }

    const rate = checkPhotoUploadRate(clientIp(request) + ":" + userId);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many upload requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Storage service unavailable" }, { status: 503 });
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: "Invalid photo upload." }, { status: 400 });
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > PROPERTY_PHOTO_MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 4 MB)" }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Enforce server-side magic bytes verification: reject spoofed HTML or non-image files
    const check = verifyFileFamily(buffer.slice(0, 64), PROPERTY_PHOTO_MIME_TYPES);
    if (!check.ok) {
      return NextResponse.json({ error: `Rejected: ${check.reason}` }, { status: 415 });
    }

    const safeName = (file.name || "photo").replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-160);
    const filePath = `${userId}/${Date.now()}_${randomUUID().slice(0, 8)}_${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: check.realMime,
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload-photo] Storage upload failed:", uploadError.statusCode || uploadError.code);
      return NextResponse.json({ error: "We could not save the photo. Please try again." }, { status: 502 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData?.publicUrl || "",
      path: filePath,
    });
  } catch (err) {
    console.error("[upload-photo] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
