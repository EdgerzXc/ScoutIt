import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveDefaultNotificationLink, notifyUser } from "@/lib/notifications";

describe("Notifications System & Intelligent Deep-Linking", () => {
  it("resolves exact workspace destinations across all platform notification types", () => {
    // Inquiries and deal rooms
    expect(resolveDefaultNotificationLink("new_inquiry")).toBe("/dashboard/inbox");
    expect(resolveDefaultNotificationLink("operator_request")).toBe("/dashboard/inbox");
    expect(resolveDefaultNotificationLink("deal_message")).toBe("/dashboard/inbox");
    expect(resolveDefaultNotificationLink("deal_dispute")).toBe("/dashboard/inbox");
    expect(resolveDefaultNotificationLink("broker_pitch")).toBe("/dashboard/inbox");
    expect(resolveDefaultNotificationLink("broker_invite")).toBe("/dashboard/inbox");
    expect(resolveDefaultNotificationLink("delegation_accepted")).toBe("/dashboard/inbox");

    // Viewing appointments
    expect(resolveDefaultNotificationLink("viewing_scheduled")).toBe("/dashboard/calendar");
    expect(resolveDefaultNotificationLink("viewing_rescheduled")).toBe("/dashboard/calendar");
    expect(resolveDefaultNotificationLink("viewing_confirmed")).toBe("/dashboard/calendar");

    // Property claims & inventory
    const samplePropId = "d0f0d48b-1fad-4055-9b39-79c4818908e5";
    expect(resolveDefaultNotificationLink("stale_listing", samplePropId)).toBe(`/dashboard/inventory/${samplePropId}`);
    expect(resolveDefaultNotificationLink("claim_approved", samplePropId)).toBe(`/dashboard/inventory/${samplePropId}`);
    expect(resolveDefaultNotificationLink("property_published", samplePropId)).toBe(`/dashboard/inventory/${samplePropId}`);
    expect(resolveDefaultNotificationLink("stale_listing", null)).toBe("/dashboard");

    // CRM Tasks
    expect(resolveDefaultNotificationLink("task_assigned")).toBe("/dashboard/crm");
    expect(resolveDefaultNotificationLink("task_completed")).toBe("/dashboard/crm");

    // Compliance & Settings
    expect(resolveDefaultNotificationLink("prc_credential_expired")).toBe("/settings#verification");

    // Connects & Billing
    expect(resolveDefaultNotificationLink("connects_refund")).toBe("/pricing");
    expect(resolveDefaultNotificationLink("subscription_renewed")).toBe("/pricing");

    // Intel & FAQs
    expect(resolveDefaultNotificationLink("faq_answered")).toBe("/intel");

    // Fallback safe default
    expect(resolveDefaultNotificationLink(null)).toBe("/dashboard");
    expect(resolveDefaultNotificationLink("unknown_custom_type")).toBe("/dashboard");
  });

  it("stores explicit action link in notify_channels array without schema alteration", async () => {
    const insertedRows = [];
    const mockClient = {
      from: vi.fn((table) => ({
        insert: vi.fn(async (rows) => {
          insertedRows.push(...rows);
          return { error: null };
        }),
      })),
      auth: {
        admin: {
          getUserById: vi.fn(async () => ({ data: { user: { email: "test@example.com" } }, error: null })),
        },
      },
    };

    const res = await notifyUser(mockClient, {
      userId: "usr-pilot-tester",
      title: "Action Required: Complete Lease Handshake",
      desc: "Counterparty accepted your commercial proposal.",
      notificationType: "deal_accepted",
      link: "/dashboard/inbox?dealId=deal-bgc-401",
    });

    expect(res).toBe(true);
    expect(insertedRows.length).toBe(1);
    expect(insertedRows[0].user_id).toBe("usr-pilot-tester");
    expect(insertedRows[0].title).toBe("Action Required: Complete Lease Handshake");
    expect(insertedRows[0].notify_channels).toEqual(["in_app", "link:/dashboard/inbox?dealId=deal-bgc-401"]);
  });

  it("defaults to standard ['in_app'] channel when no explicit link is provided", async () => {
    const insertedRows = [];
    const mockClient = {
      from: vi.fn((table) => ({
        insert: vi.fn(async (rows) => {
          insertedRows.push(...rows);
          return { error: null };
        }),
      })),
      auth: {
        admin: {
          getUserById: vi.fn(async () => ({ data: { user: { email: "test@example.com" } }, error: null })),
        },
      },
    };

    const res = await notifyUser(mockClient, {
      userId: "usr-pilot-tester-2",
      title: "System Notification",
      desc: "Weekly wrap-up ready.",
      notificationType: "monthly_wrap",
    });

    expect(res).toBe(true);
    expect(insertedRows.length).toBe(1);
    expect(insertedRows[0].notify_channels).toEqual(["in_app"]);
  });
});
