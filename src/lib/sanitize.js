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
