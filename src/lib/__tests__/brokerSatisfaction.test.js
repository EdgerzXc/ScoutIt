import {
  MIN_SATISFACTION_SAMPLE,
  SATISFACTION_LEVELS,
  buildSatisfactionSignal,
  isSatisfactionLevel,
} from "@/lib/brokerSatisfaction";

const response = (level, overrides = {}) => ({
  satisfaction_level: level,
  moderation_state: "approved",
  consent_granted: true,
  withdrawn_at: null,
  disputed_at: null,
  qualifying_handshake_id: `handshake-${level}`,
  ...overrides,
});

describe("A-038 broker satisfaction signal", () => {
  it("uses the settled four ordered levels and rejects invented values", () => {
    expect(SATISFACTION_LEVELS).toEqual(["angry", "sad", "smile", "happy"]);
    for (const level of SATISFACTION_LEVELS) expect(isSatisfactionLevel(level)).toBe(true);
    expect(isSatisfactionLevel("neutral")).toBe(false);
    expect(isSatisfactionLevel("5-stars")).toBe(false);
  });

  it("suppresses the headline below the five-response floor", () => {
    const signal = buildSatisfactionSignal([
      response("happy"),
      response("smile"),
      response("sad"),
      response("angry"),
    ]);

    expect(MIN_SATISFACTION_SAMPLE).toBe(5);
    expect(signal).toMatchObject({ state: "building", total: 4, positiveShare: null });
  });

  it("publishes a positive share with its denominator and full distribution", () => {
    const signal = buildSatisfactionSignal([
      response("happy", { qualifying_handshake_id: "h1" }),
      response("happy", { qualifying_handshake_id: "h2" }),
      response("smile", { qualifying_handshake_id: "h3" }),
      response("sad", { qualifying_handshake_id: "h4" }),
      response("angry", { qualifying_handshake_id: "h5" }),
    ]);

    expect(signal).toEqual({
      state: "published",
      total: 5,
      positiveCount: 3,
      positiveShare: 60,
      distribution: { angry: 1, sad: 1, smile: 1, happy: 2 },
    });
    expect(JSON.stringify(signal)).not.toMatch(/average|stars?|rating|score/i);
  });

  it("counts only moderated, consented, live, handshake-backed responses", () => {
    const included = ["happy", "smile", "smile", "sad", "angry"].map((level, index) =>
      response(level, { qualifying_handshake_id: `included-${index}` }),
    );
    const excluded = [
      response("happy", { moderation_state: "pending" }),
      response("happy", { consent_granted: false }),
      response("happy", { withdrawn_at: "2026-08-31T00:00:00Z" }),
      response("happy", { disputed_at: "2026-08-31T00:00:00Z" }),
      response("happy", { qualifying_handshake_id: null }),
      response("neutral"),
    ];

    const signal = buildSatisfactionSignal([...included, ...excluded]);
    expect(signal).toMatchObject({ total: 5, positiveCount: 3, positiveShare: 60 });
  });
});
