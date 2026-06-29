// ─────────────────────────────────────────────────────────────────────────
// Dependency-free input sanitizer (server + browser safe).
//
// Previously this used `isomorphic-dompurify`, which pulls in `jsdom` on the
// server. Under Next.js serverless (Turbopack) that crashes at module load
// with `ERR_REQUIRE_ESM` (jsdom -> html-encoding-sniffer -> @exodus/bytes),
// taking down any API route that imported it — e.g. /api/dashboard/update.
//
// All fields we sanitize here are plain text (titles, locations, unit names,
// detail keys/values), so we strip HTML rather than allow-list rich markup.
// This is both safer (no XSS surface) and has zero native/ESM dependencies.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Strips all HTML tags (and the contents of dangerous blocks) from a string,
 * returning plain text. Safe to run on both the server and the client.
 * @param {string} text - The input text
 * @returns {string} Plain text with all HTML removed
 */
export function stripAllTags(text) {
  if (typeof text !== "string") return text;
  return text
    // Drop dangerous elements together with their contents
    .replace(/<(script|style|iframe|object|embed|svg|math)[^>]*>[\s\S]*?<\/\1>/gi, "")
    // Remove any remaining HTML tags
    .replace(/<\/?[a-z][^>]*>/gi, "")
    // Neutralize stray angle brackets so nothing can be reconstructed as a tag
    .replace(/[<>]/g, "")
    .trim();
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
        sanitized[stripAllTags(key)] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}
