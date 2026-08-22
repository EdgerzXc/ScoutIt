import { describe, expect, it } from "vitest";
import {
  CURRENT_TERMS_SNAPSHOT_HASH,
  CURRENT_TERMS_VERSION,
  isCurrentTermsAcceptance,
  legalAcceptanceEvidence,
} from "@/lib/legalAcceptance";

describe("legal acceptance contract", () => {
  it("accepts only the exact published pilot version", () => {
    expect(isCurrentTermsAcceptance(CURRENT_TERMS_VERSION)).toBe(true);
    expect(isCurrentTermsAcceptance(null)).toBe(false);
    expect(isCurrentTermsAcceptance("pilot-older")).toBe(false);
  });

  it("derives bounded evidence on the server", () => {
    const request = new Request("https://scoutit.space/api/auth/complete-onboarding", {
      headers: { "user-agent": "test-browser".repeat(100) },
    });
    const evidence = legalAcceptanceEvidence(request);

    expect(evidence.acceptance_method).toBe("onboarding_explicit_checkbox");
    expect(evidence.terms_snapshot_hash).toBe(CURRENT_TERMS_SNAPSHOT_HASH);
    expect(evidence.terms_snapshot_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.user_agent.length).toBeLessThanOrEqual(512);
  });
});
