import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  owned: [],
  updateError: null,
  auditError: null,
  unpublish: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => "owner-1" }));
vi.mock("@/lib/airtable", () => ({ updateProperty: state.unpublish }));
vi.mock("@/lib/cmsCache", () => ({ invalidateCmsBundle: state.invalidate }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => table === "property_lifecycle_events"
      ? { upsert: async () => ({ error: state.auditError }) }
      : {
        select: () => ({ in: () => ({ eq: async () => ({ data: state.owned, error: null }) }) }),
        update: () => ({
          in: () => ({
            eq: () => ({ select: async () => ({
              data: state.updateError ? null : state.owned.map(({ id }) => ({ id })),
              error: state.updateError,
            }) }),
          }),
        }),
      },
  },
}));

const prior = { key: process.env.AIRTABLE_API_KEY, base: process.env.AIRTABLE_BASE_ID };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.AIRTABLE_API_KEY = "test-key";
  process.env.AIRTABLE_BASE_ID = "test-base";
  state.owned = [{ id: "property-1", owner_id: "owner-1", pipeline_status: "approved", canonical_slug: "live-property" }];
  state.updateError = null;
  state.auditError = null;
  state.unpublish.mockResolvedValue({});
  state.invalidate.mockResolvedValue({ sharedCachePurged: true });
});

afterEach(() => {
  for (const [key, value] of Object.entries({ AIRTABLE_API_KEY: prior.key, AIRTABLE_BASE_ID: prior.base })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function withdraw(selection = { submissionId: "property-1" }) {
  const { POST } = await import("@/app/api/dashboard/archive/route");
  const response = await POST(new Request("https://scoutit.space/api/dashboard/archive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection),
  }));
  return { status: response.status, body: await response.json() };
}

describe("U-042 public withdrawal refresh", () => {
  it("reports a completed withdrawal with public visibility unconfirmed if Redis purge fails", async () => {
    state.invalidate.mockRejectedValue(new Error("Redis unavailable"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await withdraw();
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ success: true, withdrawnCount: 1, publicCachePending: true });
    expect(state.unpublish).toHaveBeenCalledWith("test-key", "test-base", "live-property", { approved_for_scoutit: false });
    expect(state.invalidate).toHaveBeenCalledTimes(1);
    errorLog.mockRestore();
  });

  it("purges an unpublished listing even when the lifecycle audit fails", async () => {
    state.auditError = new Error("Audit unavailable");
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await withdraw();
    expect(result.status).toBe(500);
    expect(result.body.error).toContain("audit evidence needs reconciliation");
    expect(state.unpublish).toHaveBeenCalledTimes(1);
    expect(state.invalidate).toHaveBeenCalledTimes(1);
    errorLog.mockRestore();
  });

  it("evicts only the Airtable-confirmed withdrawal when a later batch item fails", async () => {
    state.owned.push({ id: "property-2", owner_id: "owner-1", pipeline_status: "approved", canonical_slug: "still-live" });
    state.unpublish.mockResolvedValueOnce({ id: "recConfirmed" }).mockRejectedValueOnce(new Error("Airtable unavailable"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const result = await withdraw({ propertyIds: ["property-1", "property-2"] });
      expect(result.status).toBe(502);
      expect(result.body).toMatchObject({ retryable: true, publicCachePending: false });
      expect(state.invalidate).toHaveBeenCalledExactlyOnceWith({ withdrawn: [{ slug: "live-property", recordId: "recConfirmed" }] });
    } finally {
      errorLog.mockRestore();
    }
  });
});
