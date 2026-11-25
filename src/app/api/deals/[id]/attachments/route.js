import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { isRoutedDealRecipient } from "@/lib/dealParty";
import { canPostInDealStatus } from "@/lib/deals/dealStatus";
import { verifyFileFamily } from "@/lib/fileTypeCheck";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { recordSystemEvent } from "@/lib/systemEvents";

export const dynamic = "force-dynamic";

const BUCKET = "chat_attachments";
const SIGNED_READ_TTL_SECONDS = 300; // 5 minutes for GET read links
const INITIAL_SIGNED_READ_TTL_SECONDS = 3600; // 1 hour for immediate render after upload

export const CHAT_ATTACHMENT_MAX_SIZES = {
  "image/jpeg": 10 * 1024 * 1024,
  "image/png": 10 * 1024 * 1024,
  "image/webp": 10 * 1024 * 1024,
  "application/pdf": 10 * 1024 * 1024,
  "video/mp4": 50 * 1024 * 1024,
  "audio/webm": 10 * 1024 * 1024,
  "audio/mp4": 10 * 1024 * 1024,
  "audio/ogg": 10 * 1024 * 1024,
  "audio/mpeg": 10 * 1024 * 1024,
  "audio/wav": 10 * 1024 * 1024,
  "audio/x-m4a": 10 * 1024 * 1024,
  "audio/aac": 10 * 1024 * 1024,
};

export const checkDealAttachmentRate = createRateLimiter({
  limit: 20,
  windowMs: 60_000,
  maxKeys: 10_000,
});

function normalizeBaseMime(rawMime) {
  return String(rawMime || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
}

function allowedFamiliesForMime(baseType) {
  if (baseType === "application/pdf") return ["application/pdf"];
  if (baseType.startsWith("image/")) return ["image"];
  if (baseType.startsWith("video/")) return ["video"];
  if (baseType.startsWith("audio/")) return ["audio", "video/webm", "video/mp4"];
  return [baseType];
}

function isSafeDealAttachmentPath(dealId, storagePath) {
  if (typeof storagePath !== "string" || !storagePath.trim()) return false;
  if (storagePath.includes("..") || storagePath.includes("\\")) return false;
  const prefix = `${dealId}/`;
  if (!storagePath.startsWith(prefix)) return false;
  const rest = storagePath.slice(prefix.length);
  return rest.length > 0 && !rest.includes("/");
}

function decodeHexBytes(hex) {
  if (typeof hex !== "string" || hex.length < 24) return null;
  const clean = hex.trim().replace(/[^0-9a-fA-F]/g, "");
  if (clean.length < 24 || clean.length % 2 !== 0) return null;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function authorizeDealParticipant(dealId, userId, { requireWritableStatus = false } = {}) {
  const { data: deal, error: dealError } = await supabaseAdmin
    .from("deals")
    .select("status, property_id, buyer_id, broker_id, properties(id, title, owner_id)")
    .eq("id", dealId)
    .single();

  if (dealError || !deal) {
    return { ok: false, status: 404, error: "Deal not found" };
  }

  const isRoutedRecipient = await isRoutedDealRecipient(supabaseAdmin, dealId, userId);
  const isParty =
    deal.buyer_id === userId ||
    deal.broker_id === userId ||
    deal.properties?.owner_id === userId ||
    isRoutedRecipient;

  if (!isParty) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (requireWritableStatus) {
    if (deal.status === "closed") {
      return { ok: false, status: 403, error: "This conversation has been closed and is read-only." };
    }
    if (!canPostInDealStatus(deal.status)) {
      return {
        ok: false,
        status: 403,
        error: "This conversation isn't open yet — attachments unlock on acceptance.",
      };
    }

    try {
      const { data: senderProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("is_shadowbanned, archived_at")
        .eq("id", userId)
        .maybeSingle();
      if (senderProfile?.is_shadowbanned === true || Boolean(senderProfile?.archived_at)) {
        return {
          ok: false,
          status: 403,
          error: "Account is restricted from sending attachments.",
          code: "ACCOUNT_RESTRICTED",
        };
      }
    } catch {
      // Fail open if moderation columns are not yet present
    }
  }

  return { ok: true, deal };
}

async function registerAttachmentScan({
  storagePath,
  userId,
  propertyId,
  fileName,
  declaredMime,
  sizeBytes,
  dealId,
}) {
  const { error: scanRegError } = await supabaseAdmin.from("file_scans").insert({
    bucket: BUCKET,
    storage_path: storagePath,
    uploader_id: userId,
    property_id: propertyId || null,
    original_filename: fileName,
    declared_mime: declaredMime,
    size_bytes: sizeBytes,
    scan_status: "pending_scan",
  });

  if (scanRegError) {
    console.warn("[deal-attachments] file_scans registration failed:", scanRegError.message);
    await recordSystemEvent({
      event: "storage.chat_attachment.scan_registration_failed",
      source: "api/deals/attachments",
      severity: "warning",
      subjectTable: "deals",
      subjectId: String(dealId),
      summary: `Attachment scan registration failed for ${storagePath}`,
      detail: {
        bucket: BUCKET,
        storagePath,
        uploaderId: userId,
        dealId,
        error: scanRegError.message,
      },
    }).catch(() => {});
    return false;
  }

  return true;
}

async function markAttachmentScanStatus(storagePath, scanStatus, extra = {}) {
  try {
    const query = supabaseAdmin.from("file_scans");
    if (typeof query?.update !== "function") return false;
    const { data, error } = await query
      .update({ scan_status: scanStatus, ...extra })
      .eq("bucket", BUCKET)
      .eq("storage_path", storagePath)
      .select("id");
    if (error) return false;
    return Array.isArray(data) ? data.length > 0 : true;
  } catch {
    return false;
  }
}

export async function GET(request, { params }) {
  try {
    const { id: dealId } = await params;
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Storage service unavailable" }, { status: 503 });
    }

    const authz = await authorizeDealParticipant(dealId, userId, { requireWritableStatus: false });
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error, code: authz.code }, { status: authz.status });
    }

    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get("path") || "";
    if (!isSafeDealAttachmentPath(dealId, storagePath)) {
      return NextResponse.json({ error: "Invalid attachment path" }, { status: 400 });
    }

    // Fail closed if file_scans lookup fails, is missing, unverified, or quarantined
    let scanRow = null;
    try {
      const { data, error: scanError } = await supabaseAdmin
        .from("file_scans")
        .select("scan_status, scan_verdict")
        .eq("bucket", BUCKET)
        .eq("storage_path", storagePath)
        .maybeSingle();

      if (scanError) {
        return NextResponse.json(
          { error: "Attachment security status unavailable." },
          { status: 503 }
        );
      }
      scanRow = data;
    } catch {
      return NextResponse.json(
        { error: "Attachment security status unavailable." },
        { status: 503 }
      );
    }

    if (
      !scanRow ||
      scanRow.scan_status === "awaiting_verification" ||
      scanRow.scan_status === "verification_failed"
    ) {
      return NextResponse.json(
        {
          error: "Attachment has not completed security verification.",
          code: "ATTACHMENT_UNVERIFIED",
        },
        { status: 423 }
      );
    }

    if (
      scanRow.scan_verdict === "infected" ||
      scanRow.scan_verdict === "suspicious"
    ) {
      return NextResponse.json(
        {
          error: "Attachment blocked by security scan.",
          code: "ATTACHMENT_QUARANTINED",
        },
        { status: 423 }
      );
    }

    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_READ_TTL_SECONDS);

    if (urlError || !urlData?.signedUrl) {
      return NextResponse.json({ error: "Failed to generate access URL for attachment." }, { status: 502 });
    }

    if (searchParams.get("redirect") === "1") {
      const redirectRes = NextResponse.redirect(urlData.signedUrl, 302);
      redirectRes.headers.set("Cache-Control", "private, no-store");
      return redirectRes;
    }

    return NextResponse.json(
      {
        success: true,
        path: storagePath,
        url: urlData.signedUrl,
        expiresIn: SIGNED_READ_TTL_SECONDS,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: dealId } = await params;
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkDealAttachmentRate(`${clientIp(request)}:${userId}:${dealId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many attachment uploads. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Storage service unavailable" }, { status: 503 });
    }

    const authz = await authorizeDealParticipant(dealId, userId, { requireWritableStatus: true });
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error, code: authz.code }, { status: authz.status });
    }
    const { deal } = authz;
    const propertyId = deal.properties?.id || deal.property_id || null;

    const contentType = String(request.headers?.get?.("content-type") || "").toLowerCase();

    // Mode 1: JSON presigned upload flow (init / complete) for large attachments (e.g., 50MB video)
    if (contentType.includes("application/json")) {
      const payload = await request.json().catch(() => null);
      if (!payload || typeof payload !== "object") {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
      }

      const action = payload.action || "init";
      const fileName = String(payload.fileName || payload.name || "attachment").trim();
      const baseType = normalizeBaseMime(payload.mimeType || payload.type);
      const fileSize = Number(payload.fileSize ?? payload.size ?? 0);

      if (!CHAT_ATTACHMENT_MAX_SIZES[baseType]) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPG, PNG, WEBP, PDF, MP4, and Audio files are allowed." },
          { status: 415 }
        );
      }

      const maxSize = CHAT_ATTACHMENT_MAX_SIZES[baseType];
      if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > maxSize) {
        return NextResponse.json(
          { error: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB for this file type.` },
          { status: 413 }
        );
      }

      if (action === "init") {
        const headerBytes = decodeHexBytes(payload.headerHex);
        if (!headerBytes) {
          return NextResponse.json({ error: "Missing or invalid file header bytes" }, { status: 400 });
        }
        const check = verifyFileFamily(headerBytes, allowedFamiliesForMime(baseType));
        if (!check.ok) {
          return NextResponse.json({ error: `Rejected: ${check.reason}` }, { status: 415 });
        }

        const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-120);
        const filePath = `${dealId}/${Date.now()}-${randomUUID().slice(0, 8)}_${safeName}`;

        const { data: signedData, error: signErr } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUploadUrl(filePath);

        if (signErr || !signedData) {
          return NextResponse.json({ error: "Failed to initialize attachment upload." }, { status: 502 });
        }

        const { error: initScanErr } = await supabaseAdmin.from("file_scans").insert({
          bucket: BUCKET,
          storage_path: filePath,
          uploader_id: userId,
          property_id: propertyId || null,
          original_filename: fileName,
          declared_mime: baseType,
          size_bytes: fileSize || null,
          scan_status: "awaiting_verification",
        });

        if (initScanErr) {
          return NextResponse.json(
            { error: "Failed to initialize attachment security tracking." },
            { status: 503 }
          );
        }

        return NextResponse.json({
          success: true,
          action: "init",
          bucket: BUCKET,
          path: filePath,
          token: signedData.token,
          signedUrl: signedData.signedUrl,
        });
      }

      if (action === "complete") {
        const storagePath = String(payload.path || "");
        if (!isSafeDealAttachmentPath(dealId, storagePath)) {
          return NextResponse.json({ error: "Invalid attachment path" }, { status: 400 });
        }

        const maxSize = CHAT_ATTACHMENT_MAX_SIZES[baseType];
        const bucketApi = supabaseAdmin.storage.from(BUCKET);
        if (typeof bucketApi.info === "function") {
          const { data: objInfo, error: infoErr } = await bucketApi.info(storagePath);
          const reportedSize = Number(objInfo?.size ?? objInfo?.metadata?.size);
          if (!infoErr && Number.isFinite(reportedSize) && reportedSize > maxSize) {
            await bucketApi.remove([storagePath]).catch(() => {});
            await markAttachmentScanStatus(storagePath, "verification_failed");
            return NextResponse.json(
              { error: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB for this file type.` },
              { status: 413 }
            );
          }
        }

        const { data: blob, error: dlErr } = await bucketApi.download(storagePath);

        if (dlErr || !blob) {
          return NextResponse.json(
            {
              error: "Uploaded attachment was not found or incomplete. Please retry the upload.",
              code: "UPLOAD_INCOMPLETE",
              retryable: true,
            },
            { status: 409 }
          );
        }

        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (bytes.byteLength === 0) {
          await bucketApi.remove([storagePath]).catch(() => {});
          await markAttachmentScanStatus(storagePath, "verification_failed");
          return NextResponse.json({ error: "Uploaded attachment is empty." }, { status: 400 });
        }
        if (bytes.byteLength > maxSize) {
          await bucketApi.remove([storagePath]).catch(() => {});
          await markAttachmentScanStatus(storagePath, "verification_failed");
          return NextResponse.json(
            { error: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB for this file type.` },
            { status: 413 }
          );
        }
        const check = verifyFileFamily(bytes.slice(0, 64), allowedFamiliesForMime(baseType));
        if (!check.ok) {
          await bucketApi.remove([storagePath]).catch(() => {});
          await markAttachmentScanStatus(storagePath, "verification_failed");
          return NextResponse.json({ error: `Rejected: ${check.reason}` }, { status: 415 });
        }

        const updatedExisting = await markAttachmentScanStatus(storagePath, "pending_scan", {
          size_bytes: bytes.byteLength || fileSize,
        });
        const scanQueued = updatedExisting
          ? true
          : await registerAttachmentScan({
              storagePath,
              userId,
              propertyId,
              fileName,
              declaredMime: baseType,
              sizeBytes: bytes.byteLength || fileSize,
              dealId,
            });

        const { data: urlData } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(storagePath, INITIAL_SIGNED_READ_TTL_SECONDS);

        const accessUrl = `/api/deals/${encodeURIComponent(dealId)}/attachments?path=${encodeURIComponent(storagePath)}`;
        return NextResponse.json({
          success: true,
          path: storagePath,
          url: urlData?.signedUrl || accessUrl,
          accessUrl,
          name: fileName,
          type: baseType,
          size: bytes.byteLength || fileSize,
          isVoiceNote: Boolean(payload.isVoiceNote || baseType.startsWith("audio/")),
          duration: payload.duration || null,
          scanQueued,
        });
      }

      return NextResponse.json({ error: "Unsupported attachment action" }, { status: 400 });
    }

    // Mode 2: Multipart FormData upload
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid attachment upload." }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const baseType = normalizeBaseMime(file.type);
    if (!CHAT_ATTACHMENT_MAX_SIZES[baseType]) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, WEBP, PDF, MP4, and Audio files are allowed." },
        { status: 415 }
      );
    }

    const maxSize = CHAT_ATTACHMENT_MAX_SIZES[baseType];
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB for this file type.` },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    const check = verifyFileFamily(buffer.slice(0, 64), allowedFamiliesForMime(baseType));
    if (!check.ok) {
      return NextResponse.json({ error: `Rejected: ${check.reason}` }, { status: 415 });
    }

    const safeName = (file.name || "attachment").replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-120);
    const filePath = `${dealId}/${Date.now()}-${randomUUID().slice(0, 8)}_${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: baseType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[DEAL ATTACHMENTS API] Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to secure storage." },
        { status: 502 }
      );
    }

    const scanQueued = await registerAttachmentScan({
      storagePath: filePath,
      userId,
      propertyId,
      fileName: file.name || safeName,
      declaredMime: baseType,
      sizeBytes: file.size || buffer.byteLength,
      dealId,
    });

    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(filePath, INITIAL_SIGNED_READ_TTL_SECONDS);

    if (urlError || !urlData?.signedUrl) {
      return NextResponse.json({ error: "Failed to generate access URL for attachment." }, { status: 502 });
    }

    const isVoiceNoteRaw = formData.get?.("isVoiceNote");
    const durationRaw = formData.get?.("duration");
    const accessUrl = `/api/deals/${encodeURIComponent(dealId)}/attachments?path=${encodeURIComponent(filePath)}`;

    return NextResponse.json({
      success: true,
      path: filePath,
      url: urlData.signedUrl,
      accessUrl,
      name: file.name || safeName,
      type: baseType,
      size: file.size || buffer.byteLength,
      isVoiceNote: isVoiceNoteRaw === "true" || isVoiceNoteRaw === true || baseType.startsWith("audio/"),
      duration: durationRaw ? Number(durationRaw) || null : null,
      scanQueued,
    });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
