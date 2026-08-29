import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
// Assertions about what the component *renders* must not be satisfied or
// broken by prose in its own comments.
const readCode = (path) =>
  read(path)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
const LOADING = "src/app/brokers/[broker-slug]/loading.js";
const CSS = "src/app/brokers/[broker-slug]/broker-detail.css";

// ─────────────────────────────────────────────────────────────────────────
// A-023 phase 3. The loading state was skipped in phase 2 on the strength of
// an Inbox report that a route-level `loading.js` stranded its fallback. That
// report was a hidden-tab artifact: React schedules the Suspense reveal with
// `requestAnimationFrame`, which never fires in a background automation tab.
//
// These tests pin the two properties that actually matter and that a future
// edit could quietly lose: the skeleton must reuse the dossier's own layout
// classes (so the swap costs no layout shift), and it must make no claim about
// the broker while it is still loading.
// ─────────────────────────────────────────────────────────────────────────

describe("A-023 phase 3 - broker dossier loading state", () => {
  it("reuses the dossier's real layout classes instead of inventing geometry", () => {
    const loading = read(LOADING);
    for (const shared of [
      "page-wrapper",
      "broker-detail-main",
      "profile-grid",
      "profile-left-column",
      "profile-right-column",
      "detail-avatar",
      "profile-header",
      "profile-body-content",
      "detail-section",
      "focus-pills-list",
    ]) {
      expect(loading).toContain(shared);
    }
    expect(loading).toContain('import "./broker-detail.css"');
  });

  it("is a skeleton, not a spinner, and announces itself once", () => {
    const loading = read(LOADING);
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain('role="status"');
    expect(loading).toMatch(/aria-hidden="true"/);
    expect(readCode(LOADING)).not.toMatch(/spinner/i);
  });

  it("asserts nothing about the broker while the dossier is still loading", () => {
    const code = readCode(LOADING);
    // A skeleton that renders a claim is a fabricated claim (Rule 3). Note
    // `detail-closures-box` is a legacy *layout* class the real dossier also
    // uses; the skeleton fills it with blank bars and states no closure count.
    for (const forbidden of ["scoutRating", "/100", "Building a ScoutIt record"]) {
      expect(code).not.toContain(forbidden);
    }
    expect(code).not.toMatch(/>\s*\d[\d,.]*\s*</);
  });

  it("honours reduced motion and keeps skeleton text at the 12px floor", () => {
    const css = read(CSS);
    expect(css).toContain("dossier-skeleton-sweep");
    const reducedMotionBlock = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reducedMotionBlock).toContain("animation: none");
    // Rule 24: `rgb(var(--x) / <alpha>)` requires space-separated channels.
    expect(css).toContain("rgb(var(--accent-ch) / 0.07)");
    expect(css).not.toMatch(/\.dossier-skeleton-status[\s\S]{0,200}font-size:\s*(?:[0-9]|10|11)px/);
  });
});
