import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  MONETIZATION_PHASES,
  PIONEER_ACCESS_BADGE_TEXT,
  PAYWALL_CONVERSION_INTENT_EVENT,
  UNIVERSE_MONTHLY_PRICE_PHP,
  UNIVERSE_MONTHLY_PRICE_LABEL,
  ACTIVE_LISTING_QUOTAS,
  resolveMonetizationPhase,
  evaluateMonetizationGate,
  logPaywallConversionIntent,
  getConversionIntentLog,
  clearConversionIntentLog,
} from "../monetizationGate";
import {
  resolveServerMonetizationPhase,
  evaluateServerMonetizationGate,
  recordServerConversionIntent,
} from "../serverMonetizationGate";

describe("Phased Paywall Gate Architecture (monetizationGate & serverMonetizationGate)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearConversionIntentLog();
    delete process.env.NEXT_PUBLIC_MONETIZATION_PHASE;
    delete process.env.SCOUTIT_MONETIZATION_PHASE;
    delete process.env.SCOUTIT_PRE_200_PREMIUM_LOCKER;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("1. Constants & Phase Resolution", () => {
    it("exports explicit pilot_zero_paywall and production_enforced modes and Pioneer badge text", () => {
      expect(MONETIZATION_PHASES.PILOT_ZERO_PAYWALL).toBe("pilot_zero_paywall");
      expect(MONETIZATION_PHASES.PRODUCTION_ENFORCED).toBe("production_enforced");
      expect(PIONEER_ACCESS_BADGE_TEXT).toBe("PIONEER ACCESS // FREE FOR LAUNCH");
      expect(PAYWALL_CONVERSION_INTENT_EVENT).toBe("telemetry:paywall-conversion-intent");
      expect(UNIVERSE_MONTHLY_PRICE_PHP).toBe(2499);
      expect(UNIVERSE_MONTHLY_PRICE_LABEL).toBe("₱2,499/mo");
      expect(ACTIVE_LISTING_QUOTAS).toEqual({
        starry: 1,
        solar: 5,
        cluster: 20,
        universe: Infinity,
      });
    });

    it("resolves phase from NEXT_PUBLIC_MONETIZATION_PHASE or dbFlags without code changes", () => {
      expect(resolveMonetizationPhase()).toBe("pilot_zero_paywall");

      process.env.NEXT_PUBLIC_MONETIZATION_PHASE = "production_enforced";
      expect(resolveMonetizationPhase()).toBe("production_enforced");

      process.env.NEXT_PUBLIC_MONETIZATION_PHASE = "pilot_zero_paywall";
      expect(resolveMonetizationPhase()).toBe("pilot_zero_paywall");

      delete process.env.NEXT_PUBLIC_MONETIZATION_PHASE;
      expect(resolveMonetizationPhase({ dbFlags: { monetization_phase: "production_enforced" } })).toBe("production_enforced");
      expect(resolveMonetizationPhase({ dbFlags: { monetization_enforced: true } })).toBe("production_enforced");
      expect(resolveMonetizationPhase({ dbFlags: { pre_launch_free_mode: false } })).toBe("production_enforced");
      expect(resolveMonetizationPhase({ dbFlags: { pre_200_premium_access: true } })).toBe("pilot_zero_paywall");
    });
  });

  describe("2. pilot_zero_paywall Mode (North Star Zero-Paywall)", () => {
    it("grants access to Off-Market Vault, Connects, and Owner cloud storage with Pioneer badge", () => {
      const vaultGate = evaluateMonetizationGate({
        phase: "pilot_zero_paywall",
        feature: "off_market_vault",
        role: "seeker",
        tier: "starry",
      });
      expect(vaultGate.mode).toBe("pilot_zero_paywall");
      expect(vaultGate.isPilotZeroPaywall).toBe(true);
      expect(vaultGate.isProductionEnforced).toBe(false);
      expect(vaultGate.allowed).toBe(true);
      expect(vaultGate.blocked).toBe(false);
      expect(vaultGate.badgeText).toBe("PIONEER ACCESS // FREE FOR LAUNCH");
      expect(vaultGate.conversionIntentEvent).toBe("telemetry:paywall-conversion-intent");

      const quotaGate = evaluateMonetizationGate({
        phase: "pilot_zero_paywall",
        feature: "listing_quota",
        role: "owner",
        tier: "starry",
        activePublishedCount: 10,
      });
      expect(quotaGate.allowed).toBe(true);
      expect(quotaGate.requiresQuotaSwap).toBe(false);
      expect(quotaGate.cloudStorageUnlimited).toBe(true);

      const connectGate = evaluateMonetizationGate({
        phase: "pilot_zero_paywall",
        feature: "connects_spend",
        role: "seeker",
        tier: "starry",
        connectsBalance: 0,
      });
      expect(connectGate.allowed).toBe(true);
      expect(connectGate.requiresConnectSpend).toBe(false);
    });

    it("logs simulated checkout conversion intents (telemetry:paywall-conversion-intent) without blocking", () => {
      const record = logPaywallConversionIntent({
        phase: "pilot_zero_paywall",
        feature: "off_market_vault",
        role: "seeker",
        tier: "universe",
        source: "/off-market",
      });

      expect(record.event).toBe("telemetry:paywall-conversion-intent");
      expect(record.phase).toBe("pilot_zero_paywall");
      expect(record.feature).toBe("off_market_vault");
      expect(record.role).toBe("seeker");
      expect(record.tier).toBe("universe");
      expect(record.source).toBe("/off-market");
      expect(record.pricePhp).toBe(2499);
      expect(record.blocked).toBe(false);

      const log = getConversionIntentLog();
      expect(log).toHaveLength(1);
      expect(log[0]).toEqual(record);
    });
  });

  describe("3. production_enforced Mode (Commercial Monetization)", () => {
    it("enforces strict Universe tier checks (₱2,499/mo) for Off-Market Vault", () => {
      const starryVault = evaluateMonetizationGate({
        phase: "production_enforced",
        feature: "off_market_vault",
        role: "seeker",
        tier: "starry",
      });
      expect(starryVault.mode).toBe("production_enforced");
      expect(starryVault.isProductionEnforced).toBe(true);
      expect(starryVault.allowed).toBe(false);
      expect(starryVault.blocked).toBe(true);
      expect(starryVault.requiresUpgrade).toBe(true);
      expect(starryVault.requiredTier).toBe("universe");
      expect(starryVault.pricePhp).toBe(2499);
      expect(starryVault.priceLabel).toBe("₱2,499/mo");

      const universeVault = evaluateMonetizationGate({
        phase: "production_enforced",
        feature: "off_market_vault",
        role: "seeker",
        tier: "universe",
      });
      expect(universeVault.allowed).toBe(true);
      expect(universeVault.blocked).toBe(false);
      expect(universeVault.requiresUpgrade).toBe(false);
    });

    it("enforces active listing quotas (1, 5, 20, ∞) and atomic quota swaps", () => {
      // Starry cap = 1
      const starryBlocked = evaluateMonetizationGate({
        phase: "production_enforced",
        feature: "listing_quota",
        role: "owner",
        tier: "starry",
        activePublishedCount: 1,
      });
      expect(starryBlocked.allowed).toBe(false);
      expect(starryBlocked.requiresQuotaSwap).toBe(true);
      expect(starryBlocked.quotaCap).toBe(1);

      // Starry with atomic quota swap target succeeds
      const starrySwap = evaluateMonetizationGate({
        phase: "production_enforced",
        feature: "listing_quota",
        role: "owner",
        tier: "starry",
        activePublishedCount: 1,
        swapWithPropertyId: "prop-live-1",
      });
      expect(starrySwap.allowed).toBe(true);
      expect(starrySwap.requiresQuotaSwap).toBe(false);
      expect(starrySwap.atomicSwapTargetId).toBe("prop-live-1");

      // Solar cap = 5
      expect(
        evaluateMonetizationGate({
          phase: "production_enforced",
          feature: "listing_quota",
          role: "owner",
          tier: "solar",
          activePublishedCount: 4,
        }).allowed
      ).toBe(true);
      expect(
        evaluateMonetizationGate({
          phase: "production_enforced",
          feature: "listing_quota",
          role: "owner",
          tier: "solar",
          activePublishedCount: 5,
        }).allowed
      ).toBe(false);

      // Cluster cap = 20
      expect(
        evaluateMonetizationGate({
          phase: "production_enforced",
          feature: "listing_quota",
          role: "owner",
          tier: "cluster",
          activePublishedCount: 20,
        }).allowed
      ).toBe(false);

      // Universe cap = Infinity
      expect(
        evaluateMonetizationGate({
          phase: "production_enforced",
          feature: "listing_quota",
          role: "owner",
          tier: "universe",
          activePublishedCount: 500,
        }).allowed
      ).toBe(true);
    });

    it("enforces paid Connects spend in production_enforced mode", () => {
      const zeroConnects = evaluateMonetizationGate({
        phase: "production_enforced",
        feature: "connects_spend",
        role: "seeker",
        tier: "starry",
        connectsBalance: 0,
        requiredConnects: 1,
      });
      expect(zeroConnects.allowed).toBe(false);
      expect(zeroConnects.requiresConnectSpend).toBe(true);

      const fundedConnects = evaluateMonetizationGate({
        phase: "production_enforced",
        feature: "connects_spend",
        role: "seeker",
        tier: "starry",
        connectsBalance: 3,
        requiredConnects: 1,
      });
      expect(fundedConnects.allowed).toBe(true);
      expect(fundedConnects.requiresConnectSpend).toBe(false);
    });
  });

  describe("4. Server Counterpart (serverMonetizationGate)", () => {
    it("resolves server phase from env or DB feature_flags and evaluates server gates", async () => {
      process.env.NEXT_PUBLIC_MONETIZATION_PHASE = "pilot_zero_paywall";
      expect(await resolveServerMonetizationPhase()).toBe("pilot_zero_paywall");

      const pilotEval = await evaluateServerMonetizationGate({
        feature: "off_market_vault",
        role: "seeker",
        tier: "starry",
        userId: "user-123",
      });
      expect(pilotEval.mode).toBe("pilot_zero_paywall");
      expect(pilotEval.allowed).toBe(true);
      expect(pilotEval.badgeText).toBe("PIONEER ACCESS // FREE FOR LAUNCH");

      process.env.NEXT_PUBLIC_MONETIZATION_PHASE = "production_enforced";
      expect(await resolveServerMonetizationPhase()).toBe("production_enforced");

      const prodEval = await evaluateServerMonetizationGate({
        feature: "off_market_vault",
        role: "seeker",
        tier: "starry",
        userId: "user-123",
      });
      expect(prodEval.mode).toBe("production_enforced");
      expect(prodEval.allowed).toBe(false);
      expect(prodEval.requiredTier).toBe("universe");
    });

    it("records server conversion intent without blocking", async () => {
      const entry = await recordServerConversionIntent({
        userId: "user-123",
        feature: "off_market_vault",
        role: "seeker",
        tier: "universe",
        source: "/api/off-market",
      });
      expect(entry.event).toBe("telemetry:paywall-conversion-intent");
      expect(entry.blocked).toBe(false);
    });
  });

  describe("5. Route Surface & Security Boundary Integration", () => {
    it("wires monetizationGate across /pricing, /pricing/seeker, /pricing/owner, /off-market, and /property/[id]", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const root = process.cwd();

      const requiredFiles = [
        "src/components/pricing/PilotPaymentControls.js",
        "src/app/pricing/page.js",
        "src/app/pricing/seeker/page.js",
        "src/app/pricing/owner/page.js",
        "src/app/off-market/page.js",
        "src/app/property/[id]/page.js",
        "src/components/property/SpatialVaultWidget.js",
        "src/components/property/ResidentialFlow.js",
        "src/components/property/CommercialFlow.js",
        "src/app/api/off-market/route.js",
        "src/app/api/dashboard/publish/route.js",
      ];

      for (const relPath of requiredFiles) {
        const source = fs.readFileSync(path.join(root, relPath), "utf8");
        expect(
          source.includes("monetizationGate") || source.includes("serverMonetizationGate"),
          `${relPath} should wire monetizationGate or serverMonetizationGate`,
        ).toBe(true);
      }

      // Verify /api/off-market sanitizes slug query parameter against PostgREST filter injection
      const offMarketApi = fs.readFileSync(path.join(root, "src/app/api/off-market/route.js"), "utf8");
      expect(offMarketApi).toContain("!/^[a-z0-9-_]+$/i.test(rawSlug)");
      expect(offMarketApi).toContain("Invalid property slug");

      // Verify /api/crm/tasks enforces routed deal recipient check and sanitizes userId
      const crmTasksApi = fs.readFileSync(path.join(root, "src/app/api/crm/tasks/route.js"), "utf8");
      expect(crmTasksApi).toContain("isRoutedDealRecipient");
      expect(crmTasksApi).toContain("!/^[a-z0-9-_]+$/i.test(String(userId))");

      // Verify PhotoUploader and Nudge have no nested buttons, orphaned buttons, or raw emojis
      const photoUploader = fs.readFileSync(path.join(root, "src/components/dashboard/PhotoUploader.js"), "utf8");
      expect(photoUploader).not.toContain("🔒");
      expect(photoUploader).toContain('aria-label={`Upload photo ${index + 1}`}');

      const nudgeSource = fs.readFileSync(path.join(root, "src/components/ui/Nudge.js"), "utf8");
      expect(nudgeSource).not.toContain("📈");
      expect(nudgeSource).not.toContain("⚡");
      expect(nudgeSource).not.toContain("🕵️");
      expect(nudgeSource).toContain("logPaywallConversionIntent");
      expect(nudgeSource).toContain("onClick={handleAction}");
    });
  });
});
