import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));

import { resolveViaEligibility } from "@/lib/serverViaEligibility";
import { GET as eligibilityGet } from "@/app/api/property/[id]/via/eligibility/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";

const PROP = "11111111-1111-4111-8111-111111111111";

/** Minimal chainable in-memory Supabase fake: select/eq/maybeSingle/insert + thenable. */
function makeDb(seed = {}, { tableErrors = {}, insertErrors = [] } = {}) {
  const tables = {
    properties: [{ id: PROP, owner_id: "owner-1" }],
    property_broker_representations: [],
    property_units: [],
    open_gate_role_listings: [],
    user_profiles: [],
    via_share_links: [],
    ...seed,
  };
  const inserts = [];
  const pendingInsertErrors = [...insertErrors];

  const db = {
    inserts,
    tables,
    from(name) {
      const filters = [];
      let insertPayload = null;
      const run = (single) => {
        if (insertPayload) {
          const err = pendingInsertErrors.shift();
          if (err) return Promise.resolve({ data: null, error: err });
          tables[name].push({ ...insertPayload });
          inserts.push({ table: name, ...insertPayload });
          return Promise.resolve({ data: { slug: insertPayload.slug }, error: null });
        }
        if (tableErrors[name]) return Promise.resolve({ data: null, error: tableErrors[name] });
        const rows = (tables[name] || []).filter((r) =>
          filters.every(([c, v]) => String(r[c]) === String(v))
        );
        return Promise.resolve({ data: single ? rows[0] || null : rows, error: null });
      };
      const b = {
        select: () => b,
        eq: (c, v) => { filters.push([c, v]); return b; },
        or: () => b,
        insert: (p) => { insertPayload = p; return b; },
        maybeSingle: () => run(true),
        then: (res, rej) => run(false).then(res, rej),
      };
      return b;
    },
  };
  return db;
}

describe("A-193 resolveViaEligibility (server)", () => {
  it("mints one verified link for the property owner, slugged from their name", async () => {
    const db = makeDb({ user_profiles: [{ id: "owner-1", display_name: "Mariana Juan" }] });
    const r = await resolveViaEligibility(db, { propertyId: PROP, userId: "owner-1" });
    expect(r).toMatchObject({ eligible: true, promoterType: "owner", promoterSlug: "mariana-juan" });
    expect(db.inserts).toHaveLength(1);
    expect(db.inserts[0]).toMatchObject({
      table: "via_share_links", property_id: PROP, promoter_id: "owner-1", promoter_type: "owner", status: "active",
    });
  });

  it("accepted broker is eligible; pending broker is not and mints nothing", async () => {
    const accepted = makeDb({
      property_broker_representations: [{ property_id: PROP, broker_id: "b1", status: "active" }],
      user_profiles: [{ id: "b1", display_name: "Broker One" }],
    });
    expect(await resolveViaEligibility(accepted, { propertyId: PROP, userId: "b1" }))
      .toMatchObject({ eligible: true, promoterType: "broker", promoterSlug: "broker-one" });

    const pending = makeDb({
      property_broker_representations: [{ property_id: PROP, broker_id: "b1", status: "pending" }],
    });
    const r = await resolveViaEligibility(pending, { propertyId: PROP, userId: "b1" });
    expect(r).toMatchObject({ eligible: false, promoterSlug: null });
    expect(pending.inserts).toHaveLength(0);
  });

  it("operator by unit assignment and by enabled Open Gate listing", async () => {
    const byUnit = makeDb({ property_units: [{ id: "u1", property_id: PROP, operator_id: "op1" }] });
    expect((await resolveViaEligibility(byUnit, { propertyId: PROP, userId: "op1" })).promoterType).toBe("operator");

    const byListing = makeDb({
      open_gate_role_listings: [
        { property_id: PROP, recipient_id: "op2", role: "operator", enabled: true, unit_id: "u9" },
      ],
    });
    expect((await resolveViaEligibility(byListing, { propertyId: PROP, userId: "op2" })).promoterType).toBe("operator");

    const disabled = makeDb({
      open_gate_role_listings: [
        { property_id: PROP, recipient_id: "op3", role: "operator", enabled: false, unit_id: "u9" },
      ],
    });
    expect((await resolveViaEligibility(disabled, { propertyId: PROP, userId: "op3" })).eligible).toBe(false);
  });

  it("an unrelated user gets the public link: not eligible, nothing written", async () => {
    const db = makeDb();
    const r = await resolveViaEligibility(db, { propertyId: PROP, userId: "stranger" });
    expect(r).toMatchObject({ eligible: false, promoterType: null, promoterSlug: null });
    expect(db.inserts).toHaveLength(0);
  });

  it("anonymous or malformed calls never reach the database", async () => {
    const db = makeDb();
    expect((await resolveViaEligibility(db, { propertyId: PROP, userId: null })).eligible).toBe(false);
    expect((await resolveViaEligibility(db, { userId: "x" })).eligible).toBe(false);
    expect((await resolveViaEligibility(null, { propertyId: PROP, userId: "x" })).eligible).toBe(false);
  });

  it("reuses an existing active link instead of minting a second one", async () => {
    const db = makeDb({
      via_share_links: [
        { id: "l1", property_id: PROP, promoter_id: "owner-1", promoter_type: "owner", slug: "keep-me", status: "active" },
      ],
    });
    const r = await resolveViaEligibility(db, { propertyId: PROP, userId: "owner-1" });
    expect(r).toMatchObject({ eligible: true, promoterSlug: "keep-me", reason: "existing_link" });
    expect(db.inserts).toHaveLength(0);
  });

  it("never silently re-activates a link staff disabled or revoked", async () => {
    for (const status of ["disabled", "revoked"]) {
      const db = makeDb({
        via_share_links: [
          { id: "l1", property_id: PROP, promoter_id: "owner-1", promoter_type: "owner", slug: "gone", status },
        ],
      });
      const r = await resolveViaEligibility(db, { propertyId: PROP, userId: "owner-1" });
      expect(r, status).toMatchObject({ eligible: false, reason: "link_disabled_by_staff" });
      expect(db.inserts).toHaveLength(0);
    }
  });

  it("retries with a stable suffix when another promoter already holds the slug (23505)", async () => {
    const db = makeDb(
      { user_profiles: [{ id: "owner-1", display_name: "Marco" }] },
      { insertErrors: [{ code: "23505", message: "duplicate key" }] }
    );
    const r = await resolveViaEligibility(db, { propertyId: PROP, userId: "owner-1" });
    expect(r.eligible).toBe(true);
    expect(r.promoterSlug).toBe("marco-owner1");
  });

  it("degrades to the public link when the table is missing or the constraint rejects the type", async () => {
    const missing = makeDb({}, { tableErrors: { via_share_links: { message: "relation does not exist" } } });
    expect(await resolveViaEligibility(missing, { propertyId: PROP, userId: "owner-1" }))
      .toMatchObject({ eligible: false, reason: "database_unavailable" });

    // Pre-migration: operator insert is refused by the old CHECK constraint.
    const preMigration = makeDb(
      { property_units: [{ id: "u1", property_id: PROP, operator_id: "op1" }] },
      { insertErrors: [{ code: "23514", message: "violates check constraint" }] }
    );
    expect(await resolveViaEligibility(preMigration, { propertyId: PROP, userId: "op1" }))
      .toMatchObject({ eligible: false, promoterSlug: null });
  });
});

describe("A-193 GET /api/property/[id]/via/eligibility", () => {
  beforeEach(() => vi.clearAllMocks());

  const call = (id = "one-ecom-center") =>
    eligibilityGet(new Request(`http://localhost:3000/api/property/${id}/via/eligibility`), {
      params: Promise.resolve({ id }),
    });

  it("returns the quiet public answer for an anonymous caller and never touches the database", async () => {
    resolveUserId.mockResolvedValue(null);
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ eligible: false, promoterType: null, promoterSlug: null, displayName: null });
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it("rejects identifiers that could escape a PostgREST filter", async () => {
    resolveUserId.mockResolvedValue("owner-1");
    const res = await call("x),id.neq.0");
    expect((await res.json()).eligible).toBe(false);
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it("returns the verified link for an eligible caller", async () => {
    resolveUserId.mockResolvedValue("owner-1");
    const db = makeDb({ user_profiles: [{ id: "owner-1", display_name: "Mariana Juan" }] });
    supabaseAdmin.from.mockImplementation((t) => db.from(t));
    const res = await call();
    expect(await res.json()).toEqual({
      eligible: true, promoterType: "owner", promoterSlug: "mariana-juan", displayName: "Mariana Juan",
    });
  });

  it("falls back to the public answer on an unexpected error instead of failing the share", async () => {
    resolveUserId.mockRejectedValue(new Error("boom"));
    const res = await call();
    expect(res.status).toBe(200);
    expect((await res.json()).eligible).toBe(false);
  });
});
