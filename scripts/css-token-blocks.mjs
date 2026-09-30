// Reads the colour-token blocks out of a stylesheet string.
//
// Shared by `scripts/verify-contrast.mjs` (the AA gate) and
// `src/lib/__tests__/designEngineeringGates.test.js` (which proves a hand-pinned
// token in a component still equals the theme value it stands in for). The gate
// exists because hand-copied values let a check pass after the palette changes —
// the A-153 failure — so the parser has to be ONE implementation, not two.

/** Extract every `--name: value;` declared directly inside `selector { … }`. */
export function declarations(selector, source) {
  const start = source.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Missing ${selector} token block`);
  const open = source.indexOf("{", start);
  let depth = 1;
  let end = open + 1;
  while (depth && end < source.length) {
    if (source[end] === "{") depth += 1;
    if (source[end] === "}") depth -= 1;
    end += 1;
  }
  if (depth) throw new Error(`Unclosed ${selector} token block`);
  const values = new Map();
  for (const [, name, value] of source.slice(open + 1, end - 1).matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    values.set(name, value.trim());
  }
  return values;
}

/** Resolve a token to a solid #hex, following `var(--x)` aliases and `r g b` channels. */
export function tokenColor(values, name) {
  const value = values.get(name);
  if (!value) throw new Error(`Missing --${name} color token`);
  if (/^#[\da-f]{3,8}$/i.test(value)) return value;
  const alias = /^var\(--([a-z0-9-]+)\)$/.exec(value);
  if (alias) return tokenColor(values, alias[1]);
  const channels = /^(\d+)\s+(\d+)\s+(\d+)$/.exec(value);
  if (channels) return `#${channels.slice(1).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  throw new Error(`--${name} is not a solid color: ${value}`);
}

/** Strip CSS comments so a hex inside a note is never read as a declaration. */
export const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "");
