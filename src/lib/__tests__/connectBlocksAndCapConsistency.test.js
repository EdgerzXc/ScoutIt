import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  checkBlockGuard,
  isBlocked,
  anyBlocked,
  anyBlockedStrict,
  _resetBlockWarningForTesting,
} from "../connectBlocks.js";
import { checkReceiverGate } from "../connectGates.js";

describe("Block and Cap Guard Consistency (A-305)", () => {
  describe("checkBlockGuard & connectBlocks", () => {
    it("returns not blocked and available when no block records exist", async () => {
      const mockAdmin = {
        from: (table) => {
          expect(table).toBe("connect_blocks");
          return {
            select: () => ({
              in: () => ({
                eq: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
              }),
            }),
          };
        },
      };

      const res = await checkBlockGuard(mockAdmin, "sender-1", ["recipient-1"]);
      expect(res).toEqual({ ok: true, blocked: false, unavailable: false });
      expect(await isBlocked(mockAdmin, "sender-1", "recipient-1")).toBe(false);
      expect(await anyBlocked(mockAdmin, "sender-1", ["recipient-1"])).toBe(false);
    });

    it("returns blocked when recipient has blocked sender", async () => {
      const mockAdmin = {
        from: (table) => ({
          select: () => ({
            in: () => ({
              eq: () => ({
                limit: async () => ({
                  data: [{ blocker_id: "recipient-1" }],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const res = await checkBlockGuard(mockAdmin, "sender-1", ["recipient-1"]);
      expect(res).toEqual({ ok: true, blocked: true, unavailable: false });
      expect(await isBlocked(mockAdmin, "sender-1", "recipient-1")).toBe(true);
      expect(await anyBlocked(mockAdmin, "sender-1", ["recipient-1"])).toBe(true);
    });

    it("fails open with warning pre-migration when table is missing and failClosed is false", async () => {
      _resetBlockWarningForTesting();
      const prevEnv = process.env.CONNECT_BLOCKS_FAIL_CLOSED;
      delete process.env.CONNECT_BLOCKS_FAIL_CLOSED;

      try {
        const mockAdmin = {
          from: () => ({
            select: () => ({
              in: () => ({
                eq: () => ({
                  limit: async () => ({
                    data: null,
                    error: { code: "42P01", message: "relation 'connect_blocks' does not exist" },
                  }),
                }),
              }),
            }),
          }),
        };

        const res = await checkBlockGuard(mockAdmin, "sender-1", ["recipient-1"]);
        expect(res).toEqual({ ok: true, blocked: false, unavailable: true });
        expect(await isBlocked(mockAdmin, "sender-1", "recipient-1")).toBe(false);
        expect(await anyBlocked(mockAdmin, "sender-1", ["recipient-1"])).toBe(false);
      } finally {
        if (prevEnv !== undefined) {
          process.env.CONNECT_BLOCKS_FAIL_CLOSED = prevEnv;
        } else {
          delete process.env.CONNECT_BLOCKS_FAIL_CLOSED;
        }
      }
    });

    it("fails closed when CONNECT_BLOCKS_FAIL_CLOSED=true or options.failClosed=true on missing table", async () => {
      _resetBlockWarningForTesting();
      const prevEnv = process.env.CONNECT_BLOCKS_FAIL_CLOSED;
      process.env.CONNECT_BLOCKS_FAIL_CLOSED = "true";

      try {
        const mockAdmin = {
          from: () => ({
            select: () => ({
              in: () => ({
                eq: () => ({
                  limit: async () => ({
                    data: null,
                    error: { code: "42P01", message: "relation 'connect_blocks' does not exist" },
                  }),
                }),
              }),
            }),
          }),
        };

        const res = await checkBlockGuard(mockAdmin, "sender-1", ["recipient-1"]);
        expect(res).toEqual({
          ok: false,
          blocked: true,
          unavailable: true,
          reason: "guard_unavailable",
        });
        expect(await isBlocked(mockAdmin, "sender-1", "recipient-1")).toBe(true);
        expect(await anyBlocked(mockAdmin, "sender-1", ["recipient-1"])).toBe(true);

        // Also works when passed explicitly via options
        delete process.env.CONNECT_BLOCKS_FAIL_CLOSED;
        const resExplicit = await checkBlockGuard(mockAdmin, "sender-1", ["recipient-1"], { failClosed: true });
        expect(resExplicit.ok).toBe(false);
        expect(resExplicit.blocked).toBe(true);
        expect(resExplicit.unavailable).toBe(true);
      } finally {
        if (prevEnv !== undefined) {
          process.env.CONNECT_BLOCKS_FAIL_CLOSED = prevEnv;
        } else {
          delete process.env.CONNECT_BLOCKS_FAIL_CLOSED;
        }
      }
    });

    it("anyBlockedStrict fails closed on missing table without throwing", async () => {
      const mockAdmin = {
        from: () => ({
          select: () => ({
            in: () => ({
              eq: () => ({
                limit: async () => ({
                  data: null,
                  error: { code: "42P01", message: "relation does not exist" },
                }),
              }),
            }),
          }),
        }),
      };

      const res = await anyBlockedStrict(mockAdmin, "sender-1", ["recipient-1"]);
      expect(res).toEqual({ ok: false, blocked: false });
    });
  });

  describe("checkReceiverGate & Bounded Cap Query", () => {
    it("bounds the query with limit to prevent O(N) whole-table scans", async () => {
      let limitArg = null;
      const mockAdmin = {
        from: (table) => {
          if (table === "user_profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "rec-1", accepting_connects: true, max_pending_connects: 5 },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "deals") {
            return {
              select: () => ({
                in: () => ({
                  limit: (n) => {
                    limitArg = n;
                    return Promise.resolve({ data: [], error: null });
                  },
                }),
              }),
            };
          }
          throw new Error("Unexpected table: " + table);
        },
      };

      const gate = await checkReceiverGate(mockAdmin, "rec-1", "prop-1");
      expect(gate).toEqual({ ok: true });
      expect(limitArg).toBe(20); // Math.min(100, Math.max(10, (5 + 5) * 2)) = 20
    });

    it("blocks when inbound requests meet or exceed cap", async () => {
      const pendingRows = [
        { id: "d1", broker_id: "rec-1", buyer_id: "other", properties: { owner_id: "other" } },
        { id: "d2", broker_id: "other", buyer_id: "other", properties: { owner_id: "rec-1" } },
      ];

      const mockAdmin = {
        from: (table) => {
          if (table === "user_profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "rec-1", accepting_connects: true, max_pending_connects: 2 },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              in: () => ({
                limit: () => Promise.resolve({ data: pendingRows, error: null }),
              }),
            }),
          };
        },
      };

      const gate = await checkReceiverGate(mockAdmin, "rec-1", "prop-1");
      expect(gate.ok).toBe(false);
      expect(gate.reason).toBe("capped");
    });

    it("applies a default bounded cap for free inquiries when profile cap is NULL", async () => {
      let queryExecuted = false;
      const mockAdmin = {
        from: (table) => {
          if (table === "user_profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "rec-1", accepting_connects: true, max_pending_connects: null },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "deals") {
            queryExecuted = true;
            return {
              select: () => ({
                in: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            };
          }
        },
      };

      // For paid send (isFreeInquiry false): NULL cap is unlimited, deals table not even queried
      const paidGate = await checkReceiverGate(mockAdmin, "rec-1", "prop-1", null, { isFreeInquiry: false });
      expect(paidGate).toEqual({ ok: true });
      expect(queryExecuted).toBe(false);

      // For free inquiry (isFreeInquiry true): fallback bounded cap applies and queries deals
      const freeGate = await checkReceiverGate(mockAdmin, "rec-1", "prop-1", null, { isFreeInquiry: true });
      expect(freeGate).toEqual({ ok: true });
      expect(queryExecuted).toBe(true);
    });

    it("rejects when account has paused connects", async () => {
      const mockAdmin = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "rec-1", accepting_connects: false, max_pending_connects: null },
                error: null,
              }),
            }),
          }),
        }),
      };

      const gate = await checkReceiverGate(mockAdmin, "rec-1", "prop-1");
      expect(gate.ok).toBe(false);
      expect(gate.reason).toBe("paused");
    });
  });

  describe("Missing-table fixture: Paid sends block, Free inquiries land under cap", () => {
    it("paid deals route blocks with 503 on missing table under post-O-004 fail-closed posture", async () => {
      process.env.CONNECT_BLOCKS_FAIL_CLOSED = "true";
      try {
        const mockMissingTableAdmin = {
          from: (table) => {
            if (table === "connect_blocks") {
              return {
                select: () => ({
                  in: () => ({
                    eq: () => ({
                      limit: async () => ({
                        data: null,
                        error: { code: "42P01", message: "relation 'connect_blocks' does not exist" },
                      }),
                    }),
                  }),
                }),
              };
            }
            throw new Error("Unexpected table: " + table);
          },
        };

        const guard = await checkBlockGuard(mockMissingTableAdmin, "sender-1", ["recipient-1"]);
        expect(guard.ok).toBe(false);
        expect(guard.unavailable).toBe(true);
        expect(guard.blocked).toBe(true);
      } finally {
        delete process.env.CONNECT_BLOCKS_FAIL_CLOSED;
      }
    });

    it("free inquiry route checks receiver cap and lands when under cap even if connect_blocks table is missing", async () => {
      const mockMissingTableAdmin = {
        from: (table) => {
          if (table === "connect_blocks") {
            return {
              select: () => ({
                in: () => ({
                  eq: () => ({
                    limit: async () => ({
                      data: null,
                      error: { code: "42P01", message: "relation 'connect_blocks' does not exist" },
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "user_profiles") {
            return {
              select: () => ({
                eq: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: { id: "sender-1" }, error: null }),
                  }),
                  maybeSingle: async () => ({
                    data: { id: "recipient-1", accepting_connects: true, max_pending_connects: 10 },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "deals") {
            return {
              select: () => ({
                in: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            };
          }
        },
      };

      // 1. anyBlockedStrict returns ok: false, blocked: false on missing table
      const blockState = await anyBlockedStrict(mockMissingTableAdmin, "sender-1", ["recipient-1"]);
      expect(blockState.blocked).toBe(false);

      // 2. checkReceiverGate succeeds because recipient is under cap (0 < 10)
      const gate = await checkReceiverGate(mockMissingTableAdmin, "recipient-1", "prop-1", null, { isFreeInquiry: true });
      expect(gate.ok).toBe(true);
      // Result: Free inquiry lands!
    });
  });

  describe("Source code contracts", () => {
    it("inquiries route imports anyBlockedStrict and checkReceiverGate and enforces them", () => {
      const src = readFileSync("src/app/api/inquiries/route.js", "utf8");
      expect(src).toContain("import { anyBlockedStrict } from \"@/lib/connectBlocks\";");
      expect(src).toContain("import { checkReceiverGate } from \"@/lib/connectGates\";");
      expect(src).toContain("checkReceiverGate(supabaseAdmin, recipient.recipientId");
      expect(src).toContain("anyBlockedStrict(supabaseAdmin, senderId, recipientIds)");
      expect(src).toContain("isFreeInquiry: true");
    });

    it("deals initiate route uses checkBlockGuard and handles unavailable guard with 503", () => {
      const src = readFileSync("src/app/api/deals/initiate/route.js", "utf8");
      expect(src).toContain("checkBlockGuard");
      expect(src).toContain("blockGuard.unavailable");
      expect(src).toContain("status: 503");
    });

    it("deals pitch route uses checkBlockGuard and handles unavailable guard with 503", () => {
      const src = readFileSync("src/app/api/deals/pitch/route.js", "utf8");
      expect(src).toContain("checkBlockGuard");
      expect(src).toContain("blockGuard.unavailable");
      expect(src).toContain("status: 503");
    });

    it("deals manual POST route uses checkBlockGuard and handles unavailable guard with 503", () => {
      const src = readFileSync("src/app/api/deals/route.js", "utf8");
      expect(src).toContain("checkBlockGuard");
      expect(src).toContain("blockGuard.unavailable");
      expect(src).toContain("status: 503");
    });

    it("dashboard invite route uses checkBlockGuard and handles unavailable guard with 503", () => {
      const src = readFileSync("src/app/api/dashboard/invite/route.js", "utf8");
      expect(src).toContain("checkBlockGuard");
      expect(src).toContain("blockGuard.unavailable");
      expect(src).toContain("status: 503");
    });
  });
});
