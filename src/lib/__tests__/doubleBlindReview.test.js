import { describe, it, expect } from "vitest";
import {
  REVIEW_WINDOW_MS,
  REVIEW_STATES,
  isSubmissionWindowOpen,
  getWindowRemaining,
  determineDoubleBlindState,
  resolveReviewVisibility,
  checkSubmissionEligibility,
} from "../scoring/doubleBlindReview";

describe("A-182: Double-Blind Review Engine & Anti-Retaliation Window", () => {
  const transactionClosedAt = "2026-10-01T00:00:00.000Z";
  const closedMs = new Date(transactionClosedAt).getTime();

  describe("isSubmissionWindowOpen & getWindowRemaining", () => {
    it("reports window open within 14 days of closing", () => {
      const day5 = closedMs + 5 * 24 * 60 * 60 * 1000;
      expect(isSubmissionWindowOpen(transactionClosedAt, day5)).toBe(true);

      const rem = getWindowRemaining(transactionClosedAt, day5);
      expect(rem.isOpen).toBe(true);
      expect(rem.remainingDays).toBe(9);
    });

    it("reports window closed after 14 days", () => {
      const day15 = closedMs + 15 * 24 * 60 * 60 * 1000;
      expect(isSubmissionWindowOpen(transactionClosedAt, day15)).toBe(false);

      const rem = getWindowRemaining(transactionClosedAt, day15);
      expect(rem.isOpen).toBe(false);
      expect(rem.remainingDays).toBe(0);
    });
  });

  describe("determineDoubleBlindState", () => {
    const day3 = closedMs + 3 * 24 * 60 * 60 * 1000;
    const day16 = closedMs + 16 * 24 * 60 * 60 * 1000;

    it("returns PENDING_BOTH when neither party has submitted within window", () => {
      const state = determineDoubleBlindState({
        reviewA: null,
        reviewB: null,
        transactionClosedAt,
        now: day3,
      });
      expect(state).toBe(REVIEW_STATES.PENDING_BOTH);
    });

    it("returns SINGLE_SUBMITTED when only one party has submitted within window", () => {
      const reviewA = { id: "rev-a", submitted_at: new Date(day3).toISOString() };
      const state = determineDoubleBlindState({
        reviewA,
        reviewB: null,
        transactionClosedAt,
        now: day3,
      });
      expect(state).toBe(REVIEW_STATES.SINGLE_SUBMITTED);
    });

    it("returns SIMULTANEOUSLY_UNLOCKED when both parties have submitted", () => {
      const reviewA = { id: "rev-a", submitted_at: new Date(day3).toISOString() };
      const reviewB = { id: "rev-b", submitted_at: new Date(day3).toISOString() };
      const state = determineDoubleBlindState({
        reviewA,
        reviewB,
        transactionClosedAt,
        now: day3,
      });
      expect(state).toBe(REVIEW_STATES.SIMULTANEOUSLY_UNLOCKED);
    });

    it("returns EXPIRED_UNLOCKED when window expires with at least one review submitted", () => {
      const reviewA = { id: "rev-a", submitted_at: new Date(day3).toISOString() };
      const state = determineDoubleBlindState({
        reviewA,
        reviewB: null,
        transactionClosedAt,
        now: day16,
      });
      expect(state).toBe(REVIEW_STATES.EXPIRED_UNLOCKED);
    });

    it("returns DISPUTED_HOLD when a review has been flagged for arbitration", () => {
      const reviewA = { id: "rev-a", submitted_at: new Date(day3).toISOString(), disputed_at: "2026-10-04T00:00:00Z" };
      const state = determineDoubleBlindState({
        reviewA,
        reviewB: null,
        transactionClosedAt,
        now: day3,
      });
      expect(state).toBe(REVIEW_STATES.DISPUTED_HOLD);
    });
  });

  describe("resolveReviewVisibility — Double-Blind Masking", () => {
    const day3 = closedMs + 3 * 24 * 60 * 60 * 1000;
    const day16 = closedMs + 16 * 24 * 60 * 60 * 1000;

    const reviewA = {
      id: "rev-a",
      reviewer_id: "user-owner",
      target_user_id: "user-tenant",
      submitted_at: new Date(day3).toISOString(),
      vectors: { payment_punctuality: 5, space_care_maintenance: 5, communication_conduct: 5, lease_covenant_adherence: 5 },
      feedback: "Exceptional tenant, premises left immaculate.",
    };

    it("allows the author to view their own submitted review at any time", () => {
      const result = resolveReviewVisibility({
        targetReview: reviewA,
        counterpartyReview: null,
        transactionClosedAt,
        viewerUserId: "user-owner",
        now: day3,
      });

      expect(result.isDoubleBlindLocked).toBe(false);
      expect(result.isAuthorViewing).toBe(true);
      expect(result.feedback).toBe("Exceptional tenant, premises left immaculate.");
    });

    it("masks review from counterparty when counterparty has not yet submitted and window is open", () => {
      const result = resolveReviewVisibility({
        targetReview: reviewA,
        counterpartyReview: null,
        transactionClosedAt,
        viewerUserId: "user-tenant",
        now: day3,
      });

      expect(result.isDoubleBlindLocked).toBe(true);
      expect(result.status).toBe("LOCKED_DOUBLE_BLIND");
      expect(result.vectors).toBe(null);
      expect(result.feedback).toBe(null);
      expect(result.notice).toContain("Contents unlock when you submit your review");
    });

    it("unmasks review to counterparty once counterparty also submits (simultaneous unlock)", () => {
      const reviewB = {
        id: "rev-b",
        reviewer_id: "user-tenant",
        target_user_id: "user-owner",
        submitted_at: new Date(day3).toISOString(),
      };

      const result = resolveReviewVisibility({
        targetReview: reviewA,
        counterpartyReview: reviewB,
        transactionClosedAt,
        viewerUserId: "user-tenant",
        now: day3,
      });

      expect(result.isDoubleBlindLocked).toBe(false);
      expect(result.feedback).toBe("Exceptional tenant, premises left immaculate.");
      expect(result.vectors.payment_punctuality).toBe(5);
    });

    it("unmasks review to counterparty once the 14-day window expires", () => {
      const result = resolveReviewVisibility({
        targetReview: reviewA,
        counterpartyReview: null,
        transactionClosedAt,
        viewerUserId: "user-tenant",
        now: day16,
      });

      expect(result.isDoubleBlindLocked).toBe(false);
      expect(result.feedback).toBe("Exceptional tenant, premises left immaculate.");
    });
  });

  describe("checkSubmissionEligibility — Anti-Retaliation Blocking", () => {
    const day3 = closedMs + 3 * 24 * 60 * 60 * 1000;
    const day16 = closedMs + 16 * 24 * 60 * 60 * 1000;

    it("permits initial submission while window is open", () => {
      const result = checkSubmissionEligibility({
        existingReview: null,
        counterpartyReview: null,
        transactionClosedAt,
        now: day3,
      });
      expect(result.canSubmit).toBe(true);
    });

    it("prevents duplicate submissions once a review has been submitted (immutable reviews)", () => {
      const result = checkSubmissionEligibility({
        existingReview: { submitted_at: "2026-10-02T10:00:00Z" },
        counterpartyReview: null,
        transactionClosedAt,
        now: day3,
      });
      expect(result.canSubmit).toBe(false);
      expect(result.reason).toContain("ALREADY_SUBMITTED");
    });

    it("bars a non-submitting counterparty from submitting late retaliatory reviews after window expires", () => {
      const reviewA = { submitted_at: "2026-10-02T10:00:00Z" };
      const result = checkSubmissionEligibility({
        existingReview: null,
        counterpartyReview: reviewA,
        transactionClosedAt,
        now: day16,
      });
      expect(result.canSubmit).toBe(false);
      expect(result.reason).toContain("WINDOW_EXPIRED");
    });
  });
});
