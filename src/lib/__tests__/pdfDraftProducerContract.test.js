import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// A-076 — the PRODUCER half of the PDF verification gate.
//
// ── WHY THIS IS A SOURCE ASSERTION ───────────────────────────────────
// The wiring under test lives in `DashboardContext.addListing` (a React
// context) and `OwnerMode` (JSX). This repo cannot render-test components at
// all: JSX is written in `.js` files, which the Vite/Rolldown pipeline vitest
// runs on will not parse. A-016 hit the same wall and recorded it. So this
// asserts the source, which is weaker than a behavioural test and is chosen
// deliberately rather than by preference.
//
// ── WHY IT IS STILL WORTH HAVING ─────────────────────────────────────
// `authTrustLifecycle.test.js` already "covers" this gate — by reimplementing
// the publish condition inline as a local function and asserting against its
// own fixture. That is Standing Rule 16: a fixture invented by the person who
// wrote the query tests the assumption, not the code. It passed continuously
// while the gate never fired for a single real listing, because nothing in the
// product ever produced a row it could match. These assertions are pinned to
// the actual files, so the regression that hid for that long cannot return
// unnoticed.

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("A-076 · PDF-assisted drafts are tagged at creation", () => {
  it("addListing sends creation_source, and still never sends pdf_verified", () => {
    const src = read("src/context/DashboardContext.js");

    // The origin must be declared on insert, or the publish gate has nothing
    // to match and PDF drafts publish unreviewed.
    expect(src).toMatch(/creation_source:\s*listing\.creationSource\s*\|\|\s*'manual'/);

    // pdf_verified is the staff attestation. It is server-only by grant and
    // must never be asserted by the browser — naming it here would both make
    // a claim the owner cannot make and fail with a permission error.
    expect(src).not.toMatch(/pdf_verified:/);
  });

  it("the owner PDF concierge tags its draft as pdf_assisted", () => {
    const src = read("src/components/dashboard/OwnerMode.js");

    // This is the live path: read-pdf -> assimilate -> addListing. It existed
    // and worked; it simply never labelled its output, so every PDF listing
    // looked hand-typed to the publish gate.
    expect(src).toMatch(/creationSource:\s*'pdf_assisted'/);
    expect(src).toContain("/api/ai/read-pdf");
  });

  it("the publish gate refuses with an explanation the owner can act on", () => {
    const src = read("src/app/api/dashboard/publish/route.js");

    expect(src).toMatch(/creation_source === 'pdf_assisted' && !currentSubmission\.pdf_verified/);
    // A refusal with no next step is a dead end. The owner must learn that
    // someone else is acting and that they need not resubmit.
    expect(src).toMatch(/reason:\s*"pdf_verification_pending"/);
    expect(src).toMatch(/do not need to resubmit/);
  });

  it("the staff unlock is reachable from the console", () => {
    // Rule 13: an endpoint with no caller is not a feature, it is a plan. The
    // unlock sat uncalled for a month — and was broken the whole time — so this
    // pins the caller in place.
    const console_ = read("src/app/admin/page.js");
    expect(console_).toContain("/api/admin/pdf-verify");
    expect(console_).toMatch(/activeTab === "pdf"/);
    // The panel must be reachable, not merely defined.
    expect(console_).toMatch(/setActiveTab\("pdf"\)/);
  });

  it("the unlock does not depend on the broken verify_pdf_draft RPC", () => {
    // The function sets `properties.updated_at`, which does not exist, so every
    // call throws 42703 (verified live 2026-09-05). Its repair is prepared in
    // migration 20260905000001 but is owner-gated, so the route must keep doing
    // the write itself — and must keep the RPC's scoping while doing so.
    const route = read("src/app/api/admin/pdf-verify/route.js");
    expect(route).not.toMatch(/\.rpc\(\s*["']verify_pdf_draft["']/);
    expect(route).toMatch(/\.eq\("creation_source",\s*"pdf_assisted"\)/);
  });
});
