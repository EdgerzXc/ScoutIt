// B2 — magic-byte file-type verification (server-side, shared by upload/ingest
// routes). Never trust the client-declared MIME: read the file's first bytes
// and verify what it REALLY is. Mirrors mission-control's scan engine
// signatures so both apps agree on what counts as a given type.

function ascii(bytes, from, to) {
  let out = "";
  for (let i = from; i < to && i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

const SIGNATURES = [
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/webp", test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  { mime: "application/pdf", test: (b) => ascii(b, 0, 5) === "%PDF-" },
  { mime: "video/mp4", test: (b) => ascii(b, 4, 8) === "ftyp" }, // MP4/MOV/M4A family
  { mime: "video/webm", test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 }, // WebM/MKV family
  { mime: "video/x-msvideo", test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "AVI " },
  { mime: "audio/ogg", test: (b) => ascii(b, 0, 4) === "OggS" },
  { mime: "audio/wav", test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WAVE" },
  { mime: "audio/mpeg", test: (b) => ascii(b, 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && b[1] !== 0xff) },
];

// Containers whose magic-byte headers are shared between video and audio tracks
const SHARED_AUDIO_VIDEO_CONTAINERS = new Set(["video/mp4", "video/webm"]);

/** Detect the actual type from bytes; null if unrecognized. */
export function detectRealMime(bytes) {
  if (!bytes || bytes.length < 12) return null;
  for (const sig of SIGNATURES) {
    try {
      if (sig.test(bytes)) return sig.mime;
    } catch {
      /* short buffer */
    }
  }
  return null;
}

/**
 * Verify a buffer really belongs to one of the allowed MIME families
 * (e.g. ["video"], ["image", "application/pdf"]).
 * Returns { ok, realMime, reason }.
 */
export function verifyFileFamily(bytes, allowedFamilies) {
  const realMime = detectRealMime(bytes);
  if (!realMime) {
    return { ok: false, realMime: null, reason: "Unrecognized file content (does not match any allowed format)." };
  }
  const family = realMime.split("/")[0];
  const ok = allowedFamilies.some((f) => {
    if (f === realMime || f === family) return true;
    const allowedFamily = f.split("/")[0];
    if (allowedFamily === "audio" && SHARED_AUDIO_VIDEO_CONTAINERS.has(realMime)) return true;
    return false;
  });
  return ok
    ? { ok: true, realMime, reason: null }
    : { ok: false, realMime, reason: `File content is ${realMime}, which is not allowed here.` };
}
