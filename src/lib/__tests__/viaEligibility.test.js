import { describe, it, expect } from "vitest";
import {
  PROMOTER_TYPES,
  classifyPromoterRelationship,
  buildPromoterSlug,
  disambiguatePromoterSlug,
} from "@/lib/viaEligibility";

const USER = "user-1";
const property = { id: "p1", owner_id: "owner-9" };

describe("A-193 classifyPromoterRelationship — 4-tier property capability matrix", () => {
  it("declares exactly the three promoter types", () => {
    expect(PROMOTER_TYPES).toEqual(["owner", "broker", "operator"]);
  });

  it("tier 1: the property owner is eligible as owner", () => {
    const r = classifyPromoterRelationship({ userId: "owner-9", property });
    expect(r).toMatchObject({ eligible: true, promoterType: "owner", promoterId: "owner-9" });
  });

  it("tier 2: only an ACTIVE representation makes a broker eligible", () => {
    const active = classifyPromoterRelationship({
      userId: USER, property, representation: { broker_id: USER, status: "active" },
    });
    expect(active).toMatchObject({ eligible: true, promoterType: "broker" });

    for (const status of ["pending", "declined", "ended", "suspended", "locked", "unavailable"]) {
      const r = classifyPromoterRelationship({
        userId: USER, property, representation: { broker_id: USER, status },
      });
      expect(r.eligible, status).toBe(false);
    }
  });

  it("tier 2: someone else's representation never counts", () => {
    const r = classifyPromoterRelationship({
      userId: USER, property, representation: { broker_id: "someone-else", status: "active" },
    });
    expect(r.eligible).toBe(false);
  });

  it("tier 3: a unit operator is eligible, with the unit recorded", () => {
    const r = classifyPromoterRelationship({
      userId: USER, property, operatorUnits: [{ id: "u7", operator_id: USER }],
    });
    expect(r).toMatchObject({ eligible: true, promoterType: "operator", unitId: "u7" });
  });

  it("tier 3: an enabled Open Gate operator listing is eligible; disabled or wrong role is not", () => {
    const ok = classifyPromoterRelationship({
      userId: USER, property,
      roleListings: [{ recipient_id: USER, role: "operator", enabled: true, unit_id: "u2" }],
    });
    expect(ok).toMatchObject({ eligible: true, promoterType: "operator", unitId: "u2" });

    const disabled = classifyPromoterRelationship({
      userId: USER, property,
      roleListings: [{ recipient_id: USER, role: "operator", enabled: false, unit_id: "u2" }],
    });
    expect(disabled.eligible).toBe(false);

    const ownerRole = classifyPromoterRelationship({
      userId: USER, property,
      roleListings: [{ recipient_id: USER, role: "owner", enabled: true, unit_id: null }],
    });
    expect(ownerRole.eligible).toBe(false);
  });

  it("tier 4: photographers, designers, unconnected brokers and visitors get nothing", () => {
    expect(classifyPromoterRelationship({ userId: USER, property })).toMatchObject({
      eligible: false, promoterType: null,
    });
    expect(classifyPromoterRelationship({ userId: null, property }).eligible).toBe(false);
    expect(classifyPromoterRelationship({ userId: USER, property: null }).eligible).toBe(false);
    expect(classifyPromoterRelationship({}).eligible).toBe(false);
  });

  it("resolves overlapping roles by authority: owner > broker > operator", () => {
    const all = {
      property,
      representation: { broker_id: "owner-9", status: "active" },
      operatorUnits: [{ id: "u1", operator_id: "owner-9" }],
    };
    expect(classifyPromoterRelationship({ userId: "owner-9", ...all }).promoterType).toBe("owner");

    const brokerAndOperator = classifyPromoterRelationship({
      userId: USER,
      property,
      representation: { broker_id: USER, status: "active" },
      operatorUnits: [{ id: "u1", operator_id: USER }],
    });
    expect(brokerAndOperator.promoterType).toBe("broker");
  });

  it("roles are per property: the same person is a broker here and a visitor elsewhere", () => {
    const here = classifyPromoterRelationship({
      userId: USER, property, representation: { broker_id: USER, status: "active" },
    });
    const elsewhere = classifyPromoterRelationship({
      userId: USER, property: { id: "p2", owner_id: "other" }, representation: null,
    });
    expect(here.eligible).toBe(true);
    expect(elsewhere.eligible).toBe(false);
  });
});

describe("A-193 promoter slugs", () => {
  it("builds a clean url-safe slug from a display name", () => {
    expect(buildPromoterSlug("Mariana Juan", "id", "broker")).toBe("mariana-juan");
    expect(buildPromoterSlug("  José  Rizal-Cruz!! ", "id", "broker")).toBe("jose-rizal-cruz");
  });

  it("is deterministic so repeated lookups never mint a second link", () => {
    expect(buildPromoterSlug("Marco Polo", "abc", "owner")).toBe(buildPromoterSlug("Marco Polo", "abc", "owner"));
  });

  it("falls back to type + id fragment when there is no usable name", () => {
    expect(buildPromoterSlug("", "ABCD-1234-efgh", "operator")).toBe("operator-abcd1234");
    expect(buildPromoterSlug("!!!", "x9", "broker")).toBe("broker-x9");
    expect(buildPromoterSlug(null, null, "owner")).toBe("owner");
  });

  it("never exceeds a sane length and never ends with a dash", () => {
    const slug = buildPromoterSlug("A".repeat(80) + " tail", "id", "broker");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("disambiguates with a stable per-promoter suffix", () => {
    expect(disambiguatePromoterSlug("marco", "AB-12-CD-34")).toBe("marco-ab12cd");
    expect(disambiguatePromoterSlug("marco", "AB-12-CD-34")).toBe(disambiguatePromoterSlug("marco", "AB-12-CD-34"));
  });
});
