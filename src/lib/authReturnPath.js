const PRIVATE_WORKSPACE_PATH = /^\/(?:dashboard(?:\/|$)|admin(?:\/|$))/;

export function normalizePrivateReturnPath(candidate, fallback = "/dashboard") {
  if (typeof candidate !== "string" || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "https://scoutit.invalid");
    if (parsed.origin !== "https://scoutit.invalid" || !PRIVATE_WORKSPACE_PATH.test(parsed.pathname)) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
