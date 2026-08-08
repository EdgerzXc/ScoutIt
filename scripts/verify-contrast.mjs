// WCAG contrast verification for the light-mode token theme.
// NEW_IDEAS_2.md §61.
//
// Exists because the light theme's whole job is legibility, and a contrast
// number written by hand into a comment is an unsourced number (Rule 3).
// Run it after touching any colour token:
//
//   node scripts/verify-contrast.mjs
//
// Exits non-zero if any pair fails its required ratio, so it can be wired
// into CI later without changes.

const hex = (h) => {
  const v = h.replace("#", "").trim();
  const n = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};

// WCAG 2.1 relative luminance.
const lum = (rgb) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [l1, l2] = [lum(hex(a)), lum(hex(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// ── The light theme, as shipped in globals.css `body.light-mode` ────────
const L = {
  bg: "#f4f4f5",
  surface: "#fafafa",
  surface3: "#e7e7ea",
  textPrimary: "#111113",
  textSecondary: "#45454d",
  textMuted: "#5f5f6a",
  accent: "#8B5E10",
  accentBright: "#9A6200",
  accentFill: "#E8AE3C",
  red: "#b91c1c",
  green: "#047857",
  yellow: "#a16207",
  sapphire: "#1d4ed8",
  amethyst: "#6d28d9",
  // The Material-3 keys Tailwind exposes, rewired off flat hex 2026-08-07
  // (§63). `on-surface` is 367 call sites of ink; `surface-variant` is 497
  // call sites of hairline/panel. If these drift, light mode silently
  // regresses across the whole app, so they are checked here.
  intelCyan: "#0b6e7f",
  intelMagenta: "#a3186b",
  tierDiamond: "#0e7490",
  tierPlatinum: "#3f6382",
  tierSilver: "#57575f",
  tierBronze: "#8a5320",
  m3OnSurface: "#111113",
  m3SurfaceVariant: "#d6d6db",
  onAccent: "#111113",
};

// ── The dark theme, for comparison — light mode must not be the weaker one ──
const D = {
  bg: "#0d0d0d",
  surface: "#121212",
  textPrimary: "#ffffff",
  textSecondary: "#a8a29a",
  accent: "#E8AE3C",
  accentBright: "#F7C64E",
  accentFill: "#E8AE3C",
  m3OnSurface: "#e5e2e1",
  m3SurfaceVariant: "#353535",
  onAccent: "#111113",
};

const AA_BODY = 4.5;   // normal text
const AA_LARGE = 3.0;  // ≥18px, or bold ≥14px — also the UI-component minimum

const checks = [
  // ── Light mode: body text ──────────────────────────────────────────
  ["LIGHT  text-primary   on surface", L.textPrimary, L.surface, AA_BODY],
  ["LIGHT  text-primary   on bg", L.textPrimary, L.bg, AA_BODY],
  ["LIGHT  text-secondary on surface", L.textSecondary, L.surface, AA_BODY],
  ["LIGHT  text-muted     on surface", L.textMuted, L.surface, AA_BODY],
  ["LIGHT  text-muted     on surface3", L.textMuted, L.surface3, AA_BODY],

  // ── Light mode: gold. The whole reason the theme was hard. ─────────
  ["LIGHT  accent (text)  on surface", L.accent, L.surface, AA_BODY],
  ["LIGHT  accent-bright  on surface", L.accentBright, L.surface, AA_BODY],
  ["LIGHT  ink on accent-fill (CTA)", L.textPrimary, L.accentFill, AA_BODY],

  // ── Light mode: semantic colours carry status meaning, so they must
  //    be readable, not merely visible. ─────────────────────────────
  ["LIGHT  red            on surface", L.red, L.surface, AA_BODY],
  ["LIGHT  green          on surface", L.green, L.surface, AA_BODY],
  ["LIGHT  yellow         on surface", L.yellow, L.surface, AA_BODY],
  ["LIGHT  sapphire       on surface", L.sapphire, L.surface, AA_BODY],
  ["LIGHT  amethyst       on surface", L.amethyst, L.surface, AA_BODY],

  // ── The rewired Material-3 Tailwind keys. ─────────────────────────
  ["LIGHT  on-surface     on surface", L.m3OnSurface, L.surface, AA_BODY],
  ["LIGHT  on-surface  on surface-var", L.m3OnSurface, L.m3SurfaceVariant, AA_BODY],
  ["LIGHT  on-accent  on accent-fill", L.onAccent, L.accentFill, AA_BODY],

  // ── Broker tier hues as TEXT (`.rating-num`). ─────────────────────
  ["LIGHT  tier-diamond  on surface", L.tierDiamond, L.surface, AA_BODY],
  ["LIGHT  tier-platinum on surface", L.tierPlatinum, L.surface, AA_BODY],
  ["LIGHT  tier-silver   on surface", L.tierSilver, L.surface, AA_BODY],
  ["LIGHT  tier-bronze   on surface", L.tierBronze, L.surface, AA_BODY],

  // ── Dashboard signal hues. Cyan is 1.5:1 and magenta 2.1:1 at their dark
  //    values on near-white — these are the light counterparts. ────────
  ["LIGHT  intel-cyan     on surface", L.intelCyan, L.surface, AA_BODY],
  ["LIGHT  intel-magenta  on surface", L.intelMagenta, L.surface, AA_BODY],

  // ── Dark mode, unchanged — regression guard. ───────────────────────
  ["DARK   text-primary   on bg", D.textPrimary, D.bg, AA_BODY],
  ["DARK   text-secondary on surface", D.textSecondary, D.surface, AA_BODY],
  ["DARK   accent (text)  on bg", D.accent, D.bg, AA_BODY],
  ["DARK   accent-bright  on bg", D.accentBright, D.bg, AA_BODY],
  ["DARK   on-surface     on surface", D.m3OnSurface, D.surface, AA_BODY],
  ["DARK   on-surface  on surface-var", D.m3OnSurface, D.m3SurfaceVariant, AA_BODY],
  ["DARK   on-accent  on accent-fill", D.onAccent, D.accentFill, AA_BODY],
];

let failed = 0;
console.log("\n  pair                                  ratio   need   result");
console.log("  " + "-".repeat(58));
for (const [label, fg, bg, need] of checks) {
  const r = ratio(fg, bg);
  const ok = r >= need;
  if (!ok) failed++;
  const grade = r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA-large" : "fail";
  console.log(
    `  ${label.padEnd(36)} ${r.toFixed(2).padStart(5)}  ${need.toFixed(1)}   ${ok ? "PASS" : "FAIL"} ${grade}`
  );
}

// The specific failure this theme exists to prevent: true gold as TEXT on a
// light surface. Asserted as a fact, so nobody "restores the brand colour"
// on a text token without seeing why it was changed.
const goldOnLight = ratio("#E8AE3C", L.surface);
console.log(
  `\n  Why gold is re-roled: true gold #E8AE3C as TEXT on ${L.surface} = ${goldOnLight.toFixed(2)}:1` +
  `\n  (needs ${AA_BODY}) — unusable for text, which is why --accent-fill is FILLS ONLY.\n`
);

console.log(failed === 0 ? "  All contrast checks passed.\n" : `  ${failed} FAILED.\n`);
process.exit(failed === 0 ? 0 : 1);
