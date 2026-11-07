import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { POST as relevantPost, DELETE as relevantDelete } from "@/app/api/community/signals/[id]/relevant/route";
import { POST as savePost, DELETE as saveDelete } from "@/app/api/community/signals/[id]/save/route";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));
vi.mock("@/lib/communityStore", () => ({ isMissingTable: (err) => err?.code === "42P01" }));
vi.mock("@/lib/clientIp", () => ({ clientIp: () => "127.0.0.1" }));

describe("A-311: Community Signals Counters Concurrency & Atomicity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Part 1: Atomic Relevant Counter Concurrency", () => {
    it("concurrent POST taps from two distinct users both record votes and leave exact counter = 2", async () => {
      // In-memory state simulating database tables with unique constraint
      const signalState = {
        id: "sig-concurrency-1",
        status: "live",
        relevant_count: 0,
      };
      const votes = new Set(); // Stores "signal_id:account_id"

      // Mock database behavior simulating Postgres transactions
      supabaseAdmin.from.mockImplementation((tableName) => {
        if (tableName === "stratosphere_signals") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: { ...signalState },
                  error: null,
                })),
              })),
            })),
            update: vi.fn((patch) => ({
              eq: vi.fn(async (_field, _val) => {
                if (typeof patch.relevant_count === "number") {
                  signalState.relevant_count = patch.relevant_count;
                }
                return { error: null };
              }),
            })),
          };
        }
        if (tableName === "signal_relevance") {
          return {
            insert: vi.fn(async (row) => {
              const key = `${row.signal_id}:${row.account_id}`;
              if (votes.has(key)) {
                return { error: { code: "23505", message: "duplicate key value" } };
              }
              votes.add(key);
              return { error: null };
            }),
            select: vi.fn((_fields, opts) => {
              if (opts?.head) {
                return {
                  eq: vi.fn(async () => ({
                    count: votes.size,
                    error: null,
                  })),
                };
              }
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                  })),
                })),
              };
            }),
          };
        }
        return {};
      });

      // Simulate atomic RPC recalculating from the authoritative vote count
      supabaseAdmin.rpc.mockImplementation(async (rpcName, args) => {
        if (rpcName === "sync_signal_relevant_count" && args.p_signal_id === signalState.id) {
          signalState.relevant_count = votes.size;
          return { data: votes.size, error: null };
        }
        return { data: null, error: { message: "Unknown RPC" } };
      });

      // User A taps
      resolveUserId.mockResolvedValueOnce("user-alpha");
      const reqA = new Request("https://scoutit.space/api/community/signals/sig-concurrency-1/relevant", {
        method: "POST",
      });

      // User B taps concurrently
      resolveUserId.mockResolvedValueOnce("user-beta");
      const reqB = new Request("https://scoutit.space/api/community/signals/sig-concurrency-1/relevant", {
        method: "POST",
      });

      const [resA, resB] = await Promise.all([
        relevantPost(reqA, { params: Promise.resolve({ id: "sig-concurrency-1" }) }),
        relevantPost(reqB, { params: Promise.resolve({ id: "sig-concurrency-1" }) }),
      ]);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
      expect(votes.size).toBe(2);
      expect(signalState.relevant_count).toBe(2);
    });

    it("idempotent double-tap by the same user does not double count", async () => {
      const votes = new Set(["sig-concurrency-1:user-alpha"]);
      const signalState = { id: "sig-concurrency-1", status: "live", relevant_count: 1 };

      supabaseAdmin.from.mockImplementation((tableName) => {
        if (tableName === "stratosphere_signals") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: { ...signalState }, error: null })),
              })),
            })),
          };
        }
        if (tableName === "signal_relevance") {
          return {
            insert: vi.fn(async () => ({
              error: { code: "23505", message: "duplicate key value" },
            })),
          };
        }
        return {};
      });

      resolveUserId.mockResolvedValue("user-alpha");
      const req = new Request("https://scoutit.space/api/community/signals/sig-concurrency-1/relevant", {
        method: "POST",
      });

      const res = await relevantPost(req, { params: Promise.resolve({ id: "sig-concurrency-1" }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.deduped).toBe(true);
      expect(signalState.relevant_count).toBe(1);
    });
  });

  describe("Part 2: Atomic Saved Counter Concurrency", () => {
    it("concurrent save taps from two distinct users both save and leave exact counter = 2", async () => {
      const signalState = {
        id: "sig-save-1",
        status: "live",
        saved_count: 0,
      };
      const saves = new Set();

      supabaseAdmin.from.mockImplementation((tableName) => {
        if (tableName === "stratosphere_signals") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: { ...signalState },
                  error: null,
                })),
              })),
            })),
            update: vi.fn((patch) => ({
              eq: vi.fn(async () => {
                if (typeof patch.saved_count === "number") {
                  signalState.saved_count = patch.saved_count;
                }
                return { error: null };
              }),
            })),
          };
        }
        if (tableName === "signal_saves") {
          return {
            insert: vi.fn(async (row) => {
              const key = `${row.signal_id}:${row.account_id}`;
              if (saves.has(key)) {
                return { error: { code: "23505", message: "duplicate key" } };
              }
              saves.add(key);
              return { error: null };
            }),
            select: vi.fn((_fields, opts) => {
              if (opts?.head) {
                return {
                  eq: vi.fn(async () => ({
                    count: saves.size,
                    error: null,
                  })),
                };
              }
              return {};
            }),
          };
        }
        return {};
      });

      supabaseAdmin.rpc.mockImplementation(async (rpcName, args) => {
        if (rpcName === "sync_signal_saved_count" && args.p_signal_id === signalState.id) {
          signalState.saved_count = saves.size;
          return { data: saves.size, error: null };
        }
        return { data: null, error: { message: "Unknown RPC" } };
      });

      resolveUserId.mockResolvedValueOnce("user-1");
      const req1 = new Request("https://scoutit.space/api/community/signals/sig-save-1/save", {
        method: "POST",
      });

      resolveUserId.mockResolvedValueOnce("user-2");
      const req2 = new Request("https://scoutit.space/api/community/signals/sig-save-1/save", {
        method: "POST",
      });

      const [res1, res2] = await Promise.all([
        savePost(req1, { params: Promise.resolve({ id: "sig-save-1" }) }),
        savePost(req2, { params: Promise.resolve({ id: "sig-save-1" }) }),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(saves.size).toBe(2);
      expect(signalState.saved_count).toBe(2);
    });
  });

  describe("Part 3: Migration Source Contract", () => {
    it("defines atomic subquery RPC functions and triggers in community signals migration", () => {
      const sqlPath = resolve(process.cwd(), "supabase/migrations/20260924000001_community_signals_p1.sql");
      const sql = readFileSync(sqlPath, "utf8");

      // Assert atomic RPC functions
      expect(sql).toContain("CREATE OR REPLACE FUNCTION public.sync_signal_relevant_count");
      expect(sql).toContain("SELECT count(*)::integer");
      expect(sql).toContain("FROM public.signal_relevance");
      expect(sql).toContain("CREATE OR REPLACE FUNCTION public.sync_signal_saved_count");
      expect(sql).toContain("FROM public.signal_saves");

      // Assert triggers on both relevance and saves tables
      expect(sql).toContain("CREATE TRIGGER trg_signal_relevance_sync");
      expect(sql).toContain("AFTER INSERT OR DELETE ON public.signal_relevance");
      expect(sql).toContain("CREATE TRIGGER trg_signal_saves_sync");
      expect(sql).toContain("AFTER INSERT OR DELETE ON public.signal_saves");
    });
  });
});
