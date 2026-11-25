// ─────────────────────────────────────────────────────────────────────────
// Dependency-free input sanitizer (server + browser safe).
//
// Previously this used `isomorphic-dompurify`, which pulls in `jsdom` on the
// server. Under Next.js serverless (Turbopack) that crashes at module load
// with `ERR_REQUIRE_ESM` (jsdom -> html-encoding-sniffer -> @exodus/bytes),
// taking down any API route that imported it — e.g. /api/dashboard/update.
//
// All fields handled here are plain text (titles, locations, unit names, detail
// keys/values). This module is not an HTML allow-list and its output must never
// be passed to dangerouslySetInnerHTML. It removes tag-shaped sections and all
// remaining angle brackets so ordinary text rendering remains the security sink.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Strips all HTML tags (and the contents of dangerous blocks) from a string,
 * returning plain text. Safe to run on both the server and the client.
 * @param {string} text - The input text
 * @returns {string} Plain text with all HTML removed
 */
export function stripAllTags(text) {
  if (typeof text !== "string") return text;
  let output = "";
  let insideTag = false;
  let quote = null;

  for (const character of text) {
    if (!insideTag) {
      if (character === "<") {
        insideTag = true;
        output += " ";
      } else if (character !== ">") {
        output += character;
      }
      continue;
    }

    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      insideTag = false;
      quote = null;
    }
  }

  return output.replace(/\s+/g, " ").trim();
}

/**
 * Recursively sanitizes a value, stripping HTML from every string it contains.
 * Object keys are sanitized too. Non-string primitives pass through untouched.
 * @param {any} obj - The value to sanitize
 * @returns {any} The sanitized value
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") {
    return stripAllTags(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }
  if (typeof obj === "object") {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const sanitizedKey = stripAllTags(key);
        if (["__proto__", "prototype", "constructor"].includes(sanitizedKey)) continue;
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}

const MAX_SVG_MARKUP_CHARS = 65536;
const DANGEROUS_SVG_PATTERNS = [
  /<script\b/i,
  /\bon[a-z]+\s*=/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*(?:text\/html|image\/svg\+xml|application\/)/i,
  /<foreignObject\b/i,
  /<(?:iframe|object|embed|applet|meta|link|style|base|form|input|textarea|button)\b/i,
  /<(?:use|image|animate|animateTransform|animateMotion|set|mpath|feImage|a)\b/i,
  /\b(?:xlink:href|href|srcdoc|formaction)\s*=/i,
  /url\s*\(\s*['"]?\s*(?:javascript|data|vbscript):/i,
  /&#x?[0-9a-f]+;?/i,
];

/**
 * Validates that a string is strictly a safe SVG without script tags,
 * dangerous URI schemes, or event handlers.
 * @param {string} svgText - The SVG string to validate
 * @returns {boolean} Whether the SVG is safe to render
 */
export function isSafeSvgMarkup(svgText) {
  if (typeof svgText !== "string") return false;
  const trimmed = svgText.trim();
  if (!trimmed || trimmed.length > MAX_SVG_MARKUP_CHARS) return false;
  if (!/^<svg(?=[\s>])/i.test(trimmed) || !/<\/svg\s*>$/i.test(trimmed)) return false;
  if ((trimmed.match(/<svg(?=[\s>])/gi) || []).length !== 1) return false;
  if ((trimmed.match(/<\/svg\s*>/gi) || []).length !== 1) return false;
  return !DANGEROUS_SVG_PATTERNS.some((pattern) => pattern.test(trimmed));
}

const SVG_DATA_URI_PREFIX_RE = /^data:image\/svg\+xml(?:\s*;\s*(?:charset\s*=\s*)?utf-8)?\s*,/i;

/**
 * Normalizes a raw SVG string or Supabase `data:image/svg+xml;utf-8,...` QR URI
 * into sanitized SVG markup, or returns null if invalid/unsafe.
 * @param {string} input
 * @returns {string|null}
 */
export function extractSafeSvgMarkup(input) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (SVG_DATA_URI_PREFIX_RE.test(trimmed)) {
    const rest = trimmed.replace(SVG_DATA_URI_PREFIX_RE, "").trim();
    if (!rest) return null;
    if (/^<svg(?=[\s>])/i.test(rest)) {
      candidate = rest;
    } else {
      try {
        candidate = decodeURIComponent(rest);
      } catch {
        return null;
      }
    }
  }

  const normalized = candidate.trim();
  return isSafeSvgMarkup(normalized) ? normalized : null;
}
