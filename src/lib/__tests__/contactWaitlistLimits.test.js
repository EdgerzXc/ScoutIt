import { describe, it, expect } from "vitest";

// A-146: contact + waitlist were Turnstile-guarded but unmetered — one client
// looping a cheap anonymous POST is the exact attack rateLimit.js exists for.
// These flood past the human range and require a 429 with a Retry-After hint.
// (Rule 19: each was watched failing before the limiter landed — flood first
// returned zero 429s on the unmetered routes.)

const { POST: contactPOST } = await import("@/app/api/contact/route");
const { POST: waitlistPOST } = await import("@/app/api/waitlist/route");

const VALID_CONTACT = {
  name: "Loop Tester",
  email: "loop@example.com",
  message: "metering probe",
  turnstileToken: "tok-probe",
};

const VALID_WAITLIST = {
  email: "loop@example.com",
  turnstileToken: "tok-probe",
};

const post = (path, body, ip) =>
  new Request(`https://www.scoutit.space${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

async function flood(handler, makeRequest, n) {
  const statuses = [];
  let retryAfter = null;
  for (let i = 0; i < n; i += 1) {
    const res = await handler(makeRequest());
    statuses.push(res.status);
    if (res.status === 429 && retryAfter === null) {
      retryAfter = res.headers.get("Retry-After");
    }
  }
  return { statuses, retryAfter };
}

describe("A-146 — anonymous PII funnels are metered", () => {
  it("meters /api/contact past the human range", async () => {
    const { statuses, retryAfter } = await flood(
      contactPOST,
      () => post("/api/contact", VALID_CONTACT, "203.0.113.101"),
      15,
    );
    // The first requests reach Turnstile (whatever it answers); the loop does not.
    expect(statuses).toContain(429);
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  it("meters /api/waitlist past the human range", async () => {
    const { statuses, retryAfter } = await flood(
      waitlistPOST,
      () => post("/api/waitlist", VALID_WAITLIST, "203.0.113.102"),
      15,
    );
    expect(statuses).toContain(429);
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  it("does not meter one caller into another caller's budget", async () => {
    const { statuses } = await flood(
      contactPOST,
      () => post("/api/contact", VALID_CONTACT, "203.0.113.103"),
      15,
    );
    expect(statuses).toContain(429);

    const fresh = await contactPOST(post("/api/contact", VALID_CONTACT, "203.0.113.104"));
    expect(fresh.status).not.toBe(429);
  });
});
