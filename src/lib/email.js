// ─────────────────────────────────────────────────────────────────────────
// EMAIL DELIVERY  (NEW_IDEAS.md §38.6 / §40.16)
//
// ScoutIt had NO email provider of any kind. In-app notifications worked, so
// a Connect request reached its recipient only when they next opened the app.
// §40.15 made that consequential: a request is archived at 7 days and removed
// at 30, so an owner who doesn't open ScoutIt for a month silently loses the
// lead and the seeker loses non-refundable Connects.
//
// DESIGN — FAILS SAFE, ALWAYS
// --------------------------
// Every function here returns a result object and NEVER throws. Email is a
// courtesy channel layered on top of the in-app notification, which is the
// system of record. A missing API key, a provider outage or a bounced address
// must never break the action that triggered the email — nobody should fail
// to send a Connect because a mail server was down.
//
// With RESEND_API_KEY unset, `sendEmail` reports `skipped: "no_provider"` and
// does nothing. That is the current production state, and it is deliberate:
// the whole path is written, tested and inert until the key exists. Adding the
// key switches it on with no further code change.
//
// Provider is Resend (owner decision, 2026-08-06). Calls go through fetch
// rather than the SDK to avoid a dependency for one HTTP POST.
// ─────────────────────────────────────────────────────────────────────────

import { SITE_URL } from "./siteUrl";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Verified sending domain. Until the domain is verified in Resend, delivery
// will fail for anything other than the account owner's own address — which
// is why sendEmail reports provider errors rather than swallowing them.
const FROM_ADDRESS = process.env.EMAIL_FROM || "ScoutIt <notifications@scoutit.space>";

/**
 * Is email configured at all?
 * Callers use this to skip the work of assembling a message when nothing
 * could be sent anyway.
 */
export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends one email. Never throws.
 *
 * @returns {Promise<{sent: boolean, skipped?: string, error?: string, id?: string}>}
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) return { sent: false, skipped: "no_provider" };
  if (!to || !subject) return { sent: false, skipped: "missing_fields" };

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
        // A text part is not optional politeness: HTML-only mail scores worse
        // with spam filters, and ScoutIt is sending from a new domain with no
        // sending reputation.
        text: text || stripHtml(html),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Provider rejected:", res.status, body.slice(0, 300));
      return { sent: false, error: `provider_${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    return { sent: true, id: data?.id };
  } catch (err) {
    // Network failure. Logged, not thrown — see the header.
    console.error("[email] Send failed:", err?.message);
    return { sent: false, error: "network" };
  }
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Shared shell for every ScoutIt transactional email.
 *
 * Deliberately plain: inline styles only, one table-free column, no images
 * and no web fonts. Gmail strips <style> blocks, Outlook ignores flexbox, and
 * a dark-themed email that renders as black-on-black in a light client is
 * worse than an ugly one that reads.
 */
export function renderEmail({ heading, body, ctaLabel, ctaPath, footnote }) {
  const cta = ctaLabel && ctaPath
    ? `<p style="margin:28px 0 0"><a href="${SITE_URL}${ctaPath}" style="background:#E8AE3C;color:#0d0d0d;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:700;font-size:14px;display:inline-block">${escapeHtml(ctaLabel)}</a></p>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f2ef;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:10px;padding:32px;color:#1a1a1a">
    <p style="margin:0 0 20px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8a7433;font-weight:700">ScoutIt</p>
    <h1 style="margin:0 0 14px;font-size:21px;line-height:1.35;color:#111">${escapeHtml(heading)}</h1>
    <div style="font-size:15px;line-height:1.6;color:#333">${body}</div>
    ${cta}
    ${footnote ? `<p style="margin:26px 0 0;font-size:12px;line-height:1.5;color:#777">${escapeHtml(footnote)}</p>` : ""}
    <hr style="border:none;border-top:1px solid #eee;margin:26px 0 14px">
    <p style="margin:0;font-size:11px;line-height:1.5;color:#999">
      You're receiving this because you have a ScoutIt account.
      <a href="${SITE_URL}/settings" style="color:#8a7433">Manage notifications</a>.
    </p>
  </div></body></html>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
