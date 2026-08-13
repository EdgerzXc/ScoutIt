import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

describe("sample notification defense-in-depth contract", () => {
  it("guards the shared notification helper before any in-app or email path", () => {
    const source = read("src/lib/notifications.js");
    const guard = source.indexOf("const routing = await validateSampleNotificationRouting");
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(source.indexOf('.from("user_notifications").insert'));
    expect(guard).toBeLessThan(source.indexOf("maybeEmailFallback"));
    expect(source).toContain("property_routing_unverified");
  });

  it("does not allow the client notification endpoint to bypass the shared guard", () => {
    const route = read("src/app/api/notifications/route.js");
    const post = route.slice(route.indexOf("export async function POST"));
    expect(post).toContain("validateSampleNotificationRouting");
    expect(post).toContain("await notifyUser");
    expect(post).not.toContain('from("user_notifications").insert');
    expect(route).toContain("propertyId: z.string().uuid().optional()");
  });

  it("keeps FAQ answer notifications tied to their property slug", () => {
    const route = read("src/app/api/faqs/route.js");
    expect(route).toContain("propertySlug: faq.property_id");
    expect(route.indexOf("propertySlug: faq.property_id")).toBeLessThan(route.indexOf('notificationType: "faq_answered"'));
  });
  it("blocks sample broker pitches and questions before their first product write", () => {
    const pitch = read("src/app/api/deals/pitch/route.js");
    const pitchGuard = pitch.indexOf("if (!sampleRouting.ok)");
    expect(pitchGuard).toBeGreaterThan(-1);
    expect(pitchGuard).toBeLessThan(pitch.indexOf('.from("property_broker_representations").insert'));
    expect(pitchGuard).toBeLessThan(pitch.indexOf("supabaseAdmin.rpc('spend_connects'"));

    const faq = read("src/app/api/faqs/route.js");
    const questionBranch = faq.slice(faq.indexOf("Branch B: asking a new question"));
    const faqGuard = questionBranch.indexOf("if (!sampleRouting.ok)");
    expect(faqGuard).toBeGreaterThan(-1);
    expect(faqGuard).toBeLessThan(questionBranch.indexOf('.from("property_faqs")\n      .insert'));
    expect(faqGuard).toBeLessThan(questionBranch.indexOf("await notifyUser"));
  });
});
