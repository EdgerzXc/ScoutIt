import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ insert: vi.fn(), user: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({}) }));
vi.mock("@/lib/workspaceRequestAuth", () => ({ getVerifiedWorkspaceUser: mocks.user }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: () => ({ insert: mocks.insert }) },
}));

import { POST } from "@/app/api/dashboard/bulk-insert/route";

beforeEach(() => {
  mocks.user.mockResolvedValue({ data: { user: { id: "owner" } } });
  mocks.insert.mockClear();
  mocks.insert.mockImplementation((rows) => ({ select: async () => ({ data: rows, error: null }) }));
});

async function importDraft(property) {
  return POST(new Request("https://scoutit.space/api/dashboard/bulk-insert", {
    method: "POST", headers: { Authorization: "Bearer synthetic", "Content-Type": "application/json" },
    body: JSON.stringify({ properties: [property] }),
  }));
}

describe("owner CSV draft database boundary", () => {
  it("preserves editable data and derives all publication fields on the server", async () => {
    const response = await importDraft({
      title: "Fixture listing", price: "₱1,250.00", type: "commercial", location: "",
      details: { "Fixture Note": "  =internal note" }, owner_id: "ignored",
      airtable_record_id: "ignored", publication_external_record_id: "ignored",
      canonical_slug: "ignored", pipeline_status: "approved", pdf_verified: true,
    });
    expect(response.status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledExactlyOnceWith([{
      title: "Fixture listing", type: "commercial", location: "", price: 1250,
      details: { "Fixture Note": "internal note" }, owner_id: "owner",
      pipeline_status: "pending", lifecycle_state: "draft", moderation_status: "pending", canonical_slug: null,
    }]);
  });

  it("rejects invalid typed fields before contacting Supabase", async () => {
    const response = await importDraft({ title: "Fixture listing", media_link: "file:///fixture.jpg" });
    expect(response.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
