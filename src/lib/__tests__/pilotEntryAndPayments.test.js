import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

describe("controlled-pilot entry and payment boundaries", () => {
  it("gives invited testers the temporary-account and sample-data notice before authentication", () => {
    const onboarding = read("src/app/onboarding/page.js");
    expect(onboarding).toContain("Invited human-testing notice");
    expect(onboarding).toContain("testing account is temporary and will be deleted");
    expect(onboarding).toContain("external email account remains yours");
    expect(onboarding).toContain("Use sample phone, profile, listing, and public contact details");
    expect(onboarding).toContain("Connect purchases are not active");
    expect(onboarding).not.toContain("deletion consent");
  });

  it("keeps plan evaluation visible while every payment control is disabled", () => {
    const controls = read("src/components/pricing/PilotPaymentControls.js");
    expect(controls).toContain("Plan concepts and prices are visible for evaluation");
    expect(controls).toContain("Payments unavailable during pilot");
    expect(controls).toMatch(/<button[\s\S]*?disabled[\s\S]*?>[\s\S]*?Payments unavailable during pilot/);
    expect(controls).toContain("This control cannot charge, subscribe, upgrade, or purchase Connects");
    expect(controls).toContain("scoutit:open-waitlist");
    expect(controls).not.toMatch(/checkout|stripe|paymentIntent|subscription\.create/i);
  });

  it("uses the shared inactive-payment controls on every pricing surface", () => {
    const pages = [
      "src/app/pricing/page.js",
      "src/app/pricing/owner/page.js",
      "src/app/pricing/seeker/page.js",
      "src/app/pricing/broker/page.js",
      "src/app/pricing/creator/page.js",
      "src/app/pricing/bundles/page.js",
    ];
    for (const page of pages) {
      const source = read(page);
      expect(source, page).toContain("PilotPaymentNotice");
      if (page !== "src/app/pricing/page.js") {
        expect(source, page).toContain("PilotPaymentControls");
        expect(source, page).not.toContain('onClick={() => window.dispatchEvent(new CustomEvent("scoutit:open-waitlist"');
      }
    }
  });
});
