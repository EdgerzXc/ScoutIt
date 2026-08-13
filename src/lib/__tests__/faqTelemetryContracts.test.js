import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const faqRoute = readFileSync("src/app/api/faqs/route.js", "utf8");
const preflightRoute = readFileSync("src/app/api/faqs/preflight/route.js", "utf8");

describe("FAQ contact-leak telemetry route contract", () => {
  it("records controlled question and answer contexts", () => {
    expect(faqRoute).toContain('recordBlockedFaq(leak.code, "public_question")');
    expect(faqRoute).toContain('recordBlockedFaq(leak.code, "public_answer")');
  });

  it("records the owner preflight context", () => {
    expect(preflightRoute).toContain('context: "owner_preflight_answer"');
    expect(preflightRoute).toContain("ruleCode: leak.code");
  });

  it("never passes the rejected text into telemetry", () => {
    expect(faqRoute).not.toMatch(/recordBlockedFaq\((?:answer|question|body|text)/);
    const call = preflightRoute.match(
      /recordFaqContactLeakTelemetry\(supabaseAdmin, \{([\s\S]*?)\}\);/,
    );
    expect(call?.[1]).toBeTruthy();
    expect(call[1]).not.toMatch(/\b(?:answer|question|text|body)\s*:/);
  });
});
