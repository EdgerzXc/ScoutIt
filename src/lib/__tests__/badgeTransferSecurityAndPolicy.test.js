import { describe, expect, it, vi, beforeEach } from "vitest";
import crypto from "crypto";
import fs from "fs";
import path from "path";

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      admin: {
        listUsers: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
}));

import { POST as transferPost } from "@/app/api/badges/transfer/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import {
  CURRENT_TERMS_VERSION,
  CURRENT_TERMS_EFFECTIVE_DATE,
  CURRENT_TERMS_SNAPSHOT_HASH,
} from "@/lib/legalVersions";

describe("Badge Transfer Security & Statutory Terms Integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Badge Transfer Security & Reassignment Tightening", () => {
    it("rejects unauthorized caller", async () => {
      resolveUserId.mockResolvedValue(null);

      const req = new Request("https://scoutit.space/api/badges/transfer", {
        method: "POST",
        body: JSON.stringify({ badgeId: "PIONEER_BROKER", recipientUserId: "usr-2" }),
      });

      const res = await transferPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/Unauthorized/i);
    });

    it("rejects self-transfer attempt (identical sender and recipient)", async () => {
      resolveUserId.mockResolvedValue("usr-sender-1");

      const req = new Request("https://scoutit.space/api/badges/transfer", {
        method: "POST",
        body: JSON.stringify({ badgeId: "PIONEER_BROKER", recipientUserId: "usr-sender-1" }),
      });

      const res = await transferPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Cannot transfer a charter seat to yourself/i);
    });

    it("resolves recipient by email via auth.admin.listUsers with case-insensitivity", async () => {
      resolveUserId.mockResolvedValue("usr-sender-1");

      supabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [
            { id: "usr-recipient-99", email: "Accredited.Broker@scoutit.space" },
          ],
        },
        error: null,
      });

      // Recipient profile lookup
      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "user_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "usr-recipient-99", role: "broker", active_roles: ["broker"], is_banned: false },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "user_badges") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((col, val) => {
                if (val === "usr-sender-1") {
                  return {
                    eq: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: "badge-row-1",
                          user_id: "usr-sender-1",
                          badge_id: "PIONEER_BROKER",
                          seat_number: 12,
                          is_transferable: true,
                          transfer_locked_until: null,
                        },
                        error: null,
                      }),
                    }),
                  };
                }
                // Recipient badges check (no pioneer badges)
                return {
                  select: vi.fn().mockResolvedValue({ data: [], error: null }),
                  then: (cb) => cb({ data: [], error: null }),
                };
              }),
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      });

      supabaseAdmin.rpc.mockResolvedValue({
        data: [{ success: true, badge_record: { badge_id: "PIONEER_BROKER", seat_number: 12 } }],
        error: null,
      });

      const req = new Request("https://scoutit.space/api/badges/transfer", {
        method: "POST",
        body: JSON.stringify({
          badgeId: "PIONEER_BROKER",
          recipientEmail: "accredited.broker@scoutit.space",
        }),
      });

      const res = await transferPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.transferredTo).toBe("usr-recipient-99");
      expect(json.seatLabel).toBe("Charter #012");
    });

    it("rejects transfer to a suspended or banned recipient account", async () => {
      resolveUserId.mockResolvedValue("usr-sender-1");

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "user_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "usr-banned-recipient",
                    role: "broker",
                    active_roles: ["broker"],
                    is_banned: true,
                    status: "suspended",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const req = new Request("https://scoutit.space/api/badges/transfer", {
        method: "POST",
        body: JSON.stringify({
          badgeId: "PIONEER_BROKER",
          recipientUserId: "usr-banned-recipient",
        }),
      });

      const res = await transferPost(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/suspended, banned, or deactivated/i);
    });

    it("rejects transfer if recipient role does not match charter accreditation", async () => {
      resolveUserId.mockResolvedValue("usr-sender-1");

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "user_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "usr-seeker-only",
                    role: "seeker",
                    active_roles: ["seeker", "buyer"],
                    is_banned: false,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "user_badges") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "badge-row-1",
                      user_id: "usr-sender-1",
                      badge_id: "PIONEER_BROKER",
                      is_transferable: true,
                      transfer_locked_until: null,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      const req = new Request("https://scoutit.space/api/badges/transfer", {
        method: "POST",
        body: JSON.stringify({
          badgeId: "PIONEER_BROKER",
          recipientUserId: "usr-seeker-only",
        }),
      });

      const res = await transferPost(req);
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Recipient must have an accredited broker role/i);
    });

    it("enforces strict 'One Pioneer Per Account' on recipient", async () => {
      resolveUserId.mockResolvedValue("usr-sender-1");

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "user_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "usr-existing-pioneer",
                    role: "owner",
                    active_roles: ["owner"],
                    is_banned: false,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "user_badges") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((col, val) => {
                if (val === "usr-sender-1") {
                  return {
                    eq: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: "badge-row-1",
                          user_id: "usr-sender-1",
                          badge_id: "PIONEER_OWNER",
                          is_transferable: true,
                          transfer_locked_until: null,
                        },
                        error: null,
                      }),
                    }),
                  };
                }
                // Recipient already holds PIONEER_CREATOR
                return Promise.resolve({
                  data: [{ badge_id: "PIONEER_CREATOR", seat_number: 3 }],
                  error: null,
                });
              }),
            }),
          };
        }
      });

      const req = new Request("https://scoutit.space/api/badges/transfer", {
        method: "POST",
        body: JSON.stringify({
          badgeId: "PIONEER_OWNER",
          recipientUserId: "usr-existing-pioneer",
        }),
      });

      const res = await transferPost(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toMatch(/strictly limited to one Pioneer seat/i);
    });

    it("rejects transfer when charter is under vesting lock", async () => {
      resolveUserId.mockResolvedValue("usr-sender-locked");

      const futureDate = new Date(Date.now() + 100 * 86400 * 1000).toISOString();

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "user_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "usr-recipient-1", role: "broker", active_roles: ["broker"] },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "user_badges") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "badge-row-locked",
                      user_id: "usr-sender-locked",
                      badge_id: "PIONEER_BROKER",
                      is_transferable: true,
                      transfer_locked_until: futureDate,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      const req = new Request("https://scoutit.space/api/badges/transfer", {
        method: "POST",
        body: JSON.stringify({
          badgeId: "PIONEER_BROKER",
          recipientUserId: "usr-recipient-1",
        }),
      });

      const res = await transferPost(req);
      expect(res.status).toBe(423);
      const json = await res.json();
      expect(json.error).toMatch(/transfer vesting lock/i);
    });
  });

  describe("2. Statutory Terms & Policy Governance (Section 09 & Version Integrity)", () => {
    const termsPath = path.resolve(process.cwd(), "src/app/terms/page.js");
    const privacyPath = path.resolve(process.cwd(), "src/app/privacy/page.js");
    const termsContent = fs.readFileSync(termsPath, "utf8");
    const privacyContent = fs.readFileSync(privacyPath, "utf8");

    it("verifies Terms of Service has exactly 20 structured sections", () => {
      const sectionMatches = termsContent.match(/num:\s*["'](\d{2})["']/g);
      expect(sectionMatches).toBeDefined();
      expect(sectionMatches.length).toBe(20);
    });

    it("includes Section 09 dedicated to Pioneer Charters & operational incentives", () => {
      expect(termsContent).toContain('num: "09"');
      expect(termsContent).toContain('title: "Pioneer Charters, honors, operational incentives, and transfer rules"');
    });

    it("expressly declares Pioneer Charters as non-equity and non-securities under RA 8799", () => {
      expect(termsContent).toContain("Republic Act No. 8799");
      expect(termsContent).toContain("Securities Regulation Code of the Philippines");
      expect(termsContent).toContain("DO NOT constitute shares of capital stock, equity ownership");
      expect(termsContent).toContain("NO PROFIT-SHARING OR DIVIDENDS");
      expect(termsContent).toContain("ScoutIt does not distribute company revenues, profits, dividends");
    });

    it("articulates operational software incentives and privileges", () => {
      expect(termsContent).toContain("Lifetime Subscription Rate Lock");
      expect(termsContent).toContain("Fast-Track Processing Queue Prioritization");
      expect(termsContent).toContain("VIP Customer Support SLA");
      expect(termsContent).toContain("Pre-Release Editorial & Feature Access");
      expect(termsContent).toContain("Spatial Dossier & Directory Accreditations");
    });

    it("enshrines scarcity caps and strict 'One Pioneer Per Account' anti-monopoly rule", () => {
      expect(termsContent).toContain("Pioneer Brokers (25 seats)");
      expect(termsContent).toContain("Pioneer Owners (20 seats)");
      expect(termsContent).toContain("Pioneer Creators (15 seats)");
      expect(termsContent).toContain("Founding Seekers (100 seats)");
      expect(termsContent).toContain("Alpha Cartographers (5 seats)");
      expect(termsContent).toContain("ONE (1) Pioneer Charter seat across all categories");
      expect(termsContent).toContain("Anti-Sybil Prohibition");
    });

    it("governs secondary transfers with 180-day vesting and 90-day cooldown", () => {
      expect(termsContent).toContain("one-hundred eighty (180) day initial vesting period");
      expect(termsContent).toContain("ninety (90) day cooldown lock");
      expect(termsContent).toContain("Private Consideration Disclaimer");
      expect(termsContent).toContain("REVOCATION FOR CAUSE:");
    });

    it("synchronizes Privacy Policy Section 02 to cover Pioneer Charter applicants", () => {
      expect(privacyContent).toContain("Pioneer Charter & Badge Applicants");
    });

    it("verifies that CURRENT_TERMS_SNAPSHOT_HASH matches exact sha256(terms + privacy)", () => {
      const computedHash = crypto
        .createHash("sha256")
        .update(termsContent + privacyContent)
        .digest("hex");

      expect(CURRENT_TERMS_VERSION).toBe("pilot-2026-11-09");
      expect(CURRENT_TERMS_EFFECTIVE_DATE).toBe("November 9, 2026");
      expect(CURRENT_TERMS_SNAPSHOT_HASH).toBe(computedHash);
    });
  });
});
