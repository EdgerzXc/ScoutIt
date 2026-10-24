import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  VERIFICATION_CLAIM,
  listingVerificationCopy,
  listingVerificationState,
} from "@/lib/listingVerification";
import { buildMessagingDispatch, buildPromoPack } from "@/lib/shareBriefing";

const STORY = "src/components/property/LuxuryStoryStudio.js";
const path = () => resolve(process.cwd(), STORY);
const readCode = () =>
  readFileSync(path(), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-20T00:00:00.000Z");
const daysAgo = (n) => new Date(NOW - n * DAY).toISOString();

// ─────────────────────────────────────────────────────────────────────────
// A-235 / SH-03. The promotional surfaces printed VERIFIED as decoration:
// a draft, a never-confirmed listing, a sample and a listing the owner
// re-confirmed last week all produced the same badge. The badge therefore
// carried no information, and it claimed a check ScoutIt cannot support
// for the space.
//
// One predicate, one vocabulary, and no surface may hardcode the word.
// ─────────────────────────────────────────────────────────────────────────

describe("A-235 listing verification claim", () => {
  it("never calls a listing it has not confirmed verified", () => {
    const state = listingVerificationState({ title: "Some Tower" }, NOW);
    expect(state.claim).toBe(VERIFICATION_CLAIM.OWNER_SUBMITTED);

    const copy = listingVerificationCopy({ title: "Some Tower" }, { now: NOW });
    const spoken = [
      copy.dossierTitle,
      copy.specHeader,
      copy.signalsHeader,
      copy.dossierLinkLine,
      copy.scanLine,
      copy.verificationLine,
    ].join(" | ");
    expect(spoken).not.toMatch(/VERIFIED/i);
  });

  it("calls a re-confirmed listing verified and says how long ago", () => {
    const property = { title: "Some Tower", last_verified_date: daysAgo(3) };
    const state = listingVerificationState(property, NOW);
    expect(state.claim).toBe(VERIFICATION_CLAIM.CONFIRMED);
    expect(state.days).toBe(3);

    const copy = listingVerificationCopy(property, { now: NOW });
    expect(copy.dossierTitle).toContain("SCOUTIT-VERIFIED");
    expect(copy.verificationLine).toContain("3 DAYS AGO");
  });

  it("stops calling a listing verified once the confirmation goes stale", () => {
    // Freshness tiers: fresh < 30 days. At 90 days the listing is real but
    // the claim is not.
    const property = { title: "Some Tower", last_verified_date: daysAgo(90) };
    const state = listingVerificationState(property, NOW);
    expect(state.claim).toBe(VERIFICATION_CLAIM.OWNER_SUBMITTED);
    const copy = listingVerificationCopy(property, { now: NOW });
    expect(copy.dossierTitle).not.toMatch(/VERIFIED/i);
    expect(copy.verificationLine).toContain("MONTHS SINCE RE-CONFIRMATION");
  });

  it("never presents a sample as a confirmed space", () => {
    const property = { title: "Demo Tower", is_sample: true, last_verified_date: daysAgo(1) };
    const state = listingVerificationState(property, NOW);
    expect(state.claim).toBe(VERIFICATION_CLAIM.SAMPLE);
    const copy = listingVerificationCopy(property, { now: NOW });
    expect(copy.dossierTitle).toContain("SAMPLE");
    expect(copy.dossierTitle).not.toMatch(/VERIFIED/i);
    expect(copy.verificationLine).toContain("NOT A REAL SPACE");
  });

  it("never presents an unpublished draft as a listing", () => {
    const property = {
      title: "Draft Tower",
      pipeline_status: "pending",
      last_verified_date: daysAgo(1),
    };
    const state = listingVerificationState(property, NOW);
    expect(state.claim).toBe(VERIFICATION_CLAIM.UNPUBLISHED);
    const copy = listingVerificationCopy(property, { now: NOW });
    expect(copy.dossierTitle).not.toMatch(/VERIFIED/i);
    expect(copy.verificationLine).toContain("NOT YET PUBLISHED");
  });

  it("does not let a delegated child unit inherit its parent's claim", () => {
    // The unit has its own row and its own (empty) confirmation date.
    const unit = { title: "Unit 3B", parent_slug: "parent-tower", last_verified_date: null };
    const state = listingVerificationState(unit, NOW);
    expect(state.claim).toBe(VERIFICATION_CLAIM.OWNER_SUBMITTED);
    expect(listingVerificationCopy(unit, { now: NOW }).dossierTitle).not.toMatch(/VERIFIED/i);
  });

  it("marks a tracked partner link as a partner link, not as verification", () => {
    const property = { title: "Some Tower", last_verified_date: daysAgo(2) };
    const via = listingVerificationCopy(property, { via: true, now: NOW });
    expect(via.dossierTitle).toContain("VIA PARTNER DOSSIER");
    expect(via.scanLine).toContain("PARTNER PRIORITY");

    const plain = listingVerificationCopy(property, { now: NOW });
    expect(plain.dossierTitle).not.toContain("VIA");
  });
});

describe("A-235 share copy carries the claim", () => {
  const unconfirmed = { title: "Some Tower", location: "Taguig", last_verified_date: null };
  const confirmed = { title: "Some Tower", location: "Taguig", last_verified_date: daysAgo(2) };

  it("does not say verified in the promo pack of an unconfirmed listing", () => {
    const pack = buildPromoPack(unconfirmed, "https://scoutit.space/property/some-tower");
    expect(pack.executiveSummary).not.toMatch(/verified/i);
    expect(pack.executiveSummary).toContain("Owner-submitted signals on record");
  });

  it("says verified in the promo pack of a confirmed listing", () => {
    const pack = buildPromoPack(confirmed, "https://scoutit.space/property/some-tower");
    expect(pack.executiveSummary).toContain("ScoutIt-verified signals on record");
  });

  it("does not say verified in a messaging dispatch of an unconfirmed listing", () => {
    const dispatch = buildMessagingDispatch(unconfirmed, "https://scoutit.space/property/some-tower", {
      platform: "viber",
    });
    expect(dispatch).not.toMatch(/verified dossier/i);
    expect(dispatch).toContain("View the dossier");
  });
});

describe("A-235 story studio uses the predicate", () => {
  it("exists at all", () => {
    expect(existsSync(path())).toBe(true);
  });

  it("no longer hardcodes a verified badge", () => {
    const code = readCode();
    expect(code).not.toContain("VERIFIED SPACE DOSSIER");
    expect(code).not.toContain("VERIFIED SPECIFICATIONS");
    expect(code).not.toContain("SCAN TO VIEW VERIFIED DOSSIER");
    expect(code).not.toContain("VERIFIED VIA PARTNER DOSSIER");
  });

  it("reads its wording from the verification predicate", () => {
    const code = readCode();
    expect(code).toContain("listingVerificationCopy");
    expect(code).toContain("verification.dossierTitle");
    expect(code).toContain("verification.specHeader");
    expect(code).toContain("verification.verificationLine");
  });
});
