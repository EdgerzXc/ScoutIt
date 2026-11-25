import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOARD_SYNC_BATCH_SIZE, syncOfflineSpacesToAccount } from "@/lib/boardSync";

const db = vi.hoisted(() => ({ userId: "account-one", rows: new Map(), properties: [], fail: false, missingReactionCol: false, write: vi.fn() }));
vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => db.userId }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table) {
      if (table === "saved_intel") return { upsert: db.write };
      return {
        select: () => ({
          eq: (status, value) => ({
            in: async (column, keys) => ({
              data: db.properties.filter((property) => property[status] === value && keys.includes(property[column])),
            }),
          }),
        }),
      };
    },
  },
}));

const { POST } = await import("@/app/api/wishlist/merge/route");
const makeItems = (count) => Array.from({ length: count }, (_, index) => ({ property_id: `space-${index}` }));
const uuid = (index) => `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

function merge(body) {
  return POST(new Request("https://www.scoutit.space/api/wishlist/merge", {
    method: "POST", body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  db.userId = "account-one";
  db.rows.clear();
  db.properties = ["tower", "garden", ...makeItems(501).map(({ property_id }) => property_id)]
    .map((canonical_slug, i) => ({ id: uuid(i), canonical_slug, pipeline_status: "approved" }));
  db.fail = false;
  db.missingReactionCol = false;
  db.write.mockReset().mockImplementation((rows) => ({
    select: async () => {
      if (db.fail) return { error: { code: "XX000" } };
      if (db.missingReactionCol && rows.some((r) => "reaction_type" in r)) {
        return { error: { code: "PGRST204", message: "Could not find the 'reaction_type' column of 'saved_intel'" } };
      }
      const inserted = [];
      for (const row of rows) {
        if (!db.properties.some((property) => property.id === row.property_id)) return { error: { code: "23503" } };
        const key = `${row.user_id}:${row.property_id}`;
        if (db.rows.has(key)) continue;
        db.rows.set(key, row);
        inserted.push({ property_id: row.property_id });
      }
      return { data: inserted };
    },
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe("Board space sync", () => {
  it("acknowledges overlapping device submissions without replacing saved reactions", async () => {
    const requests = [
      { items: [{ property_id: "tower", reaction_type: "Interested" }], user_id: "another-account" },
      { propertyIds: ["tower", "garden", "garden"] },
    ];
    const responses = await Promise.all(requests.map(merge));
    expect(responses.map((res) => res.status)).toEqual([200, 200]);
    const results = await Promise.all(responses.map((res) => res.json()));
    expect(results).toMatchObject([
      { merged: 1, alreadyHad: 0, confirmedPropertyIds: ["tower"] },
      { merged: 1, alreadyHad: 1, confirmedPropertyIds: ["tower", "garden"] },
    ]);
    expect(db.rows.get(`account-one:${uuid(0)}`).reaction_type).toBe("Interested");
    expect(db.rows.has(`another-account:${uuid(0)}`)).toBe(false);
    expect(db.write.mock.calls[0][1]).toEqual({ onConflict: "user_id,property_id", ignoreDuplicates: true });
  });

  it("maps approved slugs and UUIDs to one account row and leaves unmatched or private records on-device", async () => {
    db.properties.push({ id: uuid(900), canonical_slug: "private-draft", pipeline_status: "draft" });
    const res = await merge({ propertyIds: ["tower", uuid(0), "recAirtableOnly", "private-draft", uuid(900)] });
    expect(await res.json()).toMatchObject({
      merged: 1,
      confirmedPropertyIds: ["tower", uuid(0)],
      confirmedProperties: [
        { inputId: "tower", propertyId: uuid(0), slug: "tower" },
        { inputId: uuid(0), propertyId: uuid(0), slug: "tower" },
      ],
    });
    expect(db.rows.size).toBe(1);
  });

  it("rejects an oversized or expired-session request before writing", async () => {
    expect((await merge({ items: makeItems(BOARD_SYNC_BATCH_SIZE + 1) })).status).toBe(413);
    db.userId = null;
    expect((await merge({ items: makeItems(1) })).status).toBe(401);
    expect(db.write).not.toHaveBeenCalled();
  });

  it("withholds acknowledgement on a database failure", async () => {
    db.fail = true;
    const result = await merge({ propertyIds: ["tower"] });
    expect(result.status).toBe(500);
    expect(await result.json()).not.toHaveProperty("confirmedPropertyIds");
  });

  it("batches a larger board, retains first-batch success and retries the remainder", async () => {
    const items = makeItems(BOARD_SYNC_BATCH_SIZE + 1);
    const fetchMock = vi.fn()
      .mockImplementationOnce(async (_url, options) => merge(JSON.parse(options.body)))
      .mockRejectedValueOnce(new Error("Connection lost"))
      .mockImplementationOnce(async (_url, options) => merge(JSON.parse(options.body)));
    vi.stubGlobal("fetch", fetchMock);
    const confirmed = vi.fn();
    expect(await syncOfflineSpacesToAccount("token", items, confirmed)).toEqual({
      confirmedCount: BOARD_SYNC_BATCH_SIZE, unlinkedCount: 0, signInRequired: false,
    });
    expect(confirmed).toHaveBeenCalledTimes(1);
    expect(confirmed.mock.calls[0][0]).toHaveLength(BOARD_SYNC_BATCH_SIZE);
    expect(await syncOfflineSpacesToAccount("token", items.slice(BOARD_SYNC_BATCH_SIZE), confirmed)).toEqual({
      confirmedCount: 1, unlinkedCount: 0, signInRequired: false,
    });
    expect(confirmed).toHaveBeenLastCalledWith([
      { property_id: "space-500", account_property_id: uuid(502), public_slug: "space-500" },
    ]);
    expect(db.rows.size).toBe(items.length);
  });

  it("retries without reaction_type when saved_intel lacks that column", async () => {
    db.missingReactionCol = true;
    const res = await merge({ items: [{ property_id: "tower", reaction_type: "Interested" }] });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ merged: 1, confirmedPropertyIds: ["tower"] });
    expect(db.write).toHaveBeenCalledTimes(2);
    expect(db.write.mock.calls[1][0]).toEqual([{ user_id: "account-one", property_id: uuid(0) }]);
  });
});
