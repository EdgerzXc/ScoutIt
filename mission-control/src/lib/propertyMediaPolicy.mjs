const KNOWN_PLACEHOLDERS = new Set([
  "matterport:YWayaXpaJyH",
  "luma:b86b7928-f130-40a5-8cac-8095f30eed54",
]);

const IMAGE_HOSTS = new Set(["images.unsplash.com", "picsum.photos"]);
const KNOWN_TEST_YOUTUBE_IDS = new Set(["dQw4w9WgXcQ"]);

function httpsUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url : null;
  } catch { return null; }
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
    if (/^[A-Za-z0-9_-]{8,24}$/.test(id) && !KNOWN_PLACEHOLDERS.has(`matterport:${id}`)) return { kind: "matterport", url: url.toString() };
    return { kind: "placeholder", url: "" };
  }
  if (hostname === "lumalabs.ai") {
    const match = url.pathname.match(/^\/embed\/([0-9a-f-]{36})\/?$/i);
    if (match && !KNOWN_PLACEHOLDERS.has(`luma:${match[1].toLowerCase()}`)) return { kind: "luma", url: url.toString() };
    return { kind: "placeholder", url: "" };
  }
  if ((hostname === "www.youtube.com" || hostname === "youtube.com") && /^\/embed\/[A-Za-z0-9_-]{6,20}$/.test(url.pathname)) {
    const videoId = url.pathname.split("/").pop();
    if (KNOWN_TEST_YOUTUBE_IDS.has(videoId)) return { kind: "placeholder", url: "" };
    return { kind: "youtube", url: url.toString() };
  }
  return { kind: "unsupported", url: "" };
}
