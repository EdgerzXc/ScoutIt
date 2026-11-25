import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

import { sendPasswordRecovery, verifyPasswordRecovery } from "@/lib/passwordRecovery";

describe("password recovery", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses an isolated, non-persistent Auth client", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
    vi.resetModules();
    createClient.mockReturnValue({ auth: {} });
    const { createPasswordRecoveryClient } = await import("@/lib/passwordRecovery");

    expect(createPasswordRecoveryClient()).toEqual({});
    expect(createClient).toHaveBeenCalledWith("https://example.supabase.co", "public-test-key", {
      auth: expect.objectContaining({
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      }),
    });
  });

  it.each([null, { code: "user_not_found" }, { code: "over_email_send_rate_limit" }])(
    "returns the same request result for %j",
    async (error) => {
      const auth = { resetPasswordForEmail: vi.fn().mockResolvedValue({ error }) };
      await expect(sendPasswordRecovery(auth, "test@example.com", "bot-check")).resolves.toBeUndefined();
      expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", { captchaToken: "bot-check" });
    },
  );

  it("requires a recovery session and surfaces provider expiry to the form", async () => {
    const verifyOtp = vi.fn()
      .mockResolvedValueOnce({ error: { code: "otp_expired" } })
      .mockResolvedValueOnce({ data: { session: null } })
      .mockResolvedValueOnce({ data: { session: { access_token: "test-session" } } });
    const auth = { verifyOtp };
    await expect(verifyPasswordRecovery(auth, "test@example.com", "123456")).rejects.toMatchObject({ code: "otp_expired" });
    await expect(verifyPasswordRecovery(auth, "test@example.com", "123456")).resolves.toBe(false);
    await expect(verifyPasswordRecovery(auth, "test@example.com", "123456")).resolves.toBe(true);
    expect(verifyOtp).toHaveBeenCalledWith({ email: "test@example.com", token: "123456", type: "recovery" });
  });

  it("links to the first-party recovery form without a credential in the URL", () => {
    const template = readFileSync("supabase/templates/password-recovery.html", "utf8");
    expect(template).toContain("{{ .Token }}");
    expect(template.match(/href="([^"]+)"/)?.[1]).toBe("https://www.scoutit.space/reset-password?step=code");
  });
});
