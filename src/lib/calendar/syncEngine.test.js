import { describe, it, expect } from "vitest";
import { computeContentHash, googleToCanonical, canonicalToGoogle } from "./eventNormalize";
import { decideOutbound, decideInbound, OUTBOUND, INBOUND } from "./syncEngine";

const baseEvent = {
  title: "Site viewing",
  description: "Bring hard hat",
  location: "BGC Tower 3",
  startsAt: "2026-07-20T01:00:00.000Z",
  endsAt: "2026-07-20T02:00:00.000Z",
  allDay: false,
  status: "confirmed",
};

describe("computeContentHash", () => {
  it("is stable across equivalent timestamp formats", () => {
    const a = computeContentHash(baseEvent);
    const b = computeContentHash({ ...baseEvent, startsAt: "2026-07-20T01:00:00+00:00" });
    expect(a).toBe(b);
  });

  it("treats null and empty description/location as equal", () => {
    const a = computeContentHash({ ...baseEvent, description: "", location: "" });
    const b = computeContentHash({ ...baseEvent, description: null, location: null });
    expect(a).toBe(b);
  });

  it("changes when meaningful content changes", () => {
    expect(computeContentHash(baseEvent)).not.toBe(computeContentHash({ ...baseEvent, title: "Moved" }));
  });
});

describe("decideOutbound (ScoutIt -> provider)", () => {
  it("skips when nothing changed since last sync (no echo)", () => {
    const hash = computeContentHash(baseEvent);
    expect(decideOutbound({ local: baseEvent, lastSyncedHash: hash }).action).toBe(OUTBOUND.SKIP);
  });

  it("pushes when the local event changed", () => {
    const oldHash = computeContentHash(baseEvent);
    const local = { ...baseEvent, location: "New venue" };
    expect(decideOutbound({ local, lastSyncedHash: oldHash }).action).toBe(OUTBOUND.PUSH);
  });
});

describe("decideInbound (provider -> ScoutIt)", () => {
  it("drops our own write echoing back (core loop guard)", () => {
    // We just pushed baseEvent; lastSyncedHash == its hash. Google now echoes
    // that same event back to us — must be skipped, or we'd loop forever.
    const hash = computeContentHash(baseEvent);
    expect(decideInbound({ remote: baseEvent, local: baseEvent, lastSyncedHash: hash }).action).toBe(
      INBOUND.SKIP
    );
  });

  it("applies a genuine remote change when local is untouched", () => {
    const lastSynced = computeContentHash(baseEvent);
    const remote = { ...baseEvent, title: "Rescheduled by client" };
    expect(decideInbound({ remote, local: baseEvent, lastSyncedHash: lastSynced }).action).toBe(
      INBOUND.APPLY
    );
  });

  it("flags a conflict when both sides changed since last agreement", () => {
    const lastSynced = computeContentHash(baseEvent);
    const remote = { ...baseEvent, title: "Remote edit" };
    const local = { ...baseEvent, location: "Local edit" };
    expect(decideInbound({ remote, local, lastSyncedHash: lastSynced }).action).toBe(INBOUND.CONFLICT);
  });
});

describe("google mapping round-trip", () => {
  it("maps a timed Google event to canonical and back", () => {
    const g = {
      id: "abc",
      summary: "Meeting",
      description: "notes",
      location: "Zoom",
      status: "confirmed",
      start: { dateTime: "2026-07-20T01:00:00Z" },
      end: { dateTime: "2026-07-20T02:00:00Z" },
    };
    const canon = googleToCanonical(g);
    expect(canon.title).toBe("Meeting");
    expect(canon.allDay).toBe(false);
    const back = canonicalToGoogle(canon);
    expect(back.summary).toBe("Meeting");
    expect(back.start.dateTime).toBeTruthy();
  });

  it("handles all-day (date-only) events", () => {
    const g = { id: "x", summary: "Holiday", status: "confirmed", start: { date: "2026-07-20" }, end: { date: "2026-07-21" } };
    const canon = googleToCanonical(g);
    expect(canon.allDay).toBe(true);
    expect(canonicalToGoogle(canon).start.date).toBe("2026-07-20");
  });
});
