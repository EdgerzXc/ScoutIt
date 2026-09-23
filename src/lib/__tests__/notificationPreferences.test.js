import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// A-152 — the transactional email footer promises "Manage notifications" at
// /settings, but settings had no notification control. The panel must be a
// real control (not a second home for the Privacy marketing toggle), the
// email fallback must honor an opt-out, and every mail must carry
// one-click unsubscribe headers.
//
// (Rule 19: written first and watched failing — no #notifications section,
// no emailAlerts path, no List-Unsubscribe header existed.)

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("A-152 — notification preferences are real controls", () => {
  it("settings renders a #notifications section and nav entry", () => {
    expect(read("src/app/settings/page.js")).toContain('id="notifications"');
    expect(read("src/lib/settingsNavigation.js")).toContain("notifications");
  });

  it("the panel owns one toggle and does not duplicate the Privacy control", () => {
    const src = read("src/components/profile/NotificationPreferencesPanel.js");
    expect(src).toContain("emailAlerts");
    expect(src).not.toContain("marketingOptOut");
    // Marketing email stays in Privacy — the panel links there instead.
    expect(src).toContain("#privacy");
  });

  it("the privacy-settings route persists emailAlerts and reports storage truth", () => {
    const src = read("src/app/api/user/privacy-settings/route.js");
    expect(src).toContain("emailAlerts");
    expect(src).toContain("email_alerts");
    expect(src).toContain("emailAlertsStored");
    // The column lands via migration; until then the route degrades
    // gracefully instead of 500ing (the A-144/A-148 pattern).
    expect(src).toContain("42703");
  });

  it("the footer resolves to the working control", async () => {
    const { renderEmail } = await import("@/lib/email.js");
    expect(renderEmail({ heading: "Hi", body: "<p>ok</p>" })).toMatch(
      /\/settings#notifications/,
    );
  });

  it("every mail carries one-click unsubscribe headers", async () => {
    process.env.RESEND_API_KEY = "re_test";
    let captured;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, opts) => {
      captured = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ id: "e_1" }) };
    });
    const { sendEmail } = await import("@/lib/email.js");
    await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>Hello</p>" });
    expect(captured.headers["List-Unsubscribe"]).toMatch(
      /\/settings#notifications/,
    );
    expect(captured.headers["List-Unsubscribe-Post"]).toContain(
      "List-Unsubscribe=One-Click",
    );
  });

  it("the email fallback honors an explicit opt-out and sends otherwise", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({ id: "e_1" }) });
    const { notifyUser } = await import("@/lib/notifications.js");

    const clientFor = (emailAlerts) => ({
      from: (table) => {
        if (table === "user_notifications") {
          return { insert: async () => ({ error: null }) };
        }
        if (table === "privacy_settings") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { email_alerts: emailAlerts },
                  error: null,
                }),
              }),
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
      auth: {
        admin: {
          getUserById: async () => ({
            data: {
              user: {
                email: "away@example.com",
                // Away long enough for the fallback to fire.
                last_sign_in_at: new Date(
                  Date.now() - 48 * 3_600_000,
                ).toISOString(),
              },
            },
            error: null,
          }),
        },
      },
    });

    // notifyUser fires the email fallback WITHOUT awaiting it (by design —
    // a mail server must never block the caller's action), so each send
    // needs a yielded tick before it can be observed.
    const tick = () => new Promise((r) => setTimeout(r, 25));

    await notifyUser(clientFor(false), {
      userId: "opted-out",
      title: "New inquiry",
      desc: "Someone reached out",
      notificationType: "new_inquiry",
    });
    await tick();
    expect(fetchSpy).not.toHaveBeenCalled();

    await notifyUser(clientFor(true), {
      userId: "opted-in",
      title: "New inquiry",
      desc: "Someone reached out",
      notificationType: "new_inquiry",
    });
    await tick();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
