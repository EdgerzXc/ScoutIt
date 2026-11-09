import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { notifyUser } from "@/lib/notifications";
import { verifyFileFamily } from "@/lib/fileTypeCheck";
import { sanitizeError } from "@/lib/sanitizeError";
import { createRateLimiter } from "@/lib/rateLimit";
import { calculateQueuePosition } from "@/lib/queuePosition";
import { resolveUserPerks } from "@/lib/BadgeEngine";

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB limit
const MAX_PENDING_PER_USER = 5;
const TEMP_BUCKET = "property_photos";

const intakeLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000, // 10 uploads per minute per user/IP
});

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

    // 1. Rate limiting check (10 uploads / min)
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateKey = `${userId}:${clientIp}`;
    const rateCheck = intakeLimiter(rateKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Too many document uploads. Please wait before queueing another document.",
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfterSeconds) } }
      );
    }

    // 2. Per-user active pending queue cap
    const { count: pendingCount, error: pendingErr } = await supabaseAdmin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("pipeline_status", "ai_drafting");

    if (!pendingErr && typeof pendingCount === "number" && pendingCount >= MAX_PENDING_PER_USER) {
      return NextResponse.json(
        {
          error: `Queue limit reached: You have ${pendingCount} documents currently in the parsing queue. Please wait for them to finish before uploading more.`,
          pendingCount,
        },
        { status: 429 }
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

    // 3. Deduplication check via SHA-256 hash
    const fileHash = createHash("sha256").update(buffer).digest("hex");
    let dupQuery = supabaseAdmin
      .from("properties")
      .select("id, title, created_at, details")
      .eq("owner_id", userId)
      .eq("pipeline_status", "ai_drafting");
    if (typeof dupQuery.contains === "function") {
      dupQuery = dupQuery.contains("details", { pdf_hash: fileHash });
    }
    const { data: existingDraft, error: dupCheckErr } = await dupQuery.maybeSingle();

    if (!dupCheckErr && existingDraft && (!existingDraft.details?.pdf_hash || existingDraft.details.pdf_hash === fileHash)) {
      const queueNumber = await calculateQueuePosition(supabaseAdmin, existingDraft.id);
      return NextResponse.json({
        success: true,
        propertyId: existingDraft.id,
        queueNumber,
        title: existingDraft.title,
        queuedAt: existingDraft.details?.queued_at || existingDraft.created_at,
        deduplicated: true,
      });
    }

    // 4. Unguessable storage path using randomUUID
    const safeName = originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 100);
    const fileUuid = randomUUID();
    const storagePath = `temp_queue_docs/${userId}/${fileUuid}_${safeName}`;

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
    const timestamp = Date.now();
    const slug = `${displayTitle}-${timestamp}-${fileUuid.slice(0, 8)}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if owner holds queue_priority privilege from Pioneer charters
    let hasQueuePriority = false;
    try {
      const { data: userBadges } = await supabaseAdmin
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId);
      if (Array.isArray(userBadges) && userBadges.length > 0) {
        const perks = resolveUserPerks(userBadges);
        if (perks.queue_priority) {
          hasQueuePriority = true;
        }
      }
    } catch (perkErr) {
      console.warn("[queue-intake] perk lookup error:", perkErr?.message);
    }

    // 5. Insert draft with pipeline_status = 'ai_drafting'
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
            pdf_hash: fileHash,
            queued_at: nowIso,
            queue_priority: hasQueuePriority,
          },
        },
      ])
      .select("id, title, created_at")
      .single();

    if (insertError || !inserted) {
      console.error("[queue-intake] Property insert failed:", insertError);
      await supabaseAdmin.storage.from(TEMP_BUCKET).remove([storagePath]).catch(() => {});
      return NextResponse.json(
        { error: sanitizeError(insertError, "Failed to register property in processing queue.") },
        { status: 500 }
      );
    }

    // 6. Deterministic monotonic queue position (created_at ASC, id ASC)
    const queueNumber = await calculateQueuePosition(supabaseAdmin, inserted.id);

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
