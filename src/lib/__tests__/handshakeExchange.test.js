import { describe, it, expect } from "vitest";

// A-149: what an appointment surface may offer for contact exchange. Pure
// resolver — the appointments API answers it server-side and the schedule
// renders the answer, so these pin the contract both sides share.

import { isHandshakeComplete, resolveContactExchange } from "@/lib/handshakeExchange";

const ME = "user-1";
const THEM = "user-2";
const signed = (byMe, byThem) => ({
  status: "pending",
  party_a_id: ME,
  party_b_id: THEM,
  party_a_signed_at: byMe ? "2026-09-01T00:00:00Z" : null,
  party_b_signed_at: byThem ? "2026-09-01T00:00:00Z" : null,
});

describe("A-149 — resolveContactExchange", () => {
  it("reports exchanged once both sides signed, whatever else holds", () => {
    expect(
      resolveContactExchange({ dealStatus: "closed", viewingStatus: "cancelled", handshake: { status: "completed" }, userId: ME })
    ).toEqual({ state: "exchanged", offeredByMe: false });
    expect(
      resolveContactExchange({ dealStatus: "accepted", viewingStatus: "confirmed", handshake: signed(true, true), userId: ME })
    ).toEqual({ state: "exchanged", offeredByMe: false });
  });

  it("attributes a one-sided offer to whoever signed", () => {
    expect(
      resolveContactExchange({ dealStatus: "accepted", viewingStatus: "confirmed", handshake: signed(true, false), userId: ME })
    ).toEqual({ state: "offered", offeredByMe: true });
    expect(
      resolveContactExchange({ dealStatus: "accepted", viewingStatus: "confirmed", handshake: signed(false, true), userId: ME })
    ).toEqual({ state: "offered", offeredByMe: false });
  });

  it("offers when nothing exists yet and the deal is open", () => {
    for (const dealStatus of ["pending", "accepted", "active", "connected"]) {
      expect(
        resolveContactExchange({ dealStatus, viewingStatus: "confirmed", handshake: null, userId: ME }).state
      ).toBe("offerable");
    }
  });

  it("withholds when there is no deal, a terminal deal, or a cancelled viewing", () => {
    expect(resolveContactExchange({ dealStatus: null, viewingStatus: "confirmed", handshake: null, userId: ME }).state).toBe("unavailable");
    for (const dealStatus of ["closed", "declined", "withdrawn", "expired", "reported"]) {
      expect(
        resolveContactExchange({ dealStatus, viewingStatus: "confirmed", handshake: null, userId: ME }).state
      ).toBe("unavailable");
    }
    expect(
      resolveContactExchange({ dealStatus: "accepted", viewingStatus: "cancelled", handshake: null, userId: ME }).state
    ).toBe("unavailable");
  });

  it("isHandshakeComplete trusts the status or both timestamps, never one", () => {
    expect(isHandshakeComplete(null)).toBe(false);
    expect(isHandshakeComplete({ status: "completed" })).toBe(true);
    expect(isHandshakeComplete(signed(true, true))).toBe(true);
    expect(isHandshakeComplete(signed(true, false))).toBe(false);
    expect(isHandshakeComplete(signed(false, false))).toBe(false);
  });
});
