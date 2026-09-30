import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  current: null,
  invalidate: vi.fn(),
  updateProperty: vi.fn(),
  updateRow: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "owner-1" } }, error: null }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: state.current, error: null }) }) }),
      update: (payload) => {
        state.updateRow(payload);
        return { eq: () => ({ select: async () => ({ data: [{ id: state.current.id }], error: null }) }) };
      },
    }),
  }),
}));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: {} }));
vi.mock("@/lib/airtable", () => ({ updateProperty: state.updateProperty }));
vi.mock("@/lib/cmsCache", () => ({ invalidateCmsBundle: state.invalidate }));
vi.mock("@/lib/notifications", () => ({ notifyAttachedBrokers: vi.fn() }));

const prior = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  role: process.env.SUPABASE_SERVICE_ROLE_KEY,
  airtable: process.env.AIRTABLE_API_KEY,
  base: process.env.AIRTABLE_BASE_ID,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service";
  process.env.AIRTABLE_API_KEY = "test-airtable";
  process.env.AIRTABLE_BASE_ID = "test-base";
  state.current = {
    id: "property-1",
    owner_id: "owner-1",
    title: "Original title",
    type: "Commercial",
    location: "Taguig",
    details: {},
    canonical_slug: "original-title",
    pipeline_status: "draft",
  };
  state.invalidate.mockResolvedValue({ sharedCachePurged: true });
  state.updateProperty.mockResolvedValue({});
});

afterEach(() => {
  for (const [key, value] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: prior.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: prior.anon,
    SUPABASE_SERVICE_ROLE_KEY: prior.role,
    AIRTABLE_API_KEY: prior.airtable,
    AIRTABLE_BASE_ID: prior.base,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function update() {
  const { POST } = await import("@/app/api/dashboard/update/route");
  const response = await POST(new Request("https://scoutit.space/api/dashboard/update", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer test-session" },
    body: JSON.stringify({ submissionId: "property-1", data: { location: "Makati" } }),
  }));
  return { status: response.status, body: await response.json() };
}

describe("U-042 owner edit refresh budget", () => {
  it("saves a private draft without spending the next public CMS rebuild", async () => {
    expect(await update()).toEqual({ status: 200, body: { success: true, publicCachePending: false } });
    expect(state.updateRow).toHaveBeenCalledTimes(1);
    expect(state.updateProperty).not.toHaveBeenCalled();
    expect(state.invalidate).not.toHaveBeenCalled();
  });

  it("purges the shared catalogue after a live edit", async () => {
    state.current.pipeline_status = "approved";
    expect(await update()).toEqual({ status: 200, body: { success: true, publicCachePending: false } });
    expect(state.updateProperty).toHaveBeenCalledTimes(1);
    expect(state.invalidate).toHaveBeenCalledTimes(1);
  });

  it("keeps the completed live edit successful but flags an unconfirmed public refresh", async () => {
    state.current.pipeline_status = "approved";
    state.invalidate.mockRejectedValue(new Error("Redis unavailable"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await update()).toEqual({ status: 200, body: { success: true, publicCachePending: true } });
    expect(state.updateProperty).toHaveBeenCalledTimes(1);
    expect(state.updateRow).toHaveBeenCalledTimes(1);
    errorLog.mockRestore();
  });
});
