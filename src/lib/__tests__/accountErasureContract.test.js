import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ERASED_DATA_LABELS,
  ERASURE_CONFIRMATION,
  interpretErasureResponse,
} from "@/lib/accountErasure";

// A-126 — the right to erasure has a button, and the button can only claim what
// the route did. Payload shapes below are the route's own (see
// src/app/api/user/delete-account/route.js and erasureHonesty.test.js).

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

describe("reading the route's answer", () => {
  it("a full deletion reads as deleted", () => {
    const outcome = interpretErasureResponse({
      ok: true,
      status: 200,
      body: { success: true, accountAccessRevoked: true, message: "Your account and private data have been deleted.", erased: ["saved_intel"] },
    });
    expect(outcome.state).toBe("deleted");
  });

  it("a failed auth deletion is partial, with the route's own words — never deleted", () => {
    const body = {
      success: false,
      accountAccessRevoked: false,
      error: "Your private data was erased, but your sign-in could not be closed — you may still be able to sign in.",
      erased: ["saved_intel", "analytics_events"],
    };
    const outcome = interpretErasureResponse({ ok: false, status: 500, body });
    expect(outcome.state).toBe("partial");
    expect(outcome.message).toBe(body.error);
  });

  it("a stop part-way through the tables is partial", () => {
    const outcome = interpretErasureResponse({
      ok: false,
      status: 500,
      body: { error: "Account deletion is incomplete and has been stopped.", failedAt: "privacy_settings", erased: ["saved_intel"] },
    });
    expect(outcome.state).toBe("partial");
  });

  it("a stop at the first table is a failure, and says so in the route's words", () => {
    const body = { error: "Account deletion is incomplete and has been stopped.", failedAt: "saved_intel", erased: [] };
    const outcome = interpretErasureResponse({ ok: false, status: 500, body });
    expect(outcome.state).toBe("failed");
    expect(outcome.message).toBe(body.error);
  });

  it("a 200 that does not confirm the closed sign-in is not a deletion", () => {
    const outcome = interpretErasureResponse({ ok: true, status: 200, body: { success: true } });
    expect(outcome.state).not.toBe("deleted");
  });

  it("an expired session and a lost connection each get an honest message", () => {
    expect(interpretErasureResponse({ ok: false, status: 401, body: null }).message).toMatch(/sign in again/i);
    const lost = interpretErasureResponse({ ok: false, status: 0, body: null });
    expect(lost.state).toBe("failed");
    expect(lost.message).toMatch(/couldn't confirm/i);
  });

  it("keeps the route's audit warning on a completed deletion", () => {
    const outcome = interpretErasureResponse({
      ok: true,
      status: 200,
      body: { success: true, accountAccessRevoked: true, warning: "Deletion completed, but the audit record could not be written." },
    });
    expect(outcome.warning).toMatch(/audit/i);
  });
});

describe("the screen and the route agree", () => {
  const route = read("src/app/api/user/delete-account/route.js");

  it("the route checks the same confirmation phrase the screen sends", () => {
    const code = strip(route);
    expect(code).toContain('from "@/lib/accountErasure"');
    expect(code).toContain("body.confirm !== ERASURE_CONFIRMATION");
    expect(ERASURE_CONFIRMATION).toBe("DELETE MY ACCOUNT");
  });

  it("'What is deleted' names exactly the tables the route erases", () => {
    const block = route.slice(route.indexOf("const erasures = ["), route.indexOf("];", route.indexOf("const erasures = [")));
    const erasedTables = [...block.matchAll(/\["(\w+)",\s*"\w+"\]/g)].map((match) => match[1]);
    expect(erasedTables.length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(ERASED_DATA_LABELS).sort()).toEqual([...erasedTables].sort());
  });

  it("the panel calls the route with the phrase and decides the outcome through the helper", () => {
    const panel = strip(read("src/components/profile/DeleteAccountPanel.js"));
    expect(panel).toMatch(/fetch\(\s*"\/api\/user\/delete-account"/);
    expect(panel).toContain('method: "POST"');
    expect(panel).toContain("confirm: ERASURE_CONFIRMATION");
    expect(panel).toContain("interpretErasureResponse(");
    expect(panel).toContain("disabled={!isConfirmed || submitting}");
    expect(panel).toContain("typed.trim() === ERASURE_CONFIRMATION");
    // It never composes its own success sentence.
    expect(panel).not.toMatch(/have been deleted/i);
  });

  it("Settings renders the panel in its own reachable section", () => {
    const settings = read("src/app/settings/page.js");
    expect(settings).toContain('import DeleteAccountPanel from "@/components/profile/DeleteAccountPanel"');
    const section = settings.indexOf('id="delete-account"');
    expect(section).toBeGreaterThan(-1);
    expect(settings.indexOf("<DeleteAccountPanel", section)).toBeGreaterThan(section);
  });
});
