import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { notifyUser } from "@/lib/notifications";
import { verifyFileFamily } from "@/lib/fileTypeCheck";
import { sanitizeError } from "@/lib/sanitizeError";

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB limit
const TEMP_BUCKET = "property_photos";

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Please sign in." }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration missing: supabaseAdmin is not available." },
        { status: 500 }
      );
    }

    let buffer = null;
    let originalFilename = "property.pdf";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const jsonBody = await request.json().catch(() => ({}));
      if (jsonBody?.fileBase64) {
        buffer = new Uint8Array(Buffer.from(jsonBody.fileBase64, "base64"));
        originalFilename = jsonBody.filename || "property.pdf";
      }
    } else {
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        if (file && typeof file.arrayBuffer === "function") {
          originalFilename = file.name || "property.pdf";
          buffer = new Uint8Array(await file.arrayBuffer());
        }
      } catch (formErr) {
        console.warn("[queue-intake] formData parsing fallback:", formErr.message);
      }
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: "No document uploaded." }, { status: 400 });
    }

    if (buffer.length > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 25MB limit. Please upload a smaller document." },
        { status: 413 }
      );
    }

    // Magic bytes verification
    const check = verifyFileFamily(buffer, ["application/pdf"]);
    if (!check.ok) {
      return NextResponse.json(
        { error: "Invalid document format. Only valid PDF files are supported." },
        { status: 415 }
      );
    }

    // Temporary upload path in storage bucket
    const safeName = originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const timestamp = Date.now();
    const storagePath = `temp_queue_docs/${userId}/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(TEMP_BUCKET)
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[queue-intake] Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: sanitizeError(uploadError, "Failed to upload document to processing queue.") },
        { status: 500 }
      );
    }

    const cleanTitle = originalFilename
      .replace(/\.pdf$/i, "")
      .replace(/[_\-]+/g, " ")
      .trim();
    const displayTitle = `Drafting: ${cleanTitle}`;
    const slug = `${displayTitle}-${timestamp}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Insert draft with pipeline_status = 'ai_drafting'
    const nowIso = new Date().toISOString();
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("properties")
      .insert([
        {
          owner_id: userId,
          title: displayTitle,
          type: "commercial",
          space_category: "commercial",
          slug,
          location: "Location Pending",
          pipeline_status: "ai_drafting",
          creation_source: "pdf_assisted",
          pdf_source_url: storagePath,
          details: {
            source_pdf: originalFilename,
            temp_storage_path: storagePath,
            queued_at: nowIso,
          },
        },
      ])
      .select("id, title, created_at")
      .single();

    if (insertError || !inserted) {
      console.error("[queue-intake] Property insert failed:", insertError);
      // Clean up uploaded file if property record creation fails
      await supabaseAdmin.storage.from(TEMP_BUCKET).remove([storagePath]).catch(() => {});
      return NextResponse.json(
        { error: sanitizeError(insertError, "Failed to register property in processing queue.") },
        { status: 500 }
      );
    }

    // Calculate dynamic queue number based on pending drafts created on or before this one
    let queueNumber = 1;
    const { count, error: countError } = await supabaseAdmin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("pipeline_status", "ai_drafting")
      .lte("created_at", inserted.created_at || nowIso);

    if (!countError && typeof count === "number" && count > 0) {
      queueNumber = count;
    }

    // Dispatch in-app notification confirming queue position
    await notifyUser(supabaseAdmin, {
      userId,
      title: "Property Queued for Parsing",
      desc: `'${originalFilename}' is in the parsing queue. You are #${queueNumber} in line.`,
      propertyId: inserted.id,
      notificationType: "property_drafting",
    });

    return NextResponse.json({
      success: true,
      propertyId: inserted.id,
      queueNumber,
      title: inserted.title,
      queuedAt: nowIso,
    });
  } catch (err) {
    console.error("[queue-intake] Unexpected error:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Internal queue error.") },
      { status: 500 }
    );
  }
}
