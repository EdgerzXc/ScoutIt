import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const header = readFileSync(resolve(process.cwd(), "src/components/layout/Header.js"), "utf8");

// The narrow-width overrides live in styled-jsx inside the component, so a
// regression here is a one-character edit that no type or lint check sees.
function declaredSizes(selector) {
  const sizes = [];
  for (const [, head, block] of header.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!head.includes(selector)) continue;
    if (/svg|::after|::before/.test(head)) continue;
    for (const [, prop, px] of block.matchAll(/(?:^|[;\s])(width|height)\s*:\s*(\d+)px/g)) {
      sizes.push({ prop, px: Number(px) });
    }
  }
  return sizes;
}

describe("universal header touch targets", () => {
  it("never declares the mobile menu control below the 44px minimum", () => {
    const sizes = declaredSizes("header-menu-btn");
    expect(sizes.length).toBeGreaterThan(0);
    for (const { prop, px } of sizes) {
      expect(`${prop}:${px}`).toBe(`${prop}:${Math.max(px, 44)}`);
    }
  });

  it("never declares the display control below the 44px minimum", () => {
    const sizes = declaredSizes("header-eye-btn");
    expect(sizes.length).toBeGreaterThan(0);
    for (const { prop, px } of sizes) {
      expect(`${prop}:${px}`).toBe(`${prop}:${Math.max(px, 44)}`);
    }
  });
});
