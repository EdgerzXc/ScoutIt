import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateOutboundMessage,
  renderStaffEmailHtml,
  COMMUNICATION_TEMPLATES,
  TEMPLATE_METADATA,
} from "../src/lib/staffCommunications.mjs";
import { sendStaffEmail, isEmailConfigured } from "../src/lib/emailSender.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("validateOutboundMessage enforces strict email format and message lengths", () => {
  assert.equal(validateOutboundMessage({ recipientEmail: "invalid", subject: "Hello", message: "Valid length message body" }).valid, false);
  assert.equal(validateOutboundMessage({ recipientEmail: "", subject: "Hello", message: "Valid length message body" }).valid, false);
  assert.equal(validateOutboundMessage({ recipientEmail: "user@example.com", subject: "Hi", message: "Valid length message body" }).valid, false);
  assert.equal(validateOutboundMessage({ recipientEmail: "user@example.com", subject: "Valid Subject", message: "Short" }).valid, false);
  assert.equal(validateOutboundMessage({ recipientEmail: "user@example.com", subject: "Valid Subject", message: "This is a valid official response body." }).valid, true);
});

test("renderStaffEmailHtml creates luxury HTML email with escaped content and signatures", () => {
  const html = renderStaffEmailHtml({
    recipientName: "Maria Santos",
    subject: "Update <script>alert(1)</script>",
    message: "Your inquiry has been processed.\nThank you for reaching out.",
    staffDisplayName: "Alexander Vance",
    staffRole: "Senior Operations Director",
    referenceId: "REF-12345",
  });

  assert.ok(html.includes("Dear Maria Santos"), "Must include salutation");
  assert.ok(!html.includes("<script>"), "Must escape HTML injection in subject");
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "Must html-entity escape");
  assert.ok(html.includes("Alexander Vance"), "Must include staff name");
  assert.ok(html.includes("REF-12345"), "Must include reference ID");
  assert.ok(html.includes("#E8AE3C"), "Must include ScoutIt brand gold accent color");
});

test("sendStaffEmail fails safe when RESEND_API_KEY is not configured", async () => {
  const originalKey = process.env.RESEND_API_KEY;
  try {
    delete process.env.RESEND_API_KEY;
    assert.equal(isEmailConfigured(), false);
    const result = await sendStaffEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });
    assert.equal(result.sent, false);
    assert.equal(result.skipped, "no_provider");
  } finally {
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  }
});

test("communications/actions.js enforces Ops Manager tier and audit log", async () => {
  const source = await readFile(path.join(root, "src", "app", "dashboard", "communications", "actions.js"), "utf8");
  assert.match(source, /sendStaffReplyAction[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(source, /logActionStrict[\s\S]*?STAFF_OUTBOUND_EMAIL/);
});
