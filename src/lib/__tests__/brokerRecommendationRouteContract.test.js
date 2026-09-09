import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROUTE = "src/app/api/broker/recommendations/route.js";
// A-038 moved the qualification rule into a shared module so the invitation
// panel and this route ask the identical question. The contract followed it
// there rather than being relaxed — a rule no test guards is a rule that
// drifts back.
const ELIGIBILITY = "src/lib/brokerRecommendationEligibility.js";

const strip = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const read = () => readFileSync(resolve(process.cwd(), ROUTE), "utf8");
const readCode = () => strip(read());
const readEligibilityCode = () =>
  strip(readFileSync(resolve(process.cwd(), ELIGIBILITY), "utf8"));

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
    const rule = readEligibilityCode();

    // Looked up from deal_handshakes, not read off the payload.
    expect(rule).toContain("deal_handshakes");
    expect(rule).toContain('.eq("handshake_type", QUALIFYING_HANDSHAKE_TYPE)');
    expect(rule).toContain('.eq("status", QUALIFYING_HANDSHAKE_STATUS)');

    // Both signatures, not merely a "completed" status flag.
    expect(rule).toContain('.not("party_a_signed_at", "is", null)');
    expect(rule).toContain('.not("party_b_signed_at", "is", null)');

    expect(code).toContain("resolveQualifyingHandshakeId(supabaseAdmin, { userId, brokerId })");
    expect(code).toContain("qualifying_handshake_id: qualifyingHandshakeId");
    expect(code).not.toMatch(/qualifying_handshake_id:\s*(?:body|validated)/);
  });

  it("keeps exactly one definition of a qualifying connection", () => {
    const code = readCode();
    // The route must not re-derive the rule it delegates. A second copy here
    // is how the panel starts inviting people the route then refuses.
    expect(code).not.toContain("deal_handshakes");
    expect(code).not.toContain('.from("deals")');
  });

  it("rejects a submission unless the completed handshake actually exists", () => {
    const code = readCode();
    expect(code).toMatch(/eligibility\.stage === "deals"[\s\S]*Could not verify your completed connection/);
    expect(code).toMatch(/if \(!qualifyingHandshakeId\)[\s\S]*complete the two-sided ScoutIt handshake/);

    const insert = code.indexOf('.from("broker_recommendations")');
    const refusal = code.indexOf("if (!qualifyingHandshakeId)");
    expect(refusal).toBeGreaterThan(-1);
    expect(refusal).toBeLessThan(insert);
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

  it("stores the validated satisfaction level in its constrained column", () => {
    const code = readCode();
    expect(code).toContain("satisfaction_level: validated.value.satisfactionLevel");
    expect(code).not.toMatch(/satisfaction_level:\s*body\./);
  });

  it("requires an existing deal before accepting a recommendation", () => {
    const code = readCode();
    const rule = readEligibilityCode();

    // Without this any account could write about any broker.
    expect(rule).toContain('.from("deals")');
    expect(rule).toContain('.eq("buyer_id", userId)');
    expect(code).toMatch(/if \(!eligibility\.hasDeal\)[\s\S]*worked with this advisor/);
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
