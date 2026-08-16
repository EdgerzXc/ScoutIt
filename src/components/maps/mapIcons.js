// Map marker glyphs for the Spatial Canvas.
//
// WHY THESE ARE DRAWN, NOT DOWNLOADED
// -----------------------------------
// The dark-matter basemap ships almost no icons — measured, its sprite is used
// by exactly five layers and all five are city dots. There is nothing to
// inherit, so the marks are drawn here at runtime. That is a feature rather
// than a cost: it keeps them on-brand and adds no request.
//
// WHY THEY ARE GEOMETRIC AND MONOCHROME
// -------------------------------------
// The reference the owner brought (GeoLibre, Google Maps) uses multicoloured
// pictograms on a light basemap. Dropped onto a near-black map, a rainbow of
// pins destroys the 95/5 balance and makes ScoutIt look like every other map.
// These are single-colour, built from simple strokes at instrument scale, and
// tinted by tier:
//
//   Soft Grey  = the world   (real-world places)
//   Gold       = ours        (other ScoutIt listings)
//
// Bright gold is never used here. It belongs to exactly one thing on the page:
// the listing being viewed, which is a lit building, not a mark.

const SIZE = 22; // CSS px; drawn at devicePixelRatio for crispness

/**
 * Each glyph is a function of a 2D context on a SIZE x SIZE box, already
 * scaled, with strokeStyle/fillStyle set. Keep them to a few strokes — at
 * 22px a detailed pictogram turns to mud.
 */
const GLYPHS = {
  // Cup — cafes, bakeries, groceries, everyday errands
  daily(ctx, s) {
    const w = s * 0.44;
    const h = s * 0.34;
    const x = (s - w) / 2 - s * 0.04;
    const y = (s - h) / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w * 0.84, y + h);
    ctx.lineTo(x + w * 0.16, y + h);
    ctx.closePath();
    ctx.stroke();
    // handle
    ctx.beginPath();
    ctx.arc(x + w, y + h * 0.4, s * 0.1, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  },

  // Cross — pharmacies, clinics, hospitals, parks and fitness
  wellness(ctx, s) {
    const arm = s * 0.26;
    const t = s * 0.5;
    ctx.beginPath();
    ctx.moveTo(t - arm / 2, t);
    ctx.lineTo(t + arm / 2, t);
    ctx.moveTo(t, t - arm / 2);
    ctx.lineTo(t, t + arm / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(t, t, s * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  },

  // Fork and knife — restaurants, bars, malls, going out
  social(ctx, s) {
    const top = s * 0.3;
    const bot = s * 0.72;
    const lx = s * 0.4;
    const rx = s * 0.6;
    // fork
    ctx.beginPath();
    ctx.moveTo(lx - s * 0.07, top);
    ctx.lineTo(lx - s * 0.07, top + s * 0.14);
    ctx.moveTo(lx + s * 0.07, top);
    ctx.lineTo(lx + s * 0.07, top + s * 0.14);
    ctx.moveTo(lx, top + s * 0.14);
    ctx.lineTo(lx, bot);
    ctx.stroke();
    // knife
    ctx.beginPath();
    ctx.moveTo(rx, top);
    ctx.lineTo(rx, bot);
    ctx.moveTo(rx, top);
    ctx.lineTo(rx + s * 0.08, top + s * 0.16);
    ctx.lineTo(rx, top + s * 0.3);
    ctx.stroke();
  },

  // Carriage — stations, stops, fuel, getting out
  transit(ctx, s) {
    const w = s * 0.44;
    const h = s * 0.42;
    const x = (s - w) / 2;
    const y = (s - h) / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, s * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.05, y + h * 0.55);
    ctx.lineTo(x + w - s * 0.05, y + h * 0.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y + h);
    ctx.lineTo(x + w * 0.12, y + h + s * 0.09);
    ctx.moveTo(x + w * 0.75, y + h);
    ctx.lineTo(x + w * 0.88, y + h + s * 0.09);
    ctx.stroke();
  },

  // Anything that does not fall into the four groups
  place(ctx, s) {
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.5, s * 0.16, 0, Math.PI * 2);
    ctx.stroke();
  },

  // A ScoutIt listing. A diamond rather than a pictogram: it is not a kind of
  // place, it is a kind of ownership, and it must never be mistaken for one of
  // the world's amenities.
  listing(ctx, s) {
    const t = s * 0.5;
    const r = s * 0.26;
    ctx.beginPath();
    ctx.moveTo(t, t - r);
    ctx.lineTo(t + r, t);
    ctx.lineTo(t, t + r);
    ctx.lineTo(t - r, t);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(t, t, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  },
};

export const ICON_KEYS = Object.keys(GLYPHS);

function drawIcon(name, color, ratio) {
  const px = Math.round(SIZE * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(ratio, ratio);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // roundRect is not universal; fall back to a plain rect rather than throwing.
  if (typeof ctx.roundRect !== "function") {
    ctx.roundRect = function roundRectFallback(x, y, w, h) {
      this.rect(x, y, w, h);
    };
  }

  GLYPHS[name](ctx, SIZE);
  return { data: ctx.getImageData(0, 0, px, px), pixelRatio: ratio };
}

/**
 * Registers every glyph in both tints. Safe to call more than once — MapLibre
 * throws if an image id already exists, so existing ids are skipped.
 *
 * Image ids are `icon-<name>-world` and `icon-<name>-ours`.
 */
export function registerMapIcons(map, { world, ours }) {
  const ratio = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 3) : 1;

  for (const name of ICON_KEYS) {
    for (const [tier, color] of [["world", world], ["ours", ours]]) {
      const id = `icon-${name}-${tier}`;
      if (map.hasImage?.(id)) continue;
      const img = drawIcon(name, color, ratio);
      if (!img) continue;
      try {
        map.addImage(id, img.data, { pixelRatio: img.pixelRatio });
      } catch (err) {
        // An icon that fails to register must never take the map down; the
        // layer falls back to its circle.
      }
    }
  }
}

/**
 * Maps a tile `class` value onto one of the four groups, as a MapLibre
 * expression so it evaluates per feature inside the style rather than in JS.
 */
export function iconImageExpression(tier, groupClasses) {
  const cases = [];
  for (const [group, classes] of Object.entries(groupClasses)) {
    cases.push(["in", ["get", "class"], ["literal", classes]], `icon-${group}-${tier}`);
  }
  return ["case", ...cases, `icon-place-${tier}`];
}
