import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { verifyFileFamily } from "@/lib/fileTypeCheck";
import { recordSystemEvent } from "@/lib/systemEvents";
import { sanitizeError } from "@/lib/sanitizeError";
import { PROPERTY_VIDEO_MAX_BYTES, PROPERTY_VIDEO_MAX_MIB } from "@/lib/propertyVideoLimits";

export const checkVideoUploadRate = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
  maxKeys: 10_000,
});

const TEMP_BUCKET = "property-videos-temp";
const DIRECT_MULTIPART_MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["mp4", "mov", "avi", "webm", "mkv"];
const ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska",
];

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role not configured");
  return createClient(url, key);
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

function isSafeSegment(seg) {
  if (typeof seg !== "string" || !seg.trim()) return false;
  return !seg.includes("/") && !seg.includes("\\") && !seg.includes(".");
}

function isSafeStoragePath(ownerId, propertyId, storagePath) {
  if (typeof storagePath !== "string" || !storagePath.trim()) return false;
  if (storagePath.includes("..") || storagePath.includes("\\")) return false;
  const expectedPrefix = `${ownerId}/${propertyId}/`;
  if (!storagePath.startsWith(expectedPrefix)) return false;
  const filename = storagePath.slice(expectedPrefix.length);
  return filename.length > 0 && !filename.includes("/");
}

async function readVideoHeader(bucket, path) {
  const { data: stream, error } = await bucket.download(path).asStream();
  if (error || !stream) return null;

  const reader = stream.getReader();
  const header = new Uint8Array(64);
  let offset = 0;
  try {
    while (offset < header.length) {
      const { value, done } = await reader.read();
      if (done) break;
      const bytes = value.subarray(0, header.length - offset);
      header.set(bytes, offset);
      offset += bytes.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return header.subarray(0, offset);
}

async function verifyPropertyOwnership(supabase, propertyId, userId) {
  if (!propertyId || propertyId === "pending") {
    return { ok: true, propertyId: "pending", dbPropertyId: null };
  }
  const { data: property, error } = await supabase
    .from("properties")
    .select("id, owner_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: "Failed to verify property ownership" };
  }
  if (!property) {
    return { ok: false, status: 404, error: "Property not found" };
  }
  if (property.owner_id !== userId) {
    return { ok: false, status: 403, error: "Forbidden: You do not own this property" };
  }
  return { ok: true, propertyId: property.id, dbPropertyId: property.id };
}

async function findExistingActiveQueueItem(supabase, { storagePath, ownerId, dbPropertyId, fileName, fileSize }) {
  try {
    if (storagePath) {
      const { data: byPath } = await supabase
        .from("video_upload_queue")
        .select("id, storage_path, status")
        .eq("storage_path", storagePath)
        .maybeSingle();
      if (byPath) return byPath;
    }

    if (ownerId && fileName && fileSize) {
      let query = supabase
        .from("video_upload_queue")
        .select("id, storage_path, status")
        .eq("owner_id", ownerId)
        .eq("original_filename", fileName)
        .eq("file_size_bytes", fileSize)
        .in("status", ["pending_luma", "processing"]);

      if (dbPropertyId) {
        query = query.eq("property_id", dbPropertyId);
      }

      const { data: byMeta } = await query.maybeSingle();
      if (byMeta) return byMeta;
    }
  } catch {
    // Non-fatal if deduplication lookup fails
  }
  return null;
}

async function ensureScanAndQueueRecords(
  supabase,
  { path, ownerId, dbPropertyId, fileName, mimeType, fileSize }
) {
  let queuePending = false;

  // Ensure file_scans row exists (recover if missing on retry)
  const { data: existingScan } = await supabase
    .from("file_scans")
    .select("id")
    .eq("bucket", TEMP_BUCKET)
    .eq("storage_path", path)
    .maybeSingle();

  if (!existingScan) {
    const { error: scanRegError } = await supabase.from("file_scans").insert({
      bucket: TEMP_BUCKET,
      storage_path: path,
      uploader_id: ownerId,
      property_id: dbPropertyId,
      original_filename: fileName,
      declared_mime: mimeType || "video/mp4",
      size_bytes: fileSize,
      scan_status: "pending_scan",
    });
    if (scanRegError) {
      console.warn("[Storage Upload] file_scans registration failed:", scanRegError.message);
      queuePending = true;
    }
  }

  // Ensure video_upload_queue row exists
  const existingQueue = await findExistingActiveQueueItem(supabase, {
    storagePath: path,
    ownerId,
    dbPropertyId,
    fileName,
    fileSize,
  });

  if (existingQueue) {
    return {
      deduplicated: true,
      queuePending,
      path: existingQueue.storage_path || path,
    };
  }

  const { error: notifyError } = await supabase.from("video_upload_queue").insert({
    owner_id: ownerId,
    property_id: dbPropertyId,
    storage_path: path,
    original_filename: fileName,
    file_size_bytes: fileSize,
    status: "pending_luma",
  });

  if (notifyError) {
    console.warn("[Storage Upload] Queue insert failed:", notifyError.message);
    queuePending = true;
  }

  if (queuePending) {
    await recordSystemEvent({
      event: "storage.video_upload.recovery_required",
      source: "api/storage/upload",
      severity: "warning",
      subjectTable: "properties",
      subjectId: String(dbPropertyId || ownerId),
      summary: `Video upload registration needs recovery for ${path}`,
      detail: {
        bucket: TEMP_BUCKET,
        storagePath: path,
        ownerId,
        propertyId: dbPropertyId,
        fileName,
        fileSize,
      },
    }).catch(() => {});
  }

  return {
    deduplicated: false,
    queuePending,
    path,
  };
}

export async function POST(request) {
  try {
    // Authenticate user via JWT to prevent identity spoofing
    const authHeader = request.headers.get("Authorization") || "";
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = tokenMatch ? tokenMatch[1].trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const rate = checkVideoUploadRate(clientIp(request) + ":" + user.id);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many video upload requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const supabase = getServiceClient();
    const contentType = String(request.headers.get("content-type") || "").toLowerCase();

    // ── PRESIGNED LARGE VIDEO FLOW (init / complete) ─────────────────────────
    if (contentType.includes("application/json")) {
      const payload = await request.json().catch(() => null);
      if (!payload || typeof payload !== "object") {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
      }

      const action = payload.action || "init";
      const ownerId = String(payload.owner_id || payload.ownerId || "");
      const rawPropertyId = String(payload.property_id || payload.propertyId || "pending") || "pending";
      const fileName = String(payload.file_name || payload.fileName || "").trim();
      const fileSize = Number(payload.file_size ?? payload.fileSize ?? 0);
      const mimeType = String(payload.mime_type || payload.mimeType || "video/mp4")
        .split(";")[0]
        .trim()
        .toLowerCase();

      if (!ownerId) {
        return NextResponse.json({ error: "owner_id required" }, { status: 400 });
      }
      if (ownerId !== user.id) {
        return NextResponse.json({ error: "Unauthorized: Cannot upload for a different user" }, { status: 403 });
      }
      if (!isSafeSegment(ownerId) || !isSafeSegment(rawPropertyId)) {
        return NextResponse.json({ error: "Invalid owner_id or property_id format" }, { status: 400 });
      }

      const ownership = await verifyPropertyOwnership(supabase, rawPropertyId, user.id);
      if (!ownership.ok) {
        return NextResponse.json({ error: ownership.error }, { status: ownership.status });
      }

      if (!fileName) {
        return NextResponse.json({ error: "file_name required" }, { status: 400 });
      }
      if (!Number.isSafeInteger(fileSize) || fileSize <= 0) {
        return NextResponse.json({ error: "Valid file_size required" }, { status: 400 });
      }
      if (fileSize > PROPERTY_VIDEO_MAX_BYTES) {
        return NextResponse.json({ error: `Video exceeds the ${PROPERTY_VIDEO_MAX_MIB} MB upload limit.` }, { status: 413 });
      }

      const ext = fileName.split(".").pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ error: `File type .${ext} not allowed` }, { status: 415 });
      }
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return NextResponse.json({ error: `MIME type ${mimeType} not allowed` }, { status: 415 });
      }

      if (action === "init") {
        if (payload.header_hex || payload.headerHex) {
          const headerBytes = decodeHexBytes(payload.header_hex || payload.headerHex);
          if (!headerBytes) {
            return NextResponse.json({ error: "Invalid file header bytes" }, { status: 400 });
          }
          const check = verifyFileFamily(headerBytes, ["video"]);
          if (!check.ok) {
            return NextResponse.json({ error: `Rejected: ${check.reason}` }, { status: 415 });
          }
        }

        // Check if an identical active upload is already queued for this property
        const existingQueue = await findExistingActiveQueueItem(supabase, {
          ownerId,
          dbPropertyId: ownership.dbPropertyId,
          fileName,
          fileSize,
        });

        if (existingQueue?.storage_path) {
          return NextResponse.json({
            success: true,
            action: "init",
            deduplicated: true,
            alreadyQueued: true,
            path: existingQueue.storage_path,
            processingQueued: true,
            message:
              "This video is already queued for processing. ScoutIt team will process your Spatial Tour within 3–5 business days.",
          });
        }

        const safeBase = fileName
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9.\-_]/g, "_")
          .slice(-80);
        const timestamp = Date.now();
        const path = `${ownerId}/${rawPropertyId}/${timestamp}_${safeBase}.${ext}`;

        const { data: signedData, error: signError } = await supabase.storage
          .from(TEMP_BUCKET)
          .createSignedUploadUrl(path);

        if (signError || !signedData) {
          console.warn("[Storage Upload] Could not sign video upload:", signError?.statusCode || signError?.name);
          return NextResponse.json(
            { error: "Video storage is unavailable. Please try again later.", code: "VIDEO_STORAGE_UNAVAILABLE" },
            { status: 503 }
          );
        }

        return NextResponse.json({
          success: true,
          action: "init",
          bucket: TEMP_BUCKET,
          path,
          token: signedData.token,
          signedUrl: signedData.signedUrl,
        });
      }

      if (action === "complete") {
        const storagePath = String(payload.path || "");
        if (!isSafeStoragePath(ownerId, rawPropertyId, storagePath)) {
          return NextResponse.json({ error: "Invalid or unauthorized storage path" }, { status: 403 });
        }

        // Verify the object exists in storage (detect interrupted uploads) and check magic bytes
        const bucket = supabase.storage.from(TEMP_BUCKET);
        const { data: info, error: infoError } = await bucket.info(storagePath);
        const actualSize = Number(info?.size);
        if (infoError || !Number.isSafeInteger(actualSize) || actualSize !== fileSize) {
          return NextResponse.json(
            {
              error: "Upload was interrupted or incomplete. Please retry uploading the video.",
              code: "UPLOAD_INCOMPLETE",
              retryable: true,
            },
            { status: 409 }
          );
        }

        const headerBytes = await readVideoHeader(bucket, storagePath);
        if (!headerBytes?.byteLength) {
          return NextResponse.json(
            {
              error: "Upload was interrupted or empty. Please retry uploading the video.",
              code: "UPLOAD_INCOMPLETE",
              retryable: true,
            },
            { status: 409 }
          );
        }

        const check = verifyFileFamily(headerBytes, ["video"]);
        if (!check.ok) {
          await bucket.remove([storagePath]).catch(() => {});
          return NextResponse.json({ error: `Rejected: ${check.reason}` }, { status: 415 });
        }

        const registration = await ensureScanAndQueueRecords(supabase, {
          path: storagePath,
          ownerId,
          dbPropertyId: ownership.dbPropertyId,
          fileName,
          mimeType,
          fileSize: actualSize,
        });

        return NextResponse.json({
          success: true,
          path: registration.path,
          publicUrl: registration.path,
          deduplicated: registration.deduplicated,
          processingQueued: !registration.queuePending,
          message: registration.queuePending
            ? "Video uploaded. Our processing registration is pending — the file is safe and the team will still pick it up; no need to re-upload."
            : "Video uploaded. ScoutIt team will process your Spatial Tour within 3–5 business days.",
        });
      }

      return NextResponse.json({ error: "Unsupported upload action" }, { status: 400 });
    }

    // ── MULTIPART FORMDATA FALLBACK (Small videos / legacy callers) ──────────
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid video upload." }, { status: 400 });
    }
    const file = formData.get("file");
    const ownerId = formData.get("owner_id");
    const propertyId = formData.get("property_id") || "pending";

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ownerId) {
      return NextResponse.json({ error: "owner_id required" }, { status: 400 });
    }
    if (ownerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized: Cannot upload for a different user" }, { status: 403 });
    }

    if (!isSafeSegment(ownerId) || !isSafeSegment(propertyId)) {
      return NextResponse.json({ error: "Invalid owner_id or property_id format" }, { status: 400 });
    }
    if (file.size > DIRECT_MULTIPART_MAX_BYTES) {
      return NextResponse.json({ error: "Use a signed upload for videos over 4 MB." }, { status: 413 });
    }

    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `File type .${ext} not allowed` }, { status: 415 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `MIME type ${file.type} not allowed` }, { status: 415 });
    }

    const ownership = await verifyPropertyOwnership(supabase, propertyId, user.id);
    if (!ownership.ok) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }

    const bytes = await file.arrayBuffer();
    const check = verifyFileFamily(new Uint8Array(bytes.slice(0, 64)), ["video"]);
    if (!check.ok) {
      return NextResponse.json({ error: `Rejected: ${check.reason}` }, { status: 415 });
    }

    // Deduplicate identical active submissions before re-uploading
    const existingQueue = await findExistingActiveQueueItem(supabase, {
      ownerId,
      dbPropertyId: ownership.dbPropertyId,
      fileName: file.name,
      fileSize: file.size,
    });

    if (existingQueue?.storage_path) {
      return NextResponse.json({
        success: true,
        deduplicated: true,
        path: existingQueue.storage_path,
        publicUrl: existingQueue.storage_path,
        processingQueued: true,
        message: "Video uploaded. ScoutIt team will process your Spatial Tour within 3–5 business days.",
      });
    }

    const timestamp = Date.now();
    const path = `${ownerId}/${propertyId}/${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(TEMP_BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "video/mp4",
        upsert: false,
      });

    if (uploadError) {
      console.error("[Storage Upload]", uploadError);
      return NextResponse.json({ error: sanitizeError(uploadError, "Video upload failed") }, { status: 500 });
    }

    const registration = await ensureScanAndQueueRecords(supabase, {
      path,
      ownerId,
      dbPropertyId: ownership.dbPropertyId,
      fileName: file.name,
      mimeType: file.type || "video/mp4",
      fileSize: file.size,
    });

    return NextResponse.json({
      success: true,
      path: registration.path,
      publicUrl: registration.path,
      deduplicated: registration.deduplicated,
      processingQueued: !registration.queuePending,
      message: registration.queuePending
        ? "Video uploaded. Our processing registration is pending — the file is safe and the team will still pick it up; no need to re-upload."
        : "Video uploaded. ScoutIt team will process your Spatial Tour within 3–5 business days.",
    });
  } catch (err) {
    console.error("[Storage Upload] Unexpected error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
