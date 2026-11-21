export const DEAL_ATTACHMENT_PREFIX = "__scoutit_attachment__:";
export const DEAL_ATTACHMENT_NOTICE = "A file was shared in this conversation.";

const MIB = 1024 * 1024;
const limits = Object.freeze({
  "image/jpeg": 10 * MIB,
  "image/png": 10 * MIB,
  "image/webp": 10 * MIB,
  "application/pdf": 10 * MIB,
  "video/mp4": 50 * MIB,
  "audio/webm": 10 * MIB,
  "audio/mp4": 10 * MIB,
  "audio/ogg": 10 * MIB,
  "audio/mpeg": 10 * MIB,
  "audio/wav": 10 * MIB,
  "audio/x-m4a": 10 * MIB,
  "audio/aac": 10 * MIB,
});

export function getDealAttachmentLimit(type) {
  return Object.hasOwn(limits, type) ? limits[type] : 0;
}

export function isDealAttachmentEnvelope(body) {
  return typeof body === "string" && body.startsWith(DEAL_ATTACHMENT_PREFIX);
}

export function encodeDealAttachment(attachment) {
  return DEAL_ATTACHMENT_PREFIX + JSON.stringify(attachment);
}

export function parseDealAttachmentEnvelope(body) {
  if (!isDealAttachmentEnvelope(body)) return null;
  try {
    const item = JSON.parse(body.slice(DEAL_ATTACHMENT_PREFIX.length));
    return item && typeof item === "object" && !Array.isArray(item) ? item : null;
  } catch {
    return null;
  }
}

const ATTACHMENT_PATH = /^[a-zA-Z0-9_-]{1,80}\/[a-zA-Z0-9_-][a-zA-Z0-9._-]{0,579}$/;

export function readLegacyDealAttachment(body, dealId, storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const item = parseDealAttachmentEnvelope(body);
  if (!item || typeof item.path !== "string" || !ATTACHMENT_PATH.test(item.path) ||
      item.path.split("/")[0] !== dealId || typeof item.name !== "string" ||
      !item.name.trim() || item.name.length > 512 || typeof item.url !== "string" ||
      typeof item.type !== "string" || !Number.isSafeInteger(item.size) ||
      item.size < 1 || item.size > getDealAttachmentLimit(item.type)) return null;
  try {
    const url = new URL(item.url);
    const project = new URL(storageBase);
    const loopbackProject = process.env.NODE_ENV !== "production" && project.protocol === "http:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(project.hostname);
    if ((url.protocol !== "https:" && !loopbackProject) || url.protocol !== project.protocol ||
        url.username || url.password || url.hash || url.origin === "null") return null;
    const sameOrigin = typeof globalThis.Origin?.from === "function"
      ? globalThis.Origin.from(url).isSameOrigin(globalThis.Origin.from(project))
      : url.origin === project.origin;
    if (!sameOrigin || url.pathname !== `/storage/v1/object/sign/chat_attachments/${item.path}` ||
        url.searchParams.size !== 1 || !url.searchParams.get("token")) return null;
    return {
      path: item.path,
      url: url.href,
      name: item.name,
      type: item.type,
      size: item.size,
      isVoiceNote: item.type.startsWith("audio/"),
      duration: Number.isFinite(item.duration) && item.duration > 0 ? item.duration : null,
    };
  } catch {
    return null;
  }
}
