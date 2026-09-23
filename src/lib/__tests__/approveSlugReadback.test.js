import { describe, it, expect, vi } from "vitest";

// A-146: staff approve inserted to Airtable but never read the computed Slug
// back — reopening the slug drift the owner publish path closed on both its
// paths. These pin the read-back: slug always, canonical only when none is
// owner-locked yet.

vi.mock("@/lib/adminGuard", () => ({
  requireAdmin: async () => ({ userId: "staff-1" }),
}));

const insertProperty = vi.fn(async () => ({
  id: "rec_airtable_1",
  fields: { Slug: "tower-one" },
}));
vi.mock("@/lib/airtable", () => ({
  insertProperty: (...args) => insertProperty(...args),
  isAirtableRecordNotFoundError: () => false,
}));

let capturedUpdate = null;
const submissionRow = {
  id: "sub-1",
  pipeline_status: "pending",
  slug: "old-slug",
  canonical_slug: null,
  title: "Tower One",
};

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { ...submissionRow }, error: null }),
        }),
      }),
      update: (obj) => {
        capturedUpdate = obj;
        return { eq: async () => ({ error: null }) };
      },
    }),
  },
}));

const { POST } = await import("@/app/api/admin/approve/route");

process.env.AIRTABLE_API_KEY = "keyTest";
process.env.AIRTABLE_BASE_ID = "appTest";

const req = () =>
  new Request("https://www.scoutit.space/api/admin/approve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ submissionId: "sub-1" }),
  });

describe("A-146 — staff approve persists Airtable's computed Slug", () => {
  it("writes slug and adopts canonical when none is locked", async () => {
    capturedUpdate = null;
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(capturedUpdate).toMatchObject({
      pipeline_status: "approved",
      slug: "tower-one",
      canonical_slug: "tower-one",
    });
  });

  it("never overwrites an owner-locked canonical_slug", async () => {
    submissionRow.canonical_slug = "owner-locked-slug";
    capturedUpdate = null;
    const res = await POST(req());
    expect(res.status).toBe(200);
    // Locked means untouched: the write carries no canonical key at all,
    // while slug still tracks Airtable's computed value.
    expect(capturedUpdate).toMatchObject({
      pipeline_status: "approved",
      slug: "tower-one",
    });
    expect(capturedUpdate).not.toHaveProperty("canonical_slug");
    submissionRow.canonical_slug = null;
  });
});
