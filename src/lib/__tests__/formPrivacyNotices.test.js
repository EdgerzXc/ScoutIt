import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// A-150 — every form that collects personal contact data renders an explicit
// link to /privacy adjacent to its submit control (RA 10173 §11, RULES rule
// 30). One shared component so the wording cannot drift per form.
//
// (Rule 19: written first and watched failing — none of the five forms named
// a Privacy Policy before this item.)

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

const FORMS = [
  "src/app/contact/ContactClient.js",
  "src/components/ui/EarlyAccessGate.js",
  "src/components/property/InquiryModal.js",
  "src/components/property/UnitInquiryModal.js",
  "src/components/stratosphere/CommunityConnectModal.js",
];

describe("A-150 — form privacy disclosures", () => {
  it("the shared notice links /privacy in a new tab", () => {
    const src = read("src/components/ui/PrivacyNotice.js");
    // The href rides on a named constant so all five forms share one path;
    // pin the constant's value, not just its name.
    expect(src).toContain('PRIVACY_POLICY_PATH = "/privacy"');
    expect(src).toContain("href={PRIVACY_POLICY_PATH}");
    expect(src).toContain("_blank");
    expect(src).toContain("Privacy Policy");
  });

  it.each(FORMS)("renders the shared notice: %s", (file) => {
    const src = read(file);
    expect(src).toContain("PrivacyNotice");
    expect(src).toContain("<PrivacyNotice");
  });

  it("the contact form keeps its retention notice alongside the new link", () => {
    const src = read("src/app/contact/ContactClient.js");
    expect(src).toContain("CONTACT_RETENTION_NOTICE");
    expect(src).toContain("<PrivacyNotice");
  });
});
