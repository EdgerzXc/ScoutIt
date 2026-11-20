import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getPdfPublicationBlock } from "@/lib/propertyPdfReview";

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

  it("the owner PDF concierge uses the authenticated source-retaining producer", () => {
    expect(read("src/components/dashboard/OwnerMode.js")).toContain("submitPropertyPdfDraft(selectedFile, authedFetch)");
    expect(read("src/lib/propertyPdfQueueClient.js")).toContain("/api/properties/queue/intake");
    expect(read("src/app/api/properties/queue/intake/route.js")).toMatch(/creation_source:\s*"pdf_assisted"/);
  });

  it("the publish gate refuses with an explanation the owner can act on", () => {
    const src = read("src/app/api/dashboard/publish/route.js");

    expect(src).toContain("getPdfPublicationBlock(currentSubmission)");
    // A refusal with no next step is a dead end. The owner must learn that
    // someone else is acting and that they need not resubmit.
    expect(src).toMatch(/reason:\s*"pdf_verification_pending"/);
    expect(src).toMatch(/do not need to resubmit/);
  });

  it("blocks quarantined PDFs in every publication entry point before Airtable can write", () => {
    expect(getPdfPublicationBlock({ creation_source: "pdf_assisted", pipeline_status: "quarantined", pdf_verified: true })).toBe("pdf_source_quarantined");
    expect(getPdfPublicationBlock({ creation_source: "pdf_assisted", pipeline_status: "pending", pdf_verified: false })).toBe("pdf_verification_pending");
    expect(getPdfPublicationBlock({ creation_source: "pdf_assisted", pipeline_status: "pending", pdf_verified: true })).toBeNull();
    expect(getPdfPublicationBlock({ creation_source: "manual", pipeline_status: "pending" })).toBeNull();
    for (const [file, gate, write] of [
      ["src/app/api/dashboard/publish/route.js", "getPdfPublicationBlock(currentSubmission)", "await insertProperty("],
      ["src/app/api/admin/approve/route.js", "getPdfPublicationBlock(submission)", "await insertProperty("],
      ["mission-control/src/app/dashboard/cms/actions.js", "getPdfPublicationBlock(property)", "await publishPropertyToAirtable("],
      ["mission-control/src/app/dashboard/submissions/actions.js", "getPdfPublicationBlock(property)", "await publishPropertyToAirtable("],
    ]) {
      const code = read(file);
      expect(code.indexOf(gate)).toBeGreaterThan(0);
      expect(code.indexOf(write)).toBeGreaterThan(code.indexOf(gate));
    }
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

  it("both staff consoles use the audited review and storage cleanup contract", () => {
    const workflow = read("src/lib/propertyPdfReview.js");
    const staffActions = read("mission-control/src/app/dashboard/submissions/actions.js");
    expect(read("mission-control/src/lib/propertyPdfReview.js")).toBe(workflow);
    expect(read("mission-control/src/lib/propertyQueueStorage.js")).toBe(read("src/lib/propertyQueueStorage.js"));
    expect(workflow).toContain('.eq("creation_source", "pdf_assisted")');
    expect(workflow).toContain('client.rpc("record_property_pdf_review"');
    expect(staffActions).toContain("verifyPropertyPdfDraft(createAdminClient(), input, staff.id)");
    expect(staffActions).not.toMatch(/verify_pdf_draft|\.update\(\{\s*pdf_verified:/);
  });
});
