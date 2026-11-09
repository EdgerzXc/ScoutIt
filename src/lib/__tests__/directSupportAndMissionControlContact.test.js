import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Mock supabaseAdmin
vi.mock("@/lib/supabaseAdmin", () => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const selectBadgesMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      data: [{ badge_id: "PIONEER_OWNER_CHARTER", seat_number: 12 }],
      error: null,
    }),
  });
  const fromMock = vi.fn((table) => {
    if (table === "user_badges") {
      return { select: selectBadgesMock };
    }
    return { insert: insertMock };
  });

  return {
    supabaseAdmin: {
      from: fromMock,
    },
    __mocks: {
      insertMock,
      fromMock,
      selectBadgesMock,
    },
  };
});

// Mock turnstileGuard
vi.mock("@/lib/turnstile", () => ({
  turnstileGuard: vi.fn().mockResolvedValue(null),
  clientIpFrom: vi.fn().mockReturnValue("127.0.0.1"),
}));

// Mock email
vi.mock("@/lib/email", () => ({
  isEmailConfigured: vi.fn().mockReturnValue(true),
  sendEmail: vi.fn().mockResolvedValue({ sent: true }),
  renderEmail: vi.fn(({ heading, body, footnote }) => `<html><body><h1>${heading}</h1>${body}<p>${footnote}</p></body></html>`),
}));

// Mock @supabase/supabase-js for auth resolution
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-uuid-123" } },
        error: null,
      }),
    },
  })),
}));

// Mock createServerClient for SSR
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-uuid-123" } },
        error: null,
      }),
    },
  })),
}));

const { POST } = await import("@/app/api/contact/route");
const { supabaseAdmin, __mocks } = await import("@/lib/supabaseAdmin");
const { sendEmail } = await import("@/lib/email");

describe("Direct Support & Contact Desk Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CONTACT_NOTIFY_TO = "ops@scoutit.space";
  });

  it("ensures Footer.js routes Direct Support and Contact to /contact instead of dead mailto", () => {
    const footerPath = path.resolve(process.cwd(), "src/components/layout/Footer.js");
    const content = fs.readFileSync(footerPath, "utf-8");

    // Invariant: no dead mailto:hello@scoutit.space
    expect(content).not.toContain("mailto:hello@scoutit.space");

    // Invariant: Direct Support links to /contact?topic=support
    expect(content).toContain('/contact?topic=support');

    // Invariant: Main contact links to /contact
    expect(content).toContain('href="/contact"');
  });

  it("stores direct support inquiries with [DIRECT SUPPORT] subject prefix", async () => {
    const req = new Request("https://www.scoutit.space/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.1" },
      body: JSON.stringify({
        name: "Maria Santos",
        email: "maria@example.ph",
        subject: "Cannot access property floorplan",
        message: "The PDF download is failing with 403 on unit 12B.",
        turnstileToken: "tok-valid",
        topic: "support",
        priority: "normal",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    expect(__mocks.insertMock).toHaveBeenCalledTimes(1);
    const insertPayload = __mocks.insertMock.mock.calls[0][0];

    expect(insertPayload.subject).toContain("[DIRECT SUPPORT]");
    expect(insertPayload.subject).toContain("Cannot access property floorplan");
    expect(insertPayload.message).toContain("Topic: support");
    expect(insertPayload.status).toBe("new");
  });

  it("elevates Pioneer Charter members to VIP Pioneer Support SLA with seat number", async () => {
    const req = new Request("https://www.scoutit.space/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.1",
        authorization: "Bearer mock-token",
      },
      body: JSON.stringify({
        name: "Charter Owner",
        email: "pioneer@scoutit.ph",
        subject: "Escrow settlement question",
        message: "Need priority confirmation regarding contract clause 4.",
        turnstileToken: "tok-valid",
        topic: "vip_support",
        priority: "urgent",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const insertPayload = __mocks.insertMock.mock.calls[0][0];
    expect(insertPayload.user_id).toBe("test-user-uuid-123");
    expect(insertPayload.subject).toContain("[VIP PIONEER SUPPORT · Charter #012]");
    expect(insertPayload.message).toContain("URGENT / BLOCKING SLA");
    expect(insertPayload.message).toContain("VIP Tier: Verified Pioneer Charter");

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const emailArgs = sendEmail.mock.calls[0][0];
    expect(emailArgs.subject).toContain("[VIP SLA]");
    expect(emailArgs.subject).toContain("Charter #012");
    expect(emailArgs.html).toContain("VIP Pioneer Support SLA Ticket");
  });

  it("verifies Mission Control contact actions export both setContactStatus and saveStaffNotes with RBAC", async () => {
    const actionsPath = path.resolve(
      process.cwd(),
      "mission-control/src/app/dashboard/contact/actions.js"
    );
    const content = fs.readFileSync(actionsPath, "utf-8");

    expect(content).toContain("export async function setContactStatus");
    expect(content).toContain("export async function saveStaffNotes");
    expect(content).toContain("TIERS.OPS_MANAGER");
    expect(content).toContain("logActionStrict");
  });
});
