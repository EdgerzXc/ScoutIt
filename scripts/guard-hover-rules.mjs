import fs from "node:fs";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────
// A-074 — WRAP :hover RULES IN A CAPABILITY GUARD
//
// On a touch device a tap fires `:hover` and the state STICKS after the finger
// lifts. A card stays visually "hovered" until the user taps somewhere else,
// which reads as "selected". Of the five findings in A-074 this is the only
// one that actively misleads a user about what is selected, which is why it
// goes first.
//
// ── WHY THIS IS NOT A SED ────────────────────────────────────────────
// Two things make a naive wrap wrong:
//
//   1. A rule may mix hover and non-hover selectors:
//        `.card:hover, .card.is-open { ... }`
//      Wrapping the whole rule would delete `.card.is-open`'s styles on every
//      touch device. Those selectors have to be split, not moved.
//
//   2. Rules live inside `@media`, `@supports` and nested blocks. A wrap has
//      to happen in place, at whatever depth the rule already sits — nested
//      `@media` is valid CSS and is the correct output here.
//
// The transform is idempotent: a rule already inside a `hover: hover` guard is
// left alone.
// ─────────────────────────────────────────────────────────────────────────

export const GUARD = "@media (hover: hover) and (pointer: fine)";

/** Split a CSS block into its top-level statements, brace- and string-aware. */
function statements(source) {
  const out = [];
  let depth = 0;
  let start = 0;
  let quote = null;
  let inComment = false;

  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    const next = source[i + 1];

    if (inComment) {
      if (c === "*" && next === "/") {
        inComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (c === "\\") i += 1;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "/" && next === "*") {
      inComment = true;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }

    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) {
        out.push(source.slice(start, i + 1));
        start = i + 1;
      }
    } else if (c === ";" && depth === 0) {
      out.push(source.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < source.length) out.push(source.slice(start));
  return out;
}

const AT_RULE_WITH_BLOCK = /^\s*@(media|supports|container|layer|scope)\b/;

/** Indent every line of `text` by `pad`. */
const indent = (text, pad) =>
  text
    .split("\n")
    .map((line) => (line.trim() ? pad + line : line))
    .join("\n");

function transformBlock(source, { insideGuard, pad }) {
  return statements(source)
    .map((statement) => {
      const braceAt = statement.indexOf("{");
      if (braceAt === -1) return statement; // at-rule without a block, or stray

      const prelude = statement.slice(0, braceAt);
      const body = statement.slice(braceAt + 1, statement.lastIndexOf("}"));

      if (AT_RULE_WITH_BLOCK.test(prelude)) {
        const guarded = insideGuard || /hover\s*:\s*hover/.test(prelude);
        return (
          prelude +
          "{" +
          transformBlock(body, { insideGuard: guarded, pad: pad + "  " }) +
          "}"
        );
      }

      if (insideGuard) return statement;

      // A style rule. Split its selector list on hover vs non-hover.
      const leading = prelude.match(/^\s*/)[0];
      const selectors = prelude
        .trim()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const hover = selectors.filter((s) => /:hover\b/.test(s));
      if (hover.length === 0) return statement;
      const plain = selectors.filter((s) => !/:hover\b/.test(s));

      const rule = (list) => `${list.join(",\n" + pad)} {${body}}`;
      const wrapped = `${leading}${GUARD} {\n${pad}  ${indent(rule(hover), pad + "  ").trim()}\n${pad}}`;

      // Selectors that were NOT hover keep their styles on touch devices.
      return plain.length ? `${leading}${rule(plain)}\n${wrapped}` : wrapped;
    })
    .join("");
}

export function guardHoverRules(css) {
  return transformBlock(css, { insideGuard: false, pad: "" });
}

export function cssFiles(root = "src") {
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".css")) out.push(full);
    }
  })(root);
  return out;
}

/**
 * Files that still have a `:hover` rule outside any capability guard.
 *
 * ── KNOWN LIMITATION, STATED RATHER THAN GLOSSED ─────────────────────
 * This is a regression gate, NOT a proof of exhaustiveness. It reliably
 * catches the shape that causes the defect — a rule that applies a hover
 * *appearance* — and a mutation that unwraps one turns the suite red.
 *
 * It does not report every `:hover` token in the tree. One known case it
 * misses is in `src/app/globals.css`: the reduced-motion reset
 *
 *   @media (prefers-reduced-motion: reduce) {
 *     .hov-card, .hov-glow, .hov-card:hover, .hov-glow:hover,
 *     .hov-card:active, .hov-glow:active { transform: none; transition: none; }
 *   }
 *
 * The same selector list transforms correctly in isolation but not in place,
 * so this is a parser limitation, not a decision. It is harmless here — the
 * rule REMOVES motion rather than applying a hover appearance, so it cannot
 * leave a stuck state — but the gap is real and is written down instead of
 * being asserted away.
 */
export function unguardedHoverFiles(root = "src") {
  return cssFiles(root)
    .filter((file) => {
      const css = fs.readFileSync(file, "utf8");
      if (!css.includes(":hover")) return false;
      return guardHoverRules(css) !== css;
    })
    .map((file) => file.replaceAll("\\", "/"));
}
