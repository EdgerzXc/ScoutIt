import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/dashboard/publish/route";

const mocks = vi.hoisted(() => ({
  userId: "owner",
  from: vi.fn(),
  single: vi.fn(),
  updateProperty: vi.fn(),
  insertProperty: vi.fn(),
  invalidateCmsBundle: vi.fn(async () => ({ sharedCachePurged: true })),
  recordHistoricalSlug: vi.fn(async () => {}),
  recordSystemEvent: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: mocks.userId } } }) } }),
}));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@/lib/airtable", () => ({
  updateProperty: mocks.updateProperty,
  insertProperty: mocks.insertProperty,
  isAirtableRecordNotFoundError: (err) => err?.code === "AIRTABLE_RECORD_NOT_FOUND",
  isAirtableAmbiguousRecordError: (err) => err?.code === "AIRTABLE_AMBIGUOUS_RECORD",
  isAirtableRecordConflictError: (err) => err?.code === "AIRTABLE_RECORD_CONFLICT",
}));
vi.mock("@/lib/featureFlags", () => ({ isGlobalReadOnly: async () => false }));
vi.mock("@/lib/cmsCache", () => ({ invalidateCmsBundle: mocks.invalidateCmsBundle }));
vi.mock("@/lib/propertyRedirects", () => ({ recordHistoricalSlug: mocks.recordHistoricalSlug }));
vi.mock("@/lib/systemEvents", () => ({ recordSystemEvent: mocks.recordSystemEvent }));
vi.mock("@/lib/serverMonetizationGate", () => ({
  evaluateServerMonetizationGate: async () => ({ isPilotZeroPaywall: false }),
}));

const priorEnv = {
  apiKey: process.env.AIRTABLE_API_KEY,
  baseId: process.env.AIRTABLE_BASE_ID,
};

describe("owner publication transition guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = "owner";
    process.env.AIRTABLE_API_KEY = "keyTest";
    process.env.AIRTABLE_BASE_ID = "appTest";
    mocks.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: mocks.single }) }),
    });
  });

  afterEach(() => {
    if (priorEnv.apiKey === undefined) delete process.env.AIRTABLE_API_KEY;
    else process.env.AIRTABLE_API_KEY = priorEnv.apiKey;
    if (priorEnv.baseId === undefined) delete process.env.AIRTABLE_BASE_ID;
    else process.env.AIRTABLE_BASE_ID = priorEnv.baseId;
  });

  it.each([
    { pipeline_status: "staff_suspended" },
    { pipeline_status: "pending", lifecycle_state: "staff_suspended" },
    { pipeline_status: "permanently_removed" },
    { pipeline_status: "pending", permanently_removed_at: "2026-11-01T00:00:00Z" },
    { pipeline_status: "approved", canonical_slug: null },
  ])("denies publishing state %j before any write", async (state) => {
    mocks.single.mockResolvedValue({ data: { id: "listing", owner_id: "owner", ...state } });
    const response = await POST(new Request("https://www.scoutit.space/api/dashboard/publish", {
      method: "POST",
      headers: { Authorization: "Bearer fixture" },
      body: JSON.stringify({ submissionId: "listing" }),
    }));

    expect(response.status).toBe(409);
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("properties");
    expect(mocks.updateProperty).not.toHaveBeenCalled();
    expect(mocks.insertProperty).not.toHaveBeenCalled();
  });

  describe("A-353, A-354, A-355 — publish, record binding, republish, and swap reconciliation", () => {
    function setupDatabase(initialProperties = [], tier = "solar") {
      const properties = new Map(initialProperties.map((p) => [p.id, { ...p }]));
      let failNextUpdateForId = null;

      mocks.from.mockImplementation((table) => {
        if (table === "user_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { subscription_tier: tier, role: "owner", active_roles: ["owner"] },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "properties") {
          return {
            select: () => ({
              eq: (col, val) => ({
                single: async () => {
                  const row = properties.get(val);
                  return { data: row ? { ...row } : null, error: row ? null : { code: "PGRST116" } };
                },
                eq: async (col2, val2) => {
                  const rows = [...properties.values()].filter(
                    (r) => r[col] === val && r[col2] === val2
                  );
                  return { data: rows.map((r) => ({ ...r })), error: null };
                },
              }),
              neq: (col, val) => ({
                not: async () => {
                  const rows = [...properties.values()].filter((r) => r[col] !== val);
                  return { data: rows.map((r) => ({ ...r })), error: null };
                },
              }),
            }),
            update: (patch) => ({
              eq: (col, val) => {
                const applyUpdate = async () => {
                  if (failNextUpdateForId === val) {
                    failNextUpdateForId = null;
                    return { data: null, error: { message: "Simulated DB update error" } };
                  }
                  const existing = properties.get(val);
                  if (!existing) return { data: [], error: null };
                  const next = { ...existing, ...patch };
                  properties.set(val, next);
                  return { data: [next], error: null };
                };
                return {
                  then: (resolve, reject) => applyUpdate().then(resolve, reject),
                  eq: () => ({
                    then: (resolve, reject) => applyUpdate().then(resolve, reject),
                    select: async () => applyUpdate(),
                  }),
                  select: async () => applyUpdate(),
                };
              },
            }),
          };
        }
        if (table === "property_lifecycle_events") {
          return {
            upsert: async () => ({ error: null }),
            insert: async () => ({ error: null }),
          };
        }
        return {};
      });

      return {
        properties,
        setFailNextUpdateForId: (id) => {
          failNextUpdateForId = id;
        },
      };
    }

    it("A-355: publishes a slugless CSV-imported draft on first release and locks Airtable's computed slug and record ID", async () => {
      const { properties } = setupDatabase([
        {
          id: "csv-draft-1",
          owner_id: "owner",
          title: "Makati CSV Suite",
          location: "Makati, Metro Manila",
          type: "commercial",
          space_category: "commercial",
          creation_source: "csv",
          pipeline_status: "draft",
          lifecycle_state: "draft",
          slug: null,
          canonical_slug: null,
          details: { beds: "2" },
        },
      ]);

      mocks.insertProperty.mockResolvedValueOnce({
        id: "rec_csv_1",
        fields: { Slug: "makati-csv-suite" },
      });

      const res = await POST(new Request("https://www.scoutit.space/api/dashboard/publish", {
        method: "POST",
        headers: { Authorization: "Bearer fixture" },
        body: JSON.stringify({
          submissionId: "csv-draft-1",
          listerRelationship: "owner",
          ownerSovereigntyAgreed: true,
        }),
      }));

      expect(res.status).toBe(200);
      expect(mocks.updateProperty).not.toHaveBeenCalled();
      expect(mocks.insertProperty).toHaveBeenCalledTimes(1);
      const saved = properties.get("csv-draft-1");
      expect(saved).toMatchObject({
        pipeline_status: "approved",
        lifecycle_state: "live",
        slug: "makati-csv-suite",
        canonical_slug: "makati-csv-suite",
        lister_relationship: "owner",
      });
      expect(saved.details?.airtable_record_id).toBe("rec_csv_1");
    });

    it("A-354: prevents a second owner from overwriting an existing public listing with the same display title", async () => {
      const { properties } = setupDatabase([
        {
          id: "owner-1-prop",
          owner_id: "owner-1",
          title: "Ayala Premier Tower",
          location: "Makati",
          type: "commercial",
          pipeline_status: "draft",
          lifecycle_state: "draft",
          slug: null,
          canonical_slug: null,
          details: {},
        },
        {
          id: "owner-2-prop",
          owner_id: "owner-2",
          title: "Ayala Premier Tower",
          location: "Makati",
          type: "commercial",
          pipeline_status: "draft",
          lifecycle_state: "draft",
          slug: "ayala-premier-tower",
          canonical_slug: null,
          details: {},
        },
      ]);

      mocks.userId = "owner-1";
      mocks.insertProperty.mockResolvedValueOnce({
        id: "rec_owner_1",
        fields: { Slug: "ayala-premier-tower" },
      });

      const firstRes = await POST(new Request("https://www.scoutit.space/api/dashboard/publish", {
        method: "POST",
        headers: { Authorization: "Bearer fixture" },
        body: JSON.stringify({
          submissionId: "owner-1-prop",
          listerRelationship: "owner",
          ownerSovereigntyAgreed: true,
        }),
      }));
      expect(firstRes.status).toBe(200);
      expect(properties.get("owner-1-prop").canonical_slug).toBe("ayala-premier-tower");

      mocks.userId = "owner-2";
      const secondRes = await POST(new Request("https://www.scoutit.space/api/dashboard/publish", {
        method: "POST",
        headers: { Authorization: "Bearer fixture" },
        body: JSON.stringify({
          submissionId: "owner-2-prop",
          listerRelationship: "owner",
          ownerSovereigntyAgreed: true,
        }),
      }));

      expect(secondRes.status).toBe(409);
      expect(mocks.updateProperty).not.toHaveBeenCalled();
      expect(mocks.insertProperty).toHaveBeenCalledTimes(1);
      expect(properties.get("owner-2-prop").pipeline_status).toBe("draft");
    });

    it("A-354: converges on the same Airtable record when retrying publish after first provider write succeeds", async () => {
      const { properties, setFailNextUpdateForId } = setupDatabase([
        {
          id: "retry-prop-1",
          owner_id: "owner",
          title: "BGC Nexus Hub",
          location: "Taguig",
          type: "commercial",
          pipeline_status: "draft",
          lifecycle_state: "draft",
          slug: null,
          canonical_slug: null,
          details: {},
        },
      ]);

      mocks.insertProperty.mockResolvedValueOnce({
        id: "rec_bgc_1",
        fields: { Slug: "bgc-nexus-hub" },
      });
      mocks.updateProperty.mockResolvedValueOnce({
        id: "rec_bgc_1",
        fields: { Slug: "bgc-nexus-hub" },
      });

      // Attempt 1: Airtable insert succeeds, Supabase update fails
      setFailNextUpdateForId("retry-prop-1");
      const firstAttempt = await POST(new Request("https://www.scoutit.space/api/dashboard/publish", {
        method: "POST",
        headers: { Authorization: "Bearer fixture" },
        body: JSON.stringify({
          submissionId: "retry-prop-1",
          listerRelationship: "owner",
          ownerSovereigntyAgreed: true,
        }),
      }));
      expect(firstAttempt.status).toBe(500);
      expect(mocks.insertProperty).toHaveBeenCalledTimes(1);

      // Attempt 2: Retry converges on rec_bgc_1 via updateProperty instead of inserting a duplicate
      const secondAttempt = await POST(new Request("https://www.scoutit.space/api/dashboard/publish", {
        method: "POST",
        headers: { Authorization: "Bearer fixture" },
        body: JSON.stringify({
          submissionId: "retry-prop-1",
          listerRelationship: "owner",
          ownerSovereigntyAgreed: true,
        }),
      }));
      expect(secondAttempt.status).toBe(200);
      expect(mocks.insertProperty).toHaveBeenCalledTimes(1);
      expect(mocks.updateProperty).toHaveBeenCalledTimes(1);
      expect(mocks.updateProperty.mock.calls[0][2]).toBe("bgc-nexus-hub");
      expect(properties.get("retry-prop-1")).toMatchObject({
        pipeline_status: "approved",
        lifecycle_state: "live",
        canonical_slug: "bgc-nexus-hub",
      });
      expect(properties.get("retry-prop-1").details?.airtable_record_id).toBe("rec_bgc_1");
    });

    it("A-353: republishing an off-market listing restores Approved_For_ScoutIt=true at its frozen canonical slug", async () => {
      const { properties } = setupDatabase([
        {
          id: "off-market-1",
          owner_id: "owner",
          title: "Rockwell Suites",
          location: "Makati",
          type: "residential",
          pipeline_status: "off_market",
          lifecycle_state: "off_market",
          slug: "rockwell-suites",
          canonical_slug: "rockwell-suites",
          canonical_slug_locked_at: "2026-10-01T00:00:00.000Z",
          published_at: "2026-10-01T00:00:00.000Z",
          lister_relationship: "owner",
          owner_claim_agreed: { agreed: true, timestamp: "2026-10-01T00:00:00.000Z", disclaimer_version: "v1" },
          details: { airtable_record_id: "rec_rockwell_1" },
        },
      ]);

      mocks.updateProperty.mockResolvedValueOnce({
        id: "rec_rockwell_1",
        fields: { Slug: "rockwell-suites" },
      });

      const res = await POST(new Request("https://www.scoutit.space/api/dashboard/publish", {
        method: "POST",
        headers: { Authorization: "Bearer fixture" },
        body: JSON.stringify({ submissionId: "off-market-1" }),
      }));

      expect(res.status).toBe(200);
      expect(mocks.insertProperty).not.toHaveBeenCalled();
      expect(mocks.updateProperty).toHaveBeenCalledTimes(1);
      expect(mocks.updateProperty.mock.calls[0][2]).toBe("rockwell-suites");
      expect(mocks.updateProperty.mock.calls[0][3]).toMatchObject({
        approved_for_scoutit: true,
      });
      expect(properties.get("off-market-1")).toMatchObject({
        pipeline_status: "approved",
        lifecycle_state: "live",
        canonical_slug: "rockwell-suites",
      });
    });

    it("A-353: compensates and reports retryable failure when a cap-swap Airtable unpublish fails", async () => {
      const { properties } = setupDatabase(
        [
          {
            id: "existing-live-1",
            owner_id: "owner",
            title: "Existing Live Listing",
            location: "Taguig",
            type: "commercial",
            pipeline_status: "approved",
            lifecycle_state: "live",
            slug: "existing-live-listing",
            canonical_slug: "existing-live-listing",
            details: { airtable_record_id: "rec_live_1" },
          },
          {
            id: "new-draft-2",
            owner_id: "owner",
            title: "New Swap Candidate",
            location: "Makati",
            type: "commercial",
            pipeline_status: "draft",
            lifecycle_state: "draft",
            slug: null,
            canonical_slug: null,
            lister_relationship: "owner",
            owner_claim_agreed: { agreed: true, timestamp: "2026-10-01T00:00:00.000Z", disclaimer_version: "v1" },
            details: {},
          },
        ],
        "starry" // Starry owner cap is 1 active live listing
      );

      mocks.insertProperty.mockResolvedValueOnce({
        id: "rec_new_2",
        fields: { Slug: "new-swap-candidate" },
      });
      // First updateProperty call is unpublishing existing-live-1 (fails);
      // second updateProperty call is compensating new-draft-2 in Airtable (succeeds).
      mocks.updateProperty
        .mockRejectedValueOnce(new Error("Airtable swap unpublish timeout"))
        .mockResolvedValueOnce({ id: "rec_new_2", fields: { Slug: "new-swap-candidate" } });

      const res = await POST(new Request("https://www.scoutit.space/api/dashboard/publish", {
        method: "POST",
        headers: { Authorization: "Bearer fixture" },
        body: JSON.stringify({
          submissionId: "new-draft-2",
          swapWithPropertyId: "existing-live-1",
        }),
      }));

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.retryable).toBe(true);
      expect(body.compensated).toBe(true);
      // Existing live listing stays live in Supabase (matching its still-approved Airtable state)
      expect(properties.get("existing-live-1").pipeline_status).toBe("approved");
      // Newly published listing was compensated back to draft so owner is not over-cap
      expect(properties.get("new-draft-2").pipeline_status).toBe("draft");
    });
  });
});
