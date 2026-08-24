import { describe, expect, it } from "vitest";
import { promoteFailureState, RETRY_UNKNOWN } from "@/components/property/promoteFallback";

// A-014 — PromoteModal turned every non-OK response into one string and rendered
// a dead end, while buildPromoPack() could have produced the same three formats
// locally with no AI, no network and no tier resolution.
//
// Two different failures deserve two different answers: a 429 knows when it can
// be retried, everything else does not.

describe("promoteFailureState", () => {
  it("treats a rate limit as temporary and says when to retry", () => {
    const state = promoteFailureState({ status: 429, retryAfterSeconds: 42 });

    expect(state.kind).toBe("rate-limited");
    expect(state.retryAfterSeconds).toBe(42);
    expect(state.message).toContain("42");
  });

  it("falls back to a readable wait when the server sends no Retry-After", () => {
    const state = promoteFailureState({ status: 429, retryAfterSeconds: null });

    expect(state.kind).toBe("rate-limited");
    expect(state.retryAfterSeconds).toBe(RETRY_UNKNOWN);
    expect(state.message).not.toContain("null");
    expect(state.message).not.toContain("NaN");
  });

  it("does not promise a retry time it cannot know for a server error", () => {
    const state = promoteFailureState({ status: 500 });

    expect(state.kind).toBe("unavailable");
    expect(state.retryAfterSeconds).toBeNull();
  });

  it("still offers the local pack on any failure — that is the whole point", () => {
    for (const status of [429, 500, 502, 503, 0]) {
      expect(promoteFailureState({ status }).canUseLocalPack).toBe(true);
    }
  });

  it("never labels the local pack as the AI draft", () => {
    // Presenting deterministic template copy as AI output would be the same
    // class of untruth as the reactions endpoint returning ok:true on failure.
    const state = promoteFailureState({ status: 500 });

    expect(state.localPackLabel).toBeTruthy();
    expect(state.localPackLabel.toLowerCase()).not.toContain("ai-drafted");
  });

  it("reports success as no failure at all", () => {
    expect(promoteFailureState({ status: 200 })).toBeNull();
  });
});

// A decision function nobody calls is not a fix — the same guard pattern used
// for the ld+json sinks in U-008.
describe("PromoteModal actually wires the fallback", () => {
  const fs = require("node:fs");
  const source = () => fs.readFileSync("src/components/property/PromoteModal.js", "utf8");

  it("imports the local pack builder and the failure state", () => {
    expect(source()).toContain("buildPromoPack");
    expect(source()).toContain("promoteFailureState");
  });

  it("reads Retry-After off the response rather than guessing", () => {
    expect(source()).toContain('res.headers.get("Retry-After")');
  });

  it("no longer throws on a non-OK response instead of degrading", () => {
    // The old line was: if (!res.ok) throw new Error(...)
    expect(source()).not.toMatch(/if \(!res\.ok\) throw/);
  });

  it("does not label a degraded render as the AI source", () => {
    // degradeToLocalPack must set the factsheet source, never "ai".
    const fn = source().slice(source().indexOf("const degradeToLocalPack"));
    const body = fn.slice(0, fn.indexOf("};"));
    expect(body).toContain('setSource("factsheet")');
    expect(body).not.toContain('setSource("ai")');
  });
});
