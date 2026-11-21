import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/approve/route";

const db = vi.hoisted(() => ({
  row: {},
  reloadedRow: null,
  reservedIn: null,
  saved: true,
  stateUpdate: vi.fn(),
  insert: vi.fn(),
  activate: vi.fn(),
  unpublish: vi.fn(),
  deleteDraft: vi.fn(),
  purge: vi.fn(),
}));

vi.mock("@/lib/adminGuard", () => ({ requireAdmin: async () => ({ userId: "staff-1" }) }));
vi.mock("@/lib/airtable", async (importOriginal) => ({
  ...await importOriginal(),
  insertProperty: db.insert,
  updateProperty: db.activate,
  unpublishPropertyByRecordId: db.unpublish,
  deletePropertyById: db.deleteDraft,
}));
vi.mock("@/lib/cmsCache", () => ({ invalidateCmsBundle: db.purge }));
vi.mock("@/lib/systemEvents", () => ({ recordSystemEvent: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table) {
      const query = {
        select: () => query,
        eq: () => query,
        neq: () => query,
        is: () => query,
        limit: async () => ({ data: db.reservedIn === table ? [{ id: "reserved" }] : [] }),
        maybeSingle: async () => ({
          data: db.stateUpdate.mock.calls.length && db.reloadedRow ? db.reloadedRow : db.row,
        }),
        update: (patch) => {
          db.stateUpdate(patch);
          const writer = {
            eq: () => writer,
            is: () => writer,
            select: () => ({ maybeSingle: async () => ({ data: db.saved ? { id: db.row.id } : null }) }),
          };
          return writer;
        },
      };
      return query;
    },
  },
}));

const id = "f81d4fae-7dec-41d0-a765-00a0c91e6bf6";
const approve = () => POST(new Request("https://www.scoutit.space/api/admin/approve", {
  method: "POST",
  body: JSON.stringify({ submissionId: id }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AIRTABLE_API_KEY", "keyTest");
  vi.stubEnv("AIRTABLE_BASE_ID", "appTest");
  db.saved = true;
  db.reservedIn = null;
  db.reloadedRow = null;
  db.row = {
    id, title: "Tower One", slug: "unpublished-draft-slug", canonical_slug: null,
    owner_id: "owner-1", pipeline_status: "pending", lifecycle_state: "draft", publication_external_record_id: null,
  };
  db.insert.mockResolvedValue({ id: "recNew", fields: { Slug: "tower-one" } });
  db.activate.mockImplementation(async (_apiKey, _base, slug, payload) => ({
    id: payload.expectedRecordId, fields: { Slug: slug, Approved_For_ScoutIt: true },
  }));
  db.purge.mockResolvedValue({ sharedCachePurged: true });
});
afterEach(() => vi.unstubAllEnvs());

describe("staff approval and canonical address", () => {
  it("refuses quarantined PDF drafts before creating an Airtable record", async () => {
    Object.assign(db.row, { creation_source: "pdf_assisted", pipeline_status: "quarantined", pdf_verified: true });
    const response = await approve();
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ reason: "pdf_source_quarantined" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("stages privately and persists the confirmed Airtable address and identity", async () => {
    const response = await approve();
    expect(response.status).toBe(200);
    expect(db.insert).toHaveBeenCalledExactlyOnceWith("keyTest", "appTest", expect.objectContaining({ approved_for_scoutit: false }));
    expect(db.activate).toHaveBeenCalledExactlyOnceWith("keyTest", "appTest", "tower-one",
      expect.objectContaining({ approved_for_scoutit: true, expectedRecordId: "recNew" }));
    expect(db.stateUpdate).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      pipeline_status: "approved", lifecycle_state: "live", slug: "tower-one", canonical_slug: "tower-one",
      canonical_slug_locked_at: expect.any(String), published_at: expect.any(String),
      publication_external_record_id: "recNew",
    }));
  });

  it("reuses a verified previously published record without sending a title change", async () => {
    Object.assign(db.row, { canonical_slug: "owner-locked-slug", publication_external_record_id: "recBound" });
    expect((await approve()).status).toBe(200);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.activate).toHaveBeenCalledExactlyOnceWith("keyTest", "appTest", "owner-locked-slug",
      expect.objectContaining({ expectedRecordId: "recBound" }));
    expect(db.activate.mock.calls[0][3]).not.toHaveProperty("title");
    expect(db.stateUpdate).toHaveBeenCalledWith(expect.objectContaining({ slug: "owner-locked-slug", canonical_slug: "owner-locked-slug" }));
  });

  it("rejects a historical redirect before activating a staged record", async () => {
    db.reservedIn = "property_slug_history";
    expect((await approve()).status).toBe(409);
    expect(db.deleteDraft).toHaveBeenCalledExactlyOnceWith("keyTest", "appTest", "recNew");
    expect(db.activate).not.toHaveBeenCalled();
    expect(db.stateUpdate).not.toHaveBeenCalled();
  });

  it("blocks an unbound historical listing and a staff suspension", async () => {
    Object.assign(db.row, { canonical_slug: "legacy" });
    expect((await approve()).status).toBe(409);
    Object.assign(db.row, { canonical_slug: null, lifecycle_state: "staff_suspended" });
    expect((await approve()).status).toBe(409);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.activate).not.toHaveBeenCalled();
  });

  it("does not report success if the private save fails after public activation", async () => {
    db.saved = false;
    const response = await approve();
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ retryable: true, reconciliationRequired: false });
    expect(db.unpublish).toHaveBeenCalledExactlyOnceWith("keyTest", "appTest", "recNew");
    expect(db.purge).toHaveBeenCalledExactlyOnceWith({ withdrawn: [{ slug: "tower-one", recordId: "recNew" }] });
    expect(db.deleteDraft).toHaveBeenCalledExactlyOnceWith("keyTest", "appTest", "recNew");
  });

  it("leaves an already committed concurrent approval on its verified record", async () => {
    Object.assign(db.row, { canonical_slug: "tower-one", publication_external_record_id: "recBound" });
    db.reloadedRow = { ...db.row, pipeline_status: "approved", lifecycle_state: "live" };
    db.saved = false;
    const response = await approve();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ airtableId: "recBound" });
    expect(db.unpublish).not.toHaveBeenCalled();
    expect(db.deleteDraft).not.toHaveBeenCalled();
  });

  it("requires reconciliation if public rollback cannot be confirmed", async () => {
    db.saved = false;
    db.unpublish.mockRejectedValueOnce(new Error("CMS is unavailable"));
    const response = await approve();
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ retryable: false, reconciliationRequired: true });
    expect(db.deleteDraft).not.toHaveBeenCalled();
  });
});
