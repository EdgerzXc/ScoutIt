// WCAG contrast verification for the live light/dark token themes.
// NEW_IDEAS_2.md §61.
//
// Exists because the light theme's whole job is legibility, and a contrast
// number written by hand into a comment is an unsourced number (Rule 3).
// Run it after touching any colour token:
//
//   node scripts/verify-contrast.mjs
//
// Exits non-zero if any declared pair fails its required ratio.

import { readFileSync } from "node:fs";
import { declarations, tokenColor, stripComments } from "./css-token-blocks.mjs";

const css = stripComments(readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8"));
const recoveryCss = stripComments(readFileSync(new URL("../src/app/GlobalRecovery.module.css", import.meta.url), "utf8"));

const light = declarations("body.light-mode", css);
const dark = declarations(":root", css);
const from = (values, names) => Object.fromEntries(
  Object.entries(names).map(([key, name]) => [key, tokenColor(values, name)])
);

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

// Read what the app actually ships. Hand-copied values let the check pass
// after the palette changes, which was the A-153 failure.
const names = {
  bg: "bg", surface: "surface", surface2: "surface2", surface3: "surface3",
  textPrimary: "text-primary", textSecondary: "text-secondary",
  accent: "accent", accentBright: "accent-bright",
  accentFill: "accent-fill", onAccent: "on-accent",
  m3OnSurface: "m3-on-surface-ch",
  m3SurfaceVariant: "m3-surface-variant-ch",
};
// Status inks, read from BOTH theme blocks. A status colour is only as good as
// its weakest ground, and the grounds actually in use are the page canvas
// (--bg), the card (--surface) and the deeper well (--surface2).
const status = {
  red: "red", green: "green", yellow: "yellow", sapphire: "sapphire",
  amethyst: "amethyst", floodHigh: "flood-high",
};
const L = {
  ...from(light, names),
  ...from(light, status),
  ...from(light, {
    textMuted: "text-muted",
    intelCyan: "intel-cyan", intelMagenta: "intel-magenta",
    tierDiamond: "tier-diamond", tierPlatinum: "tier-platinum",
    tierSilver: "tier-silver", tierBronze: "tier-bronze",
  }),
};
const D = { ...from(dark, names), ...from(dark, status) };

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
  //    ...and on the page CANVAS, not only on cards. Gating just the surface
  //    pair is what let the lens red sit at 4.41:1 under the 12px bot-check
  //    error line on /onboarding — the computed public sweep
  //    (36-computed-contrast) found it on ground this script never measured.
  ["LIGHT  red            on bg", L.red, L.bg, AA_BODY],
  ["LIGHT  green          on bg", L.green, L.bg, AA_BODY],
  ["LIGHT  yellow         on surface", L.yellow, L.surface, AA_BODY],
  ["LIGHT  sapphire       on surface", L.sapphire, L.surface, AA_BODY],
  ["LIGHT  amethyst       on surface", L.amethyst, L.surface, AA_BODY],
  //    …same rule for the other three. Each is real text on the canvas in the
  //    lens: `--yellow` is the walk-score flag and `.detail-val.yellow`,
  //    `--sapphire` is the PIONEER_BROKER badge ink and calendar labels,
  //    `--amethyst` is the calendar/event-chip purple label.
  ["LIGHT  yellow         on bg", L.yellow, L.bg, AA_BODY],
  ["LIGHT  sapphire       on bg", L.sapphire, L.bg, AA_BODY],
  ["LIGHT  amethyst       on bg", L.amethyst, L.bg, AA_BODY],

  // ── The flood-risk dot (FloodRiskBadge). A 9px indicator, so the floor is
  //    the UI-component minimum (AA_LARGE), not body text; the badge paints its
  //    own card on --surface2, so that is the ground it is measured on. All four
  //    bands are asserted because any one token could be nudged later.
  ["LIGHT  flood dot Low      on surface2", L.green, L.surface2, AA_LARGE],
  ["LIGHT  flood dot Moderate on surface2", L.yellow, L.surface2, AA_LARGE],
  ["LIGHT  flood dot High     on surface2", L.floodHigh, L.surface2, AA_LARGE],
  ["LIGHT  flood dot Severe   on surface2", L.red, L.surface2, AA_LARGE],
  ["DARK   flood dot Low      on surface2", D.green, D.surface2, AA_LARGE],
  ["DARK   flood dot Moderate on surface2", D.yellow, D.surface2, AA_LARGE],
  ["DARK   flood dot High     on surface2", D.floodHigh, D.surface2, AA_LARGE],
  ["DARK   flood dot Severe   on surface2", D.red, D.surface2, AA_LARGE],

  // ── The same badge's label ink: `FloodRiskBadge` writes 12px uppercase
  //    --text-secondary and 13px --text-primary on that --surface2 card, so the
  //    body floor applies to the grounds it uses and not only to --surface.
  ["LIGHT  text-secondary on surface2", L.textSecondary, L.surface2, AA_BODY],
  ["LIGHT  text-primary   on surface2", L.textPrimary, L.surface2, AA_BODY],
  ["DARK   text-secondary on surface2", D.textSecondary, D.surface2, AA_BODY],
  ["DARK   text-primary   on surface2", D.textPrimary, D.surface2, AA_BODY],

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

  // ── Dark mode — the DEFAULT appearance, so it cannot be a partial mirror. ──
  ["DARK   text-primary   on bg", D.textPrimary, D.bg, AA_BODY],
  ["DARK   text-secondary on surface", D.textSecondary, D.surface, AA_BODY],
  ["DARK   accent (text)  on bg", D.accent, D.bg, AA_BODY],
  ["DARK   accent-bright  on bg", D.accentBright, D.bg, AA_BODY],
  ["DARK   on-surface     on surface", D.m3OnSurface, D.surface, AA_BODY],
  ["DARK   on-surface  on surface-var", D.m3OnSurface, D.m3SurfaceVariant, AA_BODY],
  ["DARK   on-accent  on accent-fill", D.onAccent, D.accentFill, AA_BODY],

  // ── Dark status inks on both grounds. Dark is the default appearance, so a
  //    status colour that only worked on a card was equally invisible here as
  //    under the lens — this block had no status rows at all before 2026-09-29.
  //    `--red` and `--green` are the Turnstile/owner-facing error and success
  //    lines, which render on the page canvas (`/onboarding`) as often as on a
  //    card; `--yellow`/`--sapphire` are dashboard and badge text.
  ["DARK   red            on bg", D.red, D.bg, AA_BODY],
  ["DARK   red            on surface", D.red, D.surface, AA_BODY],
  ["DARK   green          on bg", D.green, D.bg, AA_BODY],
  ["DARK   green          on surface", D.green, D.surface, AA_BODY],
  ["DARK   yellow         on bg", D.yellow, D.bg, AA_BODY],
  ["DARK   yellow         on surface", D.yellow, D.surface, AA_BODY],
  ["DARK   sapphire       on bg", D.sapphire, D.bg, AA_BODY],
  ["DARK   sapphire       on surface", D.sapphire, D.surface, AA_BODY],
  ["DARK   amethyst       on bg", D.amethyst, D.bg, AA_BODY],

  // Deliberately NOT gated, so the number is recorded rather than hidden:
  // dark `--amethyst` (#8b5cf6) as `.sdc-type-pill` TEXT — 12px/700, so WCAG
  // gives it no large-text exemption — measures 4.42:1 on --surface and 4.11:1
  // on --surface2, i.e. under the 4.5 body floor. The fix is nudging a visible
  // default-theme token, which is an owner call (O-030), not a gate edit:
  // adding the row here would only turn a required CI gate red first.
  // Measured lead with its confirmation command: ACTIVE A-176.
];

// global-error replaces the root layout and does not inherit globals.css.
// Its compact independent palette needs the same legibility gate.
for (const [label, selector] of [
  ["DARK", ".body"],
  ["LIGHT", ":global(body.light-mode).body"],
  ["HIGH", ":global(body.high-contrast).body"],
]) {
  const values = declarations(selector, recoveryCss);
  const color = (name) => tokenColor(values, `recovery-${name}`);
  checks.push(
    [`${label} recovery text on panel`, color("text"), color("surface"), AA_BODY],
    [`${label} recovery body on panel`, color("secondary"), color("surface"), AA_BODY],
    [`${label} recovery label on panel`, color("accent"), color("surface"), AA_BODY],
    [`${label} recovery CTA ink on fill`, color("on-fill"), color("fill"), AA_BODY],
    [`${label} recovery CTA hover ink`, color("on-fill"), color("fill-hover"), AA_BODY],
  );
}

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
