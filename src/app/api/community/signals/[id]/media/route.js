import { NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { assertAdultEligibility, resolveUserId } from "@/lib/serverAuth";
import { isSignalActive } from "@/lib/communityPosting";
import { clientIp } from "@/lib/clientIp";
import { createRateLimiter } from "@/lib/rateLimit";
import { SIGNAL_MEDIA_UUID, SIGNAL_PHOTO_BUCKET, SIGNAL_PHOTO_LIMIT, SIGNAL_VIDEO_SECONDS, signalMediaSlotAllowed, signalMediaSlots } from "@/lib/signalMediaPolicy";
import { signalMediaEnabled, signalMediaPilotTier, signalStreamConfigured, signalStreamRequest } from "@/lib/signalMediaServer";

const readRate = createRateLimiter({ limit: 120, windowMs: 60_000, maxKeys: 20_000 });
const uploadRate = createRateLimiter({ limit: 16, windowMs: 60_000, maxKeys: 20_000 });
const photoInputBytes = 4 * 1024 * 1024;
const photoOutputBytes = 800 * 1024;
const noStore = { "Cache-Control": "private, no-store" };
const response = (body, status = 200) => NextResponse.json(body, { status, headers: noStore });
const unavailable = () => response({ error: "Signal media is unavailable." }, 503);
const active = (signal) => isSignalActive(signal.last_confirmed_at, new Date(), signal.status);

async function getSignal(id) {
  const { data, error } = await supabaseAdmin.from("stratosphere_signals")
    .select("id,author_account_id,signal_type,status,last_confirmed_at")
    .eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getUploadContext(request, id) {
  const userId = await resolveUserId(request);
  if (!userId) return { error: response({ error: "Sign in to add media." }, 401) };
  const signal = await getSignal(id);
  if (!signal || signal.author_account_id !== userId) return { error: response({ error: "Signal not found." }, 404) };
  const tier = signalMediaPilotTier(userId);
  const slots = signalMediaSlots(tier, signal.signal_type, signalStreamConfigured());
  if (tier) {
    const { data: profile, error } = await supabaseAdmin.from("user_profiles").select("is_shadowbanned,archived_at").eq("id", userId).maybeSingle();
    if (error) throw error;
    if (!profile || profile.archived_at || profile.is_shadowbanned || !(await assertAdultEligibility(userId))) {
      return { error: response({ error: "This account cannot add media." }, 403) };
    }
  }
  return { slots, signal };
}

export async function GET(request, { params }) {
  if (!readRate(clientIp(request)).allowed) return response({ error: "Too many requests." }, 429);
  const { id } = await params;
  const asset = new URL(request.url).searchParams.get("asset");
  if (!SIGNAL_MEDIA_UUID.test(id) || (asset && !SIGNAL_MEDIA_UUID.test(asset))) return response({ error: "Media not found." }, 404);
  if (!signalMediaEnabled()) return asset ? response({ error: "Media not found." }, 404) : response({ photoLimit: 0, videoLimit: 0, assets: [] });
  if (!supabaseAdmin) return unavailable();
  try {
    if (!asset) {
      const context = await getUploadContext(request, id);
      if (context.error) return context.error;
      if (!active(context.signal)) return response({ photoLimit: 0, videoLimit: 0, assets: [] });
      const { data, error } = await supabaseAdmin.from("signal_media").select("id,kind,position,state,created_at").eq("signal_id", id).order("position");
      if (error) throw error;
      return response({ ...context.slots, assets: data || [] });
    }

    const post = await getSignal(id);
    if (!post || !active(post)) return response({ error: "Media not found." }, 404);
    const { data: row, error } = await supabaseAdmin.from("signal_media").select("kind,locator")
      .eq("id", asset).eq("signal_id", id).eq("state", "approved")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).maybeSingle();
    if (error) throw error;
    if (!row?.locator) return response({ error: "Media not found." }, 404);
    if (row.kind === "photo") {
      const { data, error: signedError } = await supabaseAdmin.storage.from(SIGNAL_PHOTO_BUCKET).createSignedUrl(row.locator, 120);
      if (signedError || !data?.signedUrl) return unavailable();
      return NextResponse.redirect(data.signedUrl, { headers: noStore });
    }
    if (post.signal_type !== "COMMERCIAL_PROMOTION" || !/^[a-f\d]{32}$/i.test(row.locator)) return unavailable();
    const result = await signalStreamRequest(`${row.locator}/token`, {
      method: "POST", body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 }),
    });
    if (!/^[a-z\d._-]+$/i.test(result?.token || "")) return unavailable();
    return response({ playback: `https://customer-${process.env.SCOUTIT_SIGNAL_STREAM_CUSTOMER}.cloudflarestream.com/${result.token}/iframe` });
  } catch {
    return unavailable();
  }
}

async function reserve(id, kind, position, altText = "") {
  const { data, error } = await supabaseAdmin.from("signal_media")
    .insert({ signal_id: id, kind, position, alt_text: altText }).select("id").single();
  if (error?.code === "23505") return null;
  if (error) throw error;
  return data.id;
}

async function stagePhoto(id, position, photo, altText) {
  if (!photo || typeof photo === "string" || photo.size === 0 || photo.size > photoInputBytes || !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
    return response({ error: "Choose a JPEG, PNG, or WebP photo up to 4 MB." }, 422);
  }
  let image;
  try {
    const decoder = sharp(Buffer.from(await photo.arrayBuffer()), { limitInputPixels: 32_000_000 });
    const { format, pages } = await decoder.metadata();
    if (!["jpeg", "png", "webp"].includes(format) || pages > 1) return response({ error: "Choose a still JPEG, PNG, or WebP photo." }, 422);
    image = await decoder.rotate().resize(1280, 1280, { fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toBuffer();
  } catch {
    return response({ error: "This image couldn’t be opened." }, 422);
  }
  if (image.length > photoOutputBytes) return response({ error: "Choose a smaller photo." }, 422);
  const assetId = await reserve(id, "photo", position, altText);
  if (!assetId) return response({ error: "That photo slot is already in use." }, 409);
  const path = `${id}/${assetId}.webp`;
  const bucket = supabaseAdmin.storage.from(SIGNAL_PHOTO_BUCKET);
  try {
    const { error: uploadError } = await bucket.upload(path, image, { contentType: "image/webp", upsert: false });
    if (uploadError) throw uploadError;
    const { data, error } = await supabaseAdmin.from("signal_media").update({ locator: path, state: "review" })
      .eq("id", assetId).eq("state", "reserved").select("id").maybeSingle();
    if (!error && data) return response({ ok: true, state: "review" }, 201);
  } catch {}
  const { data: current, error: readError } = await supabaseAdmin.from("signal_media").select("state,locator").eq("id", assetId).maybeSingle();
  if (current?.state === "review" && current.locator === path) return response({ ok: true, state: "review" }, 201);
  if (!readError && current?.state === "reserved") {
    const { error: removeError } = await bucket.remove([path]);
    if (!removeError) await supabaseAdmin.from("signal_media").delete().eq("id", assetId).eq("state", "reserved");
  }
  return unavailable();
}

async function startVideo(id) {
  const assetId = await reserve(id, "video", SIGNAL_PHOTO_LIMIT);
  if (!assetId) return response({ error: "This signal already has a video upload." }, 409);
  let uid;
  try {
    const expiresAt = new Date(Date.now() + 45 * 86_400_000).toISOString();
    const result = await signalStreamRequest("direct_upload", {
      method: "POST", body: JSON.stringify({
        maxDurationSeconds: SIGNAL_VIDEO_SECONDS,
        requireSignedURLs: true,
        expiry: new Date(Date.now() + 30 * 60_000).toISOString(),
        scheduledDeletion: expiresAt,
      }),
    });
    if (/^[a-f\d]{32}$/i.test(result?.uid || "")) uid = result.uid;
    if (!uid || new URL(result.uploadURL).origin !== "https://upload.videodelivery.net") throw new Error("Invalid upload receipt");
    const { data, error } = await supabaseAdmin.from("signal_media").update({ locator: uid, expires_at: expiresAt })
      .eq("id", assetId).eq("state", "reserved").select("id").maybeSingle();
    if (error || !data) throw new Error("Could not bind upload");
    return response({ uploadUrl: result.uploadURL }, 201);
  } catch {
    if (uid) await signalStreamRequest(uid, { method: "DELETE" }).catch(() => {});
    await supabaseAdmin.from("signal_media").delete().eq("id", assetId).eq("state", "reserved");
    return unavailable();
  }
}

async function finishVideo(id) {
  const { data: row, error } = await supabaseAdmin.from("signal_media").select("id,locator,state")
    .eq("signal_id", id).eq("kind", "video").maybeSingle();
  if (error) throw error;
  if (row?.state === "review" || row?.state === "approved") return response({ ok: true, state: row.state });
  if (row?.state !== "reserved" || !/^[a-f\d]{32}$/i.test(row.locator || "")) return response({ error: "Video upload not found." }, 404);
  const video = await signalStreamRequest(row.locator);
  if (video?.status?.state === "error" || Number(video?.duration) > SIGNAL_VIDEO_SECONDS) return response({ error: "The clip could not be processed. Discard it and try a clip of 30 seconds or less." }, 422);
  if (video?.readyToStream !== true) return response({ error: "Video is still processing. Check again shortly." }, 409);
  if (!video.requireSignedURLs || !(video.duration > 0 && video.duration <= SIGNAL_VIDEO_SECONDS)) return unavailable();
  const { data, error: updateError } = await supabaseAdmin.from("signal_media").update({ state: "review" })
    .eq("id", row.id).eq("state", "reserved").select("id").maybeSingle();
  if (updateError || !data) return unavailable();
  return response({ ok: true, state: "review" });
}

export async function POST(request, { params }) {
  if (!uploadRate(clientIp(request)).allowed) return response({ error: "Too many upload attempts." }, 429);
  const { id } = await params;
  if (!signalMediaEnabled() || !supabaseAdmin) return unavailable();
  if (!SIGNAL_MEDIA_UUID.test(id)) return response({ error: "Signal not found." }, 404);
  try {
    const context = await getUploadContext(request, id);
    if (context.error) return context.error;
    if (!active(context.signal)) return response({ error: "Media needs an active signal." }, 409);
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      if (!context.slots.photoLimit) return response({ error: "Photo uploads require Solar access." }, 403);
      if (Number(request.headers.get("content-length")) > photoInputBytes + 8192) return response({ error: "Choose a photo up to 4 MB." }, 413);
      const form = await request.formData();
      const position = Number(form.get("position") ?? NaN);
      if (!signalMediaSlotAllowed({ kind: "photo", position, ...context.slots })) return response({ error: "Choose an available photo slot." }, 422);
      return await stagePhoto(id, position, form.get("photo"), String(form.get("alt") || "").trim().slice(0, 120));
    }

    const body = await request.json().catch(() => null);
    if (!["startVideo", "finishVideo", "discardVideo"].includes(body?.action)) return response({ error: "Invalid media request." }, 400);
    if (!context.slots.videoLimit) return response({ error: "Video uploads require Cluster access and a Promotion signal." }, 403);
    if (body.action === "startVideo") return await startVideo(id);
    if (body.action === "finishVideo") return await finishVideo(id);
    const { data: row, error } = await supabaseAdmin.from("signal_media").select("id,locator,created_at,state")
      .eq("signal_id", id).eq("kind", "video").eq("state", "reserved").maybeSingle();
    if (error) throw error;
    if (!row?.locator || !/^[a-f\d]{32}$/i.test(row.locator)) return response({ error: "No pending upload to discard." }, 404);
    const { data: claimed, error: claimError } = await supabaseAdmin.from("signal_media").update({ state: "rejected" })
      .eq("id", row.id).eq("state", "reserved").select("id").maybeSingle();
    if (claimError || !claimed) return unavailable();
    try {
      await signalStreamRequest(row.locator, { method: "DELETE" });
    } catch {
      await supabaseAdmin.from("signal_media").update({ state: "reserved" }).eq("id", row.id).eq("state", "rejected");
      return unavailable();
    }
    await supabaseAdmin.from("signal_media").delete().eq("id", row.id).eq("state", "rejected");
    return response({ ok: true });
  } catch {
    return unavailable();
  }
}
