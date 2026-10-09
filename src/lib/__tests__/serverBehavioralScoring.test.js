import { describe, it, expect, beforeEach } from "vitest";
import {
  submitBehavioralReview,
  refreshUserMetrics,
  getUserResidentPassport,
  flagReviewDispute,
} from "../scoring/serverBehavioralScoring";
import { EVALUATION_VECTORS, TRUST_TIERS } from "../scoring/behavioralScoring";
import { PASSPORT_SCOPES } from "../scoring/residentPassport";

/**
 * In-memory Supabase Admin mock harness for server scoring integration tests.
 */
function createMockSupabaseAdmin(initialData = {}) {
  const store = {
    deals: initialData.deals || [],
    deal_handshakes: initialData.deal_handshakes || [],
    user_behavioral_reviews: initialData.user_behavioral_reviews || [],
    user_behavioral_metrics: initialData.user_behavioral_metrics || [],
    user_profiles: initialData.user_profiles || [],
  };

  return {
    store,
    from(tableName) {
      const records = store[tableName] || [];
      let currentFilter = () => true;
      let sortFn = null;
      let limitCount = null;

      const chain = {
        select(fields = "*", options = {}) {
          if (options.head && options.count === "exact") {
            return {
              or: (orFilter) => ({
                eq: (field, val) => {
                  // Count completed deals matching user
                  const matches = records.filter(r => r[field] === val);
                  return Promise.resolve({ count: matches.length, data: null, error: null });
                },
              }),
            };
          }
          return chain;
        },
        eq(field, value) {
          const prev = currentFilter;
          currentFilter = (item) => prev(item) && String(item[field]) === String(value);
          return chain;
        },
        lte(field, value) {
          const prev = currentFilter;
          currentFilter = (item) => prev(item) && item[field] <= value;
          return chain;
        },
        order(field, { ascending = true } = {}) {
          sortFn = (a, b) => {
            if (a[field] < b[field]) return ascending ? -1 : 1;
            if (a[field] > b[field]) return ascending ? 1 : -1;
            return 0;
          };
          return chain;
        },
        limit(n) {
          limitCount = n;
          return chain;
        },
        maybeSingle() {
          let filtered = records.filter(currentFilter);
          if (sortFn) filtered.sort(sortFn);
          const item = filtered[0] || null;
          return Promise.resolve({ data: item, error: null });
        },
        single() {
          let filtered = records.filter(currentFilter);
          if (sortFn) filtered.sort(sortFn);
          const item = filtered[0] || null;
          if (!item) {
            return Promise.resolve({ data: null, error: { message: "Row not found" } });
          }
          return Promise.resolve({ data: item, error: null });
        },
        then(resolve) {
          let filtered = records.filter(currentFilter);
          if (sortFn) filtered.sort(sortFn);
          if (limitCount) filtered = filtered.slice(0, limitCount);
          return Promise.resolve({ data: filtered, error: null }).then(resolve);
        },
        insert(payload) {
          const rows = Array.isArray(payload) ? payload : [payload];
          const inserted = rows.map((r) => ({
            id: r.id || `gen-${Math.random().toString(36).substring(2, 9)}`,
            ...r,
          }));
          store[tableName] = [...store[tableName], ...inserted];

          return {
            select() {
              return {
                single() {
                  return Promise.resolve({ data: inserted[0], error: null });
                },
              };
            },
            then(resolve) {
              return Promise.resolve({ data: inserted, error: null }).then(resolve);
            },
          };
        },
        update(updatePayload) {
          const updateFilters = [];
          const updateObj = {
            eq(field, value) {
              updateFilters.push((item) => String(item[field]) === String(value));
              return updateObj;
            },
            lte(field, value) {
              updateFilters.push((item) => item[field] <= value);
              return updateObj;
            },
            then(resolve) {
              store[tableName] = store[tableName].map((r) => {
                const matches = updateFilters.every((fn) => fn(r));
                if (matches) {
                  return { ...r, ...updatePayload };
                }
                return r;
              });
              return Promise.resolve({ error: null }).then(resolve);
            },
          };
          return updateObj;
        },
        upsert(payload) {
          const existingIdx = store[tableName].findIndex((r) => r.user_id === payload.user_id);
          if (existingIdx >= 0) {
            store[tableName][existingIdx] = { ...store[tableName][existingIdx], ...payload };
          } else {
            store[tableName].push({ id: `metric-${payload.user_id}`, ...payload });
          }
          return Promise.resolve({ data: payload, error: null });
        },
      };

      return chain;
    },
  };
}

describe("A-182: Server Behavioral Scoring & Double-Blind Engine", () => {
  const sampleVectors = {
    [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 5,
    [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 5,
    [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 5,
    [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 5,
  };

  let mockDb;

  beforeEach(() => {
    mockDb = createMockSupabaseAdmin({
      deals: [
        {
          id: "deal-closed-1",
          buyer_id: "user-buyer-1",
          broker_id: "user-broker-1",
          property_id: "prop-bgc-101",
          status: "completed",
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "deal-expired-1",
          buyer_id: "user-buyer-1",
          broker_id: "user-broker-1",
          property_id: "prop-bgc-101",
          status: "completed",
          closed_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days ago
          updated_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      deal_handshakes: [
        {
          id: "hs-closed-1",
          deal_id: "deal-closed-1",
          property_id: "prop-bgc-101",
          party_a_id: "user-broker-1",
          party_b_id: "user-buyer-1",
          party_a_signed_at: new Date().toISOString(),
          party_b_signed_at: new Date().toISOString(),
          status: "completed",
          updated_at: new Date().toISOString(),
        },
        {
          id: "hs-expired-1",
          deal_id: "deal-expired-1",
          property_id: "prop-bgc-101",
          party_a_id: "user-broker-1",
          party_b_id: "user-buyer-1",
          party_a_signed_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
          party_b_signed_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
          status: "completed",
          updated_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      user_profiles: [
        { id: "user-buyer-1", full_name: "Juan Seeker", kyc_verified: true },
        { id: "user-broker-1", full_name: "Maria Broker", prc_verified: true },
      ],
      user_behavioral_reviews: [],
      user_behavioral_metrics: [],
    });
  });

  describe("submitBehavioralReview — Validation & Gating", () => {
    it("fails gracefully when database client or identities are missing", async () => {
      const resNoDb = await submitBehavioralReview(null, {
        dealId: "deal-closed-1",
        reviewerId: "user-buyer-1",
        vectors: sampleVectors,
      });
      expect(resNoDb.success).toBe(false);
      expect(resNoDb.error).toContain("SERVICE_UNAVAILABLE");

      const resNoId = await submitBehavioralReview(mockDb, {
        dealId: "",
        reviewerId: "user-buyer-1",
        vectors: sampleVectors,
      });
      expect(resNoId.success).toBe(false);
      expect(resNoId.error).toContain("MISSING_IDENTITIES");
    });

    it("enforces valid 1-5 ratings across all 4 evaluation vectors", async () => {
      const badVectors = { ...sampleVectors, [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 6 };
      const res = await submitBehavioralReview(mockDb, {
        dealId: "deal-closed-1",
        reviewerId: "user-buyer-1",
        vectors: badVectors,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("INVALID_VECTORS");
    });

    it("rejects non-participants attempting to review deals", async () => {
      const res = await submitBehavioralReview(mockDb, {
        dealId: "deal-closed-1",
        reviewerId: "user-intruder-99",
        vectors: sampleVectors,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("UNAUTHORIZED_PARTY");
    });

    it("rejects reviews on deals without qualifying completed handshakes", async () => {
      mockDb.store.deal_handshakes = [];
      const res = await submitBehavioralReview(mockDb, {
        dealId: "deal-closed-1",
        reviewerId: "user-buyer-1",
        vectors: sampleVectors,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("NO_QUALIFYING_HANDSHAKE");
    });

    it("strictly locks out review submissions past the 14-day anti-retaliation window", async () => {
      const res = await submitBehavioralReview(mockDb, {
        dealId: "deal-expired-1",
        reviewerId: "user-buyer-1",
        vectors: sampleVectors,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("EXPIRED_WINDOW");
    });
  });

  describe("submitBehavioralReview — Double-Blind Lock & Simultaneous Unlock", () => {
    it("locks the first reviewer under double-blind quarantine (SINGLE_SUBMITTED)", async () => {
      const res = await submitBehavioralReview(mockDb, {
        dealId: "deal-closed-1",
        reviewerId: "user-buyer-1",
        vectors: sampleVectors,
        feedback: "Exceptional space handover.",
      });

      expect(res.success).toBe(true);
      expect(res.state).toBe("SINGLE_SUBMITTED");
      expect(res.reviewId).toBeDefined();

      const storedReview = mockDb.store.user_behavioral_reviews.find((r) => r.id === res.reviewId);
      expect(storedReview).toBeDefined();
      expect(storedReview.is_double_blind_locked).toBe(true);
      expect(storedReview.target_user_id).toBe("user-broker-1");
    });

    it("prohibits submitting a duplicate review for the same transaction", async () => {
      // First submission
      await submitBehavioralReview(mockDb, {
        dealId: "deal-closed-1",
        reviewerId: "user-buyer-1",
        vectors: sampleVectors,
      });

      // Second attempt by the same reviewer
      const duplicateRes = await submitBehavioralReview(mockDb, {
        dealId: "deal-closed-1",
        reviewerId: "user-buyer-1",
        vectors: sampleVectors,
      });

      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.error).toContain("ALREADY_SUBMITTED");
    });

    it("triggers simultaneous mutual unlock when counterparty submits their review", async () => {
      // 1. Buyer submits first (blind locked)
      const buyerRes = await submitBehavioralReview(mockDb, {
        dealId: "deal-closed-1",
        reviewerId: "user-buyer-1",
        vectors: sampleVectors,
        feedback: "Great broker.",
      });
      expect(buyerRes.state).toBe("SINGLE_SUBMITTED");

      // 2. Broker submits second -> triggers unlock
      const brokerRes = await submitBehavioralReview(mockDb, {
        dealId: "deal-closed-1",
        reviewerId: "user-broker-1",
        vectors: sampleVectors,
        feedback: "Model tenant.",
      });

      expect(brokerRes.success).toBe(true);
      expect(brokerRes.state).toBe("SIMULTANEOUSLY_UNLOCKED");

      // Verify both reviews in DB are unlocked
      const buyerReview = mockDb.store.user_behavioral_reviews.find((r) => r.id === buyerRes.reviewId);
      const brokerReview = mockDb.store.user_behavioral_reviews.find((r) => r.id === brokerRes.reviewId);

      expect(buyerReview.is_double_blind_locked).toBe(false);
      expect(brokerReview.is_double_blind_locked).toBe(false);

      // Verify metrics have been refreshed for both
      expect(mockDb.store.user_behavioral_metrics.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("refreshUserMetrics & Cold-Start Rule", () => {
    it("honors the Honest Blank rule for users with no unlocked reviews", async () => {
      const res = await refreshUserMetrics(mockDb, "user-buyer-1");

      expect(res.credential.isHonestBlank).toBe(true);
      expect(res.credential.displayBadge).toBe("[First-Time Verified Seeker]");
      expect(res.credential.compositeScore).toBe(null);
      expect(res.metrics.display_badge).toBe("[First-Time Verified Seeker]");
    });

    it("calculates composite score and sets Sovereign tier for 5-star ratings", async () => {
      mockDb.store.user_behavioral_reviews.push({
        id: "rev-unlocked-1",
        qualifying_handshake_id: "hs-closed-1",
        target_user_id: "user-buyer-1",
        reviewer_id: "user-broker-1",
        vectors: sampleVectors,
        is_double_blind_locked: false,
        is_disputed: false,
        submitted_at: new Date().toISOString(),
      });

      const res = await refreshUserMetrics(mockDb, "user-buyer-1");

      expect(res.credential.isHonestBlank).toBe(false);
      expect(res.credential.compositeScore).toBe(100);
      expect(res.credential.tier).toBe(TRUST_TIERS.SOVEREIGN.id);
      expect(res.metrics.composite_score).toBe(100);
    });
  });

  describe("flagReviewDispute — Trust & Safety Quarantine", () => {
    it("quarantines a review under DISPUTED_HOLD and removes it from behavioral standing", async () => {
      // Seed an active unlocked review
      mockDb.store.user_behavioral_reviews.push({
        id: "rev-to-dispute",
        target_user_id: "user-buyer-1",
        reviewer_id: "user-broker-1",
        vectors: {
          [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 1,
          [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 1,
          [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 1,
          [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 1,
        },
        is_double_blind_locked: false,
        is_disputed: false,
        submitted_at: new Date().toISOString(),
      });

      const disputeRes = await flagReviewDispute(mockDb, {
        reviewId: "rev-to-dispute",
        userId: "user-buyer-1",
        reason: "False statement regarding property inspection",
      });

      expect(disputeRes.success).toBe(true);

      const updatedReview = mockDb.store.user_behavioral_reviews.find((r) => r.id === "rev-to-dispute");
      expect(updatedReview.is_disputed).toBe(true);
      expect(updatedReview.dispute_reason).toContain("False statement");

      // Verify that the user's score returned to Honest Blank because the only review is quarantined
      const userMetrics = mockDb.store.user_behavioral_metrics.find((m) => m.user_id === "user-buyer-1");
      expect(userMetrics.composite_score).toBe(null);
      expect(userMetrics.display_badge).toBe("[First-Time Verified Seeker]");
    });

    it("rejects non-parties attempting to dispute an uninvolved review", async () => {
      mockDb.store.user_behavioral_reviews.push({
        id: "rev-target-1",
        target_user_id: "user-buyer-1",
        reviewer_id: "user-broker-1",
      });

      const res = await flagReviewDispute(mockDb, {
        reviewId: "rev-target-1",
        userId: "user-random-intruder",
        reason: "I object",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("UNAUTHORIZED");
    });
  });

  describe("getUserResidentPassport — Scoped Disclosure", () => {
    it("produces scoped public passport without leaking confidential feedback", async () => {
      const { passport } = await getUserResidentPassport(
        mockDb,
        "user-buyer-1",
        PASSPORT_SCOPES.PUBLIC_SUMMARY
      );

      expect(passport).toBeDefined();
      expect(passport.scope).toBe(PASSPORT_SCOPES.PUBLIC_SUMMARY);
      expect(passport.displayBadge).toBe("[First-Time Verified Seeker]");
      expect(passport.compositeScore).toBe(null);
      expect(passport.vectorBreakdown).toBe(null);
    });

    it("produces consented application passport with verified disclosures when authorized", async () => {
      mockDb.store.user_behavioral_reviews.push({
        id: "rev-consented",
        target_user_id: "user-buyer-1",
        reviewer_id: "user-broker-1",
        vectors: sampleVectors,
        feedback: "Quiet and respectful tenant",
        lease_type: "Commercial Office",
        duration_months: 24,
        is_double_blind_locked: false,
        is_disputed: false,
        submitted_at: new Date().toISOString(),
      });

      const { passport } = await getUserResidentPassport(
        mockDb,
        "user-buyer-1",
        PASSPORT_SCOPES.CONSENTED_APPLICATION,
        "deal-new-application-42"
      );

      expect(passport.scope).toBe(PASSPORT_SCOPES.CONSENTED_APPLICATION);
      expect(passport.compositeScore).toBe(100);
      expect(passport.vectorBreakdown).toBeDefined();
      expect(passport.endorsements.length).toBe(1);
      expect(passport.endorsements[0].leaseType).toBe("Commercial Office");
      expect(passport.privacyNotice).toContain("RA 10173");
    });
  });
});
