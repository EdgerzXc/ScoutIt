import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CONTACT_RETENTION_DAYS,
  CLEARABLE_CONTACT_STATUSES,
  CONTACT_CLEARED_PATCH,
  CLEARED_NAME,
  CLEARED_EMAIL,
  CONTACT_RETENTION_NOTICE,
  contactRetentionCutoffIso,
  isContactMessageCleared,
} from "@/lib/contactRetention";
import { CHAT_RETENTION_DAYS } from "@/lib/chatRetention";

const read = (path) => readFileSync(path, "utf8");
// A comment quoting the rule satisfies a guard that requires it (the A-080
// trap), so every source assertion runs on comment-stripped text.
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const job = stripComments(read("src/app/api/cron/purge-contact-messages/route.js"));
const form = stripComments(read("src/app/contact/ContactClient.js"));
const privacy = stripComments(read("src/app/privacy/page.js"));
const vercel = JSON.parse(read("vercel.json"));

// A fixed instant. Never read the clock in a test (Rule 11).
const NOW = Date.parse("2026-09-10T12:00:00.000Z");

describe("A-002 visitor contact-message retention", () => {
  it("keeps a resolved message for seven days", () => {
    expect(CONTACT_RETENTION_DAYS).toBe(7);
    expect(contactRetentionCutoffIso(NOW)).toBe("2026-09-03T12:00:00.000Z");
  });

  it("measures the window from when it was resolved, not when it arrived", () => {
    // The job's predicate is `handled_at <= cutoff`. A message that waited
    // three weeks for an answer must still be readable for seven days after.
    expect(job).toContain('.lte("handled_at", cutoff)');
    expect(job).not.toContain('.lte("created_at"');
  });

  it("only a resolved message is a candidate", () => {
    expect(CLEARABLE_CONTACT_STATUSES).toEqual(["resolved"]);
    // An open message still needs a reply address; clearing it would make the
    // answer undeliverable.
    expect(CLEARABLE_CONTACT_STATUSES).not.toContain("new");
    expect(CLEARABLE_CONTACT_STATUSES).not.toContain("in_progress");
    expect(job).toContain('.in("status", CLEARABLE_CONTACT_STATUSES)');
  });

  it("clears the personal fields and nothing else", () => {
    expect(CONTACT_CLEARED_PATCH).toEqual({
      name: CLEARED_NAME,
      email: CLEARED_EMAIL,
      ip_hash: null,
      user_agent: null,
    });
    // The support record survives: what was asked, what staff noted, and the
    // account link that has its own erasure path.
    expect(Object.keys(CONTACT_CLEARED_PATCH)).not.toContain("message");
    expect(Object.keys(CONTACT_CLEARED_PATCH)).not.toContain("subject");
    expect(Object.keys(CONTACT_CLEARED_PATCH)).not.toContain("staff_notes");
    expect(Object.keys(CONTACT_CLEARED_PATCH)).not.toContain("user_id");
  });

  it("clears rather than deletes, and the placeholders are not blank", () => {
    // name and email are NOT NULL on the live table, and a blank would render
    // as a nameless message that reads like a bug rather than a kept promise.
    expect(CLEARED_NAME.length).toBeGreaterThan(0);
    expect(CLEARED_EMAIL.length).toBeGreaterThan(0);
    expect(job).toContain(".update(CONTACT_CLEARED_PATCH)");
    expect(job).not.toContain(".delete()");
  });

  it("is idempotent: a second run the same night clears nothing", () => {
    expect(job).toContain('.neq("email", CLEARED_EMAIL)');
    expect(isContactMessageCleared({ name: CLEARED_NAME, email: CLEARED_EMAIL })).toBe(true);
    expect(isContactMessageCleared({ name: "Ana Cruz", email: "ana@example.com" })).toBe(false);
  });

  it("is authorized and logged like every other scheduled job", () => {
    expect(job).toContain("authorizeCronRequest(request)");
    expect(job).toContain('withCronEventLog("purge-contact-messages"');
  });

  it("something actually schedules it (Rule 21: no producer, no feature)", () => {
    const paths = vercel.crons.map((c) => c.path);
    expect(paths).toContain("/api/cron/purge-contact-messages");
  });

  it("stays a separate rule from Handshake Chat (Standing Rule 9)", () => {
    // The two windows happen to be the same length today. They are separate
    // constants so that changing one cannot silently move the other.
    expect(CONTACT_RETENTION_DAYS).toBe(CHAT_RETENTION_DAYS);
    expect(job).not.toContain("chatRetention");
    expect(job).not.toContain("deal_messages");
  });

  it("the published wording matches the behaviour, from one source", () => {
    expect(CONTACT_RETENTION_NOTICE).toContain(String(CONTACT_RETENTION_DAYS));
    // Rendered, not merely imported. The first version of this assertion
    // matched the import statement and passed while the sentence was deleted
    // from the form entirely -- found by mutating it (Rule 19).
    const rendered = form.replace(/^import[^;]*;/gm, "");
    expect(rendered).toContain("{CONTACT_RETENTION_NOTICE}");
    expect(privacy).toContain("CONTACT_RETENTION_DAYS");
    // Not a second hardcoded number that can drift from the constant.
    expect(privacy).not.toContain("retained for 7 days and are then cleared");
  });
});
