import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth } = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
    resend: vi.fn(),
    signUp: vi.fn(),
  },
}));

vi.mock("@/lib/supabaseClient", () => ({ supabase: { auth } }));

import { getUser, resendSignupConfirmation, signUp } from "@/lib/authClient";

describe("email confirmation auth client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates a returning user through Supabase Auth", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "verified" } }, error: null });
    await expect(getUser()).resolves.toEqual({ data: { user: { id: "verified" } }, error: null });
    expect(auth.getUser).toHaveBeenCalledOnce();
  });

  it("sends signup confirmation to the canonical onboarding return", async () => {
    auth.signUp.mockResolvedValue({ data: {}, error: null });
    await signUp("person@example.com", "password123", null, "captcha", "https://scoutit.space/onboarding");
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "password123",
      options: {
        captchaToken: "captcha",
        emailRedirectTo: "https://scoutit.space/onboarding",
      },
    });
  });

  it("resends an expired signup confirmation with CAPTCHA and the same return URL", async () => {
    auth.resend.mockResolvedValue({ data: {}, error: null });
    await resendSignupConfirmation(
      "person@example.com",
      "captcha-2",
      "https://scoutit.space/onboarding",
    );
    expect(auth.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "person@example.com",
      options: {
        captchaToken: "captcha-2",
        emailRedirectTo: "https://scoutit.space/onboarding",
      },
    });
  });
});
