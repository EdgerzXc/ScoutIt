import { describe, it, expect, vi, beforeEach } from "vitest";

// A-146 (B2): properties has no seo_* columns, so staff SEO edits 500'd on
// the Supabase write before Airtable was ever reached. SEO now travels
// Airtable-only, alongside the saved row.

vi.mock("@/lib/adminGuard", () => ({
  requireAdmin: async () => ({ userId: "staff-1" }),
}));

const updateProperty = vi.fn(async () => ({ fields: { Slug: "tower-one" } }));
vi.mock("@/lib/airtable", () => ({
  updateProperty: (...a) => updateProperty(...a),
}));

let capturedPatch = null;
const CURRENT = {
  id: "p-1",
  title: "Tower One",
  details: {},
  pipeline_status: "approved",
  canonical_slug: "tower-one",
  slug: "tower-one",
};

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { ...CURRENT }, error: null }),
        }),
      }),
      update: (patch) => {
        capturedPatch = patch;
        return {
          eq: () => ({
            select: () => ({
              single: async () => ({ data: { ...CURRENT, ...patch }, error: null }),
            }),
          }),
        };
      },
    }),
  },
}));

process.env.AIRTABLE_API_KEY = "keyTest";
process.env.AIRTABLE_BASE_ID = "appTest";

const { PATCH } = await import("@/app/api/admin/property/route");

const req = (body) =>
  new Request("https://www.scoutit.space/api/admin/property", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("A-146 — staff SEO reaches Airtable without breaking the row write", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedPatch = null;
  });

  it("keeps seo keys out of Supabase and forwards them to Airtable", async () => {
    const res = await PATCH(
      req({ id: "p-1", seo_title: "T", seo_description: "D", seo_json_ld: "{}" }),
    );
    expect(res.status).toBe(200);
    expect(capturedPatch).not.toHaveProperty("seo_title");
    expect(capturedPatch).not.toHaveProperty("seo_description");
    expect(capturedPatch).not.toHaveProperty("seo_json_ld");
    const forwarded = updateProperty.mock.calls[0][3];
    expect(forwarded.seo_title).toBe("T");
    expect(forwarded.seo_description).toBe("D");
    expect(forwarded.seo_json_ld).toBe("{}");
  });

  it("still saves ordinary fields to Supabase when no SEO is sent", async () => {
    // Title is locked on live rows — use location, an unlocked field.
    const res = await PATCH(req({ id: "p-1", location: "Makati" }));
    expect(res.status).toBe(200);
    expect(capturedPatch.location).toBe("Makati");
  });
});
