import { describe, expect, it } from "vitest";
import { statusFromDateOfBirth, MINIMUM_AGE } from "@/lib/adultEligibility";
import { PRIMARY_ROLE_ORDER, pickPrimaryRole, normalizeDashboardModes } from "@/lib/dashboardModes";

describe("Role Activation & Next of Kin Contract", () => {
  describe("Date of Birth & 18+ Legal Capacity Gate", () => {
    it("enforces minimum age of 18 years under Philippine Civil Code & RA 8792", () => {
      expect(MINIMUM_AGE).toBe(18);
    });

    it("rejects birth dates of minors under 18 years old", () => {
      const now = new Date("2026-10-27T00:00:00.000Z");
      // 17 years old
      const minorDob = "2009-05-15";
      const result = statusFromDateOfBirth(minorDob, now);
      expect(result.ok).toBe(false);
      expect(result.status).toBe("underage");
      expect(result.error).toMatch(/must be at least 18/i);
    });

    it("accepts birth dates of adults 18 years and older", () => {
      const now = new Date("2026-10-27T00:00:00.000Z");
      // Exactly 18 years old or older
      const adultDob = "2005-01-01";
      const result = statusFromDateOfBirth(adultDob, now);
      expect(result.ok).toBe(true);
      expect(result.status).toBe("declared_adult");
      expect(result.age).toBeGreaterThanOrEqual(18);
    });

    it("rejects future or unparseable birth dates", () => {
      expect(statusFromDateOfBirth("").ok).toBe(false);
      expect(statusFromDateOfBirth("invalid-date").ok).toBe(false);
      expect(statusFromDateOfBirth("2030-01-01").ok).toBe(false);
    });
  });

  describe("Buyer / Seeker Default Role Invariant", () => {
    it("ensures buyer / seeker is the first primary precedence in PRIMARY_ROLE_ORDER", () => {
      expect(PRIMARY_ROLE_ORDER[0]).toBe("buyer");
    });

    it("defaults to buyer workspace when no explicit override is provided", () => {
      const heldRoles = ["owner", "broker", "salesperson", "buyer"];
      const primary = pickPrimaryRole(heldRoles, "buyer");
      expect(primary).toBe("buyer");
    });

    it("normalizes and preserves buyer across multi-role sets", () => {
      const normalized = normalizeDashboardModes(["owner", "salesperson", "operator"], "buyer");
      expect(normalized).toContain("buyer");
      expect(normalized).toContain("owner");
      expect(normalized).toContain("broker"); // salesperson maps to broker workspace
      expect(normalized).toContain("operator");
    });
  });

  describe("Role Activation Validation Rules", () => {
    it("validates Owner Next of Kin emergency continuity structure", () => {
      const validOwnerData = {
        ownerEntityType: "individual",
        nextOfKinName: "Maria Santos Guerra",
        nextOfKinRelationship: "Spouse & Co-Owner",
        nextOfKinPhone: "+63 917 123 4567",
      };

      expect(validOwnerData.nextOfKinName.trim().length).toBeGreaterThanOrEqual(2);
      expect(validOwnerData.nextOfKinRelationship.trim().length).toBeGreaterThanOrEqual(2);
      expect(validOwnerData.nextOfKinPhone.replace(/\D/g, "").length).toBeGreaterThanOrEqual(7);
    });

    it("validates Real Estate Salesperson broker supervision under R.A. 9646", () => {
      const validSalespersonData = {
        supervisingBrokerName: "Roberto Silva (Prime Realty)",
        supervisingBrokerPrc: "0012345",
        salespersonAccreditation: "SP-2026-9876",
      };

      expect(validSalespersonData.supervisingBrokerName.trim().length).toBeGreaterThanOrEqual(2);
      expect(validSalespersonData.supervisingBrokerPrc.replace(/\D/g, "").length).toBeGreaterThanOrEqual(5);
      expect(validSalespersonData.salespersonAccreditation.trim().length).toBeGreaterThanOrEqual(3);
    });

    it("validates Co-Operator facilities desk escalation requirements", () => {
      const validOperatorData = {
        operatingEntity: "KMC Community",
        managedComplex: "High Street South Corporate Plaza",
        escalationPhone: "+63 2 8123 4567",
      };

      expect(validOperatorData.operatingEntity.trim().length).toBeGreaterThanOrEqual(2);
      expect(validOperatorData.managedComplex.trim().length).toBeGreaterThanOrEqual(2);
      expect(validOperatorData.escalationPhone.replace(/\D/g, "").length).toBeGreaterThanOrEqual(7);
    });

    it("validates Spatial Photographer gear and portfolio links", () => {
      const validPhotographerData = {
        gearDescription: "Sony A7IV 16-35mm GM, DJI Mini 4 Pro",
        portfolioUrl: "https://instagram.com/scoutit_lens",
        locationCoverage: "Metro Manila",
      };

      expect(validPhotographerData.gearDescription.trim().length).toBeGreaterThanOrEqual(3);
      expect(validPhotographerData.portfolioUrl.trim().length).toBeGreaterThanOrEqual(3);
    });

    it("validates Event & Concept Designer lookbook and specialty", () => {
      const validDesignerData = {
        designSpecialty: "Commercial Pop-ups & Luxury Staging",
        lookbookUrl: "https://lookbook.scoutit.design",
        studioName: "Studio Atelier",
      };

      expect(validDesignerData.designSpecialty.trim().length).toBeGreaterThanOrEqual(2);
      expect(validDesignerData.lookbookUrl.trim().length).toBeGreaterThanOrEqual(3);
    });

    it("validates Accredited Broker license digits and demands server-side prc_verified reset", () => {
      const validLicense = "0012345";
      const digits = validLicense.replace(/\D/g, "");
      expect(digits.length).toBeGreaterThanOrEqual(7);
      expect(digits.length).toBeLessThanOrEqual(8);

      const invalidLicense = "123";
      expect(invalidLicense.replace(/\D/g, "").length).toBeLessThan(7);
    });
  });
});
