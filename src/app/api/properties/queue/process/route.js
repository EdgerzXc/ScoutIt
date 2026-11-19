import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { requireAdmin } from "@/lib/adminGuard";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { notifyUser } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/auditTrail";
import { sanitizeError } from "@/lib/sanitizeError";
import { assimilatePropertyText, MAX_PDF_BYTES, MAX_RAW_TEXT_CHARS, MAX_PDF_PAGES } from "@/lib/assimilateProperty";
import { resolveQueueDocument } from "@/lib/propertyQueueStorage";

const MAX_PROCESS_ATTEMPTS = 3;

/**
 * Quarantines a poison pill or corrupt listing so it does not block the queue.
 */
async function quarantineProperty(propertyId, reason, details = {}, ownerId = null, document = null) {
  const nowIso = new Date().toISOString();
  try {
    const { data: quarantined, error } = await supabaseAdmin
      .from("properties")
      .update({
        pipeline_status: "quarantined",
        pdf_verified: false,
        details: {
          ...(details || {}),
          quarantine_reason: reason,
          quarantined_at: nowIso,
        },
      })
      .eq("id", propertyId)
      .eq("pipeline_status", "ai_drafting")
      .select("id")
      .maybeSingle();
    if (error || !quarantined) return false;

    if (document) {
      const { error: cleanupError } = await supabaseAdmin.storage.from(document.bucket).remove([document.path]);
      if (cleanupError) console.error("[queue-process] Could not remove quarantined PDF:", propertyId, cleanupError.code);
    }

    await writeAuditLog(supabaseAdmin, {
      action: "PROPERTY_PROCESSING_QUARANTINED",
      tableName: "properties",
      recordId: propertyId,
      userId: ownerId,
      metadata: { reason, ...details },
    }).catch(() => {});

    if (ownerId) {
      await notifyUser(supabaseAdmin, {
        userId: ownerId,
        title: "Property Document Ingestion Alert",
        desc: `Could not automatically process your document (${reason.replace(/_/g, " ")}). Please review or upload a readable PDF.`,
        propertyId,
        notificationType: "property_drafting",
      }).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error("[queue-process] Failed to quarantine property:", err);
    return false;
  }
}

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration missing: supabaseAdmin is not available." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedPropertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";

    let canProcessAny = false;
    let authUserId = null;

    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      canProcessAny = !authorizeCronRequest(request);
    }

    if (!canProcessAny) {
      const adminResult = await requireAdmin(request, { label: "QUEUE PROCESSOR" });
      if (!adminResult.error && adminResult.userId) {
        canProcessAny = true;
        authUserId = adminResult.userId;
      } else {
        authUserId = await resolveUserId(request);
      }
    }

    if (!canProcessAny && !authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canProcessAny && !requestedPropertyId) {
      return NextResponse.json({ error: "A property ID is required." }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("properties")
      .select("id, owner_id, title, location, type, space_category, price, description, media_link, pipeline_status, pdf_source_url, created_at, details")
      .eq("pipeline_status", "ai_drafting")
      .eq("creation_source", "pdf_assisted");

    if (requestedPropertyId) {
      query = query.eq("id", requestedPropertyId);
    } else {
      query = query.order("created_at", { ascending: true }).order("id", { ascending: true }).limit(1);
    }
    if (!canProcessAny) query = query.eq("owner_id", authUserId);

    const { data: property, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      console.error("[queue-process] Query error:", fetchError);
      return NextResponse.json(
        { error: sanitizeError(fetchError, "Failed to query queue.") },
        { status: 500 }
      );
    }

    if (!property) {
      return NextResponse.json({
        processed: 0,
        message: requestedPropertyId
          ? "Property not found or already processed."
          : "Queue is empty.",
      });
    }

    const document = resolveQueueDocument(property);
    const storagePath = document?.path;
    const currentAttempts = (property.details?.process_attempts || 0) + 1;

    // Poison-pill protection: if this property has failed too many times, quarantine it
    if (currentAttempts > MAX_PROCESS_ATTEMPTS) {
      const quarantined = await quarantineProperty(property.id, "max_retries_exceeded", property.details, property.owner_id, document);
      if (!quarantined) return NextResponse.json({ processed: 0 });
      return NextResponse.json({
        success: false,
        quarantined: true,
        reason: "max_retries_exceeded",
        error: "Maximum processing attempts exceeded. Listing quarantined for review.",
      }, { status: 422 });
    }

    // Stamp attempt counter immediately
    await supabaseAdmin
      .from("properties")
      .update({
        details: {
          ...(property.details || {}),
          process_attempts: currentAttempts,
          last_attempt_at: new Date().toISOString(),
        },
      })
      .eq("id", property.id)
      .eq("pipeline_status", "ai_drafting");

    if (!storagePath) {
      await quarantineProperty(property.id, "missing_storage_path", property.details, property.owner_id);
      return NextResponse.json({
        success: false,
        quarantined: true,
        reason: "missing_storage_path",
        error: "Document storage path missing.",
      }, { status: 422 });
    }

    // 1. Download file ONCE from storage
    let blob = null;
    try {
      const { data: dlBlob, error: dlError } = await supabaseAdmin.storage
        .from(document.bucket)
        .download(storagePath);

      if (dlError || !dlBlob) {
        console.warn("[queue-process] Storage download failed:", dlError?.message);
        await quarantineProperty(property.id, "storage_download_failed", { ...property.details, dl_error: dlError?.message }, property.owner_id);
        return NextResponse.json({
          success: false,
          quarantined: true,
          reason: "storage_download_failed",
          error: "Failed to download document from storage.",
        }, { status: 422 });
      }
      blob = dlBlob;
    } catch (dlException) {
      console.error("[queue-process] Error reading PDF:", dlException);
      await quarantineProperty(property.id, "storage_download_exception", { ...property.details, error: dlException.message }, property.owner_id);
      return NextResponse.json({
        success: false,
        quarantined: true,
        reason: "storage_download_exception",
        error: "Storage exception downloading document.",
      }, { status: 422 });
    }

    // 2. Oversize check: Enforce MAX_PDF_BYTES (25 MB)
    if (blob.size > MAX_PDF_BYTES) {
      console.warn(`[queue-process] PDF size ${blob.size} exceeds maximum ${MAX_PDF_BYTES} bytes`);
      const quarantined = await quarantineProperty(property.id, "pdf_oversize", { ...property.details, size_bytes: blob.size, max_bytes: MAX_PDF_BYTES }, property.owner_id, document);
      if (!quarantined) return NextResponse.json({ processed: 0 });
      return NextResponse.json({
        success: false,
        quarantined: true,
        reason: "pdf_oversize",
        error: "Document exceeds maximum allowed size (25 MB).",
      }, { status: 422 });
    }

    // 3. Extract text with corrupt-PDF detection
    let extractedText = "";
    try {
      const buffer = new Uint8Array(await blob.arrayBuffer());
      // Validate magic bytes (%PDF)
      if (buffer.length < 5 || buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
        throw new Error("Invalid PDF header magic bytes (not a valid PDF document)");
      }
      const pdfProxy = await getDocumentProxy(buffer);
      const totalPages = pdfProxy.numPages || 0;
      let rawText = "";
      if (totalPages > MAX_PDF_PAGES) {
        // Bounded server-side extraction: extract text only up to MAX_PDF_PAGES
        const texts = await Promise.all(
          Array.from({ length: Math.min(totalPages, MAX_PDF_PAGES) }, async (_, i) => {
            try {
              const page = await pdfProxy.getPage(i + 1);
              const content = await page.getTextContent();
              return content.items.filter((item) => item.str != null).map((item) => item.str).join(" ");
            } catch {
              return "";
            }
          })
        );
        rawText = texts.join("\n").replace(/\s+/g, " ");
      } else {
        const { text } = await extractText(pdfProxy, { mergePages: true });
        rawText = text || "";
      }
      extractedText = (rawText || "").trim().slice(0, MAX_RAW_TEXT_CHARS);
    } catch (pdfErr) {
      console.error("[queue-process] Corrupt PDF extraction failed:", pdfErr.message);
      const quarantined = await quarantineProperty(property.id, "corrupt_pdf", { ...property.details, error: pdfErr.message }, property.owner_id, document);
      if (!quarantined) return NextResponse.json({ processed: 0 });
      return NextResponse.json(
        {
          success: false,
          quarantined: true,
          reason: "corrupt_pdf",
          error: sanitizeError(pdfErr, "Document is corrupted or unreadable as a PDF."),
        },
        { status: 422 }
      );
    }

    // 4. Assimilate text into validated structured property data
    const extracted = await assimilatePropertyText(
      extractedText,
      property.details?.source_pdf || property.title
    );

    // 5. Update property listing in Supabase
    const nowIso = new Date().toISOString();
    const resolvedTitle = extracted.title || property.title || "Untitled Property";
    const resolvedLocation = extracted.location || (property.location !== "Pending" && property.location !== "Location Pending" ? property.location : "Location Pending");
    const resolvedCategory = extracted.space_category || property.space_category || "commercial";
    const draftDetails = { ...property.details, ...extracted.details };
    delete draftDetails.temp_storage_path;
    delete draftDetails.pdf_deleted_at;

    const { data: updatedDraft, error: updateError } = await supabaseAdmin
      .from("properties")
      .update({
        title: resolvedTitle,
        location: resolvedLocation,
        space_category: resolvedCategory,
        type: resolvedCategory,
        price: extracted.price != null ? extracted.price : property.price,
        description: extracted.description || property.description || "",
        media_link: extracted.media_link || null,
        pipeline_status: "pending",
        pdf_verified: false,
        pdf_source_url: storagePath,
        details: {
          ...draftDetails,
          floor_sqm: extracted.floor_sqm || null,
          lot_sqm: extracted.lot_sqm || null,
          beds: extracted.beds || null,
          baths: extracted.baths || null,
          parking: extracted.parking || null,
          ai_confidence: extracted.confidence || 0.8,
          ai_gaps: extracted.gaps || [],
          pdf_verification_required: true,
          processed_at: nowIso,
        },
      })
      .eq("id", property.id)
      .eq("pipeline_status", "ai_drafting")
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("[queue-process] Failed to update property:", updateError);
      return NextResponse.json(
        { error: sanitizeError(updateError, "Failed to update property dossier.") },
        { status: 500 }
      );
    }
    if (!updatedDraft) return NextResponse.json({ processed: 0 });

    await writeAuditLog(supabaseAdmin, {
      action: "PROPERTY_PARSED_AND_DRAFTED",
      tableName: "properties",
      recordId: property.id,
      userId: property.owner_id || authUserId,
      metadata: {
        source: "queue_processor",
        pending_source_review: true,
      },
    });

    if (property.owner_id) {
      await notifyUser(supabaseAdmin, {
        userId: property.owner_id,
        title: "Property Dossier Ready",
        desc: `Automatic parsing for "${resolvedTitle}" is complete. Human source verification is required before publication.`,
        propertyId: property.id,
        notificationType: "property_drafting",
      });
    }

    return NextResponse.json({
      success: true,
      propertyId: property.id,
      done: true,
      deletedPdf: false,
      title: resolvedTitle,
      pdf_verified: false,
    });
  } catch (err) {
    console.error("[queue-process] Unexpected error:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Queue processing failure.") },
      { status: 500 }
    );
  }
}
