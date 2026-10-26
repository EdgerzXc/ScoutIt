/**
 * Outbound staff communications policy, templates, and email rendering (A-258).
 * Pure functions, zero I/O, 100% testable.
 */

export const COMMUNICATION_TEMPLATES = Object.freeze({
  CONTACT_REPLY: "contact_reply",
  DISPUTE_NOTICE: "dispute_notice",
  CLAIM_RESOLUTION: "claim_resolution",
  VERIFICATION_FEEDBACK: "verification_feedback",
  GENERAL_STAFF_NOTICE: "general_staff_notice",
});

export const TEMPLATE_METADATA = Object.freeze({
  [COMMUNICATION_TEMPLATES.CONTACT_REPLY]: {
    name: "General Contact Reply",
    defaultSubject: "Response regarding your ScoutIt inquiry",
    category: "Inbound Support",
  },
  [COMMUNICATION_TEMPLATES.DISPUTE_NOTICE]: {
    name: "Dispute Resolution Notice",
    defaultSubject: "Notice of Review/Dispute Resolution — ScoutIt Space Intelligence",
    category: "Trust & Safety",
  },
  [COMMUNICATION_TEMPLATES.CLAIM_RESOLUTION]: {
    name: "Ownership Claim Decision",
    defaultSubject: "Update regarding your property ownership claim on ScoutIt",
    category: "Property Verification",
  },
  [COMMUNICATION_TEMPLATES.VERIFICATION_FEEDBACK]: {
    name: "Verification & Licensing Feedback",
    defaultSubject: "Information regarding your professional verification on ScoutIt",
    category: "Compliance",
  },
  [COMMUNICATION_TEMPLATES.GENERAL_STAFF_NOTICE]: {
    name: "Official Staff Notice",
    defaultSubject: "Official Notice from ScoutIt Operations Team",
    category: "Operations",
  },
});

/**
 * Validates outbound message parameters.
 */
export function validateOutboundMessage({ recipientEmail, subject, message }) {
  if (!recipientEmail || typeof recipientEmail !== "string") {
    return { valid: false, error: "Recipient email is required." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail.trim())) {
    return { valid: false, error: "Recipient email address is invalid." };
  }
  if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
    return { valid: false, error: "Subject line must be at least 3 characters." };
  }
  if (!message || typeof message !== "string" || message.trim().length < 10) {
    return { valid: false, error: "Message body must be at least 10 characters." };
  }
  return { valid: true, error: null };
}

/**
 * Renders an HTML email styled with ScoutIt dark luxury aesthetics.
 */
export function renderStaffEmailHtml({
  recipientName = "Valued Member",
  subject,
  message,
  staffDisplayName = "ScoutIt Operations",
  staffRole = "Platform Operations Desk",
  referenceId = null,
}) {
  const cleanMessage = (message || "").trim().replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ededed;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #121212; border: 1px solid #262626; border-radius: 12px; padding: 32px;">
    <!-- Header -->
    <div style="border-bottom: 1px solid #262626; padding-bottom: 20px; margin-bottom: 24px;">
      <div style="font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #E8AE3C; margin-bottom: 4px;">
        ScoutIt Space Intelligence
      </div>
      <div style="font-size: 18px; font-weight: 600; color: #ffffff;">
        ${escapeHtml(subject)}
      </div>
    </div>

    <!-- Salutation -->
    <p style="font-size: 14px; line-height: 1.6; color: #d4d4d4; margin-top: 0;">
      Dear ${escapeHtml(recipientName)},
    </p>

    <!-- Message Body -->
    <div style="font-size: 14px; line-height: 1.7; color: #e5e5e5; background-color: #0a0a0a; border-left: 3px solid #E8AE3C; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
      ${cleanMessage}
    </div>

    <!-- Sign-off -->
    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #262626; font-size: 13px; color: #a3a3a3;">
      <div style="font-weight: 600; color: #ffffff;">${escapeHtml(staffDisplayName)}</div>
      <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #E8AE3C; margin-top: 2px;">
        ${escapeHtml(staffRole)}
      </div>
      ${
        referenceId
          ? `<div style="font-size: 10px; font-family: monospace; color: #737373; margin-top: 8px;">Reference ID: ${escapeHtml(
              referenceId
            )}</div>`
          : ""
      }
    </div>

    <!-- Footer -->
    <div style="margin-top: 32px; font-size: 11px; color: #525252; text-align: center; border-top: 1px solid #1f1f1f; padding-top: 16px;">
      ScoutIt Space Intelligence Platform · Metro Manila, Philippines<br/>
      This is an official transactional message sent from Mission Control.
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
