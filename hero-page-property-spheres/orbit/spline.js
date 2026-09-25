// The single orbital railway. Every globe travels the exact same
// Catmull-Rom path in rail-fraction space; each globe only carries a
// different progress value. Arc-length uniform: slot positions are
// measured from the curve (by rail height), never assumed.
//
// Fraction space: x 0 = rail left → 1 = rail right,
//                 y 0 = rail top  → 1 = rail bottom.

import * as THREE from "three";

const RAW = [
  [0.1, -0.06],
  [0.15, 0.22],
  [0.02, 0.38],
  [0.13, 0.55],
  [0.24, 0.93],
  [0.42, 1.06],
];

const curve = new THREE.CatmullRomCurve3(
  RAW.map(([x, y]) => new THREE.Vector3(x, y, 0)),
  false,
  "centripetal"
);

const SAMPLES = 600;
const pts = curve.getSpacedPoints(SAMPLES);

// Arc-fraction u for a rail height: first crossing going down.
function uForY(fy) {
  for (let i = 1; i <= SAMPLES; i++) {
    if (pts[i - 1].y <= fy && pts[i].y >= fy) {
      const a = pts[i - 1].y;
      const b = pts[i].y;
      const k = b === a ? 0 : (fy - a) / (b - a);
      return (i - 1 + k) / SAMPLES;
    }
  }
  return fy < 0.5 ? 0 : 1;
}

// Slot progress values, measured — two full worlds plus a ~30% peek
// of the incoming world below the fold.
export const SLOT_T = {
  prev: uForY(0.16),
  active: uForY(0.52),
  next: uForY(0.95),
  after: 1.0,
};

export const SLOT_SPAN = SLOT_T.next - SLOT_T.active;
export const COMMIT_DIST = SLOT_SPAN * 0.25; // 25% toward next slot commits
export const FLICK_VEL = 0.0011; // progress per ms at release commits

const TP = SLOT_T.prev;
const TA = SLOT_T.active;
const TN = SLOT_T.next;
const G0 = TN + 0.06; // gravity field starts just past the peek slot
const G1 = 1.14;

function lerpStops(p, stops) {
  if (p <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i][0]) {
      const [p0, v0] = stops[i - 1];
      const [p1, v1] = stops[i];
      return v0 + ((v1 - v0) * (p - p0)) / (p1 - p0 || 1);
    }
  }
  return stops[stops.length - 1][1];
}

// Depth/scale hierarchy: previous 0.77, active 1.0, peek 0.66.
// Past the gravity line the outgoing world crushes toward the hole.
export function scaleAt(p) {
  let s = lerpStops(p, [
    [-0.3, 0.4],
    [TP - 0.12, 0.65],
    [TP, 0.85],
    [TA, 1.0],
    [TN, 0.7],
    [1.02, 0.5],
    [1.3, 0.4],
  ]);
  if (p > G0) {
    const k = Math.min(1, (p - G0) / (G1 - G0));
    s *= 1 - 0.88 * k;
  }
  return s;
}

export function opacityAt(p) {
  return lerpStops(p, [
    [-0.3, 0],
    [-0.02, 0],
    [0.04, 0.8],
    [TP, 0.8],
    [TA - 0.1, 0.95],
    [TA, 1.0],
    [TN - 0.08, 0.9],
    [TN, 0.65],
    [G0, 0.4],
    [G1, 0],
  ]);
}

// Active world pops gently toward the viewer.
export function zAt(p) {
  const d = (p - TA) / 0.22;
  return -0.15 + 0.4 * Math.exp(-d * d);
}

// Sample the railway. Beyond [0,1] the curve continues along its end
// tangents so flung worlds exit smoothly instead of clamping.
const EXT = 2.2;
export function sampleCurve(p, viewW, viewH) {
  let pt;
  if (p < 0) {
    pt = curve.getPointAt(0).addScaledVector(curve.getTangentAt(0), p * EXT);
  } else if (p > 1) {
    pt = curve.getPointAt(1).addScaledVector(curve.getTangentAt(1), (p - 1) * EXT);
  } else {
    pt = curve.getPointAt(p);
  }
  return { x: (pt.x - 0.5) * viewW, y: (0.5 - pt.y) * viewH };
}
