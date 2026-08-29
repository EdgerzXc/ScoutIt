import { describe, expect, it } from "vitest";
import {
  DISPUTE_REASONS,
  DISPUTE_REASON_LABELS,
  CHAT_RETENTION_DAYS,
  describeDisputeWindow,
  retentionCutoffIso,
} from "@/lib/chatRetention";

// ─────────────────────────────────────────────────────────────────────────
// A-045. A-041 built the route; nothing called it, so in practice a party
// still could not file a dispute (Rule 13).
//
// Two things in that surface are logic rather than markup, and both are
// tested here rather than asserted from source:
//
//   1. The grounds a person picks from must read as English, and the set of
//      labels must not drift from the set of keys the route validates. A label
//      map that silently loses a key renders a ground nobody can choose; one
//      that gains a key renders a ground the route rejects with a 400.
//
//   2. The window statement. Under the retention decision a dispute must be
//      raised while the thread is still readable, and "a right that expires
//      unannounced is not a remedy". The sentence therefore has to be true for
//      the deal's actual state, which is a calculation, not copy.
//
// Rule 11: every time-dependent assertion below runs against a fixed instant.
// ─────────────────────────────────────────────────────────────────────────

const NOW = Date.parse("2026-08-27T12:00:00.000Z");
const daysBefore = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

describe("A-045 dispute grounds are offered in plain language", () => {
  it("labels every ground the route will accept", () => {
    for (const reason of DISPUTE_REASONS) {
      expect(DISPUTE_REASON_LABELS[reason], `no label for "${reason}"`).toBeTruthy();
    }
  });

  it("offers no ground the route would reject", () => {
    // A label with no matching key renders a choice that 400s on submit.
    for (const key of Object.keys(DISPUTE_REASON_LABELS)) {
      expect(DISPUTE_REASONS).toContain(key);
    }
  });

  it("never shows the stored key to a person", () => {
    for (const reason of DISPUTE_REASONS) {
      const label = DISPUTE_REASON_LABELS[reason];
      expect(label).not.toBe(reason);
      expect(label).not.toMatch(/_/);
      // Sentence case, not a slug shouted back at the user.
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });
});

describe("A-045 the window statement is true for the deal's actual state", () => {
  it("says the clock has not started while the conversation is open", () => {
    const w = describeDisputeWindow({ status: "connected", closedAt: null, now: NOW });
    expect(w.state).toBe("before_close");
    expect(w.daysLeft).toBeNull();
    expect(w.message).toMatch(new RegExp(String(CHAT_RETENTION_DAYS)));
    expect(w.canFile).toBe(true);
  });

  it("counts the days left once the conversation has closed", () => {
    const w = describeDisputeWindow({ status: "closed", closedAt: daysBefore(2), now: NOW });
    expect(w.state).toBe("counting");
    expect(w.daysLeft).toBe(CHAT_RETENTION_DAYS - 2);
    expect(w.message).toMatch(/5 days/);
    expect(w.canFile).toBe(true);
  });

  it("stops promising preservation at exactly the instant the purge would take it", () => {
    // Corrected after the first run: the original expectation ("today") was
    // wrong, not the code. The purge selects `closed_at <= now - 7 days`, so a
    // thread closed exactly 7 days ago is ALREADY eligible and the next nightly
    // run overwrites it. Telling that person they have a day left would be the
    // exact unannounced expiry this task exists to prevent.
    const onTheBoundary = describeDisputeWindow({
      status: "closed",
      closedAt: retentionCutoffIso(NOW),
      now: NOW,
    });
    expect(onTheBoundary.state).toBe("elapsed");

    // One second inside the window still counts down.
    const justInside = describeDisputeWindow({
      status: "closed",
      closedAt: new Date(Date.parse(retentionCutoffIso(NOW)) + 1000).toISOString(),
      now: NOW,
    });
    expect(justInside.state).toBe("counting");
    expect(justInside.daysLeft).toBeGreaterThan(0);
  });

  it("counts down in whole days that never reach zero while still counting", () => {
    // "0 days left" and "still protected" cannot both be true, so the counting
    // branch must never render a zero.
    for (let d = 0; d < 7; d += 1) {
      const w = describeDisputeWindow({ status: "closed", closedAt: daysBefore(d), now: NOW });
      if (w.state !== "counting") continue;
      expect(w.daysLeft).toBeGreaterThan(0);
      expect(w.message).not.toMatch(/0 days/);
    }
  });

  it("admits the record may already be gone once the window has passed", () => {
    const w = describeDisputeWindow({ status: "closed", closedAt: daysBefore(30), now: NOW });
    expect(w.state).toBe("elapsed");
    expect(w.daysLeft).toBe(0);
    // Filing is still allowed — staff may act on other evidence — but the
    // person must not be told a thread will be preserved when it may already
    // have been overwritten.
    expect(w.canFile).toBe(true);
    expect(w.message).toMatch(/may already/i);
  });

  it("never promises preservation it cannot deliver", () => {
    const elapsed = describeDisputeWindow({
      status: "closed",
      closedAt: daysBefore(30),
      now: NOW,
    });
    expect(elapsed.message).not.toMatch(/will be (kept|preserved|protected)/i);

    const counting = describeDisputeWindow({
      status: "closed",
      closedAt: daysBefore(1),
      now: NOW,
    });
    // Inside the window the promise is real and should be made plainly — it is
    // the only reason filing feels worth doing.
    expect(counting.message).toMatch(/kept|preserved|protected/i);
  });

  it("does not fall over on a closed deal with no closing timestamp", () => {
    // Real rows predate `closed_at`; a NULL is not an assertion (Rule 14).
    const w = describeDisputeWindow({ status: "closed", closedAt: null, now: NOW });
    expect(w.canFile).toBe(true);
    expect(w.daysLeft).toBeNull();
    expect(w.message).toBeTruthy();
    expect(w.message).not.toMatch(/NaN|undefined|null/);
  });

  it("treats a reported thread as still filable", () => {
    const w = describeDisputeWindow({ status: "reported", closedAt: daysBefore(2), now: NOW });
    expect(w.canFile).toBe(true);
  });
});
