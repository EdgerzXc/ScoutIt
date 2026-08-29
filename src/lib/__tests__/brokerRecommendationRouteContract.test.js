import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROUTE = "src/app/api/broker/recommendations/route.js";
const read = () => readFileSync(resolve(process.cwd(), ROUTE), "utf8");
const readCode = () =>
  read()
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

// ─────────────────────────────────────────────────────────────────────────
// A-023 gap G1 route contract. Three values decide whether a recommendation
// is trustworthy, and none may come from the request body:
//   author identity, verified-connection status, and moderation state.
// ─────────────────────────────────────────────────────────────────────────

describe("A-023 recommendation submission route", () => {
  it("takes the author from the session, never from the body", () => {
    const code = readCode();
    expect(code).toContain("resolveUserId(request)");
    expect(code).toContain("author_user_id: userId");
    expect(code).not.toMatch(/author_user_id:\s*(?:body|validated\.value)\./);
  });

  it("resolves the verified connection server-side and never accepts one", () => {
    const code = readCode();
    // Looked up from deal_handshakes, not read off the payload.
    expect(code).toContain("deal_handshakes");
    expect(code).toContain('.eq("handshake_type", "transaction_handshake")');
    expect(code).toContain('.eq("status", "completed")');
    expect(code).toContain("qualifying_handshake_id: qualifyingHandshakeId");
    expect(code).not.toMatch(/qualifying_handshake_id:\s*(?:body|validated)/);
  });

  it("always writes a pending moderation state", () => {
    const code = readCode();
    expect(code).toContain('moderation_state: "pending"');
    expect(code).not.toMatch(/moderation_state:\s*(?:body|validated)/);
  });

  it("records consent with its timestamp rather than assuming it", () => {
    const code = readCode();
    expect(code).toContain("consent_granted: true");
    expect(code).toContain("consent_recorded_at:");
  });

  it("requires an existing deal before accepting a recommendation", () => {
    const code = readCode();
    // Without this any account could write about any broker.
    expect(code).toContain('.from("deals")');
    expect(code).toContain('.eq("buyer_id", userId)');
    expect(code).toMatch(/if \(!deals\?\.length\)/);
  });

  it("refuses self-recommendation, rate-limits, and honours the write freeze", () => {
    const code = readCode();
    expect(code).toContain("You cannot recommend yourself");
    expect(code).toContain("checkSubmissionRate(userId)");
    expect(code).toContain("isGlobalReadOnly()");
  });

  it("keeps the response private and never echoes the stored body back", () => {
    const code = readCode();
    expect(code).toContain('"Cache-Control": "private, no-store"');
    expect(code).not.toMatch(/body:\s*validated\.value\.body\s*,?\s*\}\s*,\s*201/);
  });
});
