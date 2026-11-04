import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { requireAdmin } from "@/lib/adminGuard";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { notifyUser } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/auditTrail";
import { sanitizeError } from "@/lib/sanitizeError";
import { assimilatePropertyText } from "@/lib/assimilateProperty";

const TEMP_BUCKET = "property_photos";

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration missing: supabaseAdmin is not available." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedPropertyId = body?.propertyId || null;

    // Check authorization: Cron, Admin, or Owner of the requested property
    let isAuthorized = false;
    let authUserId = null;

    // 1. Cron invocation check
    const cronAuth = authorizeCronRequest(request);
    if (!cronAuth) {
      isAuthorized = true;
    }

    // 2. Admin check
    if (!isAuthorized) {
      const adminResult = await requireAdmin(request, { label: "QUEUE PROCESSOR" });
      if (!adminResult.error) {
        isAuthorized = true;
        authUserId = adminResult.userId;
      }
    }

    // 3. User session check (owner checking their own listing)
    if (!isAuthorized) {
      authUserId = await resolveUserId(request);
    }

    // Select the property to process
    let query = supabaseAdmin
      .from("properties")
      .select("id, owner_id, title, location, type, space_category, price, description, media_link, pipeline_status, pdf_source_url, created_at, details")
      .eq("pipeline_status", "ai_drafting");

    if (requestedPropertyId) {
      query = query.eq("id", requestedPropertyId);
    } else {
      query = query.order("created_at", { ascending: true }).limit(1);
    }

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

    // If caller is an authenticated owner, verify they own this property
    if (!isAuthorized && authUserId) {
      if (property.owner_id === authUserId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const storagePath = property.details?.temp_storage_path || property.pdf_source_url;
    let extractedText = "";

    // 1. Download file ONCE if storage path exists
    if (storagePath) {
      try {
        const { data: blob, error: dlError } = await supabaseAdmin.storage
          .from(TEMP_BUCKET)
          .download(storagePath);

        if (!dlError && blob) {
          const buffer = new Uint8Array(await blob.arrayBuffer());
          const pdfProxy = await getDocumentProxy(buffer);
          const { text } = await extractText(pdfProxy, { mergePages: true });
          extractedText = (text || "").trim();
        } else {
          console.warn("[queue-process] Storage download failed:", dlError?.message);
        }
      } catch (dlException) {
        console.error("[queue-process] Error reading PDF:", dlException);
      }
    }

    // 2. Assimilate text into structured property data
    const extracted = await assimilatePropertyText(
      extractedText,
      property.details?.source_pdf || property.title
    );

    // 3. Update property listing in Supabase
    const nowIso = new Date().toISOString();
    const resolvedTitle = extracted.title || property.title || "Untitled Property";
    const resolvedLocation = extracted.location || (property.location !== "Pending" && property.location !== "Location Pending" ? property.location : "Location Pending");
    const resolvedCategory = extracted.space_category || property.space_category || "commercial";

    const { error: updateError } = await supabaseAdmin
      .from("properties")
      .update({
        title: resolvedTitle,
        location: resolvedLocation,
        space_category: resolvedCategory,
        type: resolvedCategory,
        price: extracted.price != null ? extracted.price : property.price,
        description: extracted.description || property.description || "",
        media_link: extracted.media_link || property.media_link || null,
        pipeline_status: "pending",
        pdf_verified: true,
        pdf_source_url: null, // Clear URL reference as file is deleted
        details: {
          ...(property.details || {}),
          ...(extracted.details || {}),
          floor_sqm: extracted.floor_sqm || null,
          lot_sqm: extracted.lot_sqm || null,
          beds: extracted.beds || null,
          baths: extracted.baths || null,
          parking: extracted.parking || null,
          ai_confidence: extracted.confidence || 0.8,
          ai_gaps: extracted.gaps || [],
          pdf_deleted_at: nowIso,
          processed_at: nowIso,
        },
      })
      .eq("id", property.id);

    if (updateError) {
      console.error("[queue-process] Failed to update property:", updateError);
      return NextResponse.json(
        { error: sanitizeError(updateError, "Failed to update property dossier.") },
        { status: 500 }
      );
    }

    // 4. CRITICAL: Permanently delete the temporary PDF from storage (Single-download policy)
    let pdfDeleted = false;
    if (storagePath) {
      try {
        const { error: removeError } = await supabaseAdmin.storage
          .from(TEMP_BUCKET)
          .remove([storagePath]);

        if (removeError) {
          console.warn("[queue-process] Failed to delete temp PDF:", removeError.message);
        } else {
          pdfDeleted = true;
        }
      } catch (remErr) {
        console.error("[queue-process] Exception deleting temp PDF:", remErr);
      }
    }

    // 5. Audit trail
    await writeAuditLog(supabaseAdmin, {
      action: "PROPERTY_PARSED_AND_DRAFTED",
      tableName: "properties",
      recordId: property.id,
      userId: property.owner_id || authUserId,
      metadata: {
        source: "queue_processor",
        source_pdf: property.details?.source_pdf,
        pdf_deleted: pdfDeleted,
      },
    });

    // 6. Dispatch completion notification to owner
    if (property.owner_id) {
      await notifyUser(supabaseAdmin, {
        userId: property.owner_id,
        title: "Property Dossier Ready",
        desc: `Automatic parsing for "${resolvedTitle}" is complete. Review your listing now.`,
        propertyId: property.id,
        notificationType: "property_drafting",
      });
    }

    return NextResponse.json({
      success: true,
      propertyId: property.id,
      done: true,
      deletedPdf: pdfDeleted,
      title: resolvedTitle,
    });
  } catch (err) {
    console.error("[queue-process] Unexpected error:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Queue processing failure.") },
      { status: 500 }
    );
  }
}
