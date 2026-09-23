import { describe, it, expect, vi, beforeEach } from "vitest";

// A-148 (owner spec S2): a sender with anonymity ON shows as "Anonymous" to
// the recipient while the request is unanswered. The choice persists on
// deals.sender_anonymous (migration-gated, O-004) with fail-closed behavior
// on both sides until the column exists.

import { ANONYMOUS_CONNECT_LABEL, counterpartyDisplayName } from "@/lib/identityDisclosure";
import { loadUserDealRows } from "@/lib/deals/userDeals";

describe("A-148 — disclosure rule: explicit anonymity", () => {
  it("reads Anonymous while unanswered, even for a public sender", () => {
    expect(
      counterpartyDisplayName({ dealStatus: "pending", counterpartyIsPublic: true, senderAnonymous: true, name: "Leroy", roleLabel: "Broker" })
    ).toBe(ANONYMOUS_CONNECT_LABEL);
    expect(ANONYMOUS_CONNECT_LABEL).toBe("Anonymous");
  });

  it("still reveals on acceptance — the flag never swallows a completed handshake", () => {
    expect(
      counterpartyDisplayName({ dealStatus: "accepted", counterpartyIsPublic: false, senderAnonymous: true, name: "Leroy", roleLabel: "Broker" })
    ).toBe("Leroy");
  });

  it("leaves the unflagged path exactly as it was", () => {
    expect(
      counterpartyDisplayName({ dealStatus: "pending", counterpartyIsPublic: true, name: "Leroy", roleLabel: "Broker" })
    ).toBe("Leroy");
    expect(
      counterpartyDisplayName({ dealStatus: "pending", counterpartyIsPublic: false, name: "Leroy", roleLabel: "Broker" })
    ).toBe("Broker");
  });
});

describe("A-148 — inbox reads fall back when the column does not exist yet", () => {
  // Hand-built fake client: no module mocks, the real loadUserDealRows runs.
  const fakeClient = (db) => ({
    from: (table) => ({
      select: (fields) => {
        const failAnon = typeof fields === "string" && fields.includes("sender_anonymous") && db.missingAnon === true;
        const run = async () => {
          if (failAnon) return { data: null, error: { code: "42703", message: 'column deals.sender_anonymous does not exist' } };
          if (table === "deal_routing_recipients") return { data: [], error: null };
          return { data: db.rows || [], error: null };
        };
        const q = run();
        q.not = () => run();
        return { eq: () => q, in: () => run() };
      },
    }),
  });

  it("returns rows with the flag once the column exists", async () => {
    const rows = [{ id: "d1", buyer_id: "u1", sender_anonymous: true, properties: null }];
    const { rows: out, error } = await loadUserDealRows(fakeClient({ rows }), "u1");
    expect(error).toBeNull();
    expect(out).toHaveLength(1);
    expect(out[0].sender_anonymous).toBe(true);
  });

  it("falls back to the base field list on 42703 instead of failing the inbox", async () => {
    const rows = [{ id: "d1", buyer_id: "u1", properties: null }];
    const { rows: out, error } = await loadUserDealRows(fakeClient({ rows, missingAnon: true }), "u1");
    expect(error).toBeNull();
    expect(out).toHaveLength(1);
    // Untouched by the fallback: undefined reads as not-anonymous downstream.
    expect(out[0].sender_anonymous).toBeUndefined();
  });
});

describe("A-148 — UI wiring pins (TEXT: component render tests do not exist here)", () => {
  // The repo cannot render-test components (A-088 record), so modal wiring
  // is pinned the way every other modal contract here is: source assertions
  // on the exact strings the behavior depends on.
  const read = async (path) => (await import("node:fs")).readFileSync(path, "utf8");

  it("both inquiry modals offer the toggle and send the flag", async () => {
    for (const modal of [
      "src/components/property/InquiryModal.js",
      "src/components/property/UnitInquiryModal.js",
    ]) {
      const source = await read(modal);
      expect(source, `${modal} offers anonymity`).toContain("Send anonymously");
      expect(source, `${modal} posts the flag`).toContain("anonymous: sendAnonymously === true");
      expect(source, `${modal} defaults toward concealment`).toContain("setSendAnonymously(data.settings.isProfilePublic !== true)");
    }
  });

  it("the waiting card renders the owner's word for flagged sends", async () => {
    const chatBox = await read("src/components/dashboard/ChatBox.js");
    expect(chatBox).toContain("ANONYMOUS_CONNECT_LABEL");
    expect(chatBox).toContain("Anonymous · name revealed on accept");
  });
});
