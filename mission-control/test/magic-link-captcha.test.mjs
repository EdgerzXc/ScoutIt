import assert from "node:assert/strict";
import test from "node:test";
import { sendMagicLink } from "../src/lib/magicLink.mjs";

const params = { email: "staff@example.com", origin: "https://console.example.com" };

test("missing CAPTCHA never calls Supabase", async () => {
  let calls = 0;
  await assert.rejects(sendMagicLink({ ...params, captchaToken: "", auth: { signInWithOtp() { calls++; } } }), /security check/);
  assert.equal(calls, 0);
});

test("OTP request includes the CAPTCHA token and same-origin callback; success consumes token", async () => {
  let request;
  let resets = 0;
  await sendMagicLink({ ...params, captchaToken: "fresh-token", auth: { async signInWithOtp(value) { request = value; return { error: null }; } }, resetCaptcha() { resets++; } });
  assert.deepEqual(request, { email: params.email, options: { emailRedirectTo: `${params.origin}/auth/callback`, captchaToken: "fresh-token" } });
  assert.equal(resets, 1);
});

for (const kind of ["provider", "network"]) {
  test(`${kind} failure consumes token and preserves the error for retry`, async () => {
    const failure = new Error(`${kind} failure`);
    let resets = 0;
    await assert.rejects(sendMagicLink({ ...params, captchaToken: "fresh-token", auth: { async signInWithOtp() { if (kind === "network") throw failure; return { error: failure }; } }, resetCaptcha() { resets++; } }), error => error === failure);
    assert.equal(resets, 1);
  });
}
