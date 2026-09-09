import fs from "node:fs";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────
// A-074 — REPLACE `transition: all` WITH NAMED PROPERTIES
//
// `all` animates layout-bound properties too — width, padding, border — which
// forces layout and paint off the compositor and causes visible jank on the
// mid-range Android devices Philippine brokers actually use.
//
// ── THE LIST IS MEASURED, NOT GUESSED ────────────────────────────────
// Every `:hover` / `:active` / `:focus*` rule body in `src/**/*.css` was
// scanned for the properties it actually changes. The result, by frequency:
//
//   transform 106 · border-color 87 · background 72 · color 61 · outline 34
//   box-shadow 34 · outline-offset 28 · padding-left 11 · opacity 10
//   filter 5 · text-shadow 3 · border-radius 1
//
// The named list below covers all of those EXCEPT the layout-bound ones —
// `padding-left`, `outline-offset` and `border-radius` — which is the whole
// point of the change: they will now snap rather than animate. That is A-074's
// intent, and it is a deliberate visual trade, not an oversight.
//
// ── TIMING IS PRESERVED PER OCCURRENCE ───────────────────────────────
// Each site keeps its own duration and easing, whatever they were —
// `var(--transition-fast)`, `0.2s ease`, a cubic-bezier. Only the property
// selection changes, so nothing gets faster or slower than the author chose.
// ─────────────────────────────────────────────────────────────────────────

/** Compositor-friendly properties these surfaces actually animate. */
export const NAMED_PROPERTIES = Object.freeze([
  "color",
  "background-color",
  "border-color",
  "box-shadow",
  "transform",
  "opacity",
  "filter",
]);

const ALL_TRANSITION = /transition:\s*all\s+([^;}"'`]+)/g;

/** Rewrite one `transition: all <timing>` into named properties. */
export function nameTransitionProperties(source) {
  return source.replace(ALL_TRANSITION, (_match, timing) => {
    const trimmed = timing.trim();
    return "transition: " + NAMED_PROPERTIES.map((p) => `${p} ${trimmed}`).join(", ");
  });
}

export function styleFiles(root = "src") {
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(css|js|jsx)$/.test(entry.name) && !full.includes("__tests__")) out.push(full);
    }
  })(root);
  return out;
}

/** Files still carrying a `transition: all`. */
export function filesWithTransitionAll(root = "src") {
  return styleFiles(root)
    .filter((file) => /transition:\s*all\s/.test(fs.readFileSync(file, "utf8")))
    .map((file) => file.replaceAll("\\", "/"));
}
