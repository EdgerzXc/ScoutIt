import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabaseAdmin
vi.mock("@/lib/supabaseAdmin", () => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const fromMock = vi.fn(() => ({
    insert: insertMock,
  }));
  return {
    supabaseAdmin: {
      from: fromMock,
    },
    __mocks: {
      insertMock,
      fromMock,
    },
  };
});

// Mock turnstileGuard to always allow in this test
vi.mock("@/lib/turnstile", () => ({
  turnstileGuard: vi.fn().mockResolvedValue(null),
  clientIpFrom: vi.fn().mockReturnValue("127.0.0.1"),
}));

// Mock email
vi.mock("@/lib/email", () => ({
  isEmailConfigured: vi.fn().mockReturnValue(true),
  sendEmail: vi.fn().mockResolvedValue({ sent: true }),
  renderEmail: vi.fn().mockReturnValue("<html></html>"),
}));

const { POST } = await import("@/app/api/contact/route");
const { supabaseAdmin, __mocks } = await import("@/lib/supabaseAdmin");
const { sendEmail } = await import("@/lib/email");

describe("Contact Intake Route with Zero-Cost Spam Triage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CONTACT_NOTIFY_TO = "ops@scoutit.space";
  });

  it("stores legitimate inquiries with status 'new' and triggers notification", async () => {
    const req = new Request("https://www.scoutit.space/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.1" },
      body: JSON.stringify({
        name: "Carlos Mendoza",
        email: "carlos@mendoza.ph",
        subject: "Inquiring about listing",
        message: "Hi, I have a commercial property in BGC to list.",
        turnstileToken: "tok-valid",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    expect(supabaseAdmin.from).toHaveBeenCalledWith("contact_messages");
    expect(__mocks.insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Carlos Mendoza",
        email: "carlos@mendoza.ph",
        status: "new",
      })
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("silently stores crypto spam with status 'spam' and suppresses email notifications", async () => {
    const req = new Request("https://www.scoutit.space/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.2" },
      body: JSON.stringify({
        name: "Crypto Promoter",
        email: "bot@crypto-profits.xyz",
        subject: "High yield Bitcoin investment opportunity",
        message: "Our automated trading bot guarantees huge passive income. Join our crypto investment group.",
        turnstileToken: "tok-valid",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    expect(supabaseAdmin.from).toHaveBeenCalledWith("contact_messages");
    expect(__mocks.insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Crypto Promoter",
        email: "bot@crypto-profits.xyz",
        status: "spam",
      })
    );
    // Suppressed! Email quota preserved & staff inbox clean
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
