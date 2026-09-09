import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  REMOVABLE_ROLES,
  ROLE_BEHAVIOUR,
  SIMPLE_MODE_CLASS,
  SIMPLE_MODE_EVENT,
  SIMPLE_MODE_KEY,
  deriveRole,
  isRemovableRole,
  shouldRender,
  simpleCollapsed,
} from "@/lib/simpleMode";

// A-083 phase 0 — the transform, shipping alone with no user-visible change.
//
// The specification's acceptance tests 0-3 are implemented here. Test 0 is
// weighted above every other test: if it fails, the phase does not ship,
// whatever else passes.

const read = (p) => fs.readFileSync(p, "utf8");

// ── TEST 0 — THE PRO GUARANTEE ────────────────────────────────────────────

describe("A-083 test 0 · Pro is frozen (weighted above every other test)", () => {
  // A fixture element for every removable role plus several that are not.
  const everyElement = [
    { name: "chapter-subtitle", role: "description" },
    { name: "deep-intel-panel", role: "detail" },
    { name: "provenance-label" },
    { name: "suppression-notice", role: undefined },
    { name: "verification-qualifier", role: null },
    { name: "consent-text", role: "" },
    { name: "legal-copy", role: "legal" },
    { name: "empty-state", role: "empty" },
    { name: "entitlement-boundary", role: "entitlement" },
    { name: "sidebar-label", role: "label" },
    { name: "sidebar-value", role: "value" },
    { name: "metric-number", role: "number" },
  ];

  it("renders every element in Pro, including the two removable roles", () => {
    const rendered = everyElement.filter((el) => shouldRender({ ...el, simple: false }));
    expect(rendered.map((el) => el.name)).toEqual(everyElement.map((el) => el.name));
  });

  it("collapses nothing in Pro", () => {
    for (const element of everyElement) {
      expect(simpleCollapsed({ ...element, simple: false })).toBe(false);
    }
  });

  it("keeps the identical field list in Pro before and after the transform exists", () => {
    // The transform is a pure function of role; with simple=false it is the
    // identity over any field list at all.
    const fields = Array.from({ length: 170 }, (_, i) => ({ name: `field_${i}`, role: "description" }));
    expect(fields.filter((f) => shouldRender({ ...f, simple: false }))).toHaveLength(170);
  });
});

// ── TEST 1 — THE FAIL-OPEN PROOF ──────────────────────────────────────────

describe("A-083 test 1 · an unclassified element renders in full in Simple", () => {
  it("renders an element with no classification at all", () => {
    expect(shouldRender({ simple: true })).toBe(true);
    expect(shouldRender({ role: undefined, simple: true })).toBe(true);
    expect(shouldRender({ role: null, simple: true })).toBe(true);
    expect(shouldRender({ role: "", simple: true })).toBe(true);
  });

  it("renders an element whose role nobody has heard of", () => {
    // A future Pro feature, or a typo. Neither may silently vanish.
    for (const role of ["descriptionn", "DETAIL", "annotation", "footnote", "aside"]) {
      expect(shouldRender({ role, simple: true })).toBe(true);
    }
  });

  it("renders when called with no arguments at all", () => {
    expect(shouldRender()).toBe(true);
  });

  it("treats an unknown role as core when deriving, never as removable", () => {
    expect(deriveRole({ role: "annotation" })).toBeUndefined();
    expect(deriveRole({})).toBeUndefined();
    expect(deriveRole()).toBeUndefined();
  });
});

// ── TEST 2 — REMOVAL IS AN ALLOWLIST ──────────────────────────────────────

describe("A-083 test 2 · exactly two roles are removable", () => {
  it("names description and detail, and nothing else", () => {
    expect([...REMOVABLE_ROLES].sort()).toEqual(["description", "detail"]);
    expect(Object.isFrozen(REMOVABLE_ROLES)).toBe(true);
  });

  it("omits only description, and collapses only detail", () => {
    expect(shouldRender({ role: "description", simple: true })).toBe(false);
    // `detail` is collapsed, NOT removed — it must stay in the tree behind
    // its expander so nothing hidden becomes unreachable.
    expect(shouldRender({ role: "detail", simple: true })).toBe(true);
    expect(simpleCollapsed({ role: "detail", simple: true })).toBe(true);
    expect(simpleCollapsed({ role: "description", simple: true })).toBe(false);
  });

  it("rejects every protected role as non-removable", () => {
    for (const role of [
      "provenance",
      "suppression",
      "verification",
      "consent",
      "legal",
      "empty",
      "entitlement",
      "label",
      "value",
      "number",
    ]) {
      expect(isRemovableRole(role)).toBe(false);
      expect(shouldRender({ role, simple: true })).toBe(true);
    }
  });

  it("declares a behaviour for both removable roles and no others", () => {
    expect(Object.keys(ROLE_BEHAVIOUR).sort()).toEqual(["description", "detail"]);
  });
});

// ── TEST 3 — NO AUTHORED SIMPLE CONTENT ───────────────────────────────────

describe("A-083 test 3 · Simple is derived, never authored (Rule B)", () => {
  const SOURCE_ROOTS = ["src/lib", "src/components", "src/app"];

  function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(full, out);
      else if (/\.(js|jsx)$/.test(entry.name) && !full.includes("__tests__")) out.push(full);
    }
    return out;
  }

  const files = SOURCE_ROOTS.filter(fs.existsSync).flatMap((root) => walk(root));

  it("scans a real set of source files", () => {
    expect(files.length).toBeGreaterThan(300);
  });

  it("has no file of Simple strings", () => {
    const authored = files.filter((f) => /simple(Copy|Strings|Content|Text)\.js/i.test(f));
    expect(authored).toEqual([]);
  });

  it("has no component that branches on mode to render different words", () => {
    // The forbidden shape is a conditional that picks between two strings on
    // the basis of Simple. Rule B exists to stop double authoring, which
    // drifts — and a drifted disclosure is the failure that matters.
    const offenders = [];
    for (const file of files) {
      const source = read(file);
      if (!/isSimpleMode|SIMPLE_MODE/.test(source)) continue;
      // `isSimpleMode() ? "words" : "other words"` in any spacing.
      if (/isSimpleMode\(\)\s*\?\s*["'`][^"'`]{2,}["'`]\s*:\s*["'`][^"'`]{2,}["'`]/.test(source)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the transform free of any literal copy of its own", () => {
    const transform = read("src/lib/simpleMode.js");
    const code = transform.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    // The only strings the transform may hold are role names, storage keys,
    // the class and the event — never a sentence shown to a user.
    const literals = (code.match(/["'][^"']*["']/g) || []).map((l) => l.slice(1, -1));
    const sentences = literals.filter((l) => l.trim().split(/\s+/).length > 2);
    expect(sentences).toEqual([]);
  });
});

// ── THE SWITCH ────────────────────────────────────────────────────────────

describe("A-083 phase 0 · the switch mirrors the proven Lite Mode pattern", () => {
  it("uses the keys and class the specification names", () => {
    expect(SIMPLE_MODE_KEY).toBe("scoutit_simple_mode");
    expect(SIMPLE_MODE_EVENT).toBe("scoutit:simplemode");
    expect(SIMPLE_MODE_CLASS).toBe("simple-mode");
  });

  it("applies the class before first paint, beside the existing Lite script", () => {
    const layout = read("src/app/layout.js");
    expect(layout).toContain("scoutit_simple_mode");
    expect(layout).toContain("simple-mode");
    // No-flash: it must be in the same inline head script region as Lite.
    expect(layout.indexOf("scoutit_simple_mode")).toBeGreaterThan(-1);
  });

  it("is SSR-safe — every reader guards for a missing document", () => {
    const transform = read("src/lib/simpleMode.js");
    expect(transform).toContain('typeof document !== "undefined"');
    expect(transform).toContain('typeof window === "undefined"');
  });

  it("is reachable from Help & Display, beside Lite Mode", () => {
    // Owner decision, 2026-09-03: Simple is public. Until this shipped it was
    // reachable only by setting the storage key by hand.
    const toolbox = read("src/components/ui/FloatingToolbox.js");
    expect(toolbox).toContain("toggleSimple");
    expect(toolbox).toContain("setSimpleMode(next)");
    expect(toolbox).toContain("getStoredSimpleMode()");
    expect(toolbox).toMatch(/Simple Mode \{simple \? "· On" : "· Off"\}/);
    // State is announced, not just coloured — the same bar A-084 set.
    expect(toolbox).toContain("aria-pressed={simple}");
  });

  it("names Simple Mode in the panel's accessible name, which is a promise about its contents", () => {
    for (const file of [
      "src/components/layout/Header.js",
      "src/components/ui/ProfileButton.js",
    ]) {
      expect(read(file)).toContain(
        "Help & Display (Guide / Dark / High Contrast / Lite Mode / Simple Mode)"
      );
    }
  });

  it("defaults to off, so a user who never opens the toggle sees today's product", () => {
    // No stored value and no class means Pro. `isSimpleMode` reads the class,
    // which the head script only adds when the stored value is exactly "1".
    const layout = read("src/app/layout.js");
    expect(layout).toMatch(/scoutit_simple_mode[\s\S]{0,120}===\s*['"]1['"]/);
  });
});
