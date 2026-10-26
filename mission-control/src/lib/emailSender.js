/**
 * Outbound email sender for Mission Control (A-258).
 * Fails safe: never throws, logs failures, reports status objects.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = process.env.EMAIL_FROM || "ScoutIt Operations <operations@scoutit.space>";

/**
 * Checks whether the email provider is configured.
 * @returns {boolean}
 */
export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends a transactional email through Resend.
 *
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.html
 * @param {string} [params.text]
 * @returns {Promise<{ sent: boolean, skipped?: string, error?: string, id?: string }>}
 */
export async function sendStaffEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) {
    return { sent: false, skipped: "no_provider" };
  }
  if (!to || !subject) {
    return { sent: false, skipped: "missing_fields" };
  }

  try {
    const plainText = text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to: [to],
        subject,
        html,
        text: plainText,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[MMC email] Provider error:", res.status, errBody.slice(0, 300));
      return { sent: false, error: `provider_${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error("[MMC email] Network error:", err?.message);
    return { sent: false, error: "network_error" };
  }
}
