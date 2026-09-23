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

  it("protects public writes with Turnstile and keeps roster requests authenticated", () => {
    const waitlist = read("src/components/waitlist/WaitlistModal.js");
    const roster = read("src/app/property/[id]/brokers/BrokersClient.js");
    const contact = read("src/app/property/[id]/brokers/BrokerConnectForm.js");
    expect(waitlist).toContain('import TurnstileGate from "@/components/ui/TurnstileGate"');
    expect(waitlist).toContain("turnstileRef.current?.reset()");
    expect(waitlist).toContain("!turnstileToken");
    expect(roster).not.toContain('fetch("/api/inquiries"');
    expect(contact).toContain("session?.access_token");
    expect(contact).toContain('Authorization: `Bearer ${session.access_token}`');
    expect(contact).toContain('fetch("/api/deals/initiate"');
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

  it("keeps Google sign-in on the ScoutIt origin and exchanges a nonce-bound ID token", () => {
    const onboarding = read("src/app/onboarding/page.js");

    expect(onboarding).toContain("Continue with Google");
    expect(onboarding).toContain("https://accounts.google.com/gsi/client");
    expect(onboarding).toContain("supabase.auth.signInWithIdToken");
    expect(onboarding).toContain("nonce: hashedNonce");
    expect(onboarding).toContain("use_fedcm_for_button: true");
    expect(onboarding).toContain("nonce,");
    expect(onboarding).not.toContain('signInWithOAuth("google"');
    expect(onboarding).toContain("Google sign-in is temporarily unavailable.");
    expect(onboarding).not.toContain("Google Auth Disabled for MVP");
  });
});
