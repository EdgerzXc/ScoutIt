import fs from "node:fs";
import path from "node:path";

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("controlled-pilot authentication boundary", () => {
  it("requires validated Supabase identity before dashboard hydration", () => {
    const context = read("src/context/DashboardContext.js");
    const dashboard = read("src/app/dashboard/page.js");
    expect(context).toContain("getUser");
    expect(dashboard).toContain("getUser");
    expect(context).toContain("readDevelopmentMockUser");
    expect(dashboard).toContain("readDevelopmentMockUser");
    expect(context).not.toContain('mockStr.includes("master-dev")');
  });

  it("routes inventory identity through the shared server verifier", () => {
    const inventory = read("src/app/api/dashboard/inventory/route.js");
    expect(inventory).toContain("resolveUserId(request)");
    expect(inventory).not.toContain('request.headers.get("x-mock-user-id")');
  });

  it("ships explicit confirmation recovery copy and controls", () => {
    const onboarding = read("src/app/onboarding/page.js");
    expect(onboarding).toContain("Email confirmation is required");
    expect(onboarding).toContain("Resend confirmation email");
    expect(onboarding).toContain("Use a different email");
    expect(onboarding).toContain("If your link expired");
    expect(onboarding).toContain("resendSignupConfirmation");
    expect(onboarding).toContain("getUser");
  });

  it("keeps payments inactive and removes bypass language from rendered enterprise copy", () => {
    const preview = read("src/components/dashboard/MissionControlMode.js");
    expect(preview).toContain("Pilot access");
    expect(preview).toContain("No checkout");
    expect(preview).not.toContain("Bypass Paywall");
  });

  it("hides Mission Control Google login unless its provider flag is explicit", () => {
    const login = read("mission-control/src/app/page.js");
    expect(login).toContain('NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_ENABLED === "true"');
    expect(login).toContain("GOOGLE_AUTH_ENABLED &&");
  });
});
