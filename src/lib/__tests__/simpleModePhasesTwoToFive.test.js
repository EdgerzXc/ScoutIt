import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { shouldRender, simpleCollapsed } from "@/lib/simpleMode";
import { chapterSubtitleVisible, detailGroupCollapsed } from "@/lib/simpleModeSurfaces";

// A-083 phases 2-5 — buyer dashboard, owner dashboard, broker dossier, layers.
//
// Each phase is classification only; the rule does the work. Test 0 is re-run
// for the set, as the specification requires of every phase.

const read = (p) => fs.readFileSync(p, "utf8");

const BUYER = "src/components/dashboard/BuyerMode.js";
const OWNER = "src/components/dashboard/OwnerMode.js";
const DOSSIER = "src/app/brokers/[broker-slug]/page.js";
const LAYER = "src/components/descent/LayerTransition.js";

// ── TEST 0, RE-RUN ────────────────────────────────────────────────────────

describe("A-083 phases 2-5 · test 0 — Pro is unchanged", () => {
  it("collapses nothing and removes nothing in Pro", () => {
    expect(detailGroupCollapsed(false, false)).toBe(false);
    expect(detailGroupCollapsed(false, true)).toBe(false);
    expect(shouldRender({ role: "description", simple: false })).toBe(true);
    expect(shouldRender({ role: "detail", simple: false })).toBe(true);
    expect(simpleCollapsed({ role: "detail", simple: false })).toBe(false);
    expect(chapterSubtitleVisible("Enter the atmosphere.", false)).toBe(true);
  });

  it("keeps every wrapped section present in the tree — wrapped, never deleted", () => {
    expect(read(BUYER)).toContain("Market Intelligence");
    expect(read(OWNER)).toContain("Engagement Analytics");
    expect(read(DOSSIER)).toContain("<BrokerCareerHistory section={careerHistory} />");
    expect(read(DOSSIER)).toContain("<BrokerContributions section={contributions} />");
    expect(read(LAYER)).toContain("styles.transitionTeaser");
  });
});

// ── PHASE 2 — BUYER DASHBOARD (§6.3) ──────────────────────────────────────

describe("A-083 phase 2 · buyer dashboard", () => {
  const source = read(BUYER);

  it("marks the Market Intel rail as detail", () => {
    expect(source).toContain('<SimpleDetail label="Market Intelligence">');
  });

  it("leaves the core surfaces unmarked — board, cards, search", () => {
    // Exactly one detail group: the rail. Nothing else was swept up.
    expect((source.match(/<SimpleDetail /g) || []).length).toBe(1);
  });

  it("keeps the empty states core and therefore automatic", () => {
    // §6.3: "Your Board is ready" and "The Ledger is Quiet" are core and
    // unmarked, so they survive without anyone protecting them.
    const open = source.indexOf('<SimpleDetail label="Market Intelligence">');
    const close = source.indexOf("</SimpleDetail>");
    const inside = source.slice(open, close);
    expect(inside).not.toContain("Your Board is ready");
    expect(inside).not.toContain("The Ledger is Quiet");
    expect(source).toContain("Your Board is ready");
    expect(source).toContain("The Ledger is Quiet");
  });
});

// ── PHASE 3 — OWNER DASHBOARD (§6.4) ──────────────────────────────────────

describe("A-083 phase 3 · owner dashboard", () => {
  const source = read(OWNER);

  it("marks Engagement Analytics as detail", () => {
    expect(source).toContain('<SimpleDetail label="Engagement Analytics">');
  });

  it("keeps the honest 'not yet tracked' copy inside it, not replaced", () => {
    // The analytics block states absence rather than inventing numbers. Simple
    // may hide the block; it may never rewrite what it says.
    expect(source).toContain("Not yet tracked");
    expect(source).toContain("no invented numbers until then");
  });

  it("leaves attestation and publish-consequence copy core and unmarked", () => {
    const open = source.indexOf("<SimpleDetail ");
    const close = source.indexOf("</SimpleDetail>");
    const inside = source.slice(open, close);
    expect(inside).not.toMatch(/Goes live immediately/i);
    expect(inside).not.toMatch(/attest/i);
  });
});

// ── PHASE 4 — BROKER DOSSIER (§6.5) ───────────────────────────────────────

describe("A-083 phase 4 · broker dossier", () => {
  const source = read(DOSSIER);

  it("marks Career History and Contributions as detail", () => {
    expect(source).toContain('<SimpleDetail label="Career History">');
    expect(source).toContain('<SimpleDetail label="ScoutIt Contributions">');
  });

  it("leaves the ScoutIt Record and Client Recommendations core", () => {
    // Recommendations must NOT be inside any detail group.
    const groups = [...source.matchAll(/<SimpleDetail[\s\S]*?<\/SimpleDetail>/g)].map((m) => m[0]);
    expect(groups.length).toBe(2);
    for (const group of groups) {
      expect(group).not.toContain("BrokerRecommendations");
      expect(group).not.toContain("BrokerDossierIdentity");
    }
    expect(source).toContain("<BrokerRecommendations section={recommendations} />");
  });
});

// ── PHASE 5 — LAYERS (§6.6) ───────────────────────────────────────────────

describe("A-083 phase 5 · descent layers, lightest touch", () => {
  const source = read(LAYER);

  it("removes the teaser sentence in Simple and keeps it in Pro", () => {
    expect(chapterSubtitleVisible("Touch down. Walk the directory.", false)).toBe(true);
    expect(chapterSubtitleVisible("Touch down. Walk the directory.", true)).toBe(false);
    expect(source).toContain("chapterSubtitleVisible(teaser, simple)");
  });

  it("does NOT alter the layer chain, numbering or navigation", () => {
    // §6.6 is explicit about this, and the chain was verified coherent in both
    // directions. None of these may become mode-dependent.
    expect(source).toContain("{nextNum}");
    expect(source).toContain("{nextName}");
    expect(source).toContain("href={nextHref}");
    expect(source).toContain("aria-label={`Continue to ${nextName}`}");
    // The link, number and name are outside any mode condition.
    expect(source).not.toMatch(/simple\s*&&[\s\S]{0,80}nextHref/);
    expect(source).not.toMatch(/simple\s*&&[\s\S]{0,80}transitionNum/);
  });

  it("leaves the locked Metropolis surface untouched", () => {
    const manifest = JSON.parse(read("scripts/approved-surfaces.json"));
    const locked = manifest.surfaces.map((s) => s.path.replaceAll("\\", "/"));
    expect(locked).toContain("src/app/layer/metropolis/page.js");
    // The teaser is gated in the shared component, so the locked page that
    // merely passes the prop never had to change.
    expect(read("src/app/layer/metropolis/page.js")).not.toContain("SimpleDetail");
    expect(read("src/app/layer/metropolis/page.js")).not.toContain("useSimpleMode");
  });
});

// ── RULE B, ACROSS ALL FOUR ───────────────────────────────────────────────

describe("A-083 phases 2-5 · no Simple copy was authored", () => {
  it("adds no mode-branched strings to any wired surface", () => {
    for (const file of [BUYER, OWNER, DOSSIER, LAYER, "src/components/ui/SimpleDetail.js"]) {
      const source = read(file);
      expect(source).not.toMatch(/isSimpleMode\(\)\s*\?\s*["'`][^"'`]{2,}["'`]\s*:\s*["'`][^"'`]{2,}["'`]/);
      expect(source).not.toMatch(/simple\s*\?\s*["'`][^"'`]{2,}["'`]\s*:\s*["'`][^"'`]{2,}["'`]/);
    }
  });

  it("labels every expander with the section's own existing heading", () => {
    // The label reuses words already on the page; it is not new Simple copy.
    for (const [file, label] of [
      [BUYER, "Market Intelligence"],
      [OWNER, "Engagement Analytics"],
      [DOSSIER, "Career History"],
      [DOSSIER, "ScoutIt Contributions"],
    ]) {
      const source = read(file);
      expect(source).toContain(`<SimpleDetail label="${label}">`);
    }
  });
});

// ── REACHABILITY (acceptance test 5) ──────────────────────────────────────

describe("A-083 phases 2-5 · nothing hidden is unreachable", () => {
  it("gives every collapsed section a labelled, expandable control", () => {
    const component = read("src/components/ui/SimpleDetail.js");
    expect(component).toContain("aria-expanded");
    expect(component).toContain("{children}");
    expect(component).toContain("{label}");
  });

  it("opens on demand and stays open", () => {
    expect(detailGroupCollapsed(true, false)).toBe(true);
    expect(detailGroupCollapsed(true, true)).toBe(false);
  });

  it("clears the 44px touch floor", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/\.simple-detail-toggle\s*\{[^}]*min-height:\s*44px/);
  });
});
