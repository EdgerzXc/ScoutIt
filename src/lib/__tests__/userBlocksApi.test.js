import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/user/blocks/route";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isBlocked, anyBlocked, addBlock, removeBlock, listBlocks } from "@/lib/connectBlocks";

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

describe("/api/user/blocks API endpoint (A-144 Connect Rules v1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("user-1");
  });

  it("rejects unauthenticated GET requests with 401", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue(null);
    const req = new Request("https://www.scoutit.space/api/user/blocks");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated POST requests with 401", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue(null);
    const req = new Request("https://www.scoutit.space/api/user/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedId: "user-2" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated DELETE requests with 401", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue(null);
    const req = new Request("https://www.scoutit.space/api/user/blocks?blockedId=user-2", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("POST rejects self-blocking with 400", async () => {
    const req = new Request("https://www.scoutit.space/api/user/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedId: "user-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Cannot block your own account/i);
  });

  it("POST rejects missing blockedId with 400", async () => {
    const req = new Request("https://www.scoutit.space/api/user/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST successfully adds block to connect_blocks", async () => {
    let upsertedRow = null;
    supabaseAdmin.from = vi.fn().mockReturnValue({
      upsert: vi.fn().mockImplementation((row) => {
        upsertedRow = row;
        return Promise.resolve({ error: null });
      }),
    });

    const req = new Request("https://www.scoutit.space/api/user/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedId: "user-2" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(upsertedRow).toEqual({ blocker_id: "user-1", blocked_id: "user-2" });
  });

  it("DELETE removes block from connect_blocks", async () => {
    let deleted = false;
    supabaseAdmin.from = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(() => {
            deleted = true;
            return Promise.resolve({ error: null });
          }),
        }),
      }),
    });

    const req = new Request("https://www.scoutit.space/api/user/blocks?blockedId=user-2", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(deleted).toBe(true);
  });

  it("GET lists blocked accounts enriched with user_profiles display_name", async () => {
    supabaseAdmin.from = vi.fn().mockImplementation((table) => {
      if (table === "connect_blocks") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { blocked_id: "user-2", created_at: "2026-10-11T12:00:00Z" },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "user_profiles") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { id: "user-2", display_name: "Broker Juan", headline: "RESA Certified" },
              ],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    const req = new Request("https://www.scoutit.space/api/user/blocks");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.blocks).toHaveLength(1);
    expect(json.blocks[0]).toMatchObject({
      blocked_id: "user-2",
      display_name: "Broker Juan",
      headline: "RESA Certified",
    });
  });
});

describe("connectBlocks domain logic (A-144 invariant #6)", () => {
  it("isBlocked returns false for self", async () => {
    expect(await isBlocked({}, "user-1", "user-1")).toBe(false);
  });

  it("isBlocked queries connect_blocks correctly", async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [{ blocker_id: "rec-1" }], error: null }),
            }),
          }),
        }),
      }),
    };
    expect(await isBlocked(mockClient, "sender-1", "rec-1")).toBe(true);
  });

  it("anyBlocked returns true if any recipient has blocked sender", async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() =>
                Promise.resolve({ data: [{ blocker_id: "rec-2" }], error: null })
              ),
            }),
          }),
        }),
      }),
    };
    expect(await anyBlocked(mockClient, "sender-1", ["rec-1", "rec-2"])).toBe(true);
  });

  it("addBlock prevents self block", async () => {
    const res = await addBlock({}, "user-1", "user-1");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Cannot block yourself/);
  });

  it("removeBlock deletes correctly", async () => {
    let called = false;
    const mockClient = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => {
              called = true;
              return Promise.resolve({ error: null });
            }),
          }),
        }),
      }),
    };
    const res = await removeBlock(mockClient, "user-1", "user-2");
    expect(res.ok).toBe(true);
    expect(called).toBe(true);
  });

  it("listBlocks returns empty array if no client", async () => {
    expect(await listBlocks(null, "user-1")).toEqual([]);
  });
});
