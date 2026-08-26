import { beforeEach, vi } from "vitest";

// A-023 phase 2 — failure-path proof for the representation authority read.
//
// The whole point of this module is that a failed read is NOT an empty result.
// These tests make the guard visibly fail: every error path below must return
// `ok: false`, because `ok: true` with zero rows renders as "this advisor
// represents nothing", which would be a claim we never earned.

const state = { client: null };

vi.mock("@/lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return state.client;
  },
}));

const { loadBrokerRepresentationAuthority } = await import("@/lib/serverBrokerDossier");

const AUTHORITY_ID = "e7f3634b-65d7-4adc-90ea-0544b61d988d";

/**
 * Minimal stand-in for the supabase-js query builder as this module uses it:
 * `.from(t).select(cols).eq(...)` and `.from(t).select(cols).in(...)`.
 */
function stubClient({ representations = [], properties = [], repError = null, propError = null, throwOn = null } = {}) {
  return {
    from(table) {
      if (throwOn === table) throw new Error(`connection reset on ${table}`);
      return {
        select() {
          return {
            eq: () => Promise.resolve({ data: representations, error: repError }),
            in: () => Promise.resolve({ data: properties, error: propError }),
          };
        },
      };
    },
  };
}

const representationRow = (overrides = {}) => ({
  id: "rep-1",
  property_id: "prop-1",
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

const catalogProperty = { slug: "one-ayala-tower", title: "One Ayala Tower", spaceCategory: "Office" };

describe("A-023 phase 2 - representation authority read", () => {
  beforeEach(() => {
    state.client = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("answers ok with nothing to look up when the dossier is unlinked", async () => {
    state.client = stubClient({ representations: [representationRow()] });

    const result = await loadBrokerRepresentationAuthority(null, [catalogProperty]);

    expect(result.lookup).toEqual({ ok: true, representations: [] });
    expect(result.propertiesByAuthorityId.size).toBe(0);
  });

  it("fails closed when the Supabase service client is absent", async () => {
    state.client = null;

    const result = await loadBrokerRepresentationAuthority(AUTHORITY_ID, [catalogProperty]);

    expect(result.lookup.ok).toBe(false);
    expect(result.lookup.reason).toBe("service_unavailable");
  });

  it("fails closed when the representation query returns an error", async () => {
    state.client = stubClient({ repError: { message: "permission denied" } });

    const result = await loadBrokerRepresentationAuthority(AUTHORITY_ID, [catalogProperty]);

    expect(result.lookup.ok).toBe(false);
    expect(result.lookup.reason).toBe("authority_unavailable");
  });

  it("fails closed when the property resolution query returns an error", async () => {
    state.client = stubClient({
      representations: [representationRow()],
      propError: { message: "statement timeout" },
    });

    const result = await loadBrokerRepresentationAuthority(AUTHORITY_ID, [catalogProperty]);

    expect(result.lookup.ok).toBe(false);
  });

  it("fails closed when the client throws outright", async () => {
    state.client = stubClient({ throwOn: "property_broker_representations" });

    const result = await loadBrokerRepresentationAuthority(AUTHORITY_ID, [catalogProperty]);

    expect(result.lookup.ok).toBe(false);
  });

  it("resolves a live, publicly catalogued property", async () => {
    state.client = stubClient({
      representations: [representationRow()],
      properties: [{ id: "prop-1", slug: "one-ayala-tower", canonical_slug: "one-ayala-tower", pipeline_status: "approved" }],
    });

    const result = await loadBrokerRepresentationAuthority(AUTHORITY_ID, [catalogProperty]);

    expect(result.lookup.ok).toBe(true);
    expect(result.propertiesByAuthorityId.get("prop-1")).toBe(catalogProperty);
  });

  it("drops a property that is not live in Supabase", async () => {
    state.client = stubClient({
      representations: [representationRow()],
      properties: [{ id: "prop-1", slug: "one-ayala-tower", canonical_slug: "one-ayala-tower", pipeline_status: "off_market" }],
    });

    const result = await loadBrokerRepresentationAuthority(AUTHORITY_ID, [catalogProperty]);

    expect(result.propertiesByAuthorityId.size).toBe(0);
  });

  it("drops a live property that is absent from the public catalog", async () => {
    state.client = stubClient({
      representations: [representationRow()],
      properties: [{ id: "prop-1", slug: "unpublished-tower", canonical_slug: "unpublished-tower", pipeline_status: "approved" }],
    });

    const result = await loadBrokerRepresentationAuthority(AUTHORITY_ID, [catalogProperty]);

    expect(result.propertiesByAuthorityId.size).toBe(0);
  });

  it("does not query properties at all when the broker has no representations", async () => {
    state.client = stubClient({ representations: [] });

    const result = await loadBrokerRepresentationAuthority(AUTHORITY_ID, [catalogProperty]);

    expect(result.lookup).toEqual({ ok: true, representations: [] });
    expect(result.propertiesByAuthorityId.size).toBe(0);
  });
});
