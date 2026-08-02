const DEFAULT_MAX_AGE_SECONDS = 5 * 60;

function decodeBase64Url(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(String(value || "").length / 4) * 4, "=");

  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "base64").toString("utf8");
  }

  return decodeURIComponent(
    Array.from(atob(normalized))
      .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("")
  );
}

export function readJwtPayload(token) {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

export function hasRecentPasswordAuthentication(
  token,
  { now = Date.now(), maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS } = {}
) {
  const payload = readJwtPayload(token);
  if (!payload || !Array.isArray(payload.amr)) return false;

  const nowSeconds = Math.floor(now / 1000);
  return payload.amr.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const method = String(entry.method || "").toLowerCase();
    const timestamp = Number(entry.timestamp);
    if (method !== "password" || !Number.isFinite(timestamp)) return false;

    const ageSeconds = nowSeconds - timestamp;
    return ageSeconds >= -30 && ageSeconds <= maxAgeSeconds;
  });
}

export function getBearerToken(request) {
  const header = request?.headers?.get?.("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

