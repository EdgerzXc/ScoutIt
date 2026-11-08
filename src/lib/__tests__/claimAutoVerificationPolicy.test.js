import { describe, it, expect } from "vitest";
import {
  normalizePersonName,
  calculateNameMatchConfidence,
  evaluateClaimAutoVerification,
  PRIMARY_TITLE_DOC_TYPES,
  REPRESENTATIVE_DOC_TYPES,
  PROVISIONAL_DISPUTE_WINDOW_HOURS,
} from "../claimAutoVerificationPolicy.mjs";

describe("Claim Auto-Verification Policy — 4 Safety Guardrails", () => {
  const MOCK_PROPERTY = {
    id: "prop-alpha-123",
    title: "High Street Corporate Center Suite 15A",
    owner_id: "prior-broker-456",
    verified: false,
    lister_relationship: "authorized_broker",
  };

  const MOCK_PROFILE = {
    id: "user-owner-789",
    full_name: "Juan Mercado Dela Cruz",
    display_name: "Juan Dela Cruz",
    role: "owner",
    active_roles: ["owner"],
  };

  const MOCK_DOCS = [
    {
      documentType: "transfer_certificate_of_title",
      storagePath: "user-owner-789/claims/tct-123456.pdf",
    },
  ];

  const MOCK_OCR_CLEAN = {
    registeredOwner: "JUAN MERCADO DELA CRUZ",
    titleNumber: "TCT-123456",
    lotNumber: "Lot 15-A",
    city: "Taguig",
  };

  describe("Name Normalization & Matching Engine", () => {
    it("handles exact Filipino names regardless of case and punctuation", () => {
      const match = calculateNameMatchConfidence("Juan Dela Cruz", "JUAN DELA CRUZ");
      expect(match.confidence).toBe(1.0);
      expect(match.matchType).toBe("exact");
    });

    it("handles transposed Filipino name ordering (Last, First)", () => {
      const match = calculateNameMatchConfidence("DELA CRUZ, JUAN", "JUAN DELA CRUZ");
      expect(match.confidence).toBe(1.0);
      expect(match.matchType).toBe("transposed_exact");
    });

    it("strips common professional prefixes and generational suffixes", () => {
      const match = calculateNameMatchConfidence("Atty. Juan Dela Cruz Jr.", "JUAN DELA CRUZ");
      expect(match.confidence).toBe(1.0);
    });

    it("flags middle name discrepancy as < 98% requiring human verification", () => {
      const match = calculateNameMatchConfidence("Juan Dela Cruz", "Juan Mercado Dela Cruz");
      expect(match.confidence).toBeLessThan(0.98);
      expect(match.matchType).toBe("middle_name_variant");
    });

    it("fails completely different names with low confidence", () => {
      const match = calculateNameMatchConfidence("Juan Dela Cruz", "Maria Clara Santos");
      expect(match.confidence).toBeLessThan(0.5);
    });
  });

  describe("Guardrail 1: Direct Registered Owner Requirement", () => {
    it("rejects represented broker claims from auto-verification", () => {
      const result = evaluateClaimAutoVerification({
        property: MOCK_PROPERTY,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "authorized_broker",
        documents: MOCK_DOCS,
        ocrData: MOCK_OCR_CLEAN,
        agreed: true,
      });

      expect(result.canAutoVerify).toBe(false);
      expect(result.reasonCode).toBe("represented_claim_requires_staff");
    });

    it("rejects property manager claims from auto-verification", () => {
      const result = evaluateClaimAutoVerification({
        property: MOCK_PROPERTY,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "property_manager",
        documents: MOCK_DOCS,
        ocrData: MOCK_OCR_CLEAN,
        agreed: true,
      });

      expect(result.canAutoVerify).toBe(false);
      expect(result.reasonCode).toBe("represented_claim_requires_staff");
    });

    it("rejects claims with Special Power of Attorney (SPA) documents attached", () => {
      const docsWithSpa = [
        ...MOCK_DOCS,
        { documentType: "special_power_of_attorney", storagePath: "spa.pdf" },
      ];

      const result = evaluateClaimAutoVerification({
        property: MOCK_PROPERTY,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "owner",
        documents: docsWithSpa,
        ocrData: MOCK_OCR_CLEAN,
        agreed: true,
      });

      expect(result.canAutoVerify).toBe(false);
      expect(result.reasonCode).toBe("representative_document_present");
    });
  });

  describe("Guardrail 2: Primary Land Title Document Requirement", () => {
    it("rejects claims lacking a TCT or CCT primary document", () => {
      const taxDecOnly = [
        { documentType: "tax_declaration", storagePath: "tax-dec.pdf" },
      ];

      const result = evaluateClaimAutoVerification({
        property: MOCK_PROPERTY,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "owner",
        documents: taxDecOnly,
        ocrData: MOCK_OCR_CLEAN,
        agreed: true,
      });

      expect(result.canAutoVerify).toBe(false);
      expect(result.reasonCode).toBe("missing_primary_title");
    });
  });

  describe("Guardrail 3: Zero-Contest Conflict Lock", () => {
    it("rejects auto-verification if property owner is already verified", () => {
      const alreadyVerifiedProp = { ...MOCK_PROPERTY, verified: true };

      const result = evaluateClaimAutoVerification({
        property: alreadyVerifiedProp,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "owner",
        documents: MOCK_DOCS,
        ocrData: MOCK_OCR_CLEAN,
        agreed: true,
      });

      expect(result.canAutoVerify).toBe(false);
      expect(result.reasonCode).toBe("property_already_verified");
    });

    it("rejects auto-verification if a competing claim is active on the listing", () => {
      const competingClaims = [
        {
          id: "claim-competing-999",
          claimant_user_id: "other-user-333",
          status: "submitted",
        },
      ];

      const result = evaluateClaimAutoVerification({
        property: MOCK_PROPERTY,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "owner",
        documents: MOCK_DOCS,
        existingClaims: competingClaims,
        ocrData: MOCK_OCR_CLEAN,
        agreed: true,
      });

      expect(result.canAutoVerify).toBe(false);
      expect(result.reasonCode).toBe("competing_claim_active");
    });

    it("rejects auto-verification if commercial deals/handshakes are actively open", () => {
      const activeDeals = [{ id: "deal-live-888", status: "handshake_pending" }];

      const result = evaluateClaimAutoVerification({
        property: MOCK_PROPERTY,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "owner",
        documents: MOCK_DOCS,
        activeDeals,
        ocrData: MOCK_OCR_CLEAN,
        agreed: true,
      });

      expect(result.canAutoVerify).toBe(false);
      expect(result.reasonCode).toBe("active_deal_in_progress");
    });
  });

  describe("Guardrail 4: Identity & Name Matching", () => {
    it("rejects when OCR text is missing or pending", () => {
      const result = evaluateClaimAutoVerification({
        property: MOCK_PROPERTY,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "owner",
        documents: MOCK_DOCS,
        ocrData: null,
        agreed: true,
      });

      expect(result.canAutoVerify).toBe(false);
      expect(result.reasonCode).toBe("ocr_title_data_pending");
    });

    it("rejects when claimant name does not match Title owner name", () => {
      const mismatchedOcr = {
        registeredOwner: "DON PEDRO VALDEZ",
        titleNumber: "TCT-123456",
      };

      const result = evaluateClaimAutoVerification({
        property: MOCK_PROPERTY,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "owner",
        documents: MOCK_DOCS,
        ocrData: mismatchedOcr,
        agreed: true,
      });

      expect(result.canAutoVerify).toBe(false);
      expect(result.reasonCode).toBe("name_match_insufficient");
    });
  });

  describe("Guardrail 0: Legal Declaration Agreement", () => {
    it("rejects when legal disclaimer affidavit is not accepted", () => {
      const result = evaluateClaimAutoVerification({
        property: MOCK_PROPERTY,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "owner",
        documents: MOCK_DOCS,
        ocrData: MOCK_OCR_CLEAN,
        agreed: false,
      });

      expect(result.canAutoVerify).toBe(false);
      expect(result.reasonCode).toBe("declaration_not_accepted");
    });
  });

  describe("Successful Auto-Verification (All Guardrails Passed)", () => {
    it("successfully approves a clean direct-owner Land Title with 72-hour provisional window", () => {
      const result = evaluateClaimAutoVerification({
        property: MOCK_PROPERTY,
        claimantProfile: MOCK_PROFILE,
        claimedRelationship: "owner",
        documents: MOCK_DOCS,
        ocrData: MOCK_OCR_CLEAN,
        agreed: true,
      });

      expect(result.canAutoVerify).toBe(true);
      expect(result.provisional).toBe(true);
      expect(result.provisionalWindowHours).toBe(72);
      expect(result.confidence).toBe(1.0);
      expect(result.titleNumber).toBe("TCT-123456");
      expect(result.reason).toContain("Clean Land Title auto-verification passed");
    });
  });
});
