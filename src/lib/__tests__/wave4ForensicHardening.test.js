import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toBool, withFallbackVerticalPrice, reverseMapCategoryFields } from "@/lib/propertyFieldMapping";
import { resolveFlowNode } from "@/lib/flow/flowNodeResolver";

const pitchState = {
  brokerId: "broker-test-1",
  failStamp: false,
  failRefund: false,
  systemEvents: [],
};

const makeChain = (table) => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    maybeSingle: async () => {
      if (table === "user_profiles") {
        return {
          data: { role: "broker", active_roles: ["broker"], subscription_tier: "starry" },
          error: null,
        };
      }
      if (table === "property_broker_representations") {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    },
    single: async () => {
      if (table === "properties") {
        return {
          data: {
            id: "prop-1",
            slug: "test-tower",
            owner_id: "owner-1",
            title: "Test Tower",
            lifecycle_state: "live",
            pipeline_status: "approved",
          },
          error: null,
        };
      }
      return { data: null, error: null };
    },
    insert: () => ({
      select: () => {
        if (table === "property_broker_representations") {
          return {
            maybeSingle: async () => ({ data: { id: "rep-1" }, error: null }),
          };
        }
        if (table === "deals") {
          return Promise.resolve({ data: [{ id: "deal-pitch-1" }], error: null });
        }
        return Promise.resolve({ data: [], error: null });
      },
    }),
    update: () => ({
      eq: async () => {
        if (table === "deals" && pitchState.failStamp) {
          return { error: { message: "simulated stamp failure" } };
        }
        return { error: null };
      },
    }),
    delete: () => ({
      eq: async () => ({ error: null }),
    }),
  };
  return chain;
};

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => makeChain(table),
    rpc: async (name) => {
      if (name === "spend_connects_atomic") {
        return { data: [{ total_balance: 9, remaining_total: 9 }], error: null };
      }
      if (name === "refund_connects_system_error") {
        if (pitchState.failRefund) {
          return { data: null, error: { message: "refund rpc timeout" } };
        }
        return { data: [{ transaction_id: "tx-refund-1" }], error: null };
      }
      return { data: null, error: null };
    },
  },
}));

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: async () => pitchState.brokerId,
}));

vi.mock("@/lib/systemEvents", () => ({
  recordSystemEvent: async (payload) => {
    pitchState.systemEvents.push(payload);
    return true;
  },
}));

vi.mock("@/lib/notifications", () => ({
  notifyUser: async () => ({ ok: true }),
}));

vi.mock("@/lib/crmActivity", () => ({
  logActivity: async () => ({ ok: true }),
}));

vi.mock("@/lib/sampleInventory", () => ({
  validateSampleInquiryRecipients: () => ({ ok: true }),
}));

vi.mock("@/lib/connectBlocks", () => ({
  isBlocked: async () => false,
  checkBlockGuard: async () => ({ ok: true, blocked: false }),
}));

vi.mock("@/lib/connectGates", () => ({
  findRecentPendingDeal: async () => null,
  checkReceiverGate: async () => ({ ok: true }),
}));

vi.mock("@/lib/connectsWallet", () => ({
  ensureConnectBalancesWallet: async () => ({ ok: true }),
}));

const { POST: pitchPost, checkPitchRate } = await import("@/app/api/deals/pitch/route");

function collectJsFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(full));
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".jsx")) {
      files.push(full);
    }
  }
  return files;
}

describe("Wave 4 Forensic Hardening (A-371)", () => {
  beforeEach(() => {
    pitchState.brokerId = "broker-test-1";
    pitchState.failStamp = false;
    pitchState.failRefund = false;
    pitchState.systemEvents = [];
    checkPitchRate.reset();
  });

  describe("Pillar 1 — Non-blocking UI dialog contracts", () => {
    it("contains zero blocking window.confirm or alert calls in dashboard components and ArticlesClient", () => {
      const files = [
        ...collectJsFiles(path.resolve(process.cwd(), "src/components/dashboard")),
        path.resolve(process.cwd(), "mission-control/src/app/dashboard/articles/ArticlesClient.js"),
      ];

      const violations = [];
      for (const file of files) {
        const src = fs.readFileSync(file, "utf8");
        if (/\b(?:window\.)?(?:confirm|alert|prompt)\s*\(/.test(src)) {
          violations.push(path.relative(process.cwd(), file));
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("Pillar 2 — Boolean coercion and 6-vertical top-level price forwarding", () => {
    it("coerces falsy text strings cleanly in toBool without false positives", () => {
      for (const val of ["No", "no", "False", "FALSE", "0", "none", "N/A", "na", "null", "off", "unchecked", "", false, 0]) {
        expect(toBool(val), `Expected toBool(${JSON.stringify(val)}) to be false`).toBe(false);
      }
      for (const val of ["Yes", "true", "PEZA Accredited", true, 1]) {
        expect(toBool(val), `Expected toBool(${JSON.stringify(val)}) to be true`).toBe(true);
      }
    });

    it("maps top-level fallback price into Airtable fields across all 6 verticals without overriding explicit details", () => {
      const scenarios = [
        ["commercial", "Php 1,250/sqm/mo", "CM_Rent_Per_Sqm", "Php 1,250/sqm/mo"],
        ["residential", 18500000, "RS_Price", 18500000],
        ["str", 6500, "STR_Nightly_Rate", 6500],
        ["restaurants", 240000, "RST_Rent", 240000],
        ["hospitality", 450000000, "Listed_Price", 450000000],
        ["venues", 95000, "VEN_Rental_Rate", 95000],
      ];

      for (const [category, topPrice, expectedKey, expectedVal] of scenarios) {
        const enriched = withFallbackVerticalPrice({}, topPrice, category);
        const airtableMap = reverseMapCategoryFields(enriched, category);
        expect(airtableMap[expectedKey], `Vertical ${category} -> ${expectedKey}`).toBe(expectedVal);
      }

      // Explicit detail value must never be overwritten by fallback price
      const preserved = withFallbackVerticalPrice({ price: 22000000 }, 18500000, "residential");
      expect(reverseMapCategoryFields(preserved, "residential").RS_Price).toBe(22000000);
    });
  });

  describe("Pillar 3 & 4 — Pitch API & Mission Control outreach RBAC/audit hardening", () => {
    it("rejects malformed JSON payloads and oversized messages on POST /api/deals/pitch with 400", async () => {
      const badJsonReq = new Request("https://scoutit.space/api/deals/pitch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad-json",
      });
      const badJsonRes = await pitchPost(badJsonReq);
      expect(badJsonRes.status).toBe(400);

      const longMsgReq = new Request("https://scoutit.space/api/deals/pitch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId: "prop-1", message: "x".repeat(2001) }),
      });
      const longMsgRes = await pitchPost(longMsgReq);
      expect(longMsgRes.status).toBe(400);
    });

    it("enforces checkPitchRate limit (429 with Retry-After) and logs reconciliation system event on refund failure", async () => {
      // Simulate 15 requests hitting limit
      for (let i = 0; i < 15; i += 1) {
        const req = new Request("https://scoutit.space/api/deals/pitch", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.42" },
          body: JSON.stringify({ listingId: "prop-1", message: "Representing institutional tenant" }),
        });
        const res = await pitchPost(req);
        expect(res.status).toBe(200);
      }

      const blockedReq = new Request("https://scoutit.space/api/deals/pitch", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.42" },
        body: JSON.stringify({ listingId: "prop-1", message: "16th attempt" }),
      });
      const blockedRes = await pitchPost(blockedReq);
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("Retry-After")).toBeTruthy();

      checkPitchRate.reset();
      pitchState.failStamp = true;
      pitchState.failRefund = true;

      const failReq = new Request("https://scoutit.space/api/deals/pitch", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.43" },
        body: JSON.stringify({ listingId: "prop-1", message: "Post-spend refund test" }),
      });
      const failRes = await pitchPost(failReq);
      expect(failRes.status).toBe(500);
      expect(pitchState.systemEvents.length).toBe(1);
      expect(pitchState.systemEvents[0]).toMatchObject({
        event: "connects.pitch.reconciliation_required",
        severity: "error",
        subjectTable: "deals",
        subjectId: "deal-pitch-1",
      });
    });

    it("requires logAction and status/snippet validation across all 3 mutators in mission-control outreach actions", () => {
      const outreachSrc = fs.readFileSync(
        path.resolve(process.cwd(), "mission-control/src/app/dashboard/outreach/actions.js"),
        "utf8"
      );
      expect(outreachSrc).toContain("ALLOWED_OUTREACH_STATUSES");
      expect(outreachSrc).toContain('action: "outreach.lead.ingest"');
      expect(outreachSrc).toContain('action: "outreach.lead.status_update"');
      expect(outreachSrc).toContain('action: "outreach.lead.convert_to_draft"');
      expect(outreachSrc).not.toContain("${insertError.message}");
    });
  });

  describe("Pillar 5 — Master Flow Graph route resolution operational truth", () => {
    it("maps all 10 vercel.json crons, MC scan processor, and admin/dashboard lifecycle endpoints explicitly", () => {
      const vercel = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8"));
      const expectedCronTargets = {
        "/api/cron/check-stale-listings": "sys_freshness_staleness_engine",
        "/api/cron/purge-chat-messages": "cron_purge_chat_messages",
        "/api/cron/recompute-broker-metrics": "cron_recompute_broker_metrics",
        "/api/cron/purge-contact-messages": "cron_purge_contact_messages",
        "/api/cron/purge-crm-activity": "cron_purge_crm_activity",
        "/api/cron/purge-analytics": "cron_purge_analytics",
        "/api/cron/monthly-rollover": "cron_monthly_rollover",
        "/api/cron/verify-prc-status": "cron_verify_prc_status",
        "/api/cron/process-calendar-sync-queue": "cron_calendar_sync_queue",
        "/api/cron/sweep-pending-requests": "cron_sweep_pending_requests",
      };

      for (const cron of vercel.crons || []) {
        const resolved = resolveFlowNode(cron.path);
        expect(resolved, `Expected cron ${cron.path} to resolve`).not.toBeNull();
        expect(resolved.nodeId).toBe(expectedCronTargets[cron.path]);
      }

      const additionalRoutes = [
        ["/api/scan/process", "mc_scan_process_cron"],
        ["/api/admin/pdf-verify", "owner_creation_pipeline"],
        ["/api/admin/connects-refund", "sys_connect_wallet"],
        ["/api/dashboard/representation/revoke", "action_owner_remove_broker"],
        ["/api/dashboard/open-gate", "dashboard_open_gate"],
        ["/api/property/claim", "claim_listing_modal"],
      ];

      for (const [routePath, expectedNodeId] of additionalRoutes) {
        const resolved = resolveFlowNode(routePath);
        expect(resolved, `Expected ${routePath} to resolve`).not.toBeNull();
        expect(resolved.nodeId).toBe(expectedNodeId);
      }
    });
  });
});
