import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canAccessDashboardWorkspace,
} from "@/lib/dashboardModes";
import {
  hasActiveRole,
  getCurrentRole,
  getCurrentTier,
  syncAuthenticatedUserCache,
} from "@/lib/entitlements";
import { accountClassFor, capacityFor } from "@/lib/communityPosting";
import { deckOrderForRole } from "@/lib/workspaceDeck";
import { POST as activateRolePOST } from "@/app/api/user/activate-role/route";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

const read = (relPath) => readFileSync(resolve(process.cwd(), relPath), "utf8");

describe("A-274 — Comprehensive Role & Authorization Logic Deep-Dive", () => {
  describe("1. Dashboard Workspace Access Control (canAccessDashboardWorkspace)", () => {
    it("allows buyer / seeker / exploring workspace as universal baseline for all accounts", () => {
      expect(canAccessDashboardWorkspace("buyer", [])).toBe(true);
      expect(canAccessDashboardWorkspace("seeker", ["buyer"])).toBe(true);
      expect(canAccessDashboardWorkspace("exploring", ["owner"])).toBe(true);
    });

    it("denies specialized workspaces when the user only holds buyer", () => {
      const held = ["buyer"];
      expect(canAccessDashboardWorkspace("owner", held)).toBe(false);
      expect(canAccessDashboardWorkspace("broker", held)).toBe(false);
      expect(canAccessDashboardWorkspace("salesperson", held)).toBe(false);
      expect(canAccessDashboardWorkspace("provider", held)).toBe(false);
      expect(canAccessDashboardWorkspace("photographer", held)).toBe(false);
      expect(canAccessDashboardWorkspace("designer", held)).toBe(false);
      expect(canAccessDashboardWorkspace("operator", held)).toBe(false);
      expect(canAccessDashboardWorkspace("mc_enterprise", held)).toBe(false);
      expect(canAccessDashboardWorkspace("mc_staff", held)).toBe(false);
    });

    it("permits specialized workspaces only when the matching role or alias is held", () => {
      expect(canAccessDashboardWorkspace("owner", ["buyer", "owner"])).toBe(true);
      expect(canAccessDashboardWorkspace("broker", ["buyer", "broker"])).toBe(true);
      expect(canAccessDashboardWorkspace("broker", ["buyer", "salesperson"])).toBe(true);
      expect(canAccessDashboardWorkspace("provider", ["buyer", "photographer"])).toBe(true);
      expect(canAccessDashboardWorkspace("provider", ["buyer", "designer"])).toBe(true);
      expect(canAccessDashboardWorkspace("operator", ["buyer", "operator"])).toBe(true);
      expect(canAccessDashboardWorkspace("mc_enterprise", ["buyer", "mc_enterprise"])).toBe(true);
    });

    it("permits canonical staff (admin / staff) to inspect any valid workspace, but rejects non-canonical 'superuser'", () => {
      expect(canAccessDashboardWorkspace("owner", ["admin"])).toBe(true);
      expect(canAccessDashboardWorkspace("mc_enterprise", ["staff"])).toBe(true);
      expect(canAccessDashboardWorkspace("mc_staff", ["admin"])).toBe(true);
      expect(canAccessDashboardWorkspace("owner", ["superuser"])).toBe(false);
      expect(canAccessDashboardWorkspace("mc_enterprise", ["superuser"])).toBe(false);
    });

    it("fails closed on unknown or empty requested roles", () => {
      expect(canAccessDashboardWorkspace("", ["admin"])).toBe(false);
      expect(canAccessDashboardWorkspace("unknown_role", ["admin"])).toBe(false);
    });
  });

  describe("2. Entitlements & Multi-Role Cache Sync (hasActiveRole & syncAuthenticatedUserCache)", () => {
    beforeEach(() => {
      const store = new Map();
      vi.stubGlobal("window", {
        dispatchEvent: vi.fn(),
      });
      vi.stubGlobal("localStorage", {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        length: 0,
        key: () => null,
      });
    });

    it("equates buyer and seeker in hasActiveRole and preserves specialized multi-roles", () => {
      syncAuthenticatedUserCache({
        id: "user-123",
        role: "owner",
        primaryMode: "owner",
        active_roles: ["buyer", "owner", "photographer", "provider"],
        subscription_tier: "cluster",
      });

      expect(getCurrentTier()).toBe("cluster");
      expect(getCurrentRole()).toBe("owner");
      expect(hasActiveRole("buyer")).toBe(true);
      expect(hasActiveRole("seeker")).toBe(true);
      expect(hasActiveRole("owner")).toBe(true);
      expect(hasActiveRole("photographer")).toBe(true);
      expect(hasActiveRole("provider")).toBe(true);
      expect(hasActiveRole("broker")).toBe(false);
      expect(hasActiveRole("admin")).toBe(false);
    });

    it("clears the authenticated user cache on sign-out", () => {
      syncAuthenticatedUserCache({
        id: "user-123",
        role: "broker",
        active_roles: ["buyer", "broker"],
        subscription_tier: "universe",
      });
      expect(hasActiveRole("broker")).toBe(true);

      syncAuthenticatedUserCache(null);
      expect(getCurrentTier()).toBe("starry");
      expect(hasActiveRole("broker")).toBe(false);
    });
  });

  describe("3. Community Signal Account Class Resolution (accountClassFor)", () => {
    it("resolves capacity classes across both role and active_roles array with highest-capacity precedence", () => {
      expect(accountClassFor({ role: "seeker", active_roles: ["buyer"] })).toBe("standard");
      expect(capacityFor("standard")).toBe(3);

      expect(accountClassFor({ role: "seeker", active_roles: ["buyer", "owner"] })).toBe("owner");
      expect(capacityFor("owner")).toBe(5);

      expect(accountClassFor({ role: "seeker", active_roles: ["buyer", "operator"] })).toBe("business");
      expect(capacityFor("business")).toBe(5);

      expect(accountClassFor({ role: "seeker", active_roles: ["buyer", "owner", "broker"] })).toBe("broker");
      expect(capacityFor("broker")).toBe(10);
    });
  });

  describe("4. Workspace Deck Role Normalization (deckOrderForRole)", () => {
    it("normalizes raw role aliases before selecting deck order", () => {
      expect(deckOrderForRole("salesperson")).toEqual(deckOrderForRole("broker"));
      expect(deckOrderForRole("photographer")).toEqual(deckOrderForRole("provider"));
      expect(deckOrderForRole("designer")).toEqual(deckOrderForRole("provider"));
      expect(deckOrderForRole("seeker")).toEqual(deckOrderForRole("buyer"));
    });
  });

  describe("5. Role Activation API Security Gates (POST /api/user/activate-role)", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    const makeReq = (body) =>
      new Request("http://localhost/api/user/activate-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    it("rejects unauthenticated requests with 401", async () => {
      serverAuth.resolveUserId.mockResolvedValue(null);
      const res = await activateRolePOST(makeReq({ role: "owner", data: {} }));
      expect(res.status).toBe(401);
    });

    it("rejects archived, shadowbanned, or underage accounts with 403", async () => {
      serverAuth.resolveUserId.mockResolvedValue("user-blocked");

      for (const blockedState of [
        { archived_at: "2026-10-01T00:00:00Z", is_shadowbanned: false, adult_eligibility_status: "declared_adult" },
        { archived_at: null, is_shadowbanned: true, adult_eligibility_status: "declared_adult" },
        { archived_at: null, is_shadowbanned: false, adult_eligibility_status: "underage" },
      ]) {
        supabaseAdmin.from = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { active_roles: ["buyer"], role_metadata: {}, ...blockedState },
                error: null,
              }),
            }),
          }),
        });

        const res = await activateRolePOST(
          makeReq({
            role: "owner",
            data: {
              nextOfKinName: "Juan Dela Cruz",
              nextOfKinRelationship: "Spouse",
              nextOfKinPhone: "+63 917 123 4567",
            },
          })
        );
        expect(res.status).toBe(403);
      }
    });

    it("adds 'provider' alongside 'photographer' so the Creative Partner workspace unlocks cleanly", async () => {
      serverAuth.resolveUserId.mockResolvedValue("user-photo");
      const updates = [];

      supabaseAdmin.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                active_roles: ["buyer"],
                role_metadata: {},
                archived_at: null,
                is_shadowbanned: false,
                adult_eligibility_status: "declared_adult",
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockImplementation((payload) => {
          updates.push(payload);
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const res = await activateRolePOST(
        makeReq({
          role: "photographer",
          data: {
            gearDescription: "Sony A7RV + 16-35mm GM",
            portfolioUrl: "https://scoutit.ph/portfolio/lens",
            locationCoverage: "Metro Manila",
          },
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.activeRoles).toContain("photographer");
      expect(body.activeRoles).toContain("provider");
      expect(body.activeRoles).toContain("buyer");
      expect(updates[0].provider_type).toBe("photographer");
    });

    it("forces prc_verified = false and prc_verified_at = null when activating or recalibrating broker", async () => {
      serverAuth.resolveUserId.mockResolvedValue("user-broker");
      const updates = [];

      supabaseAdmin.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                active_roles: ["buyer"],
                role_metadata: {},
                archived_at: null,
                is_shadowbanned: false,
                adult_eligibility_status: "declared_adult",
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockImplementation((payload) => {
          updates.push(payload);
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const res = await activateRolePOST(
        makeReq({
          role: "broker",
          data: {
            prcLicense: "PRC-REB-0012345",
            firm: "Ayala Premier Brokerage",
          },
        })
      );
      expect(res.status).toBe(200);
      expect(updates[0].prc_license).toBe("0012345");
      expect(updates[0].prc_verified).toBe(false);
      expect(updates[0].prc_verified_at).toBeNull();
    });
  });

  describe("6. End-to-End Source Authorization Contracts", () => {
    it("Dashboard enforces canAccessDashboardWorkspace on URL params, custom events, and mode switches", () => {
      const dashboard = read("src/app/dashboard/page.js");
      expect(dashboard).toContain("canAccessDashboardWorkspace");
      expect(dashboard).toContain("normalizeDashboardMode");
      const guardCount = (dashboard.match(/canAccessDashboardWorkspace\(/g) || []).length;
      expect(guardCount).toBeGreaterThanOrEqual(4);
    });

    it("BottomNav gates Enterprise Mission Control link to mc_enterprise / admin / staff and excludes 'superuser'", () => {
      const bottomNav = read("src/components/layout/BottomNav.js");
      expect(bottomNav).not.toContain('"superuser"');
      expect(bottomNav).toContain('["mc_enterprise", "admin", "staff"]');
    });

    it("Settings prevents salesperson-to-broker privilege escalation and preserves non-lens specialized roles", () => {
      const settings = read("src/app/settings/page.js");
      expect(settings).toContain("const INTENT_TAGS = [...SELF_SERVICE_TAGS, ...GATED_TAGS];");
      expect(settings).toContain('!(t === "broker" && !rawRoles.includes("broker") && rawRoles.includes("salesperson"))');
      expect(settings).toContain("rawActiveRoles.includes(role.id)");
    });

    it("API routes inspect both profile.role and profile.active_roles for staff, community capacity, and FAQ authority", () => {
      const verifyRoute = read("src/app/api/property/verify/route.js");
      const seoRoute = read("src/app/api/seo/readiness/route.js");
      const faqsRoute = read("src/app/api/faqs/route.js");
      const signalsRoute = read("src/app/api/community/signals/route.js");

      expect(verifyRoute).toContain('select("role, active_roles")');
      expect(seoRoute).toContain('select("role, active_roles")');
      expect(faqsRoute).toContain('select("role, active_roles, prc_verified")');
      expect(signalsRoute).toContain("active_roles");
      expect(signalsRoute).toContain("accountClassFor(profile)");
    });
  });
});
