import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─────────────────────────────────────────────────────────────────────────
// A-038 — the invitation surface and the endpoint that gates it.
//
// Source assertions, not render tests. This repo writes JSX in `.js` files,
// which the pipeline vitest runs on will not parse, so no component here can
// be rendered — the same limit A-016 recorded. The behavioural half of this
// feature is covered in brokerRecommendationEligibility.test.js; what remains
// to guard is the set of properties a reviewer cannot see by running it:
// that the panel never decides verification, never blocks, and asks the same
// question the route answers.
// ─────────────────────────────────────────────────────────────────────────

const PANEL = "src/components/dashboard/RecommendationInvitation.js";
const ROUTE = "src/app/api/broker/recommendations/eligibility/route.js";
const BUYER = "src/components/dashboard/BuyerMode.js";

const readSource = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const readCode = (path) =>
  readSource(path)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("A-038 recommendation invitation panel", () => {
  it("closes Rule 13 — the submission endpoint finally has a caller", () => {
    const code = readCode(PANEL);
    expect(code).toContain('const ENDPOINT = "/api/broker/recommendations"');
    expect(code).toMatch(/fetch\(ENDPOINT, \{[\s\S]*method: "POST"/);
  });

  it("sends only the keys the validator accepts", () => {
    const code = readCode(PANEL);
    const payload = code.slice(code.indexOf("body: JSON.stringify({"));
    const submitted = payload.slice(0, payload.indexOf("}),"));

    // The validator rejects unknown keys rather than stripping them, so an
    // extra field here fails every submission rather than being ignored.
    for (const key of [
      "brokerId",
      "satisfactionLevel",
      "body",
      "attributionMode",
      "authorDisplayName",
      "relationshipType",
      "consentGranted",
    ]) {
      expect(submitted).toContain(key);
    }

    // The three values the server decides must never appear in a request body.
    expect(submitted).not.toContain("moderationState");
    expect(submitted).not.toContain("qualifyingHandshakeId");
    expect(submitted).not.toContain("verified");
  });

  it("takes consent as an explicit checkbox, never a default", () => {
    const code = readCode(PANEL);
    expect(code).toContain("useState(false)");
    expect(code).toContain('type="checkbox"');
    // Consent gates the submit button, not merely the copy beside it.
    expect(code).toMatch(/canSubmit\s*=[\s\S]*consentGranted/);
    expect(code).toContain("disabled={!canSubmit}");
  });

  it("requires a satisfaction level and an attribution choice before sending", () => {
    const code = readCode(PANEL);
    expect(code).toMatch(/canSubmit\s*=[\s\S]*level && attributionMode/);
  });

  it("offers all four attribution modes and all four satisfaction levels", () => {
    const code = readCode(PANEL);
    expect(code).toContain("ATTRIBUTION_MODES.FULL_NAME");
    expect(code).toContain("ATTRIBUTION_MODES.INITIALS");
    expect(code).toContain("ATTRIBUTION_MODES.ROLE_ONLY");
    expect(code).toContain("ATTRIBUTION_MODES.ANONYMOUS");
    // The levels come from the shared constant so the panel cannot offer a
    // fifth face the database's constraint would reject.
    expect(code).toContain("SATISFACTION_LEVELS.map");
  });

  it("is an invitation: dismissible, and never a modal or a blocker", () => {
    const code = readCode(PANEL);
    expect(code).toContain("onDismiss");
    expect(code).toContain("persistDismissed");
    // Nothing here may trap focus or cover the page.
    expect(code).not.toContain("role=\"dialog\"");
    expect(code).not.toContain("aria-modal");
    expect(code).not.toMatch(/\bfixed inset-0\b/);
  });

  it("renders nothing when there is nothing to ask about, or when the check failed", () => {
    const code = readCode(PANEL);
    expect(code).toMatch(/if \(state\.status === "error" \|\| !visible\.length\) return null/);
  });

  it("ships all four states", () => {
    const code = readCode(PANEL);
    expect(code).toContain('status: "loading"');
    expect(code).toContain('status: "error"');
    expect(code).toContain('status: "saving"');
    expect(code).toContain('status: "sent"');
  });

  it("labels the connection honestly and shows no star or average", () => {
    const source = readSource(PANEL);
    expect(source).toContain("Verified ScoutIt connection");
    expect(source).not.toMatch(/aggregateRating|★|averageRating/);
  });

  it("never claims the submission is published", () => {
    const source = readSource(PANEL);
    // The fallback copy for a success with no server message must still say
    // review comes first.
    expect(source).toMatch(/review before it appears/);
    expect(source).not.toMatch(/now live|published to their page/i);
  });

  it("survives localStorage being unavailable", () => {
    const code = readCode(PANEL);
    expect(code).toMatch(/function readDismissed\(\)[\s\S]*catch \{[\s\S]*return \[\]/);
    expect(code).toMatch(/function persistDismissed\([\s\S]*catch \{/);
  });

  it("is reachable from the buyer dashboard", () => {
    const code = readCode(BUYER);
    expect(code).toContain('import RecommendationInvitation from "./RecommendationInvitation"');
    expect(code).toContain("<RecommendationInvitation />");
  });
});

describe("A-038 eligibility endpoint", () => {
  it("is authenticated and private", () => {
    const code = readCode(ROUTE);
    expect(code).toContain("resolveUserId(request)");
    expect(code).toMatch(/if \(!userId\) return json\(\{ error: "Unauthorized" \}, 401\)/);
    expect(code).toContain('"Cache-Control": "private, no-store"');
  });

  it("asks the same qualification question the submission route answers", () => {
    const code = readCode(ROUTE);
    expect(code).toContain("listRecommendationOpportunities(supabaseAdmin, { userId })");
    // No second copy of the rule.
    expect(code).not.toContain("deal_handshakes");
    expect(code).not.toContain('.from("deals")');
  });

  it("never hands the client the handshake id", () => {
    const code = readCode(ROUTE);
    const payload = code.slice(code.indexOf("return {"), code.indexOf("})\n      .filter"));
    expect(payload).not.toContain("handshakeId");
  });

  it("takes advisor identity from Airtable, per the dual-CMS boundary", () => {
    const code = readCode(ROUTE);
    expect(code).toContain("getCmsBundle()");
    expect(code).toContain("publicBrokerIdentity(findPublicBroker(brokers, opportunity.brokerId))");
    // An advisor with no public dossier is dropped, not shown as a raw UUID.
    expect(code).toContain("if (!identity) return null");
  });

  it("withholds invitations until the satisfaction column actually exists", () => {
    // 20260831000001_broker_satisfaction_signal.sql is owner-gated under W-003.
    // Inviting before it is applied means the client writes something the
    // database then refuses.
    const rule = readCode("src/lib/brokerRecommendationEligibility.js");
    expect(rule).toMatch(
      /if \(!\(await isSatisfactionSignalReady\(client\)\)\)[\s\S]*signalReady: false/,
    );

    const submission = readCode("src/app/api/broker/recommendations/route.js");
    expect(submission).toMatch(
      /if \(!\(await isSatisfactionSignalReady\(supabaseAdmin\)\)\)[\s\S]*Nothing was saved/,
    );
  });

  it("checks the capability before reading the submitted words", () => {
    const submission = readCode("src/app/api/broker/recommendations/route.js");
    const gate = submission.indexOf("isSatisfactionSignalReady(supabaseAdmin)");
    const validate = submission.indexOf("validateRecommendationSubmission(body)");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(validate);
  });

  it("answers an empty list rather than an error when nothing qualifies", () => {
    const code = readCode(ROUTE);
    expect(code).toMatch(/if \(!result\.opportunities\.length\) return json\(\{ invitations: \[\] \}\)/);
  });

  it("never leaks a raw database error", () => {
    const code = readCode(ROUTE);
    expect(code).toContain("sanitizeError(error)");
    expect(code).toMatch(/if \(!result\.ok\) return json\(\{ error: "Could not check your connections" \}, 503\)/);
  });
});
