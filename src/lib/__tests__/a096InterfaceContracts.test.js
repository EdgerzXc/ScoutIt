import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// A-096 — interface contracts a screen reader and a tab bar depend on.
// Render tests are impossible in this repo (JSX in .js), so these pin the
// structure by reading source. County of exception, recorded once:
// - /off-market gets NO title here (indexability undecided — adding metadata
//   that improves its ranking first is the wrong order).
// - /showcase heading/landmark fixes touch a locked surface: scoped to O-001
//   review, not this task.
// - The two axe contrast readings (#f44336, #fb923c) reproduce from no source
//   in this tree; changing palette values blind is refused — W-004 re-proves.

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("A-096 — headings name every workspace", () => {
  it("BuyerMode renders exactly one h1 without changing visuals", () => {
    const src = read("src/components/dashboard/BuyerMode.js");
    expect(src.match(/<h1[\s>]/g) || []).toHaveLength(1);
    expect(src).toContain("sr-only");
  });

  it("BrokerMode landing h1s are responsive twins (one accessible at a time)", () => {
    const src = read("src/components/dashboard/BrokerMode.js");
    expect(src.match(/>Broker Intelligence<\/h1>/g) || []).toHaveLength(2);
  });

  it("inbox outline is monotonic (h1, then h2s, no h3)", () => {
    const src = read("src/app/dashboard/inbox/page.js");
    expect(src).toContain("<h1");
    expect(src).not.toContain("<h3");
  });

  it("article detail outline is monotonic (h1, h2, h3, h4 in order)", () => {
    const src = read("src/app/intel/[article-slug]/page.js");
    const levels = [...src.matchAll(/<(h[1-6])[\s>]/g)].map((m) => Number(m[1][1]));
    expect(levels.length).toBeGreaterThan(0);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });
});

describe("A-096 — controls announce themselves", () => {
  it("radius selects carry names on both dashboards", () => {
    for (const file of [
      "src/components/dashboard/BuyerMode.js",
      "src/components/dashboard/BrokerMode.js",
    ]) {
      const src = read(file);
      expect(src).toContain('aria-label="Search radius"');
    }
  });

  it("no primary action renders an empty accessible name", () => {
    const src = read("src/app/dashboard/page.js");
    expect(src).not.toContain('label: ""');
    expect(src).toContain("PRIMARY_ACTIONS[mode] || null");
  });

  it("unknown modes get a headed fallback with a door, not bare text", () => {
    const src = read("src/app/dashboard/page.js");
    expect(src).not.toContain("<div>Unknown Mode</div>");
    expect(src).toContain("Workspace unavailable");
    expect(src).toContain('href="/discover"');
  });

  it("Mission Control sign-in CTAs show keyboard focus", () => {
    const src = read("mission-control/src/app/page.js");
    expect(src.match(/focus-visible:outline/g).length).toBeGreaterThanOrEqual(2);
  });
});

describe("A-096 — every route names its tab (except undecided /off-market)", () => {
  const titled = {
    "src/app/dashboard/layout.js": "Dashboard",
    "src/app/dashboard/inbox/layout.js": "Inbox",
    "src/app/dashboard/crm/layout.js": "CRM",
    "src/app/dashboard/calendar/layout.js": "Calendar",
    "src/app/settings/layout.js": "Settings",
    "src/app/profile/layout.js": "Profile",
    "src/app/admin/layout.js": "Admin Console",
    "src/app/admin/flow/layout.js": "Flow Map",
    "src/app/badges/layout.js": "Badges",
    "src/app/enterprise/layout.js": "Enterprise",
    "src/app/transit/layout.js": "Transit",
    "src/app/onboarding/layout.js": "Create Account",
    "src/app/descent/layout.js": "Descent",
  };
  it.each(Object.entries(titled))("%s exports its title", (file, title) => {
    expect(existsSync(join(process.cwd(), file))).toBe(true);
    const src = read(file);
    expect(src).toContain(`title: "${title}"`);
    expect(src).toContain("{children}");
  });
});
