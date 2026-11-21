import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/dashboard/delete/route";

const state = vi.hoisted(() => ({
  property: {},
  update: vi.fn(),
  selectUpdated: vi.fn(),
  audit: vi.fn(),
  unpublish: vi.fn(),
  purge: vi.fn(),
}));

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => "owner-1" }));
vi.mock("@/lib/propertyReauthentication", () => ({
  getBearerToken: () => "test-token",
  hasRecentPasswordAuthentication: () => true,
}));
vi.mock("@/lib/airtable", () => ({ unpublishBoundProperty: state.unpublish }));
vi.mock("@/lib/cmsCache", () => ({ invalidateCmsBundle: state.purge }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table) {
      if (table === "properties") {
        return {
          select: () => ({ eq: () => ({ single: async () => ({ data: state.property }) }) }),
          update: state.update,
        };
      }
      if (table === "property_lifecycle_events") return { insert: state.audit, upsert: state.audit };
      return { select: () => ({ eq: async () => ({ data: [] }) }) };
    },
  },
}));

function remove() {
  return POST(new Request("https://scoutit.space/api/dashboard/delete", {
    method: "POST",
    body: JSON.stringify({
      submissionId: "property-1",
      confirmationTitle: "Example",
      confirmPermanentRemoval: true,
    }),
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  state.property = {
    id: "property-1",
    owner_id: "owner-1",
    title: "Example",
    pipeline_status: "archived",
    lifecycle_state: "off_market",
    canonical_slug: "example",
    publication_external_record_id: "recBound",
  };
  const query = { eq: () => query, select: state.selectUpdated };
  state.update.mockReturnValue(query);
  state.selectUpdated.mockResolvedValue({ data: [{ id: "property-1" }] });
  state.audit.mockResolvedValue({});
  state.purge.mockResolvedValue({ sharedCachePurged: true });
});

describe("retained removal publication binding", () => {
  it("reconfirms an off-market listing's exact Airtable record before writing and purging", async () => {
    vi.stubEnv("AIRTABLE_API_KEY", "test-key");
    vi.stubEnv("AIRTABLE_BASE_ID", "test-base");
    try {
      const response = await remove();
      expect(response.status).toBe(200);
      expect(state.unpublish).toHaveBeenCalledExactlyOnceWith("test-key", "test-base", { slug: "example", recordId: "recBound" });
      expect(state.unpublish.mock.invocationCallOrder[0]).toBeLessThan(state.update.mock.invocationCallOrder[0]);
      expect(state.purge).toHaveBeenCalledExactlyOnceWith({ withdrawn: [{ slug: "example", recordId: "recBound" }] });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("leaves an unbound historical record and the cache alone", async () => {
    delete state.property.publication_external_record_id;
    const response = await remove();
    expect(response.status).toBe(409);
    expect(state.unpublish).not.toHaveBeenCalled();
    expect(state.update).not.toHaveBeenCalled();
    expect(state.purge).not.toHaveBeenCalled();
  });

  it("retains a never-published draft without using a draft slug for an Airtable mutation", async () => {
    Object.assign(state.property, { pipeline_status: "draft", lifecycle_state: "draft", slug: "example" });
    delete state.property.canonical_slug;
    delete state.property.publication_external_record_id;
    const response = await remove();
    expect(response.status).toBe(200);
    expect(state.update).toHaveBeenCalledTimes(1);
    expect(state.unpublish).not.toHaveBeenCalled();
    expect(state.purge).not.toHaveBeenCalled();
  });
});
