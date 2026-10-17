// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { parseListingBudgetPhp, matchesCatalogBudget } from "@/app/api/questit/route";
import { normalizeWhereToCoordinate } from "@/app/api/whereto/route";
import { sanitizeCsvFormulaValue } from "@/app/api/dashboard/bulk-insert/route";
import { aggregateBrokerViaMetrics } from "@/lib/viaTelemetry";
import { escapeHtml } from "@/lib/email";
import { checkInfraProximity, findNearestInfraProjects } from "@/lib/spatialIntel";

describe("A-211 Phases 7–12 Forensic Hardening (GAP-31 to GAP-92)", () => {
  const rootDir = process.cwd();
  const read = (relPath) => fs.readFileSync(path.join(rootDir, relPath), "utf8");

  describe("Phase 7 — Financial & Quota Integrity, Rate Limiting & Wallet Atomicity", () => {
    test("GAP-31: wishlist/share route fails fast with 503 DB_UNAVAILABLE on non-collision DB errors", () => {
      const content = read("src/app/api/wishlist/share/route.js");
      expect(content).toContain("function isCollisionError(error)");
      expect(content).toContain('code: "DB_UNAVAILABLE"');
      expect(content).toContain("status: 503");
    });

    test("GAP-32: v1/questit/raise refunds Connects when company_quests.insert fails", () => {
      const content = read("src/app/api/v1/questit/raise/route.js");
      expect(content).toContain('rpc("refund_connects_system_error"');
      expect(content).toContain('p_ref_type: "bounty_refund"');
    });

    test("GAP-34: parseListingBudgetPhp & matchesCatalogBudget handle K/M/Million/B/Billion, ranges, and inquiry-only listings", () => {
      expect(parseListingBudgetPhp("₱25M")).toEqual({ isUnpriced: false, min: 25_000_000, max: 25_000_000 });
      expect(parseListingBudgetPhp("PHP 1.5 Billion")).toEqual({ isUnpriced: false, min: 1_500_000_000, max: 1_500_000_000 });
      expect(parseListingBudgetPhp("₱850K/mo")).toEqual({ isUnpriced: false, min: 850_000, max: 850_000 });
      expect(parseListingBudgetPhp("₱15M - ₱25M")).toEqual({ isUnpriced: false, min: 15_000_000, max: 25_000_000 });
      expect(parseListingBudgetPhp("Price Upon Inquiry")).toEqual({ isUnpriced: true, min: null, max: null });

      expect(matchesCatalogBudget("₱25M", 30_000_000)).toBe(true);
      expect(matchesCatalogBudget("₱25M", 20_000_000)).toBe(false);
      expect(matchesCatalogBudget("Contact for Price", 20_000_000)).toBe(true);
    });

    test("GAP-37: check-stale-listings cron enforces getAirtableBudgetStatus and records call", () => {
      const content = read("src/app/api/cron/check-stale-listings/route.js");
      expect(content).toContain("getAirtableBudgetStatus");
      expect(content).toContain("recordAirtableCall(1)");
      expect(content).toContain("budgetStatus.exhausted");
    });

    test("GAP-40 & GAP-49: wallet route and SQL migration enforce idempotent wallet initialization and FOR UPDATE locking", () => {
      const walletContent = read("src/app/api/wallet/route.js");
      expect(walletContent).toContain('upsert(');
      expect(walletContent).toContain('onConflict: "user_id,role"');
      expect(walletContent).toContain('.neq("granted_month", currentMonth)');

      const sqlContent = read("supabase/migrations/20261015000001_forensic_hardening_gap_fixes.sql");
      expect(sqlContent).toContain("ON CONFLICT (user_id, role) DO UPDATE");
      expect(sqlContent).toContain("FOR UPDATE");
    });

    test("GAP-42: serverSpatialStudio refunds Connects if property_spatial_requests insert fails", () => {
      const content = read("src/lib/serverSpatialStudio.js");
      expect(content).toContain("refundConnectsOnSystemFailure");
      expect(content).toContain("handleSpatialGenerationFailure");
      expect(content).toContain("queue_insert_failed");
    });

    test("GAP-43: property/[id]/via route enforces per-IP rate limiting on GET and POST", () => {
      const content = read("src/app/api/property/[id]/via/route.js");
      expect(content).toContain("checkViaGetRate");
      expect(content).toContain("checkViaPostRate");
      expect(content).toContain("status: 429");
    });

    test("GAP-44: telemetry/device route uses distributed Upstash Redis rate limiting with in-memory fallback", () => {
      const content = read("src/app/api/telemetry/device/route.js");
      expect(content).toContain("checkDistributedTelemetryRate");
      expect(content).toContain("@upstash/ratelimit:telemetry");
    });

    test("GAP-60: deals/pitch route rejects pitches on unclaimed/ownerless properties with 422 PROPERTY_UNCLAIMED", () => {
      const content = read("src/app/api/deals/pitch/route.js");
      expect(content).toContain("if (!property.owner_id)");
      expect(content).toContain('code: "PROPERTY_UNCLAIMED"');
      expect(content).toContain("status: 422");
    });

    test("GAP-65: whereto route enforces rate limiting and rounds coordinates to 4 decimal places", () => {
      expect(normalizeWhereToCoordinate(14.5547291)).toBe(14.5547);
      expect(normalizeWhereToCoordinate("121.0472819")).toBe(121.0473);
      const content = read("src/app/api/whereto/route.js");
      expect(content).toContain("checkWhereToRate");
      expect(content).toContain("normalizeWhereToCoordinate");
    });

    test("GAP-78: user/plan route reads canonical user_connect_wallets and user_connect_accounts when active", () => {
      const content = read("src/app/api/user/plan/route.js");
      expect(content).toContain("isCanonicalConnectWalletActive");
      expect(content).toContain("user_connect_wallets");
      expect(content).toContain("user_connect_accounts");
    });

    test("GAP-81: proxy.js configures distinct Upstash Redis prefixes and tier-scoped keys", () => {
      const content = read("src/proxy.js");
      expect(content).toContain("prefix: '@upstash/ratelimit:standard'");
      expect(content).toContain("prefix: '@upstash/ratelimit:strict'");
      expect(content).toContain("prefix: '@upstash/ratelimit:ai'");
      expect(content).toContain("`ratelimit_${tier}_${ip}`");
    });
  });

  describe("Phase 8 — Dual-CMS Slug & Cache Integrity, Outreach Claim Flow & Bulk Ingest Hardening", () => {
    test("GAP-33: mission-control locks canonical_slug and blocks Slug/Title writes to Airtable", () => {
      const airtableContent = read("mission-control/src/lib/airtable.js");
      expect(airtableContent).toContain("delete patchFields.Title");
      expect(airtableContent).toContain('"Slug" in fields');
      expect(airtableContent).toContain('"Title" in fields');

      const cmsActions = read("mission-control/src/app/dashboard/cms/actions.js");
      expect(cmsActions).toContain("canonical_slug: lockedCanonicalSlug");
      expect(cmsActions).toContain("canStaffChangeDisplayTitle");
    });

    test("GAP-45: verify-prc-status cron and admin/prc route invalidate CMS bundle on PRC status transitions", () => {
      const cronContent = read("src/app/api/cron/verify-prc-status/route.js");
      expect(cronContent).toContain("invalidateCmsBundle");
      expect(cronContent).toContain("prc_expiry");

      const adminPrcContent = read("src/app/api/admin/prc/route.js");
      expect(adminPrcContent).toContain("invalidateCmsBundle");
    });

    test("GAP-55: outreach claim payload includes dbPropertyRow and /claim/[token] route exists", () => {
      const outreachPolicy = read("mission-control/src/lib/outreachPolicy.mjs");
      expect(outreachPolicy).toContain("dbPropertyRow");
      expect(outreachPolicy).toContain("claim_token: claimToken");

      const claimPage = read("src/app/claim/[token]/page.js");
      expect(claimPage).toContain("claim_token");
      expect(claimPage).toContain("/dashboard/inventory?claim=");
    });

    test("GAP-72, GAP-75, GAP-84 & GAP-87: FAQs, inquiries, and property/premium resolve canonical_slug and UUID", () => {
      expect(read("src/app/api/faqs/route.js")).toContain("findProperty");
      expect(read("src/app/api/faqs/preflight/route.js")).toContain("findProperty");
      expect(read("src/app/api/faqs/review/route.js")).toContain("findProperty");
      expect(read("src/app/api/inquiries/route.js")).toContain('.eq("canonical_slug", propertySlug)');
      expect(read("src/app/api/property/premium/route.js")).toContain("p.canonical_slug === slug");
    });

    test("GAP-82: cmsCache persists publisher rebuild window in Redis for cross-isolate awareness", () => {
      const content = read("src/lib/cmsCache.js");
      expect(content).toContain('CMS_PUBLISHER_REBUILD_KEY = "cms_publisher_rebuild_until"');
      expect(content).toContain("CMS_PUBLISHER_REBUILD_KEY,");
      expect(content).toContain("redis.get(CMS_PUBLISHER_REBUILD_KEY)");
    });

    test("GAP-91: dashboard/inventory resolves saved_intel across id, slug, canonical_slug, and airtable_record_id", () => {
      const content = read("src/app/api/dashboard/inventory/route.js");
      expect(content).toContain("saved_intel");
      expect(content).toContain("saved_count: savedCount");
    });

    test("GAP-92: bulk-insert enforces MAX_BATCH_SIZE=100, strips CSV formula prefixes, and sets draft/pending status", () => {
      expect(sanitizeCsvFormulaValue("=CMD|' /C calc'!A0")).toBe("CMD|' /C calc'!A0");
      expect(sanitizeCsvFormulaValue("+SUM(A1:A2)")).toBe("SUM(A1:A2)");
      expect(sanitizeCsvFormulaValue("@import")).toBe("import");
      expect(sanitizeCsvFormulaValue("Normal Title")).toBe("Normal Title");

      const content = read("src/app/api/dashboard/bulk-insert/route.js");
      expect(content).toContain("MAX_BATCH_SIZE = 100");
      expect(content).toContain('pipeline_status: "pending"');
      expect(content).toContain('lifecycle_state: "draft"');
    });
  });

  describe("Phase 9 — Deal Lifecycle, Chat Authorization, Routed Recipients & CRM Notifications", () => {
    test("GAP-50, GAP-56 & GAP-68: deals/[id]/messages selects property_id, derives sender_role server-side, and blocks shadowbanned users", () => {
      const content = read("src/app/api/deals/[id]/messages/route.js");
      expect(content).toContain("status, property_id, buyer_id, broker_id, properties(id, title, owner_id)");
      expect(content).toContain("verifiedSenderRole");
      expect(content).toContain("sender_role: verifiedSenderRole");
      expect(content).toContain("is_shadowbanned");
    });

    test("GAP-51 & GAP-70: sweep-pending-requests and deal withdrawal notify routed recipients", () => {
      expect(read("src/app/api/cron/sweep-pending-requests/route.js")).toContain("deal_routing_recipients");
      expect(read("src/app/api/deals/[id]/route.js")).toContain("deal_routing_recipients");
    });

    test("GAP-57: deals/[id]/export includes routed recipient and message sender_ids in partyIds", () => {
      const content = read("src/app/api/deals/[id]/export/route.js");
      expect(content).toContain('isRoutedRecipient && { id: userId, role: "broker" }');
      expect(content).toContain('.map((m) => m?.sender_id && { id: m.sender_id');
    });

    test("GAP-58, GAP-59, GAP-69, GAP-76 & GAP-86: deal lifecycle transitions stamp pending_clock_reset_at and notify counterparties", () => {
      expect(read("src/app/api/deals/[id]/close/route.js")).toContain('notificationType: "deal_closed"');
      expect(read("src/app/api/deals/[id]/unarchive/route.js")).toContain('notificationType: "request_unarchived"');
      expect(read("src/app/api/deals/route.js")).toContain("pending_clock_reset_at: nowIso");
      expect(read("src/app/api/community/signals/[id]/connect/route.js")).toContain("pending_clock_reset_at: nowIso");
      expect(read("src/app/api/dashboard/deals/update/route.js")).toContain("KNOWN_PIPELINE_STATUSES");
    });

    test("GAP-88: via-metrics avoids non-existent deals.stage column and aggregateBrokerViaMetrics counts viewing_scheduled/closed statuses", () => {
      const routeContent = read("src/app/api/broker/via-metrics/route.js");
      expect(routeContent).not.toContain("status, stage,");

      const metrics = aggregateBrokerViaMetrics({
        deals: [
          { id: "d1", property_id: "p1", status: "viewing_scheduled" },
          { id: "d2", property_id: "p1", status: "closed" },
        ],
      });
      expect(metrics.funnel.viewingsScheduled).toBe(2);
      expect(metrics.funnel.dealsClosed).toBe(1);
    });

    test("GAP-89 & GAP-90: CRM activity authorizes routed recipients and CRM tasks notify assignees/creators", () => {
      expect(read("src/app/api/crm/activity/route.js")).toContain("isRoutedDealRecipient");
      expect(read("src/app/api/crm/tasks/route.js")).toContain('notificationType: "task_assigned"');
      expect(read("src/app/api/crm/tasks/[id]/route.js")).toContain('notificationType: "task_completed"');
    });
  });

  describe("Phase 10 — Trust, Compliance, Behavioral Scoring, Claims, Disputes & Security Sanitization", () => {
    test("GAP-35: leads/export-audit returns complianceBlocked: true and LeadExportButton surfaces compliance error", () => {
      expect(read("src/app/api/leads/export-audit/route.js")).toContain("complianceBlocked: true");
      expect(read("src/components/dashboard/crm/LeadExportButton.js")).toContain("AUDIT_LOG_FAILED");
    });

    test("GAP-38 & GAP-39: notifications EMAIL_WORTHY includes claim/dispute types and claim route exports approvePropertyClaim", () => {
      const notifContent = read("src/lib/notifications.js");
      expect(notifContent).toContain('"claim_submitted"');
      expect(notifContent).toContain('"claim_approved"');
      expect(notifContent).toContain('"deal_dispute"');
      expect(notifContent).toContain("forceEmail");

      const claimContent = read("src/app/api/property/claim/route.js");
      expect(claimContent).toContain("export async function approvePropertyClaim");
    });

    test("GAP-41: purge-chat-messages enforces 24h DISPUTE_RESOLUTION_GRACE_MS after dispute closure", () => {
      const content = read("src/app/api/cron/purge-chat-messages/route.js");
      expect(content).toContain("DISPUTE_RESOLUTION_GRACE_MS = 24 * 60 * 60 * 1000");
      expect(content).toContain("nowMs - resolvedTs < DISPUTE_RESOLUTION_GRACE_MS");
    });

    test("GAP-46, GAP-61, GAP-62 & GAP-63: serverBehavioralScoring supports direct owner deals, notifies counterparties, and syncs dispute state", () => {
      const content = read("src/lib/scoring/serverBehavioralScoring.js");
      expect(content).toContain("properties(owner_id)");
      expect(content).toContain('notificationType: "review_unlocked"');
      expect(content).toContain('notificationType: "review_submitted"');
      expect(content).toContain("property_ref: reviewId");

      const disputesActions = read("mission-control/src/app/dashboard/disputes/actions.js");
      expect(disputesActions).toContain('from("user_behavioral_reviews")');
      expect(disputesActions).toContain('is_disputed: outcome === "resolved"');
    });

    test("GAP-52: recompute-broker-metrics includes multi-role brokers via active_roles.cs.{broker}", () => {
      const content = read("src/app/api/cron/recompute-broker-metrics/route.js");
      expect(content).toContain("role.eq.broker,active_roles.cs.{broker}");
    });

    test("GAP-66: escapeHtml neutralizes XSS vectors and contact route escapes user-supplied fields", () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
      );
      const contactContent = read("src/app/api/contact/route.js");
      expect(contactContent).toContain("escapeHtml(name)");
      expect(contactContent).toContain("escapeHtml(message)");
    });

    test("GAP-67 & GAP-68: seo/readiness rejects unclaimed listings for non-staff and community/signals blocks shadowbanned users", () => {
      expect(read("src/app/api/seo/readiness/route.js")).toContain(
        "if (!prop.owner_id || String(prop.owner_id) !== String(userId))"
      );
      expect(read("src/app/api/community/signals/route.js")).toContain('code: "ACCOUNT_RESTRICTED"');
    });

    test("GAP-73, GAP-74 & GAP-85: mission-control notifications/badges and deal disputes write user_notifications", () => {
      expect(read("mission-control/src/app/dashboard/notifications/actions.js")).toContain("user_notifications");
      expect(read("mission-control/src/app/dashboard/badges/actions.js")).toContain("user_notifications");
      expect(read("src/app/api/deals/[id]/dispute/route.js")).toContain('notificationType: "deal_dispute"');
    });
  });

  describe("Phase 11 — Viewings & Calendar Resilience, Spatial Intel, Units & Cron Scalability", () => {
    test("GAP-36: meetLink exports enqueueCalendarSyncRetry and bookingService/viewing-appointments wire retry records", () => {
      expect(read("src/lib/calendar/meetLink.js")).toContain("export async function enqueueCalendarSyncRetry");
      expect(read("src/lib/viewings/bookingService.js")).toContain("enqueueCalendarSyncRetry");
      expect(read("src/app/api/viewing-appointments/[id]/route.js")).toContain("enqueueCalendarSyncRetry");
    });

    test("GAP-53: checkInfraProximity computes minimum distance across LineString segments", () => {
      // Midpoint along Metro Manila Subway segment between Ortigas (14.5869, 121.0614) and BGC (14.5547, 121.0450)
      const midLat = (14.5869 + 14.5547) / 2;
      const midLon = (121.0614 + 121.045) / 2;
      const hit = checkInfraProximity(midLat, midLon);
      expect(hit).not.toBeNull();
      expect(hit.distance_km).toBeLessThan(0.5);

      const nearest = findNearestInfraProjects(14.5547, 121.045);
      expect(nearest).not.toBeNull();
      expect(nearest.name).toBeTruthy();
    });

    test("GAP-64, GAP-77, GAP-79 & GAP-80: units parallel update, exact signal relevance count, and bounded cron queries", () => {
      expect(read("src/app/api/dashboard/units/route.js")).toContain("await Promise.all(");
      expect(read("src/app/api/community/signals/[id]/relevant/route.js")).toContain("syncExactRelevantCount");
      expect(read("src/app/api/cron/monthly-rollover/route.js")).toContain("PROPERTY_SCAN_LIMIT = 2000");
      expect(read("src/app/api/cron/purge-contact-messages/route.js")).toContain('.in("id", batchIds)');
    });
  });

  describe("Phase 12 — Client Auth State Sync, Design DNA Tokenization & Mobile Form Ergonomics", () => {
    test("GAP-47 & GAP-83: entitlements, Header, HomeClient, descent, and Nudge fall back to Supabase Auth session", () => {
      expect(read("src/lib/entitlements.js")).toContain("syncAuthenticatedUserCache");
      expect(read("src/lib/entitlements.js")).toContain("-auth-token");
      expect(read("src/components/layout/Header.js")).toContain("supabase.auth.getSession()");
      expect(read("src/app/HomeClient.js")).toContain("supabase.auth.getSession()");
      expect(read("src/app/descent/page.js")).toContain("supabase.auth.getSession()");
      expect(read("src/components/ui/Nudge.js")).toContain("supabase.auth.getSession()");
    });

    test("GAP-48: descent.css uses 100dvh and semantic CSS variables", () => {
      const css = read("src/app/descent/descent.css");
      expect(css).toContain("height: 100dvh;");
      expect(css).toContain("min-height: 100dvh;");
      expect(css).toContain("background: var(--bg);");
      expect(css).toContain("--gold: var(--accent);");
      expect(css).toContain("--gold-bright: var(--accent-bright);");
    });

    test("GAP-54 & GAP-71: DealFileSlideOver, NewDealModal, and OwnerMode enforce >=16px mobile font-size (text-base md:text-sm)", () => {
      expect(read("src/components/dashboard/crm/DealFileSlideOver.js")).toContain("text-base md:text-sm");
      expect(read("src/components/dashboard/crm/NewDealModal.js")).toContain("text-base md:text-sm");
      expect(read("src/components/dashboard/OwnerMode.js")).toContain("text-base md:text-sm");
    });
  });
});
