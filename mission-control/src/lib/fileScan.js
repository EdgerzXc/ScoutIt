import "server-only";
import crypto from "crypto";

// B1 Stage-1 scan engine (server-only).
//
// Layered verdicts — every layer that is AVAILABLE must pass:
//   1. Magic-byte sniffing: the file's real type from its first bytes —
//      never trust the client-declared MIME (B2).
//   2. Coherence: detected type must be allowed AND match the declared type
//      family; size sanity-checked.
//   3. VirusTotal hash lookup (only if VIRUSTOTAL_API_KEY is set): known-bad
//      hash → infected; known-clean → strengthens the verdict.
// Verdict policy: any hard failure → 'infected' (spoofed type) or
// 'suspicious' (unknown type / VT flags). All available checks pass →
// 'clean'. The engine string records exactly which layers ran, so staff can
// see how strong a "clean" is.

const MAX_BYTES = 50 * 1024 * 1024; // absolute ceiling for scanned files

// Magic-byte signatures for the file families ScoutIt accepts.
const SIGNATURES = [
  { mime: "image/jpeg", ext: ["jpg", "jpeg"], test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: ["png"], test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/webp", ext: ["webp"], test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  { mime: "application/pdf", ext: ["pdf"], test: (b) => ascii(b, 0, 5) === "%PDF-" },
  // MP4/MOV family: 'ftyp' box at offset 4.
  { mime: "video/mp4", ext: ["mp4", "mov", "m4v"], test: (b) => ascii(b, 4, 8) === "ftyp" },
  { mime: "video/webm", ext: ["webm", "mkv"], test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
];

// Types we never accept regardless of declared MIME (executables, scripts,
// archives that smuggle payloads).
const FORBIDDEN = [
  { name: "windows-executable", test: (b) => b[0] === 0x4d && b[1] === 0x5a }, // MZ
  { name: "elf-executable", test: (b) => b[0] === 0x7f && ascii(b, 1, 4) === "ELF" },
  { name: "zip-archive", test: (b) => b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07) },
  { name: "gzip-archive", test: (b) => b[0] === 0x1f && b[1] === 0x8b },
  { name: "shell-script", test: (b) => ascii(b, 0, 2) === "#!" },
];

function ascii(bytes, from, to) {
  return Buffer.from(bytes.slice(from, to)).toString("ascii");
}

/** Detect the real file type from its bytes. Returns {mime, ext[]} or null. */
export function detectFileType(bytes) {
  if (!bytes || bytes.length < 12) return null;
  for (const sig of SIGNATURES) {
    try {
      if (sig.test(bytes)) return { mime: sig.mime, ext: sig.ext };
    } catch {
      /* short buffer — keep trying others */
    }
  }
  return null;
}

/** Check for explicitly forbidden payload types. Returns a name or null. */
export function detectForbiddenType(bytes) {
  if (!bytes || bytes.length < 4) return null;
  for (const f of FORBIDDEN) {
    try {
      if (f.test(bytes)) return f.name;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function sha256Hex(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/** Optional VirusTotal lookup by hash. Returns null when unavailable. */
async function virusTotalVerdict(sha256) {
  const key = process.env.VIRUSTOTAL_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, {
      headers: { "x-apikey": key },
    });
    if (res.status === 404) return { verdict: "unknown_hash" }; // never seen — not proof of clean
    if (!res.ok) return null; // VT unavailable — don't block the pipeline on it
    const json = await res.json();
    const stats = json?.data?.attributes?.last_analysis_stats || {};
    const bad = (stats.malicious ?? 0) + (stats.suspicious ?? 0);
    if (bad > 0) return { verdict: "infected", detail: `${bad} engines flagged` };
    return { verdict: "clean" };
  } catch {
    return null; // network failure — VT layer simply didn't run
  }
}

/**
 * Run the full Stage-1 scan on a file buffer.
 * @returns {Promise<{verdict:'clean'|'suspicious'|'infected', engine:string,
 *  detectedMime:string|null, sha256:string, notes:string}>}
 */
export async function scanBuffer(buffer, { declaredMime = null, filename = "" } = {}) {
  const bytes = new Uint8Array(buffer.slice(0, 64));
  const hash = sha256Hex(Buffer.from(buffer));
  const engines = ["magic-bytes"];
  const notes = [];

  // Size ceiling.
  if (buffer.byteLength > MAX_BYTES) {
    return {
      verdict: "suspicious",
      engine: engines.join("+"),
      detectedMime: null,
      sha256: hash,
      notes: `File exceeds ${MAX_BYTES / 1024 / 1024}MB scan ceiling`,
    };
  }

  // Forbidden payloads are an immediate hard fail.
  const forbidden = detectForbiddenType(bytes);
  if (forbidden) {
    return {
      verdict: "infected",
      engine: engines.join("+"),
      detectedMime: null,
      sha256: hash,
      notes: `Forbidden payload type detected: ${forbidden}`,
    };
  }

  // Real type must be one we recognize.
  const detected = detectFileType(bytes);
  if (!detected) {
    return {
      verdict: "suspicious",
      engine: engines.join("+"),
      detectedMime: null,
      sha256: hash,
      notes: "Unrecognized file type (magic bytes match no allowed format)",
    };
  }

  // Declared-vs-real coherence: a mismatch in FAMILY (image/pdf/video) means
  // the client lied about what it uploaded — treat as spoofing.
  if (declaredMime) {
    const declaredFamily = declaredMime.split("/")[0];
    const detectedFamily = detected.mime.split("/")[0];
    if (declaredFamily !== detectedFamily) {
      return {
        verdict: "infected",
        engine: engines.join("+"),
        detectedMime: detected.mime,
        sha256: hash,
        notes: `Type spoofing: declared ${declaredMime}, actual ${detected.mime}`,
      };
    }
  }

  // Extension coherence (soft signal — note, don't fail).
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext && !detected.ext.includes(ext)) {
    notes.push(`extension .${ext} does not match detected ${detected.mime}`);
  }

  // Optional VirusTotal layer.
  const vt = await virusTotalVerdict(hash);
  if (vt) {
    engines.push("virustotal");
    if (vt.verdict === "infected") {
      return {
        verdict: "infected",
        engine: engines.join("+"),
        detectedMime: detected.mime,
        sha256: hash,
        notes: `VirusTotal: ${vt.detail}`,
      };
    }
    if (vt.verdict === "unknown_hash") notes.push("hash not previously seen by VirusTotal");
  }

  return {
    verdict: "clean",
    engine: engines.join("+") + "+heuristics",
    detectedMime: detected.mime,
    sha256: hash,
    notes: notes.join("; ") || "all available checks passed",
  };
}
