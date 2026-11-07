import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  CRM_ACTIVITY_RETENTION_DAYS,
  ANALYTICS_RETENTION_DAYS,
  SECURITY_LOGS_RETENTION_DAYS,
  crmActivityRetentionCutoffIso,
  analyticsRetentionCutoffIso,
  securityLogsRetentionCutoffIso,
} from "@/lib/activityRetention";

describe("A-318: Contact Route PII Protection & DB Outage Fallback", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("fails 500 honestly and leaves no mailbox copy when DB insert returns an error", async () => {
    process.env.RESEND_API_KEY = "test_resend_key";
    process.env.CONTACT_NOTIFY_TO = "staff@scoutit.space";

    vi.doMock("@/lib/turnstile", () => ({
      turnstileGuard: vi.fn().mockResolvedValue(null),
      clientIpFrom: () => "198.51.100.1",
    }));
    vi.doMock("@/lib/clientIp", () => ({
      clientIp: () => "198.51.100.1",
    }));

    const insertMock = vi.fn().mockResolvedValue({
      error: new Error("connection failure to postgres cluster"),
    });

    vi.doMock("@/lib/supabaseAdmin", () => ({
      supabaseAdmin: {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      },
    }));

    const sendEmailMock = vi.fn().mockResolvedValue({ sent: true, id: "msg_123" });
    vi.doMock("@/lib/email", () => ({
      sendEmail: sendEmailMock,
      renderEmail: vi.fn(() => "<html><body>email</body></html>"),
      isEmailConfigured: () => true,
    }));

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("https://scoutit.space/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Confidential Visitor",
        email: "visitor@example.com",
        subject: "Private Inquiry",
        message: "Sensitive property details that must obey 7-day clearing promise.",
        turnstileToken: "token_abc",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toBe("We could not save your message. Please try again shortly.");
    // ZERO emails sent to staff mailbox during DB outage
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("fails 500 honestly and leaves no mailbox copy when DB throws an unexpected exception", async () => {
    process.env.RESEND_API_KEY = "test_resend_key";
    process.env.CONTACT_NOTIFY_TO = "staff@scoutit.space";

    vi.doMock("@/lib/turnstile", () => ({
      turnstileGuard: vi.fn().mockResolvedValue(null),
      clientIpFrom: () => "198.51.100.2",
    }));
    vi.doMock("@/lib/clientIp", () => ({
      clientIp: () => "198.51.100.2",
    }));

    vi.doMock("@/lib/supabaseAdmin", () => ({
      supabaseAdmin: {
        from: vi.fn().mockImplementation(() => {
          throw new Error("fatal supabase client crash");
        }),
      },
    }));

    const sendEmailMock = vi.fn().mockResolvedValue({ sent: true });
    vi.doMock("@/lib/email", () => ({
      sendEmail: sendEmailMock,
      renderEmail: vi.fn(),
      isEmailConfigured: () => true,
    }));

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("https://scoutit.space/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Confidential Visitor",
        email: "visitor@example.com",
        subject: "Private Inquiry",
        message: "Details that must not leak into mailboxes.",
        turnstileToken: "token_abc",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("succeeds with 201 and alerts staff when DB insert commits successfully", async () => {
    process.env.RESEND_API_KEY = "test_resend_key";
    process.env.CONTACT_NOTIFY_TO = "staff@scoutit.space";

    vi.doMock("@/lib/turnstile", () => ({
      turnstileGuard: vi.fn().mockResolvedValue(null),
      clientIpFrom: () => "198.51.100.3",
    }));
    vi.doMock("@/lib/clientIp", () => ({
      clientIp: () => "198.51.100.3",
    }));

    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.doMock("@/lib/supabaseAdmin", () => ({
      supabaseAdmin: {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      },
    }));

    const sendEmailMock = vi.fn().mockResolvedValue({ sent: true, id: "msg_456" });
    vi.doMock("@/lib/email", () => ({
      sendEmail: sendEmailMock,
      renderEmail: vi.fn(() => "<html><body>email</body></html>"),
      isEmailConfigured: () => true,
    }));

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("https://scoutit.space/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Saved Visitor",
        email: "visitor@example.com",
        subject: "Valid Inquiry",
        message: "Hello ScoutIt team",
        turnstileToken: "token_abc",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });
});

describe("A-318: Activity and Telemetry Retention Helpers", () => {
  it("computes 90-day cutoffs accurately", () => {
    const fixedNow = 1793972348738; // fixed reference timestamp
    const expectedCutoff = new Date(fixedNow - 90 * 24 * 60 * 60 * 1000).toISOString();

    expect(CRM_ACTIVITY_RETENTION_DAYS).toBe(90);
    expect(ANALYTICS_RETENTION_DAYS).toBe(90);
    expect(SECURITY_LOGS_RETENTION_DAYS).toBe(90);

    expect(crmActivityRetentionCutoffIso(fixedNow)).toBe(expectedCutoff);
    expect(analyticsRetentionCutoffIso(fixedNow)).toBe(expectedCutoff);
    expect(securityLogsRetentionCutoffIso(fixedNow)).toBe(expectedCutoff);
  });
});

describe("A-318: Purge CRM Activity Cron Route (/api/cron/purge-crm-activity)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.CRON_SECRET = "cron_secret_abc";
  });

  it("rejects unauthorized calls with 401", async () => {
    const { GET } = await import("@/app/api/cron/purge-crm-activity/route");
    const req = new Request("https://scoutit.space/api/cron/purge-crm-activity", {
      headers: { authorization: "Bearer wrong_secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("selects and deletes 91-day activity log rows", async () => {
    const selectMock = vi.fn();
    const deleteMock = vi.fn();

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{ id: "act_91_day_old" }],
        error: null,
      }),
      delete: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    };
    mockChain.select.mockImplementation((fields) => {
      if (fields === "id") {
        return {
          ...mockChain,
          lte: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: "act_91_day_old" }],
              error: null,
            }),
          }),
        };
      }
      return mockChain;
    });
    mockChain.delete.mockReturnValue({
      in: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "act_91_day_old" }],
          error: null,
        }),
      }),
    });

    vi.doMock("@/lib/supabaseAdmin", () => ({
      supabaseAdmin: {
        from: vi.fn().mockReturnValue(mockChain),
      },
    }));

    vi.doMock("@/lib/cronEventLog", () => ({
      withCronEventLog: (job, fn) => fn,
    }));

    const { GET } = await import("@/app/api/cron/purge-crm-activity/route");
    const req = new Request("https://scoutit.space/api/cron/purge-crm-activity", {
      headers: { authorization: "Bearer cron_secret_abc" },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.purged).toBe(1);
    expect(body.retentionDays).toBe(90);
  });
});

describe("A-318: Purge Analytics Cron Route (/api/cron/purge-analytics)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.CRON_SECRET = "cron_secret_abc";
  });

  it("rejects unauthorized calls with 401", async () => {
    const { GET } = await import("@/app/api/cron/purge-analytics/route");
    const req = new Request("https://scoutit.space/api/cron/purge-analytics", {
      headers: { authorization: "Bearer wrong_secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("selects and deletes 91-day analytics events and security access logs", async () => {
    vi.doMock("@/lib/supabaseAdmin", () => ({
      supabaseAdmin: {
        from: vi.fn((table) => {
          if (table === "analytics_events") {
            return {
              select: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ id: "analytics_91_days" }],
                    error: null,
                  }),
                }),
              }),
              delete: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  select: vi.fn().mockResolvedValue({
                    data: [{ id: "analytics_91_days" }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "security_access_logs") {
            return {
              select: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ id: "sec_log_91_days" }],
                    error: null,
                  }),
                }),
              }),
              delete: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  select: vi.fn().mockResolvedValue({
                    data: [{ id: "sec_log_91_days" }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      },
    }));

    vi.doMock("@/lib/cronEventLog", () => ({
      withCronEventLog: (job, fn) => fn,
    }));

    const { GET } = await import("@/app/api/cron/purge-analytics/route");
    const req = new Request("https://scoutit.space/api/cron/purge-analytics", {
      headers: { authorization: "Bearer cron_secret_abc" },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.purgedAnalytics).toBe(1);
    expect(body.purgedSecurityLogs).toBe(1);
    expect(body.retentionDays).toBe(90);
  });
});

describe("A-318: Vercel Cron Registration in vercel.json", () => {
  it("registers purge-crm-activity and purge-analytics with valid daily schedules", () => {
    const raw = readFileSync(resolve(process.cwd(), "vercel.json"), "utf8");
    const vercel = JSON.parse(raw);
    const crons = vercel.crons || [];

    const crmCron = crons.find((c) => c.path === "/api/cron/purge-crm-activity");
    const analyticsCron = crons.find((c) => c.path === "/api/cron/purge-analytics");

    expect(crmCron).toBeDefined();
    expect(crmCron.schedule).toMatch(/^\S+ \S+ \S+ \S+ \S+$/);

    expect(analyticsCron).toBeDefined();
    expect(analyticsCron.schedule).toMatch(/^\S+ \S+ \S+ \S+ \S+$/);
  });
});
