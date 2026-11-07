import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { verifyFileFamily } from "@/lib/fileTypeCheck";
import { randomUUID } from "crypto";

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET = "property_photos";

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid token" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Storage service unavailable" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Enforce server-side magic bytes verification: reject spoofed HTML or non-image files
    const check = verifyFileFamily(buffer.slice(0, 64), ["image"]);
    if (!check.ok) {
      return NextResponse.json({ error: `Rejected: ${check.reason}` }, { status: 415 });
    }

    const safeName = (file.name || "photo").replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filePath = `${userId}/${Date.now()}_${randomUUID().slice(0, 8)}_${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: check.realMime || file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload-photo] Storage upload failed:", uploadError);
      return NextResponse.json({ error: uploadError.message || "Upload failed" }, { status: 500 });
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
