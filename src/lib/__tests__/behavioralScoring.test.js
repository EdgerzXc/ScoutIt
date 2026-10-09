import { describe, it, expect } from "vitest";
import {
  EVALUATION_VECTORS,
  VECTOR_WEIGHTS,
  TRUST_TIERS,
  isValidVectorRatings,
  calculateReviewCompositeScore,
  resolveTrustTier,
  computeUserTrustCredential,
  validateReviewAuthority,
} from "../scoring/behavioralScoring";

describe("A-182: Behavioral Scoring Engine", () => {
  describe("isValidVectorRatings & calculateReviewCompositeScore", () => {
    it("validates that all four vectors are within 1-5 numerical scale", () => {
      const validVectors = {
        [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 5,
        [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 4,
        [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 5,
        [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 4,
      };
      expect(isValidVectorRatings(validVectors)).toBe(true);

      expect(isValidVectorRatings({ ...validVectors, [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 6 })).toBe(false);
      expect(isValidVectorRatings({ ...validVectors, [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 0 })).toBe(false);
      expect(isValidVectorRatings({ ...validVectors, [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: "5" })).toBe(false);
      expect(isValidVectorRatings(null)).toBe(false);
    });

    it("calculates weighted composite score accurately", () => {
      // All 5s = 100.00
      const perfectVectors = {
        [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 5,
        [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 5,
        [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 5,
        [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 5,
      };
      expect(calculateReviewCompositeScore(perfectVectors)).toBe(100);

      // All 1s = 20.00
      const lowestVectors = {
        [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 1,
        [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 1,
        [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 1,
        [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 1,
      };
      expect(calculateReviewCompositeScore(lowestVectors)).toBe(20);

      // Weighted calculation:
      // payment (5) * 0.35 = 1.75
      // space_care (4) * 0.25 = 1.00
      // communication (4) * 0.20 = 0.80
      // covenant (5) * 0.20 = 1.00
      // sum = 4.55 / 5 * 100 = 91.00
      const mixedVectors = {
        [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 5,
        [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 4,
        [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 4,
        [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 5,
      };
      expect(calculateReviewCompositeScore(mixedVectors)).toBe(91);
    });
  });

  describe("resolveTrustTier", () => {
    it("maps scores to luxury trust tiers", () => {
      expect(resolveTrustTier(95).id).toBe(TRUST_TIERS.SOVEREIGN.id);
      expect(resolveTrustTier(90).id).toBe(TRUST_TIERS.SOVEREIGN.id);
      expect(resolveTrustTier(85).id).toBe(TRUST_TIERS.ESTEEMED.id);
      expect(resolveTrustTier(75).id).toBe(TRUST_TIERS.VERIFIED.id);
      expect(resolveTrustTier(65).id).toBe(TRUST_TIERS.STANDARD.id);
      expect(resolveTrustTier(null).id).toBe(TRUST_TIERS.HONEST_BLANK.id);
    });
  });

  describe("computeUserTrustCredential — Honest Blank Rule", () => {
    it("strictly enforces Honest Blank Rule for zero-transaction / cold-start users", () => {
      const coldStart = computeUserTrustCredential({
        transactionCount: 0,
        reviews: [],
        isKycVerified: true,
      });

      expect(coldStart.isHonestBlank).toBe(true);
      expect(coldStart.compositeScore).toBe(null);
      expect(coldStart.displayBadge).toBe("[First-Time Verified Seeker]");
      expect(coldStart.tier).toBe(TRUST_TIERS.HONEST_BLANK.id);
      expect(coldStart.vectorAverages).toBe(null);
      expect(coldStart.isKycVerified).toBe(true);
    });

    it("quarantines reviews under dispute or double-blind lock from affecting score", () => {
      const reviews = [
        {
          id: "rev-1",
          vectors: {
            [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 5,
            [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 5,
            [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 5,
            [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 5,
          },
        },
        {
          id: "rev-disputed",
          is_disputed: true,
          vectors: {
            [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 1,
            [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 1,
            [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 1,
            [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 1,
          },
        },
        {
          id: "rev-locked",
          is_double_blind_locked: true,
          vectors: {
            [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 1,
            [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 1,
            [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 1,
            [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 1,
          },
        },
      ];

      const cred = computeUserTrustCredential({
        transactionCount: 1,
        reviews,
      });

      expect(cred.isHonestBlank).toBe(false);
      expect(cred.eligibleReviewCount).toBe(1);
      expect(cred.compositeScore).toBe(100);
      expect(cred.tier).toBe(TRUST_TIERS.SOVEREIGN.id);
    });

    it("aggregates vector averages across multiple unlocked reviews", () => {
      const reviews = [
        {
          id: "rev-1",
          vectors: {
            [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 5,
            [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 5,
            [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 4,
            [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 4,
          },
        },
        {
          id: "rev-2",
          vectors: {
            [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 4,
            [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 4,
            [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 4,
            [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 4,
          },
        },
      ];

      const cred = computeUserTrustCredential({
        transactionCount: 2,
        reviews,
      });

      expect(cred.eligibleReviewCount).toBe(2);
      expect(cred.vectorAverages[EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]).toBe(4.5);
      expect(cred.vectorAverages[EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]).toBe(4.5);
      expect(cred.vectorAverages[EVALUATION_VECTORS.COMMUNICATION_CONDUCT]).toBe(4.0);
    });
  });

  describe("validateReviewAuthority — Anti-Self-Dealing & Handshake Gating", () => {
    const validHandshake = {
      id: "hs-123",
      status: "completed",
      party_a_user_id: "user-owner",
      party_b_user_id: "user-tenant",
      party_a_signed_at: "2026-10-01T10:00:00Z",
      party_b_signed_at: "2026-10-01T11:00:00Z",
    };

    it("allows valid review between counterparties on a completed handshake", () => {
      const result = validateReviewAuthority({
        reviewerId: "user-owner",
        targetUserId: "user-tenant",
        qualifyingHandshakeId: "hs-123",
        handshake: validHandshake,
      });
      expect(result.valid).toBe(true);
    });

    it("strictly prohibits self-dealing / reviewing oneself", () => {
      const result = validateReviewAuthority({
        reviewerId: "user-owner",
        targetUserId: "user-owner",
        qualifyingHandshakeId: "hs-123",
        handshake: validHandshake,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("SELF_DEALING_PROHIBITED");
    });

    it("rejects review if handshake is incomplete / unsigned", () => {
      const pendingHandshake = {
        ...validHandshake,
        status: "pending",
        party_b_signed_at: null,
      };
      const result = validateReviewAuthority({
        reviewerId: "user-owner",
        targetUserId: "user-tenant",
        qualifyingHandshakeId: "hs-123",
        handshake: pendingHandshake,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("HANDSHAKE_INCOMPLETE");
    });

    it("rejects third-party strangers who were not party to the handshake", () => {
      const result = validateReviewAuthority({
        reviewerId: "user-intruder",
        targetUserId: "user-tenant",
        qualifyingHandshakeId: "hs-123",
        handshake: validHandshake,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("PARTY_MISMATCH");
    });
  });
});
