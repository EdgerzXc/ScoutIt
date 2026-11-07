const KNOWN_PLACEHOLDERS = new Set([
  "matterport:YWayaXpaJyH",
  "luma:b86b7928-f130-40a5-8cac-8095f30eed54",
]);

const IMAGE_HOSTS = new Set([
  "images.unsplash.com",
  "picsum.photos",
]);

function httpsUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function classifyPropertyMedia(value) {
  const url = httpsUrl(value);
  if (!url) return { kind: "invalid", url: "" };

  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();
  const imageExtension = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(pathname);
  if (imageExtension || IMAGE_HOSTS.has(hostname) || hostname.endsWith(".airtableusercontent.com") || hostname.endsWith(".supabase.co")) {
    return { kind: "image", url: url.toString() };
  }

  if (hostname === "my.matterport.com" && pathname === "/show/") {
    const id = url.searchParams.get("m") || "";
    if (/^[A-Za-z0-9_-]{8,24}$/.test(id) && !KNOWN_PLACEHOLDERS.has(`matterport:${id}`)) {
      return { kind: "matterport", url: url.toString() };
    }
    return { kind: "placeholder", url: "" };
  }

  if (hostname === "lumalabs.ai") {
    const match = url.pathname.match(/^\/embed\/([0-9a-f-]{36})\/?$/i);
    if (match && !KNOWN_PLACEHOLDERS.has(`luma:${match[1].toLowerCase()}`)) {
      return { kind: "luma", url: url.toString() };
    }
    return { kind: "placeholder", url: "" };
  }

  if ((hostname === "www.youtube.com" || hostname === "youtube.com") && /^\/embed\/[A-Za-z0-9_-]{6,20}$/.test(url.pathname)) {
    return { kind: "youtube", url: url.toString() };
  }

  return { kind: "unsupported", url: "" };
}

export function spatialEmbedUrl(value, expectedKind) {
  const media = classifyPropertyMedia(value);
  return media.kind === expectedKind ? media.url : "";
}

export function imageMediaUrl(value) {
  const media = classifyPropertyMedia(value);
  return media.kind === "image" ? media.url : "";
}

export function videoEmbedUrl(value) {
  const media = classifyPropertyMedia(value);
  return media.kind === "youtube" ? media.url : "";
}

export function safeFloorPlans(plans) {
  if (!Array.isArray(plans)) return [];
  return plans.flatMap((plan) => {
    const url = httpsUrl(plan?.url);
    if (!url) return [];
    const type = String(plan?.type || "").toLowerCase();
    if (!type.startsWith("image/") && type !== "application/pdf") return [];
    return [{
      url: url.toString(),
      name: String(plan?.name || "Floor plan").slice(0, 120),
      type,
    }];
  }).slice(0, 20);
}

/**
 * Hardened photo parser for Airtable and Supabase payloads.
 * Accepts strings (single or comma-separated), arrays of strings, or arrays of
 * Airtable attachment objects ({ url, filename, thumbnails }).
 * Discards malformed or unsafe items without dropping valid images from the gallery.
 */
export function extractPhotoUrls(value) {
  if (!value) return [];
  const rawList = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : typeof value === "object"
        ? [value]
        : [];

  const seen = new Set();
  const urls = [];

  for (const item of rawList) {
    if (!item) continue;
    let candidate = "";
    if (typeof item === "string") {
      candidate = item.trim();
    } else if (typeof item === "object") {
      if (typeof item.url === "string") {
        candidate = item.url.trim();
      } else if (typeof item.thumbnails?.large?.url === "string") {
        candidate = item.thumbnails.large.url.trim();
      } else if (typeof item.thumbnails?.full?.url === "string") {
        candidate = item.thumbnails.full.url.trim();
      }
    }

    if (!candidate) continue;

    if (candidate.startsWith("javascript:") || candidate.startsWith("data:") || candidate.startsWith("file:")) {
      continue;
    }

    try {
      if (/^https?:\/\//i.test(candidate)) {
        const parsed = new URL(candidate);
        const clean = parsed.toString();
        if (!seen.has(clean)) {
          seen.add(clean);
          urls.push(clean);
        }
      } else if (candidate.startsWith("/") && !candidate.startsWith("//")) {
        if (!seen.has(candidate)) {
          seen.add(candidate);
          urls.push(candidate);
        }
      }
    } catch {
      continue;
    }
  }

  return urls;
}

