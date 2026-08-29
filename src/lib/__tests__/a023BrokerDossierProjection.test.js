import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  DOSSIER_REPRESENTATION_STATES,
  PUBLIC_BROKER_IDENTITY_KEYS,
  buildRepresentationSection,
  publicBrokerIdentity,
  resolveBrokerAuthorityId,
} from "@/lib/brokerDossier";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

const AUTHORITY_ID = "e7f3634b-65d7-4adc-90ea-0544b61d988d";
const OTHER_AUTHORITY_ID = "07f42e23-4cad-4131-9023-419f56dfcfcf";
const NOW = "2026-08-26T00:00:00.000Z";

const airtableBroker = () => ({
  id: AUTHORITY_ID,
  name: "Marco Villanueva",
  title: "Principal Advisor",
  specialty: "Commercial",
  location: "BGC, Taguig",
  bio: "Ten years in Metro Manila commercial leasing.",
  image: "https://example.test/marco.jpg",
  license: "PRC-0001",
  licenseVerified: true,
  clearanceTier: "Tier II",
  niche: ["Office", "Retail"],
  isExample: true,
  managedProperties: [],
  // Retired legacy composites. These still arrive from Airtable and must never
  // survive into anything the browser receives.
  rating: 92.5,
  closures: 34,
  subscriptionTier: 1,
  subscriptionLabel: "Gold",
  rosterRank: "A1",
  rosterStatus: "Active",
  metrics: [{ label: "Roster Rank", value: "A1" }],
});

const eligibleRepresentation = (overrides = {}) => ({
  id: "rep-1",
  property_id: "prop-uuid-1",
  broker_id: AUTHORITY_ID,
  status: "active",
  visible_to_public: true,
  contactable: true,
  account_eligible: true,
  inventory_eligible: true,
  priority: 0,
  accepted_at: "2026-08-01T00:00:00.000Z",
  created_at: "2026-08-01T00:00:00.000Z",
  ...overrides,
});

const publicProperty = (overrides = {}) => ({
  slug: "one-ayala-tower",
  title: "One Ayala Tower",
  spaceCategory: "Office",
  location: "Makati",
  image: "https://example.test/tower.jpg",
  ...overrides,
});

const catalog = () => new Map([["prop-uuid-1", publicProperty()]]);

describe("A-023 phase 2 - public broker dossier projection", () => {
  describe("identity allowlist", () => {
    it("publishes only allowlisted identity keys", () => {
      const identity = publicBrokerIdentity(airtableBroker());
      expect(Object.keys(identity).sort()).toEqual([...PUBLIC_BROKER_IDENTITY_KEYS].sort());
    });

    it("drops every retired trust composite so it never reaches the browser", () => {
      const identity = publicBrokerIdentity(airtableBroker());
      const serialized = JSON.stringify(identity);

      for (const retired of ["rating", "closures", "subscriptionTier", "subscriptionLabel", "rosterRank", "rosterStatus", "metrics"]) {
        expect(identity).not.toHaveProperty(retired);
      }
      // The values themselves must be gone, not merely renamed.
      expect(serialized).not.toContain("92.5");
      expect(serialized).not.toContain("Gold");
    });

    it("returns null rather than a partial dossier for an unusable record", () => {
      expect(publicBrokerIdentity(null)).toBeNull();
      expect(publicBrokerIdentity({ id: "", name: "No Id" })).toBeNull();
      expect(publicBrokerIdentity({ id: AUTHORITY_ID, name: "   " })).toBeNull();
    });
  });

  describe("identity link resolution", () => {
    it("links a dossier to the representation authority only by explicit Auth UUID", () => {
      expect(resolveBrokerAuthorityId(AUTHORITY_ID)).toBe(AUTHORITY_ID);
      expect(resolveBrokerAuthorityId(AUTHORITY_ID.toUpperCase())).toBe(AUTHORITY_ID);
    });

    it("refuses to link by an Airtable record id, name, or email", () => {
      expect(resolveBrokerAuthorityId("recABC123DEF45678")).toBeNull();
      expect(resolveBrokerAuthorityId("Marco Villanueva")).toBeNull();
      expect(resolveBrokerAuthorityId("marco@example.test")).toBeNull();
      expect(resolveBrokerAuthorityId("")).toBeNull();
      expect(resolveBrokerAuthorityId(null)).toBeNull();
    });
  });

  describe("representation section states", () => {
    it("reports NOT_LINKED - never an empty count - when no authority link exists", () => {
      const section = buildRepresentationSection({
        authorityId: null,
        lookup: { ok: true, representations: [] },
        propertiesByAuthorityId: catalog(),
        now: NOW,
      });

      expect(section.state).toBe(DOSSIER_REPRESENTATION_STATES.NOT_LINKED);
      expect(section.cards).toEqual([]);
      // The distinction that matters: we must not claim there are none.
      expect(section.claimsEmptiness).toBe(false);
    });

    it("reports LOOKUP_FAILED when the authority read fails, and claims nothing", () => {
      const section = buildRepresentationSection({
        authorityId: AUTHORITY_ID,
        lookup: { ok: false, reason: "service_unavailable" },
        propertiesByAuthorityId: catalog(),
        now: NOW,
      });

      expect(section.state).toBe(DOSSIER_REPRESENTATION_STATES.LOOKUP_FAILED);
      expect(section.cards).toEqual([]);
      expect(section.claimsEmptiness).toBe(false);
    });

    it("reports NONE_ELIGIBLE only when the authority actually answered with nothing", () => {
      const section = buildRepresentationSection({
        authorityId: AUTHORITY_ID,
        lookup: { ok: true, representations: [] },
        propertiesByAuthorityId: catalog(),
        now: NOW,
      });

      expect(section.state).toBe(DOSSIER_REPRESENTATION_STATES.NONE_ELIGIBLE);
      expect(section.claimsEmptiness).toBe(true);
    });

    it("lists an eligible representation as an allowlisted card", () => {
      const section = buildRepresentationSection({
        authorityId: AUTHORITY_ID,
        lookup: { ok: true, representations: [eligibleRepresentation()] },
        propertiesByAuthorityId: catalog(),
        now: NOW,
      });

      expect(section.state).toBe(DOSSIER_REPRESENTATION_STATES.LISTED);
      expect(section.cards).toEqual([
        {
          slug: "one-ayala-tower",
          title: "One Ayala Tower",
          category: "Office",
          location: "Makati",
          image: "https://example.test/tower.jpg",
          href: "/property/one-ayala-tower",
        },
      ]);
    });

    it("excludes every non-eligible representation state", () => {
      const ineligible = [
        eligibleRepresentation({ id: "r-pending", status: "pending" }),
        eligibleRepresentation({ id: "r-ended", status: "ended", ended_at: "2026-08-10T00:00:00.000Z" }),
        eligibleRepresentation({ id: "r-locked", locked_at: "2026-08-10T00:00:00.000Z" }),
        eligibleRepresentation({ id: "r-susp", suspended_at: "2026-08-10T00:00:00.000Z" }),
        eligibleRepresentation({ id: "r-unavail", unavailable_at: "2026-08-10T00:00:00.000Z" }),
        eligibleRepresentation({ id: "r-hidden", visible_to_public: false }),
        eligibleRepresentation({ id: "r-nocontact", contactable: false }),
        eligibleRepresentation({ id: "r-account", account_eligible: false }),
        eligibleRepresentation({ id: "r-inventory", inventory_eligible: false }),
        eligibleRepresentation({ id: "r-expired", expires_at: "2026-08-10T00:00:00.000Z" }),
      ];

      const section = buildRepresentationSection({
        authorityId: AUTHORITY_ID,
        lookup: { ok: true, representations: ineligible },
        propertiesByAuthorityId: catalog(),
        now: NOW,
      });

      expect(section.cards).toEqual([]);
      expect(section.state).toBe(DOSSIER_REPRESENTATION_STATES.NONE_ELIGIBLE);
    });

    it("drops an eligible representation whose property is not in the public catalog", () => {
      const section = buildRepresentationSection({
        authorityId: AUTHORITY_ID,
        lookup: { ok: true, representations: [eligibleRepresentation({ property_id: "withdrawn-uuid" })] },
        propertiesByAuthorityId: catalog(),
        now: NOW,
      });

      expect(section.cards).toEqual([]);
      expect(section.state).toBe(DOSSIER_REPRESENTATION_STATES.NONE_ELIGIBLE);
    });

    it("ignores a representation belonging to another broker", () => {
      const section = buildRepresentationSection({
        authorityId: AUTHORITY_ID,
        lookup: { ok: true, representations: [eligibleRepresentation({ broker_id: OTHER_AUTHORITY_ID })] },
        propertiesByAuthorityId: catalog(),
        now: NOW,
      });

      expect(section.cards).toEqual([]);
    });

    it("orders cards by representation authority, never by a trust score", () => {
      const properties = new Map([
        ["prop-a", publicProperty({ slug: "a-tower", title: "A Tower" })],
        ["prop-b", publicProperty({ slug: "b-tower", title: "B Tower" })],
      ]);
      const section = buildRepresentationSection({
        authorityId: AUTHORITY_ID,
        lookup: {
          ok: true,
          representations: [
            eligibleRepresentation({ id: "low", property_id: "prop-a", priority: 0 }),
            eligibleRepresentation({ id: "high", property_id: "prop-b", priority: 9 }),
          ],
        },
        propertiesByAuthorityId: properties,
        now: NOW,
      });

      expect(section.cards.map((card) => card.slug)).toEqual(["b-tower", "a-tower"]);
    });

    it("never emits a private representation or deal field on a public card", () => {
      const section = buildRepresentationSection({
        authorityId: AUTHORITY_ID,
        lookup: { ok: true, representations: [eligibleRepresentation()] },
        propertiesByAuthorityId: catalog(),
        now: NOW,
      });
      const serialized = JSON.stringify(section.cards);

      for (const leaked of ["broker_id", "rep-1", "prop-uuid-1", "accepted_at", "priority", "owner"]) {
        expect(serialized).not.toContain(leaked);
      }
    });
  });

  describe("template isolation", () => {
    // RE-AIMED 2026-08-27. This assertion originally required Career History to
    // be ABSENT, which was the correct isolation while its claims table was
    // migration-gated — and it did its job: it went red the moment G4 built the
    // surface. Career History now exists deliberately, so the guard is pointed
    // at what it was always protecting (the two templates never merging)
    // rather than at the absence that used to imply it (Rule 14).
    it("keeps the identity projection free of any career-history concern", () => {
      const dossierModule = read("src/lib/brokerDossier.js");
      expect(dossierModule).not.toMatch(/careerHistory/i);
    });

    it("never lets a career claim reach the ScoutIt Record projection", () => {
      const metrics = read("src/lib/brokerMetrics.js");
      expect(metrics).not.toMatch(/careerHistory|career_claims|brokerCareerHistory/);

      const career = read("src/lib/brokerCareerHistory.js");
      expect(career).not.toMatch(/brokerMetrics|completedTransactions|responseRate/);
    });

    it("renders the ScoutIt Record before Career History and from separate lookups", () => {
      const page = read("src/app/brokers/[broker-slug]/page.js");
      expect(page.indexOf("<BrokerDossierIdentity")).toBeLessThan(
        page.indexOf("<BrokerCareerHistory"),
      );
      expect(page).not.toMatch(/buildCareerHistorySection\([^)]*metricLookup/);
      expect(page).not.toMatch(/buildScoutItRecord\([^)]*careerLookup/);
    });
  });

  describe("public payload", () => {
    it("stops publishing retired composites through /api/cms", () => {
      const airtable = read("src/lib/airtable.js");
      const brokerBlock = airtable.slice(
        airtable.indexOf("export async function fetchBrokers"),
        airtable.indexOf("export async function fetchProperties"),
      );

      expect(brokerBlock).not.toMatch(/^\s*rating:/m);
      expect(brokerBlock).not.toMatch(/^\s*closures:/m);
      expect(brokerBlock).not.toMatch(/^\s*subscriptionTier:/m);
      expect(brokerBlock).not.toMatch(/^\s*subscriptionLabel:/m);
      expect(brokerBlock).not.toMatch(/^\s*rosterRank:/m);
      expect(brokerBlock).not.toMatch(/^\s*rosterStatus:/m);
      expect(brokerBlock).not.toMatch(/^\s*metrics:/m);
      expect(brokerBlock).not.toMatch(/^\s*managedProperties:/m);
    });
  });
});
