import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { turnstileGuard, clientIpFrom } from "@/lib/turnstile";
import { sendEmail, renderEmail, isEmailConfigured } from "@/lib/email";

// Public contact intake — the logged-out path for someone who has not signed up
// and has a question.
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
});

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

  const { name, email, subject, message, turnstileToken } = parsed.data;

  // Unauthenticated write path. Left open it is a spam cannon aimed at whoever
  // reads the queue, and a queue nobody trusts is a queue nobody reads.
  const blocked = await turnstileGuard(request, turnstileToken);
  if (blocked) return blocked;

  try {
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name,
      email,
      subject: subject || null,
      message,
      // status is intentionally NOT accepted from the body — a client-set
      // status would let a spammer file their own message as already handled.
      ip_hash: await maskIp(request),
      user_agent: (request.headers.get("user-agent") || "").slice(0, 500) || null,
    });

    if (error) {
      // Never echo the raw Postgres error: it names the schema. But do fail
      // loudly — a swallowed insert here recreates the exact bug this route
      // exists to remove.
      console.error("[Contact] Insert failed", error.message);
      return NextResponse.json(
        { ok: false, message: "We could not save your message. Please try again shortly." },
        { status: 500 },
      );
    }

    // Tell a human, without letting that failure reach the sender.
    //
    // The row is already committed by this point, and Mission Control's contact
    // queue is the system of record — this email is a nudge so the queue gets
    // opened, not the delivery mechanism. Awaited so a provider rejection is
    // logged rather than lost to an unhandled rejection after the response, but
    // never surfaced: the visitor's message IS saved, and telling them it
    // failed because our own notification bounced would be a lie in the
    // direction that loses their message.
    if (isEmailConfigured() && process.env.CONTACT_NOTIFY_TO) {
      const result = await sendEmail({
        to: process.env.CONTACT_NOTIFY_TO,
        subject: `New contact message — ${subject || "no subject"}`,
        html: renderEmail({
          heading: "Someone used the contact form",
          // Never interpolate the sender's text into HTML by hand — renderEmail
          // escapes what it is given, and the message is attacker-controlled.
          body: `${name} <${email}> wrote:\n\n${message}`,
          ctaLabel: "Open the contact queue",
          ctaPath: "/contact",
          footnote: "Reply from Mission Control → Contact Queue.",
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
