import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyFileFamily } from "@/lib/fileTypeCheck";
import { calculateQueuePosition } from "@/lib/queuePosition";
import { notifyUser } from "@/lib/notifications";
import { resolveUserPerks } from "@/lib/BadgeEngine";
import { PRIVATE_QUEUE_BUCKET, PROPERTY_PDF_MAX_BYTES, propertyPdfUploadPath } from "@/lib/propertyQueueStorage";

const UPLOAD_ID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function reply(data, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

function uploadRoute(handler) {
  return async (request) => {
    try {
      const ownerId = await resolveUserId(request);
      if (!ownerId) return reply({ error: "Sign in to upload a PDF." }, 401);
      if (!supabaseAdmin) return reply({ error: "PDF uploads are temporarily unavailable." }, 503);
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return reply({ error: "Invalid PDF upload request." }, 400);
      }
      return await handler(body, ownerId);
    } catch (error) {
      console.error("[property-pdf-upload] Request failed:", error?.code || error?.name);
      return reply({ error: "PDF uploads are temporarily unavailable. Try again." }, 503);
    }
  };
}

export const POST = uploadRoute(async (body, ownerId) => {
  if (typeof body.filename !== "string" || !/\.pdf$/i.test(body.filename.trim()) ||
      !Number.isInteger(body.size) || body.size <= 0) {
    return reply({ error: "Choose a valid PDF file." }, 400);
  }
  if (body.size > PROPERTY_PDF_MAX_BYTES) return reply({ error: "Choose a PDF up to 25 MB." }, 413);

  const filename = body.filename.trim().replace(/[^\p{L}\p{N} ._-]/gu, "_").slice(-100);
  const { data: uploadId, error: reservationError } = await supabaseAdmin.rpc("reserve_property_pdf_upload", {
    p_owner_id: ownerId, p_filename: filename, p_size_bytes: body.size,
  });
  if (reservationError) throw reservationError;
  if (!uploadId) return reply({ error: "Your PDF queue is full. Wait for a draft to finish before uploading another file." }, 429);

  const path = propertyPdfUploadPath(ownerId, uploadId);
  const { data, error: signError } = await supabaseAdmin.storage.from(PRIVATE_QUEUE_BUCKET)
    .createSignedUploadUrl(path, { upsert: false });
  if (signError || !data?.token) {
    await supabaseAdmin.from("property_pdf_uploads").delete().eq("id", uploadId).eq("owner_id", ownerId);
    throw signError || new Error("Missing upload token");
  }

  return reply({ uploadId, path, token: data.token });
});

export const PATCH = uploadRoute(async (body, ownerId) => {
  if (typeof body.uploadId !== "string" || !UPLOAD_ID.test(body.uploadId)) {
    return reply({ error: "The PDF upload ID is invalid." }, 400);
  }

  const uploadId = body.uploadId.toLowerCase();
  const { data: intent, error: lookupError } = await supabaseAdmin.from("property_pdf_uploads")
    .select("size_bytes, property_id").eq("id", uploadId).eq("owner_id", ownerId)
    .gt("expires_at", new Date().toISOString()).maybeSingle();
  if (lookupError) throw lookupError;
  if (!intent) return reply({ error: "This PDF upload has expired. Upload the file again." }, 404);
  if (intent.property_id) return reply({ success: true, propertyId: intent.property_id });

  const path = propertyPdfUploadPath(ownerId, uploadId);
  const bucket = supabaseAdmin.storage.from(PRIVATE_QUEUE_BUCKET);
  const { data: object, error: objectError } = await bucket.info(path);
  if (objectError || !object) {
    const missing = !objectError || Number(objectError.statusCode || objectError.status) === 404;
    return reply({ error: missing ? "The PDF upload has not reached storage yet." : "Could not check the uploaded PDF." }, missing ? 409 : 503);
  }

  const { data: blob, error: downloadError } = await bucket.download(path);
  if (downloadError || !blob) return reply({ error: "Could not validate the uploaded PDF. Try again." }, 503);
  if (blob.size !== intent.size_bytes || blob.size > PROPERTY_PDF_MAX_BYTES) {
    return reply({ error: "The uploaded file size does not match the selected PDF." }, 422);
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (!verifyFileFamily(bytes, ["application/pdf"]).ok) {
    return reply({ error: "The uploaded file is not a valid PDF." }, 415);
  }

  const { data: badges } = await supabaseAdmin.from("user_badges").select("badge_id").eq("user_id", ownerId);
  const { data: result, error: finalizeError } = await supabaseAdmin.rpc("finalize_property_pdf_upload", {
    p_upload_id: uploadId,
    p_owner_id: ownerId,
    p_pdf_hash: createHash("sha256").update(bytes).digest("hex"),
    p_priority: Boolean(resolveUserPerks(badges || []).queue_priority),
  });
  if (finalizeError) throw finalizeError;
  if (result?.state === "full") return reply({ error: "Your PDF queue is full. Try again when a draft finishes." }, 429);
  if (result?.state === "expired") return reply({ error: "This PDF upload has expired. Upload the file again." }, 404);
  if (!result?.propertyId) throw new Error("Missing finalized draft");

  if (result.created) {
    const queueNumber = await calculateQueuePosition(supabaseAdmin, result.propertyId);
    await notifyUser(supabaseAdmin, {
      userId: ownerId, title: "Property Queued for Parsing", desc: `Your PDF is #${queueNumber} in the queue.`,
      propertyId: result.propertyId, notificationType: "property_drafting",
    }).catch(() => {});
  }
  return reply({ success: true, propertyId: result.propertyId });
});
