import { describe, it, expect } from "vitest";
import {
  PASSPORT_SCOPES,
  anonymizeReviewEndorsement,
  generateResidentPassport,
} from "../scoring/residentPassport";
import { EVALUATION_VECTORS, TRUST_TIERS } from "../scoring/behavioralScoring";

describe("A-182: Private Resident Passport Engine (RA 10173)", () => {
  const mockProfile = {
    id: "user-seeker-77",
    full_name: "Atty. Juan Dela Cruz",
    kyc_verified: true,
    created_at: "2024-05-15T00:00:00Z",
  };

  const sampleReviews = [
    {
      id: "rev-uuid-12345678",
      property_category: "Commercial Office",
      city_hub: "BGC, Taguig",
      duration_months: 24,
      completed_at: "2026-08-01T00:00:00Z",
      feedback: "Impeccable lease compliance and punctuality.",
      vectors: {
        [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 5,
        [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 5,
        [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 5,
        [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 5,
      },
    },
    {
      id: "rev-uuid-87654321",
      property_category: "Residential Penthouse",
      city_hub: "Makati CBD",
      duration_months: 12,
      completed_at: "2025-06-01T00:00:00Z",
      feedback: "Quiet and respectful resident.",
      vectors: {
        [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 5,
        [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 4,
        [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 5,
        [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 5,
      },
    },
  ];

  describe("anonymizeReviewEndorsement", () => {
    it("anonymizes endorsement details to prevent doxxing past landlords or addresses", () => {
      const endorsement = anonymizeReviewEndorsement(sampleReviews[0]);

      expect(endorsement.endorsementId).toBe("rev-uuid");
      expect(endorsement.leaseType).toBe("Commercial Office");
      expect(endorsement.cityHub).toBe("BGC, Taguig");
      expect(endorsement.tenancyDurationMonths).toBe(24);
      expect(endorsement.hasFeedbackNote).toBe(true);
      // Ensures raw feedback string or landlord identity is not leaked in the summary endorsement
      expect(endorsement.feedback).toBeUndefined();
      expect(endorsement.reviewer_id).toBeUndefined();
      expect(endorsement.landlord_name).toBeUndefined();
    });
  });

  describe("generateResidentPassport — Scoped Disclosure", () => {
    it("returns minimal badge & transactions in PUBLIC_SUMMARY scope (no private score or comments)", () => {
      const passport = generateResidentPassport({
        userProfile: mockProfile,
        transactionCount: 2,
        reviews: sampleReviews,
        scope: PASSPORT_SCOPES.PUBLIC_SUMMARY,
      });

      expect(passport.scope).toBe(PASSPORT_SCOPES.PUBLIC_SUMMARY);
      expect(passport.displayBadge).toBe("[Sovereign Resident]");
      expect(passport.isHonestBlank).toBe(false);
      expect(passport.verifiedTransactions).toBe(2);
      expect(passport.isKycVerified).toBe(true);

      // Private vectors and composite score are omitted in public summary
      expect(passport.compositeScore).toBe(null);
      expect(passport.vectorBreakdown).toBe(null);
      expect(passport.endorsements).toBe(null);
    });

    it("returns detailed vector breakdown and anonymized endorsements in CONSENTED_APPLICATION scope", () => {
      const passport = generateResidentPassport({
        userProfile: mockProfile,
        transactionCount: 2,
        reviews: sampleReviews,
        scope: PASSPORT_SCOPES.CONSENTED_APPLICATION,
        consentedTargetDealId: "deal-office-99",
      });

      expect(passport.scope).toBe(PASSPORT_SCOPES.CONSENTED_APPLICATION);
      expect(passport.consentedDealId).toBe("deal-office-99");
      expect(passport.compositeScore).toBeGreaterThanOrEqual(95);
      expect(passport.vectorBreakdown[EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]).toBe(5);
      expect(passport.endorsements.length).toBe(2);
      expect(passport.endorsements[0].cityHub).toBe("BGC, Taguig");
      expect(passport.privacyNotice).toContain("RA 10173");
    });

    it("returns [First-Time Verified Seeker] credential for cold-start users in both scopes", () => {
      const coldPassport = generateResidentPassport({
        userProfile: mockProfile,
        transactionCount: 0,
        reviews: [],
        scope: PASSPORT_SCOPES.CONSENTED_APPLICATION,
      });

      expect(coldPassport.isHonestBlank).toBe(true);
      expect(coldPassport.displayBadge).toBe("[First-Time Verified Seeker]");
      expect(coldPassport.compositeScore).toBe(null);
      expect(coldPassport.endorsements).toEqual([]);
    });
  });
});
