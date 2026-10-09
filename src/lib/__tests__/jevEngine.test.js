import { describe, it, expect } from "vitest";
import {
  JEV_INTENTS,
  CANONICAL_POLICIES,
  classifyIntent,
  parsePolicyQuestion,
  compileSupabaseQuery,
  compileAirtableFormula,
  compileSpatialFilter,
  compileConciergePreflight,
  lintResaCompliance,
  processJevQuery,
} from "../ai/jevEngine.js";

describe("Jev Deterministic AI Engine (SLM Architecture)", () => {
  describe("Intent Classification", () => {
    it("classifies RESA compliance checks", () => {
      expect(classifyIntent("Please do a compliance check for this listing")).toBe(
        JEV_INTENTS.COMPLIANCE_LINT_RESA
      );
      expect(classifyIntent("verify resa ra 9646 rules")).toBe(
        JEV_INTENTS.COMPLIANCE_LINT_RESA
      );
    });

    it("classifies Spatial GIS queries", () => {
      expect(classifyIntent("Check flood hazard and noah rating for Rockwell")).toBe(
        JEV_INTENTS.DATABASE_QUERY_SPATIAL
      );
      expect(classifyIntent("How close is the fault line to this building?")).toBe(
        JEV_INTENTS.DATABASE_QUERY_SPATIAL
      );
      expect(classifyIntent("Is this within 10 min walk to MRT or subway?")).toBe(
        JEV_INTENTS.DATABASE_QUERY_SPATIAL
      );
    });

    it("classifies internal canonical policy questions", () => {
      expect(classifyIntent("What is the dual-cms policy?")).toBe(
        JEV_INTENTS.INTERNAL_POLICY_RULE
      );
      expect(classifyIntent("Explain the honest blank cold start rule")).toBe(
        JEV_INTENTS.INTERNAL_POLICY_RULE
      );
      expect(classifyIntent("What does agent say about surface locks?")).toBe(
        JEV_INTENTS.INTERNAL_POLICY_RULE
      );
      expect(classifyIntent("How does double blind review work?")).toBe(
        JEV_INTENTS.INTERNAL_POLICY_RULE
      );
    });

    it("classifies private Supabase operational queries", () => {
      expect(classifyIntent("Show recent audit log actions in mission control")).toBe(
        JEV_INTENTS.DATABASE_QUERY_SUPABASE
      );
      expect(classifyIntent("Find deal status for accepted buyer inquiries")).toBe(
        JEV_INTENTS.DATABASE_QUERY_SUPABASE
      );
      expect(classifyIntent("List recent system events")).toBe(
        JEV_INTENTS.DATABASE_QUERY_SUPABASE
      );
    });

    it("classifies public Airtable catalog queries", () => {
      expect(classifyIntent("How many commercial spaces in BGC are published?")).toBe(
        JEV_INTENTS.DATABASE_QUERY_AIRTABLE
      );
      expect(classifyIntent("Show public listings with square meter above 150")).toBe(
        JEV_INTENTS.DATABASE_QUERY_AIRTABLE
      );
    });

    it("defaults seeker property searches to Concierge Preflight", () => {
      expect(classifyIntent("Looking for a 2BR condo in Makati under 80k")).toBe(
        JEV_INTENTS.CONCIERGE_PREFLIGHT
      );
    });
  });

  describe("Canonical Policy Vault (Zero Hallucination)", () => {
    it("answers Dual-CMS separation rule with exact verbatim citation", () => {
      const res = parsePolicyQuestion("What is the dual-cms rule for database writes?");
      expect(res.answered).toBe(true);
      expect(res.policyId).toBe("DUAL_CMS_INVARIANT");
      expect(res.ruleNumber).toBe("AGENTS §2");
      expect(res.doc).toContain("STRUCTURE.md");
      expect(res.citation).toContain("AGENTS §2");
      expect(res.verbatim).toContain("AIRTABLE = Public Read-Only Content");
      expect(res.verbatim).toContain("SUPABASE = Private User Data");
    });

    it("answers Honest Blank cold-start rule correctly", () => {
      const res = parsePolicyQuestion("How do we handle new seekers with zero reviews under honest blank?");
      expect(res.answered).toBe(true);
      expect(res.policyId).toBe("HONEST_BLANK_RULE");
      expect(res.summary).toContain("artificial 0%");
    });

    it("answers Surface Lock Gate rule", () => {
      const res = parsePolicyQuestion("Can an agent refresh surface lock checksums?");
      expect(res.answered).toBe(true);
      expect(res.policyId).toBe("SURFACE_LOCK_GATE");
      expect(res.doc).toBe("scripts/approved-surfaces.json");
    });

    it("answers Double-Blind reviews protocol", () => {
      const res = parsePolicyQuestion("What is the retaliation window for double-blind reviews?");
      expect(res.answered).toBe(true);
      expect(res.policyId).toBe("DOUBLE_BLIND_REVIEWS");
      expect(res.verbatim).toContain("14-day");
    });

    it("answers Data Privacy Act RA 10173 and Resident Passport rules", () => {
      const res = parsePolicyQuestion("Can ScoutIt create a public blacklist under data privacy act ra 10173?");
      expect(res.answered).toBe(true);
      expect(res.policyId).toBe("DATA_PRIVACY_ACT_RA10173");
      expect(res.verbatim).toContain("Public blacklist creation is strictly prohibited");
    });

    it("returns honest false when no canonical policy matches", () => {
      const res = parsePolicyQuestion("What is the recipe for chicken adobo?");
      expect(res.answered).toBe(false);
      expect(res.citation).toBeNull();
    });
  });

  describe("Supabase Query Compiler", () => {
    it("compiles deals query with accepted filter", () => {
      const compiled = compileSupabaseQuery("Find accepted deal status records");
      expect(compiled.target).toBe("supabase");
      expect(compiled.table).toBe("deals");
      expect(compiled.filters).toEqual([{ column: "status", op: "eq", value: "accepted" }]);
      expect(compiled.zeroEgress).toBe(true);
    });

    it("compiles mission control action log query", () => {
      const compiled = compileSupabaseQuery("Show recent audit log actions");
      expect(compiled.table).toBe("mission_control_actions");
    });

    it("compiles system events query", () => {
      const compiled = compileSupabaseQuery("Retrieve recent system events");
      expect(compiled.table).toBe("system_events");
    });
  });

  describe("Airtable Formula Compiler", () => {
    it("synthesizes category and city formula correctly", () => {
      const compiled = compileAirtableFormula("Commercial spaces in BGC");
      expect(compiled.target).toBe("airtable");
      expect(compiled.table).toBe("Properties");
      expect(compiled.formula).toContain("{SpaceCategory} = 'Commercial'");
      expect(compiled.formula).toContain("FIND('BGC', UPPER({City}))");
      expect(compiled.formula).toContain("{Status} = 'Published'");
    });

    it("synthesizes SQM area constraint correctly", () => {
      const compiled = compileAirtableFormula("Residential condos in Makati with at least 150 sqm");
      expect(compiled.formula).toContain("{SpaceCategory} = 'Residential'");
      expect(compiled.formula).toContain("FIND('MAKATI', UPPER({City}))");
      expect(compiled.formula).toContain("{Floor_Area_SQM} >= 150");
    });
  });

  describe("Spatial GIS Vault Compiler", () => {
    it("extracts flood ceiling, fault envelope, and PEZA requirements", () => {
      const spatial = compileSpatialFilter(
        "Find flood safe buildings in BGC with peza tax incentive near mrt train"
      );
      expect(spatial.target).toBe("spatial_vault");
      expect(spatial.district).toBe("BGC");
      expect(spatial.floodRiskCeiling).toBe("LOW");
      expect(spatial.requirePeza).toBe(true);
      expect(spatial.transitProximityMeters).toBe(800);
    });

    it("enforces 5km seismic fault line envelope when queried", () => {
      const spatial = compileSpatialFilter("Check seismic fault line proximity");
      expect(spatial.maxFaultDistanceMeters).toBe(5000);
    });
  });

  describe("Concierge Preflight Router (< 50ms)", () => {
    it("extracts structured parameters rapidly without external LLM calls", () => {
      const res = compileConciergePreflight("2BR condo in BGC under 80k/month near train");
      expect(res.category).toBe("Residential");
      expect(res.location).toBe("BGC, Taguig");
      expect(res.bedrooms).toBe(2);
      expect(res.maxBudget).toBe(80000);
      expect(res.budgetPeriod).toBe("monthly");
      expect(res.transitOriented).toBe(true);
      expect(res.preflightValid).toBe(true);
      expect(res.executionTimeMs).toBeLessThan(50);
    });

    it("handles STR nightly rates correctly", () => {
      const res = compileConciergePreflight("Short-term stay in Makati under 4.5k per night");
      expect(res.category).toBe("STR");
      expect(res.budgetPeriod).toBe("nightly");
      expect(res.maxBudget).toBe(4500);
      expect(res.preflightValid).toBe(true);
    });

    it("handles commercial million-peso purchase correctly", () => {
      const res = compileConciergePreflight("Office for sale in Ortigas up to 25M");
      expect(res.category).toBe("Commercial");
      expect(res.budgetPeriod).toBe("purchase");
      expect(res.maxBudget).toBe(25000000);
      expect(res.preflightValid).toBe(true);
    });
  });

  describe("RESA RA 9646 Compliance Linter", () => {
    it("passes compliant broker listing with 8-digit PRC license", () => {
      const audit = lintResaCompliance({
        prcLicense: "00123456",
        brokerage: "Apex Realty Partners",
        description: "Prime 3BR corner suite in Rockwell Center.",
      });
      expect(audit.compliant).toBe(true);
      expect(audit.prcVerified).toBe(true);
      expect(audit.violations).toHaveLength(0);
    });

    it("flags missing or invalid PRC license", () => {
      const audit = lintResaCompliance({
        prcLicense: "123", // invalid 3 digits
        brokerage: "Independent",
        description: "Spacious loft.",
      });
      expect(audit.compliant).toBe(false);
      expect(audit.prcVerified).toBe(false);
      expect(audit.violations[0]).toContain("Invalid PRC license length");
    });

    it("flags deceptive zero-commission and guaranteed yield claims", () => {
      const audit = lintResaCompliance({
        prcLicense: "12345678",
        brokerage: "Premier Brokerage",
        description: "Guaranteed 0% commission with guaranteed 15% return on investment!",
      });
      expect(audit.compliant).toBe(false);
      expect(audit.violations.some((v) => v.includes("0% commission"))).toBe(true);
      expect(audit.violations.some((v) => v.includes("guaranteed speculative investment yields"))).toBe(true);
    });
  });

  describe("Universal Jev Query Orchestrator", () => {
    it("orchestrates policy vault questions", () => {
      const outcome = processJevQuery("What is the surface lock gate policy?");
      expect(outcome.intent).toBe(JEV_INTENTS.INTERNAL_POLICY_RULE);
      expect(outcome.mode).toBe("deterministic_policy_vault");
      expect(outcome.result.answered).toBe(true);
    });

    it("orchestrates Supabase operational queries", () => {
      const outcome = processJevQuery("Show audit log actions");
      expect(outcome.intent).toBe(JEV_INTENTS.DATABASE_QUERY_SUPABASE);
      expect(outcome.mode).toBe("supabase_operational_sql");
      expect(outcome.result.table).toBe("mission_control_actions");
    });

    it("orchestrates Airtable catalog queries", () => {
      const outcome = processJevQuery("How many commercial listings in Ortigas?");
      expect(outcome.intent).toBe(JEV_INTENTS.DATABASE_QUERY_AIRTABLE);
      expect(outcome.mode).toBe("airtable_formula_compiler");
      expect(outcome.result.formula).toContain("{SpaceCategory} = 'Commercial'");
    });

    it("orchestrates Spatial GIS queries", () => {
      const outcome = processJevQuery("Check flood hazard and noah rating for Ortigas");
      expect(outcome.intent).toBe(JEV_INTENTS.DATABASE_QUERY_SPATIAL);
      expect(outcome.mode).toBe("spatial_gis_vault");
    });
  });
});
