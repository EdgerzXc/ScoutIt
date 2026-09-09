import fs from "node:fs";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────
// ICON-ONLY BUTTONS WITHOUT AN ACCESSIBLE NAME (A-084, WCAG 4.1.2)
//
// A screen reader announces these as "button" and nothing else.
//
// ── WHY THIS SCANNER IS SHAPED THE WAY IT IS ─────────────────────────
// A-084 records that a first scan of `src/components` reported **35** such
// buttons and that reading them gave **4** — most had visible text beside the
// icon. A scanner that over-reports is worse than none, because the gate then
// gets muted. So "has a name" is defined generously:
//
//   · an `aria-label` / `aria-labelledby` / `title` attribute, OR
//   · rendered text of two or more word characters, OR
//   · a `{variable}` or `{obj.prop}` child, which is text at runtime.
//
// A single glyph is NOT a name. `{isSelected ? "✓" : "+"}` technically gives
// the button an accessible name of "✓", which announces as nothing useful —
// that is the loophole that would let a fifth appear while the gate stayed
// green, so glyphs are treated as unnamed.
// ─────────────────────────────────────────────────────────────────────────

const ROOTS = ["src/components", "src/app"];

/** Buttons deliberately without a name, each with the reason it is honest. */
export const ALLOWED = Object.freeze([
  // Nothing yet. Add an entry only with a reason a reviewer would accept.
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|tsx)$/.test(entry.name) && !full.includes("__tests__")) out.push(full);
  }
  return out;
}

/** Split `<button ...>inner</button>`, handling nesting and self-closing. */
function buttonBlocks(source) {
  const blocks = [];
  const open = /<button\b/g;
  let match;

  while ((match = open.exec(source))) {
    // Find the end of the opening tag, respecting braces and quotes.
    let i = match.index + "<button".length;
    let depth = 0;
    let quote = null;
    for (; i < source.length; i += 1) {
      const c = source[i];
      if (quote) {
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth += 1;
      else if (c === "}") depth -= 1;
      else if (c === ">" && depth === 0) break;
    }
    const attrs = source.slice(match.index, i);
    if (source[i - 1] === "/") continue; // self-closing, no children

    // Matching </button>, allowing nested <button> (rare but possible).
    let nest = 1;
    let j = i + 1;
    const scan = /<button\b|<\/button>/g;
    scan.lastIndex = j;
    let inner = "";
    let hit;
    while ((hit = scan.exec(source))) {
      if (hit[0] === "<button") nest += 1;
      else {
        nest -= 1;
        if (nest === 0) {
          inner = source.slice(i + 1, hit.index);
          break;
        }
      }
    }
    blocks.push({ index: match.index, attrs, inner });
  }
  return blocks;
}

const NAME_ATTR = /\b(aria-label|aria-labelledby|title)\s*=/;

/**
 * Remove JSX element tags, leaving only what the button actually renders as
 * children.
 *
 * This cannot be `/<[^>]*>/g`: an attribute may hold an arrow function, so a
 * `>` inside `{...}` is not the end of the tag. Getting this wrong is not
 * cosmetic — the first version of this scanner read `<Send className={cond ? a
 * : b} />` as a *text child* and declared the button named, which is precisely
 * the button A-084 reports. It found 3 offenders and missed all 4 known ones.
 */
function stripTags(source) {
  let out = "";
  let depth = 0;
  let quote = null;
  let inTag = false;

  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];

    if (inTag) {
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth += 1;
      else if (c === "}") depth -= 1;
      else if (c === ">" && depth === 0) {
        inTag = false;
        out += " ";
      }
      continue;
    }

    if (c === "<") {
      inTag = true;
      depth = 0;
      quote = null;
      continue;
    }
    out += c;
  }
  return out;
}

/** Is this expression body only short glyph literals? `"✓"`, `"+"`, `""`. */
function isGlyphOnly(body) {
  const literals = body.match(/["'`][^"'`]*["'`]/g) || [];
  if (literals.length === 0) return false;
  const withoutLiterals = body.replace(/["'`][^"'`]*["'`]/g, "").replace(/[\s?:]/g, "");
  if (withoutLiterals !== "") return false;
  return literals.every((literal) => literal.slice(1, -1).trim().length < 2);
}

/**
 * Does this expression body still yield text after its JSX tags were stripped?
 *
 * `item.title` -> yes. `saved ? "on" : "off"` -> yes.
 * `saved ?  : ` (both branches were elements) -> no.
 */
function rendersText(body) {
  const question = body.indexOf("?");
  if (question === -1) return true; // a bare value: `{item.title}`

  // Everything after the condition. If every branch is empty, the element
  // rendered icons, not words.
  const branches = body
    .slice(question + 1)
    .split(":")
    .map((branch) => branch.trim());
  return branches.some((branch) => branch.length > 0);
}

function hasAccessibleName({ attrs, inner }) {
  if (NAME_ATTR.test(attrs)) return true;

  const children = stripTags(inner.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ""));

  // A `{something}` child renders text at runtime — unless it is only glyphs,
  // or unless every branch of it was a JSX element and is now empty.
  //
  // That second case is the one that matters most here. The Buyer save toggle
  // is `{saved ? <Bookmark .../> : <Bookmark .../>}` — after tag-stripping the
  // branches are empty, so it renders NO text, but a naive reading sees a
  // dynamic child and calls the button named. That is the exact control A-084
  // reports as the worst of the four, so a scanner that misses it is worse
  // than useless: it would report green over the defect it exists to catch.
  for (const expression of children.match(/\{([^{}]*)\}/g) || []) {
    const body = expression.slice(1, -1).trim();
    if (!body) continue;
    if (isGlyphOnly(body)) continue;
    if (!rendersText(body)) continue;
    return true;
  }

  // Plain rendered text.
  const text = children
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .trim();
  return /[\p{L}\p{N}]{2,}/u.test(text);
}

/** @returns {{file: string, line: number, snippet: string}[]} */
export function findUnnamedIconButtons() {
  const files = ROOTS.filter(fs.existsSync).flatMap((root) => walk(root));
  const offenders = [];

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    if (!source.includes("<button")) continue;

    for (const block of buttonBlocks(source)) {
      if (hasAccessibleName(block)) continue;
      const line = source.slice(0, block.index).split("\n").length;
      const key = `${file.replaceAll("\\", "/")}:${line}`;
      if (ALLOWED.some((entry) => entry.at === key)) continue;
      offenders.push({
        file: file.replaceAll("\\", "/"),
        line,
        snippet: block.attrs.replace(/\s+/g, " ").slice(0, 80),
      });
    }
  }

  return offenders;
}

export function scannedFileCount() {
  return ROOTS.filter(fs.existsSync).flatMap((root) => walk(root)).length;
}
