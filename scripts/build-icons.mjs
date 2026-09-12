/**
 * Rebuild the raster app icons from the one vector source.
 *
 *   node scripts/build-icons.mjs
 *
 * Source of truth: src/components/brand/markPath.js (the traced SIT mark).
 * Outputs: src/app/apple-icon.png, src/app/favicon.ico, the PWA PNGs under
 * public/icons/, and the same set for the mission-control console.
 *
 * icon.svg is written by hand from the same path data and is not touched here.
 * Re-run this whenever the mark changes so the rasters cannot drift from it.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GOLD = "#E8AE3C";
const INK = "#0D0D0D";
const ICO_SIZES = [16, 32, 48, 64, 128, 256];
const APPLE = 180;
const APPLE_INSET = 0.78; // Apple crops to a rounded rect; keep the mark clear of it

const src = readFileSync(join(ROOT, "src/components/brand/markPath.js"), "utf8");
const path = src.match(/'(M[^']+)'/)?.[1];
if (!path) throw new Error("Could not read MARK_PATH from markPath.js");

const markSvg = (fill) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">` +
      `<path fill="${fill}" fill-rule="evenodd" d="${path}"/></svg>`
  );

/** Mark rendered at `inner` px, centred on an `size` px `bg` tile. */
async function tile(size, inner, bg) {
  const mark = await sharp(markSvg(GOLD), { density: 900 })
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const pad = Math.round((size - inner) / 2);
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: mark, left: pad, top: pad }])
    .png()
    .toBuffer();
}

/** Minimal ICO container holding PNG payloads (Vista+; every current browser). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  const dir = Buffer.alloc(16 * pngs.length);
  let offset = header.length + dir.length;
  pngs.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir[o] = size >= 256 ? 0 : size; // 0 means 256
    dir[o + 1] = size >= 256 ? 0 : size;
    dir[o + 2] = 0; // palette size
    dir[o + 3] = 0; // reserved
    dir.writeUInt16LE(1, o + 4); // colour planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });

  return Buffer.concat([header, dir, ...pngs.map((p) => p.data)]);
}

// PWA icons. Android needs real PNGs; "maskable" is cropped to a circle or
// squircle depending on the launcher, so it carries far more padding.
import { mkdirSync } from "node:fs";
mkdirSync(join(ROOT, "public/icons"), { recursive: true });
for (const size of [192, 512]) {
  const any = await tile(size, Math.round(size * 0.9), INK);
  writeFileSync(join(ROOT, `public/icons/icon-${size}.png`), any);
  const maskable = await tile(size, Math.round(size * 0.6), INK);
  writeFileSync(join(ROOT, `public/icons/maskable-${size}.png`), maskable);
  console.log(`icon-${size}.png + maskable-${size}.png`);
}

const apple = await tile(APPLE, Math.round(APPLE * APPLE_INSET), INK);
writeFileSync(join(ROOT, "src/app/apple-icon.png"), apple);
console.log(`apple-icon.png  ${APPLE}x${APPLE}  ${(apple.length / 1024).toFixed(1)}kb`);

const pngs = [];
for (const size of ICO_SIZES) {
  pngs.push({ size, data: await tile(size, Math.round(size * 0.92), INK) });
}
const favicon = ico(pngs);
writeFileSync(join(ROOT, "src/app/favicon.ico"), favicon);
console.log(
  `favicon.ico     ${ICO_SIZES.join("/")}  ${(favicon.length / 1024).toFixed(1)}kb`
);

// The staff console is a second Next app in the same repo and was still
// shipping the stock Next.js favicon. Same mark, same script.
const MC = join(ROOT, "mission-control/src/app");
if (existsSync(MC)) {
  writeFileSync(join(MC, "favicon.ico"), favicon);
  writeFileSync(join(MC, "apple-icon.png"), apple);
  writeFileSync(
    join(MC, "icon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="ScoutIt">` +
      `<title>ScoutIt</title><path fill="${GOLD}" fill-rule="evenodd" d="${path}"/></svg>
`
  );
  console.log("mission-control  favicon.ico + apple-icon.png + icon.svg");
}
