import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// A-161: Platform Fallback Contracts
// Tests graceful degradation across AI processing, Contact intake, and Deal refunds.

describe("AI Blueprint Fallback Contract", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("falls back to heuristic mapping when GEMINI_API_KEY is not configured", async () => {
    delete process.env.GEMINI_API_KEY;
    vi.doMock("@/lib/serverAuth", () => ({
      resolveUserId: async () => "user-123",
    }));

    const { POST } = await import("@/app/api/ai/blueprint/route");
    const req = new Request("https://scoutit.space/api/ai/blueprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headers: ["Building Name", "Monthly Rent", "District", "Notes"],
        sampleData: [{ "Building Name": "One Central", "Monthly Rent": "100000" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data["Building Name"]).toBe("title");
    expect(data["Monthly Rent"]).toBe("price");
    expect(data["District"]).toBe("details");
    expect(data["Notes"]).toBe("description");
  });

  it("falls back to heuristic mapping when Gemini API throws an error", async () => {
    process.env.GEMINI_API_KEY = "test_key";
    vi.doMock("@/lib/serverAuth", () => ({
      resolveUserId: async () => "user-123",
    }));
    vi.doMock("@/lib/geminiModel", () => ({
      generateWithFallback: vi.fn().mockRejectedValue(new Error("Gemini quota exceeded")),
    }));

    const { POST } = await import("@/app/api/ai/blueprint/route");
    const req = new Request("https://scoutit.space/api/ai/blueprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headers: ["Property Title", "Location Area", "Photos"],
        sampleData: [{ "Property Title": "Alpha Tower" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data["Property Title"]).toBe("title");
    expect(data["Location Area"]).toBe("location");
    expect(data["Photos"]).toBe("media_link");
  });
});

describe("AI Rewrite Fallback Contract", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns formatted original text with fallback flag when GEMINI_API_KEY is not configured", async () => {
    delete process.env.GEMINI_API_KEY;
    vi.doMock("@/lib/serverAuth", () => ({
      resolveUserId: async () => "user-123",
    }));

    const { POST } = await import("@/app/api/ai/rewrite/route");
    const req = new Request("https://scoutit.space/api/ai/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "  High floor corner unit with panoramic Makati skyline view.  ",
        location: "Makati",
        category: "Condominium",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.fallback).toBe(true);
    expect(data.text).toBe("High floor corner unit with panoramic Makati skyline view.");
  });

  it("returns formatted original text when Gemini API throws an error", async () => {
    process.env.GEMINI_API_KEY = "test_key";
    vi.doMock("@/lib/serverAuth", () => ({
      resolveUserId: async () => "user-123",
    }));
    vi.doMock("@/lib/geminiModel", () => ({
      generateWithFallback: vi.fn().mockRejectedValue(new Error("AI service temporary timeout")),
    }));

    const { POST } = await import("@/app/api/ai/rewrite/route");
    const req = new Request("https://scoutit.space/api/ai/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Clean minimalist warehouse in Pasig.",
        location: "Pasig",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.fallback).toBe(true);
    expect(data.text).toBe("Clean minimalist warehouse in Pasig.");
  });
});

describe("Contact Route Fallback Contract", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("dispatches emergency email fallback and returns 201 when database insert fails", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.CONTACT_NOTIFY_TO = "alerts@scoutit.space";

    vi.doMock("@/lib/turnstile", () => ({
      turnstileGuard: vi.fn().mockResolvedValue(null),
      clientIpFrom: () => "127.0.0.1",
    }));
    vi.doMock("@/lib/clientIp", () => ({
      clientIp: () => "127.0.0.1",
    }));
    vi.doMock("@/lib/supabaseAdmin", () => ({
      supabaseAdmin: {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: new Error("connection timeout to postgres") }),
        }),
      },
    }));

    const sendEmailMock = vi.fn().mockResolvedValue({ sent: true, id: "email-123" });
    vi.doMock("@/lib/email", () => ({
      sendEmail: sendEmailMock,
      renderEmail: vi.fn(({ heading, body }) => `<html><body>${heading}: ${body}</body></html>`),
      isEmailConfigured: () => true,
    }));

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("https://scoutit.space/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Lead",
        email: "lead@example.com",
        subject: "Property Inquiry",
        message: "Interested in the penthouse listing.",
        turnstileToken: "valid-token",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(sendEmailMock).toHaveBeenCalled();
  });

  it("returns 500 when database insert fails and email fallback is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_NOTIFY_TO;

    vi.doMock("@/lib/turnstile", () => ({
      turnstileGuard: vi.fn().mockResolvedValue(null),
      clientIpFrom: () => "127.0.0.1",
    }));
    vi.doMock("@/lib/clientIp", () => ({
      clientIp: () => "127.0.0.1",
    }));
    vi.doMock("@/lib/supabaseAdmin", () => ({
      supabaseAdmin: {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: new Error("connection timeout to postgres") }),
        }),
      },
    }));

    vi.doMock("@/lib/email", () => ({
      sendEmail: vi.fn(),
      renderEmail: vi.fn(),
      isEmailConfigured: () => false,
    }));

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("https://scoutit.space/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Lead",
        email: "lead@example.com",
        subject: "Property Inquiry",
        message: "Interested in the penthouse listing.",
        turnstileToken: "valid-token",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });
});

describe("Deals Transactional Rollback Fallback Contract", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("handles deal insert failure by executing refund and returning safe notification", async () => {
    vi.doMock("@/lib/serverAuth", () => ({
      resolveUserId: async () => "user-sender-1",
    }));
    vi.doMock("@/lib/connectBlocks", () => ({
      isBlocked: async () => false,
    }));
    vi.doMock("@/lib/connectGates", () => ({
      checkReceiverGate: async () => ({ ok: true }),
    }));

    let rpcCalledWith = [];
    const mockSupabaseAdmin = {
      from: (table) => {
        if (table === "properties") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: "prop-uuid-1", title: "Tower Alpha", slug: "tower-alpha", owner_id: "other-owner" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "user_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: "00000000-0000-0000-0000-000000000002" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "deals") {
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: null,
                  error: new Error("deals table disk full or temporary constraint"),
                }),
              }),
            }),
          };
        }
        if (table === "security_access_logs") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { select: vi.fn(), insert: vi.fn() };
      },
      rpc: vi.fn((method, args) => {
        rpcCalledWith.push({ method, args });
        if (method === "spend_connects") {
          return Promise.resolve({ data: [{ total_balance: 5 }], error: null });
        }
        if (method === "refund_connects_system_error") {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    vi.doMock("@/lib/supabaseAdmin", () => ({
      supabaseAdmin: mockSupabaseAdmin,
    }));

    const { POST } = await import("@/app/api/deals/route");
    const req = new Request("https://scoutit.space/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: "prop-uuid-1",
        otherPartyEmail: "00000000-0000-0000-0000-000000000002",
        status: "pending",
        initialMessage: "Inquiry on property",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("Your Connect token has been refunded");
    expect(rpcCalledWith.some(call => call.method === "refund_connects_system_error")).toBe(true);
  });
});

