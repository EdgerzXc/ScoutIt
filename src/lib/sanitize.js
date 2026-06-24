import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes an object by recursively traversing and stripping XSS payloads from string values.
 * @param {any} obj - The object to sanitize
 * @returns {any} The sanitized object
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li', 'ol'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}

/**
 * Strips all HTML tags and returns plain text.
 * @param {string} text - The input text
 * @returns {string} Text with all HTML tags stripped
 */
export function stripAllTags(text) {
  if (typeof text !== 'string') return text;
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}
