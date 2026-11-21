const PRIVATE_PARAMETERS = new Set([
  "token", "access_token", "auth_token", "signature", "x-amz-signature", "x-goog-signature",
]);

export function publicMediaUrl(value) {
  if (typeof value !== "string" || !value.trim() || value.length > 2000) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password ||
        /\/storage\/v1\/object\/(?:sign|authenticated)(?:\/|$)/i.test(url.pathname) ||
        [...url.searchParams.keys()].some((name) => PRIVATE_PARAMETERS.has(name.toLowerCase()))) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
