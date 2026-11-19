const SVG_DATA_PREFIX = /^data:image\/svg\+xml(?:;(?:charset=)?utf-8)?,/i;

export function authenticatorQrImage(value) {
  if (typeof value !== "string") return "";
  const input = value.trim();
  const prefix = input.match(SVG_DATA_PREFIX)?.[0];
  let svg = prefix ? input.slice(prefix.length).trim() : input;

  if (prefix && /^%3c/i.test(svg)) {
    try {
      svg = decodeURIComponent(svg);
    } catch {
      return "";
    }
  }

  if (!/^(?:<\?xml\s[^?]*\?>\s*)?<svg(?:\s|>)/i.test(svg)) return "";
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
