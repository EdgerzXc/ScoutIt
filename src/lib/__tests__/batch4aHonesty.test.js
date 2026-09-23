import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// A-146 batch 4a: small honesty fixes pinned by reading source (JSX-in-.js
// can't render under this vitest config — same convention as a096).

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("A-146 — no fabricated verification on spec facts", () => {
  it("assoc dues carry no (Verified) tag", () => {
    const src = read("src/components/property/ResidentialFlow.js");
    expect(src).not.toContain("(Verified)");
    expect(src).toContain("Assoc Dues");
  });
});

describe("A-146 — the AI wishlist tool tells the truth", () => {
  it("never claims a save it did not perform", () => {
    const src = read("src/app/api/questit/route.js");
    expect(src).not.toContain("Successfully saved");
    expect(src).toContain("tap Save");
  });
});

describe("A-146 — guaranteed-404 roster pages are not indexed", () => {
  it("photographer slugs carry noindex while the roster is empty", () => {
    expect(read("src/app/photographers/[photographer-slug]/page.js")).toContain(
      "index: false",
    );
  });
});

describe("A-146 — Lite stops the event-horizon loop", () => {
  it("EventHorizon takes the still path under Lite like reduced-motion", () => {
    const src = read("src/components/cinematic/EventHorizon.js");
    expect(src).toContain("isLiteMode");
    expect(src).toContain("isLiteMode()");
  });
});

describe("A-146 — CRM lens derives from the server profile", () => {
  it("offers only held lenses, never the localStorage hint", () => {
    const src = read("src/app/dashboard/crm/page.js");
    expect(src).toContain("currentUser?.active_roles");
    expect(src).toContain("lensOptions");
    expect(src).not.toContain('saved.primaryMode === "broker"');
  });
});
