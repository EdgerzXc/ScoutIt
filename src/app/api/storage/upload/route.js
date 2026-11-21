import { NextResponse } from "next/server";
import { canSee } from "@/lib/entitlements";
import { detectRealMime } from "@/lib/fileTypeCheck";
import { looksLikeUuid } from "@/lib/propertyLookup";
import { resolveServerTier, resolveUserId } from "@/lib/serverAuth";
import { SPATIAL_STYLE_PRESETS } from "@/lib/spatialStudio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getVideoFormat, VIDEO_BUCKET, VIDEO_MAX_BYTES } from "@/lib/conciergeVideo";

const NO_STORE = { "Cache-Control": "private, no-store" };
const HEADER_BYTES = 64;
const BODY_BYTES = 2048;

function reply(body, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function unavailable() {
  return reply({ error: "Video intake is temporarily unavailable. Try again.", code: "UNAVAILABLE" }, 503);
}

async function readJson(request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let length = 0;
  let body = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) return JSON.parse(body + decoder.decode());
      length += chunk.value.byteLength;
      if (length > BODY_BYTES) return null;
      body += decoder.decode(chunk.value, { stream: true });
    }
  } catch {
    return null;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

async function detectStoredVideo(bucket, path) {
  const { data: stream, error } = await bucket.download(path).asStream();
  if (error || !stream) throw new Error("Video header unavailable");
  const reader = stream.getReader();
  const header = new Uint8Array(HEADER_BYTES);
  let offset = 0;
  try {
    while (offset < header.length) {
      const { value, done } = await reader.read();
      if (done) break;
      const piece = value.subarray(0, header.length - offset);
      header.set(piece, offset);
      offset += piece.length;
    }
    return detectRealMime(header.subarray(0, offset));
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

const receipt = (id) => reply({ success: true, id, status: "pending_scan" });
const invalidVideo = () => reply({ error: "The stored file does not match the selected video. Remove it and choose a video again.", code: "INVALID_VIDEO" }, 415);
const expiredUpload = () => reply({ error: "This upload session expired. Remove the file and select it again.", code: "EXPIRED" }, 410);
const listingNotFound = () => reply({ error: "Select a listing you own.", code: "NOT_FOUND" }, 404);

async function reserveUpload(bucket, ownerId, id, body) {
  const { propertyId, stylePreset, filename, size } = body;
  const format = getVideoFormat(filename);
  if (!format) return reply({ error: "Choose an MP4, MOV, WebM or MKV video with a valid filename." }, 415);
  if (!Number.isSafeInteger(size) || size < 12 || size > VIDEO_MAX_BYTES) {
    return reply({ error: "Choose a non-empty video no larger than 50 MB." }, 413);
  }
  if (!looksLikeUuid(propertyId) || typeof stylePreset !== "string" ||
      !Object.hasOwn(SPATIAL_STYLE_PRESETS, stylePreset)) {
    return reply({ error: "Select a listing and a style preset." }, 400);
  }

  const { data: reservation, error } = await supabaseAdmin.rpc("reserve_concierge_video_upload", {
    p_id: id,
    p_owner: ownerId,
    p_property: propertyId.trim(),
    p_style: stylePreset,
    p_filename: filename,
    p_size: size,
    p_extension: format.extension,
    p_mime: format.mime,
  });
  if (error) return unavailable();
  if (reservation?.status === "not_found") return listingNotFound();
  if (reservation?.status === "limit") {
    return reply({ error: "You reached the daily video upload limit. Try again tomorrow.", code: "RATE_LIMIT" }, 429);
  }
  if (reservation?.status === "completed") return receipt(id);
  if (reservation?.status === "expired") return expiredUpload();
  if (reservation?.status === "conflict") return reply({ error: "This upload session is already assigned to another file." }, 409);
  if (reservation?.status !== "reserved" || !reservation.path) return unavailable();

  const { data, error: signError } = await bucket.createSignedUploadUrl(reservation.path, { upsert: false });
  if (signError || !data?.token) return unavailable();
  return reply({ success: true, id, path: reservation.path, token: data.token, contentType: format.mime });
}

async function completeUpload(bucket, ownerId, id) {
  const { data: reservation, error } = await supabaseAdmin
    .from("concierge_video_uploads")
    .select("storage_path, declared_mime, size_bytes, expires_at, completed_at")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) return unavailable();
  if (!reservation) return reply({ error: "Upload session not found.", code: "NO_SESSION" }, 404);
  if (reservation.completed_at) return receipt(id);
  if (Date.parse(reservation.expires_at) <= Date.now()) return expiredUpload();

  const { data: object, error: infoError } = await bucket.info(reservation.storage_path);
  if (infoError) {
    if ([infoError.status, infoError.statusCode].some((status) => String(status) === "404")) {
      return reply({ error: "The video upload did not finish. Try again.", code: "UPLOAD_INCOMPLETE" }, 409);
    }
    return unavailable();
  }
  if (!object?.version) return unavailable();
  const format = getVideoFormat(reservation.storage_path.split("/").at(-1));
  if (!format || object.size !== reservation.size_bytes || object.contentType !== reservation.declared_mime) {
    return invalidVideo();
  }
  const mime = await detectStoredVideo(bucket, reservation.storage_path);
  if (mime !== format.signature) return invalidVideo();

  const { data: result, error: completeError } = await supabaseAdmin.rpc("complete_concierge_video_upload", {
    p_id: id,
    p_owner: ownerId,
    p_version: object.version,
    p_detected_mime: mime,
  });
  if (completeError) return unavailable();
  if (result === "completed") return receipt(id);
  if (result === "expired") return expiredUpload();
  if (result === "not_found") return listingNotFound();
  if (result === "changed") {
    return reply({ error: "The file changed before it could be registered. Remove it and try again.", code: "INVALID_VIDEO" }, 409);
  }
  return unavailable();
}

export async function POST(request) {
  try {
    const ownerId = await resolveUserId(request);
    if (!looksLikeUuid(ownerId)) return reply({ error: "Sign in to upload a video." }, 401);
    if (!supabaseAdmin) return unavailable();
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) {
      return reply({ error: "Send upload details as JSON." }, 415);
    }
    const body = await readJson(request);
    if (!body || typeof body.id !== "string" || !looksLikeUuid(body.id) ||
        (body.action !== "init" && body.action !== "complete")) {
      return reply({ error: "Invalid upload request." }, 400);
    }

    const bucket = supabaseAdmin.storage.from(VIDEO_BUCKET);
    if (body.action === "complete") return await completeUpload(bucket, ownerId, body.id.trim());
    const { tier } = await resolveServerTier(request);
    if (!canSee("vault", tier)) return reply({ error: "This plan does not include Vault video uploads." }, 403);
    return await reserveUpload(bucket, ownerId, body.id.trim(), body);
  } catch (error) {
    console.error("[concierge video] Request failed", error?.code || error?.name || "Error");
    return unavailable();
  }
}
