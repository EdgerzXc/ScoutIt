import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CRUST_SERVICE_DATA,
  CRUST_SERVICE_KEYS,
} from "@/components/descent/crustServiceData";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("F-007 Crust professional-category contract", () => {
  it("defines four distinct roles with evidence, engagement, boundary, and next-action copy", () => {
    expect(CRUST_SERVICE_KEYS).toEqual(["advisors", "photography", "research", "events"]);

    for (const key of CRUST_SERVICE_KEYS) {
      const service = CRUST_SERVICE_DATA[key];
      expect(service.navLabel).toBeTruthy();
      expect(service.summary.length).toBeGreaterThan(80);
      expect(service.purpose.length).toBeGreaterThan(100);
      expect(service.evidence.length).toBeGreaterThan(100);
      expect(service.engage.length).toBeGreaterThan(100);
      expect(service.boundary).toMatch(/ScoutIt|roster/i);
      expect(service.rosterNote).toMatch(/empty|Example|profile/i);
      expect(service.href).toMatch(/^\/[a-z-]+$/);
      expect(existsSync(resolve(process.cwd(), "src/app", service.href.slice(1)))).toBe(true);
    }
  });

  it("limits verification language to named evidence and preserves provider launch boundaries", () => {
    expect(CRUST_SERVICE_DATA.advisors.evidence).toMatch(/PRC Verified badge appears only after staff records supporting registry evidence/i);
    expect(CRUST_SERVICE_DATA.advisors.boundary).toMatch(/not the broker/i);

    for (const key of ["photography", "research", "events"]) {
      const service = CRUST_SERVICE_DATA[key];
      expect(service.status).toMatch(/waitlisted/i);
      expect(service.evidence).toMatch(/Example, Pilot, and availability signals/i);
      expect(service.boundary).toMatch(/not yet|remain limited|remain unavailable|not yet open/i);
    }
  });

  it("implements a deep-linked, keyboard-operable tab interface", () => {
    const page = read("src/app/layer/crust/page.js");
    expect(page).toContain('role="tablist"');
    expect(page).toContain('role="tab"');
    expect(page).toContain('role="tabpanel"');
    expect(page).toContain("aria-selected={selected}");
    expect(page).toContain("window.history.pushState");
    expect(page).toContain('window.addEventListener("popstate"');
    expect(page).toContain('event.key === "ArrowRight"');
    expect(page).toContain('event.key === "Home"');
    expect(page).toContain('event.key === "End"');
  });

  it("keeps motion and transparency fallbacks explicit", () => {
    const css = read("src/app/layer/crust/page.module.css");
    const background = read("src/components/descent/BackgroundCrust.js");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/@media \(prefers-reduced-transparency: reduce\)/);
    expect(background).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches');
    expect(background).toContain("if (isLiteMode() || prefersReducedMotion) return;");
  });
});