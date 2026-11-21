export function parsePointToLatLng(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  const point = /^(?:SRID=4326;)?POINT\(\s*([-+\d.eE]+)\s+([-+\d.eE]+)\s*\)$/i.exec(text);
  if (point) return checkedPoint(Number(point[1]), Number(point[2]));

  const hex = text.startsWith("\\x") ? text.slice(2) : text;
  if (!/^(?:00|01)[0-9a-f]+$/i.test(hex) || (hex.length !== 42 && hex.length !== 50)) return null;
  const bytes = Uint8Array.from(hex.match(/../g), (byte) => Number.parseInt(byte, 16));
  const view = new DataView(bytes.buffer);
  const littleEndian = bytes[0] === 1;
  const type = view.getUint32(1, littleEndian);
  if (type === 1 && bytes.length === 21) {
    return checkedPoint(view.getFloat64(5, littleEndian), view.getFloat64(13, littleEndian));
  }
  if (type !== 0x20000001 || bytes.length !== 25 || view.getUint32(5, littleEndian) !== 4326) return null;
  return checkedPoint(view.getFloat64(9, littleEndian), view.getFloat64(17, littleEndian));
}

function checkedPoint(lng, lat) {
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
  return { lat, lng };
}
