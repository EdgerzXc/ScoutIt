import { supabase } from "./supabaseClient";
import { PROPERTY_PHOTO_MAX_BYTES, PROPERTY_PHOTO_MIME_TYPES } from "./propertyPhotoLimits";
import { PROPERTY_VIDEO_MAX_BYTES, PROPERTY_VIDEO_MAX_MIB } from "./propertyVideoLimits";

// 10MB for documents/images/audio, 50MB for videos
const MAX_SIZES = {
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

// Serverless function payload ceiling (4 MB safety margin below 4.5 MB platform limit)
const DIRECT_MULTIPART_MAX_BYTES = 4 * 1024 * 1024;

async function readHeaderHex(file, byteCount = 64) {
  if (!file) return null;
  try {
    const slice = typeof file.slice === "function" ? file.slice(0, byteCount) : file;
    if (typeof slice.arrayBuffer !== "function") return null;
    const buf = new Uint8Array(await slice.arrayBuffer());
    return Array.from(buf.slice(0, byteCount))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

async function resolveSessionToken(explicitToken) {
  if (explicitToken) return explicitToken;
  if (typeof supabase?.auth?.getSession !== "function") return "";
  const { data } = await supabase.auth.getSession().catch(() => ({ data: {} }));
  return data?.session?.access_token || "";
}

async function uploadToPresignedStorage({ bucket, path, token, signedUrl, file, contentType }) {
  const storageBucket = supabase?.storage?.from?.(bucket);
  if (storageBucket && typeof storageBucket.uploadToSignedUrl === "function" && token) {
    const { error } = await storageBucket.uploadToSignedUrl(path, token, file, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      throw new Error(error.message || "Direct storage upload was interrupted.");
    }
    return;
  }

  if (!signedUrl) {
    throw new Error("Missing signed upload URL from server.");
  }

  const putRes = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType || "application/octet-stream",
    },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`Direct storage upload failed with status ${putRes.status}`);
  }
}

export const uploadAttachment = async (dealId, file, extraMeta = {}) => {
  // 1. Client-side MIME Type Validation (Defense in Depth)
  const baseType = (file.type || "").split(";")[0].trim().toLowerCase();
  if (!MAX_SIZES[baseType]) {
    throw new Error("Invalid file type. Only JPG, PNG, WEBP, PDF, MP4, and Audio files are allowed.");
  }

  // 2. Client-side Size Validation
  const maxSize = MAX_SIZES[baseType];
  if (file.size > maxSize) {
    throw new Error(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB for this file type.`);
  }

  const token = await resolveSessionToken(extraMeta.token);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const endpoint = `/api/deals/${encodeURIComponent(dealId)}/attachments`;

  // 3a. Large attachments (> 4 MB) use presigned upload + complete verification
  if (file.size > DIRECT_MULTIPART_MAX_BYTES) {
    const headerHex = await readHeaderHex(file);
    const initRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        action: "init",
        fileName: file.name,
        mimeType: baseType,
        fileSize: file.size,
        headerHex,
        isVoiceNote: Boolean(extraMeta.isVoiceNote || baseType.startsWith("audio/")),
        duration: extraMeta.duration || null,
      }),
    });

    const initJson = await initRes.json().catch(() => ({}));
    if (!initRes.ok) {
      throw new Error(initJson.error || "Failed to initialize attachment upload.");
    }

    await uploadToPresignedStorage({
      bucket: initJson.bucket || "chat_attachments",
      path: initJson.path,
      token: initJson.token,
      signedUrl: initJson.signedUrl,
      file,
      contentType: baseType,
    });

    const completeRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        action: "complete",
        path: initJson.path,
        fileName: file.name,
        mimeType: baseType,
        fileSize: file.size,
        isVoiceNote: Boolean(extraMeta.isVoiceNote || baseType.startsWith("audio/")),
        duration: extraMeta.duration || null,
      }),
    });

    const completeJson = await completeRes.json().catch(() => ({}));
    if (!completeRes.ok) {
      throw new Error(completeJson.error || "Failed to finalize attachment upload.");
    }

    return {
      path: completeJson.path,
      url: completeJson.url,
      accessUrl: completeJson.accessUrl,
      name: completeJson.name || file.name,
      type: completeJson.type || baseType,
      size: completeJson.size || file.size,
      isVoiceNote: Boolean(completeJson.isVoiceNote),
      duration: completeJson.duration ?? extraMeta.duration ?? null,
    };
  }

  // 3b. Standard attachments (<= 4 MB) upload directly through the server gate
  const formData = new FormData();
  formData.append("file", file);
  if (extraMeta.isVoiceNote) formData.append("isVoiceNote", "true");
  if (extraMeta.duration != null) formData.append("duration", String(extraMeta.duration));

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });
  } catch (fetchErr) {
    const bucket = typeof supabase?.storage?.from === "function" ? supabase.storage.from("chat_attachments") : null;
    if (bucket && typeof bucket.upload === "function" && typeof bucket.createSignedUrl === "function") {
      const safeName = (file.name || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${dealId}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await bucket.upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        throw uploadError;
      }
      const { data: urlData, error: urlError } = await bucket.createSignedUrl(filePath, 60 * 60 * 24 * 7);
      if (urlError || !urlData?.signedUrl) {
        throw urlError || new Error("Failed to create signed URL for attachment.");
      }
      return {
        path: filePath,
        url: urlData.signedUrl,
        accessUrl: urlData.signedUrl,
        name: file.name,
        type: baseType || file.type,
        size: file.size,
        isVoiceNote: Boolean(extraMeta.isVoiceNote || baseType.startsWith("audio/")),
        duration: extraMeta.duration ?? null,
      };
    }
    throw fetchErr;
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Failed to upload file to secure storage.");
  }

  return {
    path: json.path,
    url: json.url,
    accessUrl: json.accessUrl,
    name: json.name || file.name,
    type: json.type || baseType,
    size: json.size || file.size,
    isVoiceNote: Boolean(json.isVoiceNote || extraMeta.isVoiceNote || baseType.startsWith("audio/")),
    duration: json.duration ?? extraMeta.duration ?? null,
  };
};

export const getAttachmentSignedUrl = async (dealId, storagePath, { token, mockOwnerId } = {}) => {
  const resolvedToken = await resolveSessionToken(token);
  const qs = new URLSearchParams({ path: storagePath });
  if (mockOwnerId && !resolvedToken) qs.set("mockOwnerId", mockOwnerId);

  const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/attachments?${qs.toString()}`, {
    method: "GET",
    headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {},
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) {
    throw new Error(json.error || "Failed to generate access URL for attachment.");
  }
  return json.url;
};

export const uploadPropertyVideo = async (file, { ownerId, propertyId, token } = {}) => {
  if (!file) throw new Error("No video file selected.");
  if (file.size > PROPERTY_VIDEO_MAX_BYTES) {
    throw new Error(`Video exceeds the ${PROPERTY_VIDEO_MAX_MIB} MB upload limit.`);
  }
  const resolvedToken = await resolveSessionToken(token);
  if (!resolvedToken) throw new Error("Please sign in before uploading a video.");

  const mimeType = (file.type || "video/mp4").split(";")[0].trim().toLowerCase();
  const headerHex = await readHeaderHex(file);
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${resolvedToken}`,
  };

  // Step 1: Authorize property ownership and acquire a scoped signed upload URL
  const initRes = await fetch("/api/storage/upload", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      action: "init",
      owner_id: ownerId,
      property_id: propertyId || "pending",
      file_name: file.name,
      file_size: file.size,
      mime_type: mimeType,
      header_hex: headerHex,
    }),
  });

  const initJson = await initRes.json().catch(() => ({}));
  if (!initRes.ok) {
    throw new Error(initJson.error || "Video upload authorization failed.");
  }

  // Duplicate submission already queued on the server
  if (initJson.deduplicated && initJson.alreadyQueued) {
    return initJson;
  }

  // Step 2: Stream the video directly to the private bucket using the scoped token
  await uploadToPresignedStorage({
    bucket: initJson.bucket || "property-videos-temp",
    path: initJson.path,
    token: initJson.token,
    signedUrl: initJson.signedUrl,
    file,
    contentType: mimeType,
  });

  // Step 3: Verify completion, magic bytes, scan registration, and queue deduplication
  const completeRes = await fetch("/api/storage/upload", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      action: "complete",
      owner_id: ownerId,
      property_id: propertyId || "pending",
      path: initJson.path,
      file_name: file.name,
      file_size: file.size,
      mime_type: mimeType,
    }),
  });

  const completeJson = await completeRes.json().catch(() => ({}));
  if (!completeRes.ok) {
    throw new Error(completeJson.error || "Video upload verification failed.");
  }

  return completeJson;
};

export const uploadPropertyPhoto = async (file) => {
  // Client-side quick check
  const baseType = (file.type || "").split(";")[0].trim().toLowerCase();
  if (!PROPERTY_PHOTO_MIME_TYPES.includes(baseType)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  if (file.size > PROPERTY_PHOTO_MAX_BYTES) {
    throw new Error("Choose an image no larger than 4 MB.");
  }

  // A-317: Route upload through authenticated server gate with magic-bytes verification
  const formData = new FormData();
  formData.append("file", file);

  const token = await resolveSessionToken();

  const res = await fetch("/api/storage/upload-photo", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Upload failed with status ${res.status}`);
  }

  const json = await res.json();
  return json.url;
};
