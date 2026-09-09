import fs from "node:fs";
import { describe, expect, it } from "vitest";

// A-087 — the broker-only position, said out loud at sign-up. Closes the code
// half of O-013.
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────
// Under RA 9646 a real estate **salesperson** is *accredited*, not licensed:
// no board exam, must practise under a named supervising broker, and may not
// sell independently. ScoutIt's live roles are `admin`, `broker`, `provider` —
// there is no salesperson role. So a salesperson signing up today is stored as
// a "broker" and rendered on a public profile headed "Advisory Profile" with a
// PRC **licence** field, presenting an accredited person as a licensed one.
//
// The owner chose option B on 2026-09-04: ScoutIt admits licensed brokers only.
// O-013 is explicit that option B is not "do nothing" — it has exactly one
// requirement: **say it where a person signs up.** Without that line the
// defect is unchanged and now knowingly so, which is worse than not having
// decided.
//
// ── WHAT THIS TEST IS AND IS NOT ─────────────────────────────────────
// It asserts the notice is rendered in the broker branch of the onboarding
// form. It cannot assert how it reads — that is the owner's call and the
// wording is expected to change. So it pins the two things that must survive a
// rewrite: the notice sits inside `mode === "broker"`, and it distinguishes a
// salesperson from a broker. Reword freely; do not delete.

const onboarding = fs.readFileSync("src/app/onboarding/page.js", "utf8");

/** The broker-only branch of the form, sliced from its guard to the closing fragment. */
function brokerBranch(source) {
  const start = source.indexOf('{mode === "broker" && <>');
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf("</>}", start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("A-087 · the broker-only position is stated at sign-up", () => {
  it("renders the notice inside the broker branch, not somewhere a buyer sees it", () => {
    const branch = brokerBranch(onboarding);
    expect(branch).toContain("salesperson");
    expect(branch).toContain("supervising broker");
  });

  it("names both credentials, so the distinction is the point rather than a hint", () => {
    const branch = brokerBranch(onboarding);
    // A notice that says "brokers only" without naming the other thing leaves
    // a salesperson to guess whether it means them. It does.
    expect(branch.toLowerCase()).toContain("licensed");
    expect(branch.toLowerCase()).toContain("accreditation");
  });

  it("keeps the existing claim-versus-verification wording, which is separate and still true", () => {
    // The PRC number records a claim; public verification is its own review
    // (W-008). The new notice must not have displaced that sentence.
    expect(brokerBranch(onboarding)).toContain("public verification remains a separate review");
  });

  it("does not appear in the buyer or owner path", () => {
    // Everything outside the broker branch must be free of it — a salesperson
    // notice on a buyer's screen is noise, and on an owner's screen it is
    // confusing.
    const branch = brokerBranch(onboarding);
    const rest = onboarding.split(branch).join("");
    expect(rest).not.toContain("supervising broker");
  });
});
