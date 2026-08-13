import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("Turnstile production boundaries", () => {
  it("allows only Cloudflare's documented challenge origin in script and frame CSP", () => {
    const config = read("next.config.mjs");
    const cloudflareOrigin = "https://challenges.cloudflare.com";

    const scriptSource = config.match(/script-src ([^;]+);/)?.[1] || "";
    const frameSource = config.match(/frame-src ([^;]+);/)?.[1] || "";

    expect(scriptSource).toContain(cloudflareOrigin);
    expect(frameSource).toContain(cloudflareOrigin);
    expect(config).not.toContain("https://*.cloudflare.com");
  });

  it("requires every public service-role write form to use the shared gate", () => {
    const waitlist = read("src/components/waitlist/WaitlistModal.js");
    const inquiry = read("src/app/property/[id]/brokers/BrokersClient.js");

    for (const source of [waitlist, inquiry]) {
      expect(source).toContain('import TurnstileGate from "@/components/ui/TurnstileGate"');
      expect(source).toContain("turnstileRef.current?.reset()");
      expect(source).toContain("!turnstileToken");
    }
    expect(inquiry).toContain("turnstileToken,");
  });

  it("makes both public write endpoints fail closed before persistence", () => {
    for (const file of ["src/app/api/waitlist/route.js", "src/app/api/inquiries/route.js"]) {
      const route = read(file);
      const guardIndex = route.indexOf("await turnstileGuard(req, turnstileToken)");
      const writeIndex = route.indexOf(".from(");

      expect(route).toContain('turnstileToken: z.string().min(1');
      expect(guardIndex).toBeGreaterThan(-1);
      expect(writeIndex).toBeGreaterThan(guardIndex);
    }
  });

  it("protects permanent-removal password reauthentication before Supabase CAPTCHA is enabled", () => {
    const owner = read("src/components/dashboard/OwnerMode.js");
    const context = read("src/context/DashboardContext.js");

    expect(owner).toContain('action="permanent-listing-removal"');
    expect(owner).toContain("!removalCaptchaToken");
    expect(owner).toContain("removalTurnstileRef.current?.reset()");
    expect(context).toContain("signInWithPassword(");
    expect(context).toContain("captchaToken,");
    expect(context).not.toContain("supabase.auth.signInWithPassword(");
  });

  it("keeps the configured Google OAuth path visible and handles provider errors", () => {
    const onboarding = read("src/app/onboarding/page.js");

    expect(onboarding).toContain("Continue with Google");
    expect(onboarding).toContain('signInWithOAuth("google"');
    expect(onboarding).toContain("Google sign-in is temporarily unavailable.");
    expect(onboarding).not.toContain("Google Auth Disabled for MVP");
  });
});
