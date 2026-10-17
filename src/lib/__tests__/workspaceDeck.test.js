import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  DECK_PANELS,
  deckOrderForRole,
  deckNeighbors,
  isPipelineRole,
  classifySwipeIntent,
  shouldCommitSwipe,
  resistDeadEnd,
  setDeckDirection,
  consumeDeckDirection,
  SWIPE_LOCK_SELECTORS,
} from "../workspaceDeck";

function pageExists(href) {
  const path = href === "/dashboard" ? "src/app/dashboard/page.js" : `src/app${href}/page.js`;
  return existsSync(join(process.cwd(), path));
}

describe("Workspace Deck model (A-205)", () => {
  it("orders owner/broker as [crm | workspace | inbox | calendar]", () => {
    expect(deckOrderForRole("owner")).toEqual(["crm", "workspace", "inbox", "calendar"]);
    expect(deckOrderForRole("broker")).toEqual(["crm", "workspace", "inbox", "calendar"]);
  });

  it("gives non-pipeline roles a two-panel deck with no CRM", () => {
    for (const mode of ["buyer", "exploring", "provider", "operator", "unknown"]) {
      expect(deckOrderForRole(mode)).toEqual(["workspace", "inbox"]);
    }
  });

  it("maps swipe-left from Workspace to Inbox and swipe-right to CRM (owner mapping)", () => {
    const { leftHref, rightHref } = deckNeighbors("workspace", "owner");
    expect(leftHref).toBe("/dashboard/inbox");
    expect(rightHref).toBe("/dashboard/crm");
  });

  it("returns Workspace from both Inbox and CRM neighbours (owner)", () => {
    expect(deckNeighbors("inbox", "owner").rightHref).toBe("/dashboard");
    expect(deckNeighbors("crm", "owner").leftHref).toBe("/dashboard");
    expect(deckNeighbors("crm", "owner").rightHref).toBeNull();
    expect(deckNeighbors("inbox", "owner").leftHref).toBe("/dashboard/calendar");
    expect(deckNeighbors("calendar", "owner").rightHref).toBe("/dashboard/inbox");
    expect(deckNeighbors("calendar", "owner").leftHref).toBeNull();
  });

  it("keeps buyer neighbours inside the two-panel deck", () => {
    expect(deckNeighbors("workspace", "buyer")).toEqual({
      leftHref: "/dashboard/inbox",
      rightHref: null,
    });
    expect(deckNeighbors("inbox", "buyer")).toEqual({
      leftHref: null,
      rightHref: "/dashboard",
    });
  });

  it("fails closed on an unknown panel", () => {
    expect(deckNeighbors("nope", "owner")).toEqual({ leftHref: null, rightHref: null });
  });

  it("every deck href resolves to a real App Router page", () => {
    for (const panel of Object.values(DECK_PANELS)) {
      expect(pageExists(panel.href)).toBe(true);
    }
  });
});

describe("Swipe intent classifier", () => {
  it("stays undecided below the minimum travel", () => {
    expect(classifySwipeIntent(5, 4)).toBeNull();
  });

  it("claims clear horizontal travel", () => {
    expect(classifySwipeIntent(-40, 6)).toBe("horizontal");
    expect(classifySwipeIntent(30, 10)).toBe("horizontal");
  });

  it("yields clear vertical travel to page scroll", () => {
    expect(classifySwipeIntent(6, 60)).toBe("vertical");
  });
});

describe("Release and resistance math", () => {
  it("commits past a quarter of the panel width", () => {
    expect(shouldCommitSwipe(-120, 390, 0)).toBe(true);
    expect(shouldCommitSwipe(-40, 390, 0)).toBe(false);
  });

  it("commits on fling velocity even for short travel", () => {
    expect(shouldCommitSwipe(-20, 390, -0.8)).toBe(true);
    expect(shouldCommitSwipe(20, 390, 0.8)).toBe(true);
  });

  it("rubber-bands dead ends instead of following 1:1", () => {
    expect(Math.abs(resistDeadEnd(100))).toBeLessThan(100);
    expect(resistDeadEnd(-100)).toBeLessThan(0);
  });
});

describe("Cross-route direction handoff", () => {
  it("is consumed exactly once — stale directions never animate later navigations", () => {
    setDeckDirection("left");
    expect(consumeDeckDirection()).toBe("left");
    expect(consumeDeckDirection()).toBeNull();
  });

  it("rejects anything but left/right", () => {
    setDeckDirection("up");
    expect(consumeDeckDirection()).toBeNull();
  });
});

describe("Pipeline role detection", () => {
  it("recognises owner and broker lenses in any casing", () => {
    expect(isPipelineRole(["owner"])).toBe(true);
    expect(isPipelineRole(["Broker"])).toBe(true);
    expect(isPipelineRole(["buyer", "owner"])).toBe(true);
  });

  it("fails closed for buyers, providers, unknown or missing roles", () => {
    expect(isPipelineRole(["buyer"])).toBe(false);
    expect(isPipelineRole(["operator"])).toBe(false);
    expect(isPipelineRole([])).toBe(false);
    expect(isPipelineRole(null)).toBe(false);
    expect(isPipelineRole(undefined)).toBe(false);
  });
});

describe("Swipe lock zones", () => {
  it("always locks map canvases and form fields", () => {
    for (const selector of ["canvas", "input", "textarea", "select", "[data-swipe-lock]"]) {
      expect(SWIPE_LOCK_SELECTORS).toContain(selector);
    }
  });
});
