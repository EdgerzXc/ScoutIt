import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  SIGNAL_STATUSES,
  DEFAULT_MAX_SIGNAL_ANSWERS,
  signalTerminalState,
  isSignalActive,
  maxAnswersForSignal,
  openAnswersText,
  activeSignalCutoffIso,
} from "@/lib/communityPosting";

const read = (relative) => readFileSync(resolve(process.cwd(), relative), "utf8");
const stripComments = (code) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const NOW = new Date("2026-10-24T12:00:00.000Z");
const DAY = 86_400_000;

describe("A-239 Descent Board Continuous Chain", () => {
  it("has continuous 01 to 06 layers on descent page and CSS", () => {
    const code = read("src/app/descent/page.js");
    const css = read("src/app/descent/descent.css");
    expect(code).toContain("01");
    expect(code).toContain("02");
    expect(code).toContain("03");
    expect(code).toContain("04");
    expect(code).toContain("05");
    expect(code).toContain("06");
    expect(code).toContain("Stratosphere");
    expect(code).toContain("layer-stratosphere");
    expect(code).not.toContain("layer-atmos");
    expect(css).toContain("layer-stratosphere");
    expect(css).not.toContain("layer-atmos");
  });

  it("fixes layer count comment in layer layout", () => {
    const code = read("src/app/layer/layout.js");
    expect(code).toContain("six descent layers");
    expect(code).not.toContain("five descent layers");
  });
});

describe("A-240 Demand Signal Fulfillment and Removal", () => {
  it("determines terminal states accurately with signalTerminalState", () => {
    // 1. Fulfilled status -> served
    expect(signalTerminalState({ status: SIGNAL_STATUSES.FULFILLED, now: NOW })).toBe("served");
    expect(signalTerminalState({ status: "fulfilled", now: NOW })).toBe("served");

    // 2. Closed status -> withdrawn
    expect(signalTerminalState({ status: SIGNAL_STATUSES.CLOSED, now: NOW })).toBe("withdrawn");
    expect(signalTerminalState({ status: "withdrawn", now: NOW })).toBe("withdrawn");

    // 3. Handshake completed deal -> served
    expect(signalTerminalState({ status: "active", dealOutcome: "completed", now: NOW })).toBe("served");

    // 4. Stale/expired lastConfirmedAt (> 7 days) -> expired
    const expiredInstant = new Date(NOW.getTime() - 8 * DAY).toISOString();
    expect(
      signalTerminalState({
        status: "active",
        lastConfirmedAt: expiredInstant,
        now: NOW,
      })
    ).toBe("expired");

    // 5. Active and fresh signal -> live (not terminal)
    const freshInstant = new Date(NOW.getTime() - 2 * DAY).toISOString();
    expect(
      signalTerminalState({
        status: "active",
        lastConfirmedAt: freshInstant,
        now: NOW,
      })
    ).toBe("live");
  });

  it("un-counts fulfilled signals in capacity checks and feed queries", () => {
    const freshInstant = new Date(NOW.getTime() - 2 * DAY).toISOString();
    // Active returns true
    expect(isSignalActive(freshInstant, NOW, "active")).toBe(true);

    // Fulfilled returns false (freeing capacity and excluding from active feed)
    expect(isSignalActive(freshInstant, NOW, "fulfilled")).toBe(false);
    expect(isSignalActive(freshInstant, NOW, "closed")).toBe(false);
    expect(isSignalActive(freshInstant, NOW, "archived")).toBe(false);
  });

  it("provides author close route with outcome options and handshake bridge", () => {
    const closeRouteCode = read("src/app/api/community/signals/[id]/close/route.js");
    expect(closeRouteCode).toContain("outcome");
    expect(closeRouteCode).toContain("SIGNAL_STATUSES.FULFILLED");
    expect(closeRouteCode).toContain("fulfilled_at");

    const handshakeRouteCode = read("src/app/api/deals/handshake/route.js");
    expect(handshakeRouteCode).toContain("routing_snapshot?.signal_id");
    expect(handshakeRouteCode).toContain("SIGNAL_STATUSES.FULFILLED");
  });

  it("has staged migration for O-034 fulfilled status", () => {
    const migrationPath = "supabase/migrations/20261024000001_signal_fulfilled_state.sql";
    expect(existsSync(resolve(process.cwd(), migrationPath))).toBe(true);
    const sql = read(migrationPath);
    expect(sql).toContain("fulfilled");
    expect(sql).toContain("fulfilled_at");
    expect(sql).toContain("serving_deal_id");
  });
});

describe("A-241 No Connect Spent on Answered Post & Bounded Answers", () => {
  it("enforces default bound of 3 answers per signal", () => {
    expect(DEFAULT_MAX_SIGNAL_ANSWERS).toBe(3);
    expect(maxAnswersForSignal({})).toBe(3);
    expect(maxAnswersForSignal({ requirements: { max_answers: 5 } })).toBe(5);
    expect(maxAnswersForSignal({ requirements: { max_answers: 20 } })).toBe(10); // clamped to MAX_ALLOWED
  });

  it("formats open answers text honestly", () => {
    expect(openAnswersText(0, 3)).toBe(null);
    expect(openAnswersText(1, 3)).toBe("1 answer waiting · 2 more welcome");
    expect(openAnswersText(2, 3)).toBe("2 answers waiting · 1 more welcome");
    expect(openAnswersText(3, 3)).toBe("Answers full (3/3)");
  });

  it("checks terminal state and refuses connect BEFORE spend in connect route", () => {
    const connectRoute = read("src/app/api/community/signals/[id]/connect/route.js");
    expect(connectRoute).toContain("signalTerminalState");
    expect(connectRoute).toContain("SIGNAL_SERVED");
    expect(connectRoute).toContain("SIGNAL_WITHDRAWN");
    expect(connectRoute).toContain("SIGNAL_EXPIRED");
    expect(connectRoute).toContain("SIGNAL_ANSWERS_FULL");

    // Must check terminal state and bounds before spend_connects
    const terminalCheckIdx = connectRoute.indexOf("signalTerminalState");
    const answersCheckIdx = connectRoute.indexOf("SIGNAL_ANSWERS_FULL");
    const spendIdx = connectRoute.indexOf("spend_connects");

    expect(terminalCheckIdx).toBeGreaterThan(0);
    expect(answersCheckIdx).toBeGreaterThan(0);
    expect(spendIdx).toBeGreaterThan(0);
    expect(terminalCheckIdx).toBeLessThan(spendIdx);
    expect(answersCheckIdx).toBeLessThan(spendIdx);
  });

  it("reuses open pending requests without re-spending connects", () => {
    const connectRoute = read("src/app/api/community/signals/[id]/connect/route.js");
    expect(connectRoute).toContain("existingUserDeal");
    expect(connectRoute).toContain("reused: true");
    const existingCheckIdx = connectRoute.indexOf("existingUserDeal");
    const spendIdx = connectRoute.indexOf("spend_connects");
    expect(existingCheckIdx).toBeLessThan(spendIdx);
  });

  it("names community signal in pending sweep notifications", () => {
    const sweepRoute = read("src/app/api/cron/sweep-pending-requests/route.js");
    expect(sweepRoute).toContain("deal.routing_snapshot?.signal_title");
    expect(sweepRoute).toContain('community signal "${signalTitle}"');
  });

  it("connect UI and modal display honest copy regarding no refunds", () => {
    const modalCode = read("src/components/stratosphere/CommunityConnectModal.js");
    expect(modalCode).toContain("No refunds: a Connect buys delivery of your request, not a guaranteed match.");
    expect(modalCode).toContain("isFull");
    expect(modalCode).toContain("isTerminal");
    expect(modalCode).toContain("ANSWERS FULL");
  });
});
