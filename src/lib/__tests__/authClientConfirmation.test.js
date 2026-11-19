import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth } = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    resend: vi.fn(),
    signUp: vi.fn(),
    mfa: { getAuthenticatorAssuranceLevel: vi.fn() },
  },
}));

vi.mock("@/lib/supabaseClient", () => ({ supabase: { auth } }));

import { getSession, getUser, getWorkspaceUser, resendSignupConfirmation, signUp } from "@/lib/authClient";

describe("email confirmation auth client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates a returning user through Supabase Auth", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "verified" } }, error: null });
    await expect(getUser()).resolves.toEqual({ data: { user: { id: "verified" } }, error: null });
    expect(auth.getUser).toHaveBeenCalledOnce();
  });

  it("keeps ordinary sign-in available when authenticator enrollment is unverified", async () => {
    const user = { id: "verified", factors: [{ status: "unverified" }] };
    auth.getUser.mockResolvedValue({ data: { user }, error: null });

    await expect(getWorkspaceUser()).resolves.toEqual({ data: { user }, error: null });
    expect(auth.getSession).not.toHaveBeenCalled();
  });

  it.each(["aal1", "aal2"])("applies workspace assurance %s for an enrolled user", async (currentLevel) => {
    const user = { id: "verified", factors: [{ status: "verified" }] };
    auth.getUser.mockResolvedValue({ data: { user }, error: null });
    auth.getSession.mockResolvedValue({ data: { session: { user } }, error: null });
    auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel }, error: null });

    await expect(getWorkspaceUser()).resolves.toEqual({ data: { user: currentLevel === "aal2" ? user : null }, error: null });
  });

  it("rejects assurance from a different account after a session change", async () => {
    const user = { id: "verified", factors: [{ status: "verified" }] };
    auth.getUser.mockResolvedValue({ data: { user }, error: null });
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: "other" } } }, error: null });

    await expect(getWorkspaceUser()).resolves.toEqual({ data: { user: null }, error: null });
    expect(auth.mfa.getAuthenticatorAssuranceLevel).not.toHaveBeenCalled();
  });

  it("safely returns null user and session without throwing when Supabase Auth rejects or returns null data", async () => {
    auth.getUser.mockRejectedValue(new Error("network offline"));
    const userRes = await getUser();
    expect(userRes.data).toEqual({ user: null });
    expect(userRes.error).toBeInstanceOf(Error);

    auth.getSession.mockResolvedValue({ data: null, error: new Error("auth error") });
    const sessionRes = await getSession();
    expect(sessionRes.data).toEqual({ session: null });
    expect(sessionRes.error).toBeInstanceOf(Error);
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
