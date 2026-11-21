export const VIDEO_BUCKET = "property-videos-temp";
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const VIDEO_ACCEPT = ".mp4,.mov,.webm,.mkv";

const formats = {
  mp4: { mime: "video/mp4", signature: "video/mp4" },
  mov: { mime: "video/quicktime", signature: "video/mp4" },
  webm: { mime: "video/webm", signature: "video/webm" },
  mkv: { mime: "video/x-matroska", signature: "video/webm" },
};

export function getVideoFormat(filename) {
  if (typeof filename !== "string" || filename.length > 200 ||
      /[\x00-\x1f\x7f/\\]/.test(filename)) return null;
  const extension = /\.([a-z0-9]+)$/i.exec(filename)?.[1].toLowerCase();
  return Object.hasOwn(formats, extension) ? { extension, ...formats[extension] } : null;
}
