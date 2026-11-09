import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { turnstileGuard, clientIpFrom } from "@/lib/turnstile";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { sendEmail, renderEmail, isEmailConfigured } from "@/lib/email";
import { classifyContactSpam } from "@/lib/contactSpamPolicy.mjs";
import { resolveUserId } from "@/lib/serverAuth";
import { getPioneerBadge } from "@/lib/BadgeEngine";

// Public contact intake — the logged-out path for someone who has not signed up
// and has a question, or member direct support intake.
//
// WHAT THIS REPLACES
// ------------------
// Two `mailto:hello@scoutit.space` links in the footer. `scoutit.space` has no
// MX records, so every visitor who used the site's own Contact link reached
// nobody — and, being a mailto, got no error either. That is worse than having
// no contact route at all, because it looks like it worked.
//
// WHAT THIS IS NOT
// ----------------
// Not the post-Connect chatbox. That is two identified parties transacting
// after a Connect is spent (`/api/deals/*`), with its own identity, billing and
// retention rules. This is an anonymous stranger asking ScoutIt a question, and
// the two must never share a code path — Standing Rule 9 governs the boundary.
//
// FAILURE POSTURE
// ---------------
// This route NEVER reports success it did not achieve. InquiryModal.js once
// returned a fake success message and silently dropped every real inquiry; the
// whole point of replacing a dead mailto is that the sender learns the truth.
// A failed insert returns 5xx and the form says so.

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("A valid email is required").max(200),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Message is required").max(4000),
  // Public writes require a token in the request shape and server-side
  // verification below. There is no configuration-dependent bypass.
  turnstileToken: z.string().min(1, "Captcha token is required"),
  topic: z.enum(["general", "support", "vip_support", "listing"]).optional(),
  priority: z.enum(["normal", "urgent"]).optional(),
});

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const safeEscape = escapeHtml;

// A-146: anonymous stranger + stored PII = the loop target. 10/min/IP, the
// same ceiling as /api/inquiries — generous to humans, closed to loops.
const checkContactRate = createRateLimiter({ limit: 10, windowMs: 60_000, maxKeys: 20_000 });

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Salted hash, never a raw IP — the same rule security_access_logs follows. */
async function maskIp(request) {
  const salt = process.env.IP_SALT;
  if (!salt) return null;
  const ip = clientIpFrom(request);
  if (!ip) return null;
  return "ip_anon_" + (await sha256Hex(ip + salt));
}

export async function POST(request) {
  // Unauthenticated PII write: meter per IP before any other work (same
  // pattern as /api/inquiries — 10/min). Turnstile stops bots; this stops a
  // loop. The IP is metering-only (maskIp below is what gets stored, salted).
  const rate = checkContactRate(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many messages. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let parsed;
  try {
    parsed = schema.safeParse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not read that request." },
      { status: 400 },
    );
  }

  if (!parsed.success) {
    // Surface the first real validation message rather than a generic one: the
    // sender can only fix what they are told about.
    const first = parsed.error.issues?.[0];
    return NextResponse.json(
      { ok: false, message: first?.message || "Please check the form and try again." },
      { status: 400 },
    );
  }

  const { name, email, subject, message, turnstileToken, topic, priority } = parsed.data;

  // Unauthenticated write path. Left open it is a spam cannon aimed at whoever
  // reads the queue, and a queue nobody trusts is a queue nobody reads.
  const blocked = await turnstileGuard(request, turnstileToken);
  if (blocked) return blocked;

  // Zero-cost in-memory spam triage (runs locally with 0 API calls)
  const spamAssessment = classifyContactSpam({ name, email, subject, message });
  const messageStatus = spamAssessment.isSpam ? "spam" : "new";

  // Check if sender is signed in and detect Pioneer Charter honors
  let senderUserId = null;
  let isVipPioneer = topic === "vip_support";
  let pioneerSeatLabel = null;

  try {
    senderUserId = await resolveUserId(request);
    if (senderUserId && supabaseAdmin) {
      const { data: userBadges } = await supabaseAdmin
        .from("user_badges")
        .select("badge_id, seat_number")
        .eq("user_id", senderUserId);

      const pioneer = getPioneerBadge(userBadges);
      if (pioneer) {
        isVipPioneer = true;
        if (pioneer.seat_number) {
          pioneerSeatLabel = `Charter #${String(pioneer.seat_number).padStart(3, "0")}`;
        }
      }
    }
  } catch (authErr) {
    console.warn("[Contact] Sender user resolution warning:", authErr?.message);
  }

  // Intelligently prefix and structure the subject for staff triage in Mission Control
  let finalSubject = (subject || "").trim();
  if (isVipPioneer) {
    const seatTag = pioneerSeatLabel ? ` · ${pioneerSeatLabel}` : "";
    finalSubject = `[VIP PIONEER SUPPORT${seatTag}] ${finalSubject || "Priority SLA Request"}`;
  } else if (topic === "support") {
    const urgencyTag = priority === "urgent" ? " · URGENT" : "";
    finalSubject = `[DIRECT SUPPORT${urgencyTag}] ${finalSubject || "Technical Assistance"}`;
  } else if (topic === "listing") {
    finalSubject = `[LISTING / CLAIM] ${finalSubject || "Listing Inquiry"}`;
  }

  finalSubject = finalSubject.slice(0, 200);

  // Intelligently embed triage metadata into message if present
  let finalMessage = message;
  const metaLines = [];
  if (topic && topic !== "general") metaLines.push(`Topic: ${topic}`);
  if (priority === "urgent") metaLines.push(`Urgency: URGENT / BLOCKING SLA`);
  if (isVipPioneer) metaLines.push(`VIP Tier: Verified Pioneer Charter (${pioneerSeatLabel || "Active"})`);
  if (metaLines.length > 0) {
    finalMessage = `[${metaLines.join(" | ")}]\n\n${message}`;
  }

  try {
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name,
      email,
      subject: finalSubject || null,
      message: finalMessage,
      status: messageStatus,
      user_id: senderUserId || null,
      ip_hash: await maskIp(request),
      user_agent: (request.headers.get("user-agent") || "").slice(0, 500) || null,
    });

    if (error) {
      // Never echo the raw Postgres error: it names the schema. Fail 500
      // honestly without leaking unmanaged PII copies into mailboxes outside
      // the 7-day retention clearing schedule (A-318 / Fourth Sweep F-02).
      console.error("[Contact] Insert failed", error.message);
      return NextResponse.json(
        { ok: false, message: "We could not save your message. Please try again shortly." },
        { status: 500 },
      );
    }

    // Tell a human, without letting that failure reach the sender.
    // Suppressed for spam to save email quota and prevent staff notification noise.
    if (!spamAssessment.isSpam && isEmailConfigured() && process.env.CONTACT_NOTIFY_TO) {
      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safeSubject = escapeHtml(finalSubject || "no subject");
      const safeMessage = escapeHtml(finalMessage).replace(/\n/g, "<br/>");
      const emailHeading = isVipPioneer
        ? "🚨 VIP Pioneer Support SLA Ticket"
        : topic === "support"
        ? "🛠️ Inbound Direct Support Ticket"
        : "Someone used the contact form";

      const result = await sendEmail({
        to: process.env.CONTACT_NOTIFY_TO,
        subject: isVipPioneer
          ? `[VIP SLA] New message from ${safeName} (${pioneerSeatLabel || "Pioneer"})`
          : `New contact message — ${safeSubject}`,
        html: renderEmail({
          heading: emailHeading,
          // GAP-66: Always HTML-escape sender fields before passing into renderEmail body
          body: `<p><strong>${safeName}</strong> &lt;${safeEmail}&gt; wrote:</p><p>${safeMessage}</p>`,
          ctaLabel: "Open the contact queue",
          // GAP-100: Deep link staff directly to the Mission Control contact queue instead of public form
          ctaPath: "/dashboard/contact",
          footnote: isVipPioneer
            ? "VIP SLA Ticket: Priority resolution required under Terms of Service Section 09."
            : "Reply from Mission Control → Contact Queue.",
        }),
      });
      if (!result.sent) {
        console.error("[Contact] Staff notification not sent:", result.error || result.skipped);
      }
    }

    return NextResponse.json({ ok: true, message: "Message received." }, { status: 201 });
  } catch (err) {
    console.error("[Contact] Unexpected failure", err?.message);
    return NextResponse.json(
      { ok: false, message: "We could not save your message. Please try again shortly." },
      { status: 500 },
    );
  }
}
