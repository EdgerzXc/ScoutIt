import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  properties: new Map(), reserved: false, failWithdraw: false, writes: [],
  insert: vi.fn(), update: vi.fn(), unpublish: vi.fn(), discard: vi.fn(),
  cache: vi.fn(), audit: vi.fn(), authenticate: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({}) }));
vi.mock("@/lib/workspaceRequestAuth", () => ({ getVerifiedWorkspaceUser: db.authenticate }));
vi.mock("@/lib/featureFlags", () => ({ isGlobalReadOnly: async () => false }));
vi.mock("@/lib/serverMonetizationGate", () => ({
  evaluateServerMonetizationGate: async () => ({ isPilotZeroPaywall: false }),
}));
vi.mock("@/lib/cmsCache", () => ({ invalidateCmsBundle: db.cache }));
vi.mock("@/lib/systemEvents", () => ({ recordSystemEvent: db.audit }));
vi.mock("@/lib/airtable", async (actual) => ({
  ...await actual(),
  insertProperty: db.insert, updateProperty: db.update,
  unpublishPropertyByRecordId: db.unpublish, deletePropertyById: db.discard,
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table) {
      const predicates = [];
      let updates;
      const execute = () => {
        if (table === "user_profiles") return { data: [{ role: "owner", subscription_tier: "starry" }] };
        if (table === "property_slug_redirects") return { data: db.reserved ? [{ old_slug: "airtable-new" }] : [] };
        if (table === "property_slug_history") return { data: [] };
        const matches = [...db.properties.values()].filter(row => predicates.every(test => test(row)));
        if (!updates) return { data: matches.map(row => ({ ...row })) };
        if (db.failWithdraw && matches[0]?.id === "former" && updates.pipeline_status === "off_market") {
          return { data: [], error: { code: "FIXTURE_WRITE_FAILURE" } };
        }
        for (const row of matches) {
          db.writes.push({ id: row.id, state: updates.pipeline_status });
          Object.assign(row, updates);
        }
        return { data: matches.map(({ id }) => ({ id })) };
      };
      const single = async () => {
        const { data, error } = execute();
        return { data: data?.[0] || null, error };
      };
      const query = {
        select: () => query,
        update: (values) => { updates = values; return query; },
        eq: (key, value) => { predicates.push(row => row[key] === value); return query; },
        is: (key) => { predicates.push(row => row[key] == null); return query; },
        neq: (key, value) => { predicates.push(row => row[key] !== value); return query; },
        limit: () => query,
        maybeSingle: single, single,
        then: (resolve, reject) => Promise.resolve(execute()).then(resolve, reject),
      };
      return query;
    },
  },
}));

import { POST } from "@/app/api/dashboard/publish/route";

function addFormer(overrides = {}) {
  db.properties.set("former", {
    id: "former", owner_id: "owner-1", title: "Former property", slug: "former-property",
    canonical_slug: "former-property", publication_external_record_id: "recFormer",
    pipeline_status: "approved", lifecycle_state: "live", published_at: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });
}

async function publish(body = {}) {
  const response = await POST(new Request("https://scoutit.space/api/dashboard/publish", {
    method: "POST", headers: { Authorization: "Bearer fixture", "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId: "draft", listerRelationship: "owner", ownerSovereigntyAgreed: true, ...body }),
  }));
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.stubEnv("AIRTABLE_API_KEY", "fixture-key");
  vi.stubEnv("AIRTABLE_BASE_ID", "fixture-base");
  vi.spyOn(console, "error").mockImplementation(() => {});
  db.properties.clear();
  db.properties.set("draft", {
    id: "draft", owner_id: "owner-1", title: "New listing", slug: "unverified-draft-slug",
    pipeline_status: "pending", lifecycle_state: "draft", publication_external_record_id: null,
  });
  db.writes = [];
  db.reserved = false;
  db.failWithdraw = false;
  db.authenticate.mockResolvedValue({ data: { user: { id: "owner-1" } } });
  db.insert.mockResolvedValue({ id: "recNew", fields: { Slug: "airtable-new" } });
  db.update.mockImplementation(async (_key, _base, slug, { approved_for_scoutit, expectedRecordId }) => ({
    id: expectedRecordId, fields: { Slug: slug, Approved_For_ScoutIt: approved_for_scoutit },
  }));
  db.cache.mockResolvedValue({ sharedCachePurged: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("owner publication across the private queue and public CMS", () => {
  it.each([
    ["approved", "draft"],
    ["pending", "staff_suspended"],
    ["permanently_removed", "draft"],
  ])("guards the lifecycle before any provider mutation (%s, %s)", async (pipeline_status, lifecycle_state) => {
    Object.assign(db.properties.get("draft"), { pipeline_status, lifecycle_state });
    expect((await publish()).status).toBe(409);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(db.writes).toEqual([]);
  });

  it("fails closed when the authority column or a legacy record binding is missing", async () => {
    const draft = db.properties.get("draft");
    delete draft.publication_external_record_id;
    expect((await publish()).status).toBe(503);
    Object.assign(draft, { canonical_slug: "historical", publication_external_record_id: null });
    expect((await publish()).status).toBe(409);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("stages a first publication privately, activates the returned record, and saves its public identity", async () => {
    const result = await publish();
    expect(result).toMatchObject({ status: 200, body: { success: true, swappedPropertyId: null } });
    expect(db.insert).toHaveBeenCalledExactlyOnceWith("fixture-key", "fixture-base", expect.objectContaining({
      title: "New listing", approved_for_scoutit: false,
    }));
    expect(db.update).toHaveBeenCalledExactlyOnceWith("fixture-key", "fixture-base", "airtable-new",
      expect.objectContaining({ expectedRecordId: "recNew", approved_for_scoutit: true }));
    expect(db.properties.get("draft")).toMatchObject({
      canonical_slug: "airtable-new", publication_external_record_id: "recNew", pipeline_status: "approved",
    });
  });

  it("removes only the new private staging record when the address has been reserved", async () => {
    db.reserved = true;
    expect((await publish()).status).toBe(409);
    expect(db.discard).toHaveBeenCalledExactlyOnceWith("fixture-key", "fixture-base", "recNew");
    expect(db.update).not.toHaveBeenCalled();
    expect(db.writes).toEqual([]);
  });

  it("evicts a verified private staging record if its binding is ambiguous before activation", async () => {
    db.update.mockRejectedValueOnce(Object.assign(new Error("fixture"), { code: "AIRTABLE_RECORD_BINDING" }));
    expect(await publish()).toMatchObject({ status: 409, body: { code: "PUBLICATION_ADDRESS_CONFLICT" } });
    expect(db.discard).toHaveBeenCalledExactlyOnceWith("fixture-key", "fixture-base", "recNew");
    expect(db.writes).toEqual([]);
  });

  it("completes an authorized swap only after both writes and forwards the withdrawn identity to the cache", async () => {
    addFormer();
    expect(await publish({ swapWithPropertyId: "former" })).toMatchObject({ status: 200, body: { swappedPropertyId: "former" } });
    expect(db.properties.get("former").pipeline_status).toBe("off_market");
    expect(db.cache).toHaveBeenCalledExactlyOnceWith({ withdrawn: [{ slug: "former-property", recordId: "recFormer" }] });
  });

  it("rolls back the replacement on former Airtable failure and retries with the same record", async () => {
    addFormer();
    db.update.mockImplementationOnce(async () => ({ id: "recNew", fields: { Slug: "airtable-new", Approved_For_ScoutIt: true } }));
    db.update.mockRejectedValueOnce(new Error("fixture public failure"));
    const swap = { swapWithPropertyId: "former" };
    expect(await publish(swap)).toMatchObject({ status: 502, body: { compensated: true, retryable: true } });
    expect(db.unpublish).toHaveBeenCalledExactlyOnceWith("fixture-key", "fixture-base", "recNew");
    expect(db.properties.get("former").pipeline_status).toBe("approved");
    expect(db.properties.get("draft")).toMatchObject({ pipeline_status: "pending", canonical_slug: "airtable-new", publication_external_record_id: "recNew" });
    expect(db.cache).toHaveBeenCalledWith({ withdrawn: [{ slug: "airtable-new", recordId: "recNew" }] });
    expect((await publish(swap)).status).toBe(200);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it("reports private reconciliation after the confirmed former takedown", async () => {
    addFormer();
    db.failWithdraw = true;
    const result = await publish({ swapWithPropertyId: "former" });
    expect(result).toMatchObject({ status: 502, body: { compensated: true, reconciliationRequired: true } });
    expect(db.cache).toHaveBeenCalledWith({ withdrawn: [
      { slug: "former-property", recordId: "recFormer" }, { slug: "airtable-new", recordId: "recNew" },
    ] });
    expect(db.audit).toHaveBeenCalledWith(expect.objectContaining({
      detail: expect.objectContaining({ stage: "swap_private" }),
    }));
  });

  it("never suggests a blind retry when the rollback could not be verified", async () => {
    addFormer();
    db.failWithdraw = true;
    db.unpublish.mockRejectedValueOnce(new Error("fixture rollback failure"));
    expect(await publish({ swapWithPropertyId: "former" })).toMatchObject({
      status: 502, body: { compensated: false, reconciliationRequired: true, retryable: false },
    });
  });

  it("keeps direct Airtable writes off the table when the returned binding differs", async () => {
    const real = await vi.importActual("@/lib/airtable");
    const provider = vi.fn().mockResolvedValue(Response.json({ records: [{ id: "recDifferent" }] }));
    vi.stubGlobal("fetch", provider);
    try {
      await expect(real.updateProperty("fixture-key", "fixture-base", "property", { expectedRecordId: "recExpected" }))
        .rejects.toMatchObject({ code: "AIRTABLE_RECORD_BINDING" });
      expect(provider).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
