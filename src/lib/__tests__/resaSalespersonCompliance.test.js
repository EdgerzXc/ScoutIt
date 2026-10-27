import fs from "node:fs";
import { describe, expect, it } from "vitest";

// RESA Law (R.A. 9646) §31 Compliance Contract
// Real estate salespersons (RES) are accredited practitioners under the direct
// supervision and accountability of a licensed real estate broker (REB).
// The public "Your Move" section must accurately reflect that both licensed brokers
// and their accredited salespersons can facilitate walkthroughs and inquiries.

const commercialFlow = fs.readFileSync("src/components/property/CommercialFlow.js", "utf8");
const residentialFlow = fs.readFileSync("src/components/property/ResidentialFlow.js", "utf8");
const termsPage = fs.readFileSync("src/app/terms/page.js", "utf8");
const onboardingPage = fs.readFileSync("src/app/onboarding/page.js", "utf8");
const dealsInitiateRoute = fs.readFileSync("src/app/api/deals/initiate/route.js", "utf8");

describe("R.A. 9646 Compliance & Salesperson Representation", () => {
  it("CommercialFlow includes accredited salespersons under direct broker supervision", () => {
    expect(commercialFlow).toContain(
      "all site walks, direct inquiries, and purchase offers are facilitated exclusively by licensed real estate brokers and their accredited salespersons under direct broker supervision."
    );
  });

  it("ResidentialFlow includes accredited salespersons under direct broker supervision", () => {
    expect(residentialFlow).toContain(
      "all site walks, direct inquiries, and purchase offers are facilitated exclusively by licensed real estate brokers and their accredited salespersons under direct broker supervision."
    );
  });

  it("renders inclusive CTA buttons across commercial and residential flows", () => {
    expect(commercialFlow).toContain("Connect with an Authorized Broker or Representative →");
    expect(residentialFlow).toContain("Connect with an Authorized Broker or Representative →");
  });

  it("updates Tier 3 introduction text to include accredited representatives", () => {
    expect(commercialFlow).toContain(
      "Connect with an authorized broker or accredited representative to arrange a private walkthrough or review commercial lease terms."
    );
    expect(residentialFlow).toContain(
      "Connect with an authorized broker or accredited representative to arrange a private walkthrough or review title files."
    );
  });

  it("does not regress to stating site walks are facilitated by brokers alone without salespersons", () => {
    expect(commercialFlow).not.toContain("facilitated exclusively by licensed, authorized real estate brokers.");
    expect(residentialFlow).not.toContain("facilitated exclusively by licensed, authorized real estate brokers.");
  });

  it("maintains an 80px bottom margin on mobile to clear the fixed bottom navigation dock", () => {
    expect(commercialFlow).toContain('marginBottom:"80px"');
    expect(residentialFlow).toContain('marginBottom:"80px"');
  });

  it("enforces R.A. 9646 statutory boundaries in Terms of Service", () => {
    expect(termsPage).toContain("Republic Act No. 9646 (the Real Estate Service Act of the Philippines, or RESA)");
    expect(termsPage).toContain("Under Section 3(g) of the RESA Law (RA 9646), Connects are not real estate brokerage fees");
    expect(termsPage).toContain("engage in unauthorized real estate practice under RA 9646");
  });

  it("enforces licensed broker boundary on primary onboarding registration", () => {
    expect(onboardingPage).toContain("ScoutIt lists");
    expect(onboardingPage).toContain("licensed real estate brokers");
    expect(onboardingPage).toContain("supervising broker");
  });

  it("deals initiate route enforces adult legal capacity and server-resolved routing", () => {
    expect(dealsInitiateRoute).toContain("assertAdultEligibility");
    expect(dealsInitiateRoute).toContain("create_routed_buyer_deal");
  });

  it("BottomNav includes salesperson role representing accredited salespersons under broker supervision", () => {
    const bottomNav = fs.readFileSync("src/components/layout/BottomNav.js", "utf8");
    expect(bottomNav).toContain('id: "salesperson"');
    expect(bottomNav).toContain('label: "Real Estate Salesperson"');
    expect(bottomNav).toContain("supervision");
  });

  it("dashboardModes maps salesperson to the broker pipeline workspace", () => {
    const dashboardModes = fs.readFileSync("src/lib/dashboardModes.js", "utf8");
    expect(dashboardModes).toContain('salesperson: "broker"');
  });
});
