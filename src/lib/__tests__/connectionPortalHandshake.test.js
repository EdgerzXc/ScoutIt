import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

// ── U-023 / U-024 — the seeker→broker contact portal ────────────────────────
//
// Two defects on the same money-adjacent surface, both found in the 2026-09-09
// admin-dashboard readiness audit and both re-verified against current code
// before this fix:
//
//   U-023  The form POSTed `{ broker_id, acquisition_brief }` to
//          /api/deals/initiate, which reads neither and 400s without
//          `listingId | propertySlug`. The catch then rendered
//          "Handshake Initiated! … deal workspace has been created."
//          Every submission failed and every user was told it succeeded.
//
//   U-024  The wallet bar called `getConnectsBalance` from `@/lib/profileClient`.
//          A repo-wide grep finds that name only at the import site — it does
//          not exist — so the destructured value was undefined, calling it
//          threw, and the catch rendered a hardcoded `10` as a measurement.
//
// These are source contracts because ConnectionPortal is a client component,
// which the JSX-in-`.js` render-test limit puts out of reach.
const PORTAL = "src/components/connection/ConnectionPortal.js";
const BROKER_PAGE = "src/app/brokers/[broker-slug]/page.js";
const INITIATE = "src/app/api/deals/initiate/route.js";

describe("U-023 the handshake sends what the route actually reads", () => {
  const portal = read(PORTAL);

  it("sends a listing identity, not the two fields the route ignores", () => {
    expect(portal).toContain("propertySlug: space");
    // `broker_id` / `acquisition_brief` are not parameters of this route.
    expect(portal).not.toContain("broker_id: brokerId");
    expect(portal).not.toContain("acquisition_brief: intent");
  });

  it("sends field names the initiate route destructures", () => {
    // Non-vacuity: assert against the route's own parameter list rather than a
    // remembered shape, so a rename on either side fails here.
    const route = read(INITIATE);
    const destructure = route.slice(route.indexOf("const {"), route.indexOf("= await request.json()"));
    for (const field of ["propertySlug", "message", "preferredBrokerId"]) {
      expect(destructure, `initiate reads ${field}`).toContain(field);
      expect(portal, `portal sends ${field}`).toContain(field);
    }
  });

  it("never renders the success screen for a rejected initiate", () => {
    // The defect was `catch { setSubmitted(true) }`. There must be exactly one
    // setSubmitted(true), and it must sit after the ok check.
    const successCalls = portal.match(/setSubmitted\(true\)/g) || [];
    expect(successCalls).toHaveLength(1);

    const okGuard = portal.indexOf("if (!res.ok)");
    const success = portal.indexOf("setSubmitted(true)");
    expect(okGuard).toBeGreaterThan(-1);
    expect(success).toBeGreaterThan(okGuard);

    // The catch reports rather than celebrates.
    const catchBlock = portal.slice(portal.indexOf("} catch (err)"), portal.indexOf("} finally {"));
    expect(catchBlock).not.toContain("setSubmitted");
    expect(catchBlock).toContain("setErrorMsg");
  });

  it("refuses before the request when no space is chosen", () => {
    expect(portal).toContain("if (!space)");
    // And offers no form at all when the advisor has no public space, rather
    // than a button that cannot succeed.
    expect(portal).toContain("spaces.length === 0");
  });

  it("builds the space list from the dossier's own representation authority", () => {
    const page = read(BROKER_PAGE);
    expect(page).toContain("spaces={(representations.cards || []).map(");
    expect(page).toContain("slug: card.slug");
  });
});

describe("U-024 no unsourceable number renders as a balance", () => {
  const portal = read(PORTAL);

  it("does not call the function that never existed", () => {
    expect(portal).not.toContain("getConnectsBalance");
  });

  it("renders no Connects balance at all, and no hardcoded fallback", () => {
    expect(portal).not.toContain("connectsBalance");
    expect(portal).not.toContain("Connects Available");
    // Standing Rule 3 — the specific fabricated figure must not come back.
    expect(portal).not.toMatch(/setConnectsBalance\(10\)/);
  });

  it("still states the cost, which is a fact it can source", () => {
    // Omitting the balance must not turn into omitting the price of the action.
    expect(portal).toContain("1 Connect Required");
  });
});
