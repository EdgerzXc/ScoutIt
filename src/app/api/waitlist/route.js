// Founding Waitlist intake — pre-launch.
//
// ✅ PERSISTS AGAIN 2026-08-06 (§59 · W18.1). It did not, for months.
//
// ── WHAT WAS WRONG ────────────────────────────────────────────────────
// The insert was commented out with the note *"Supabase is mid-security-reset,
// so we do not persist PII into a dev-open database"*. That reason expired: the
// reset happened, `waitlist` exists, RLS is on, and it carries a deny-all client
// policy. But the stub stayed, so every Founding Member signup was written to a
// Vercel serverless console log and thrown away — while the visitor was told
// `{ ok: true }`. The table had **0 rows**. This is the entire pre-launch funnel.
//
// ⚠️ THE COMMENTED CODE WOULD NOT HAVE WORKED IF UNCOMMENTED. It used the
// browser `supabase` client, and the table's RLS policy is
// "Clients cannot access waitlist directly" — `USING (false)`, which for an ALL
// policy also governs INSERT. Restoring it verbatim would have swapped a silent
// discard for a silent 500. It must use the service-role client, which is what
// the deny-all policy exists to funnel writes through.
//
// Standing Rule 21: this had a producer and no consumer. Fixing the producer
// without checking the policy would have produced a second silent failure.

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { stripAllTags } from "@/lib/sanitize";
import { turnstileGuard } from "@/lib/turnstile";

const waitlistSchema = z.object({
  // `.trim()` runs BEFORE `.email()`. Without it a pasted or autocompleted
  // address with a trailing space — routine on mobile — fails validation and
  // the visitor is told "Invalid input data" for an address that is fine.
  // Found by a test asserting normalisation; the insert was never reached.
  email: z.string().trim().toLowerCase().email("Invalid email format").max(255),
  role: z.enum(["seeker", "owner", "broker", "photographer", "researcher"]).nullable().optional(),
  tier: z.string().nullable().optional(),
  source: z.string().max(60).optional(),
  turnstileToken: z.string().min(1, "Captcha token is required")
});

export async function POST(req) {

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const result = waitlistSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ ok: false, error: "Invalid input data." }, { status: 400 });
  }

  const { email, role, tier, source: rawSource, turnstileToken } = result.data;
  const source = stripAllTags(rawSource || "site");

  // ── Bot check ────────────────────────────────────────────────────────
  // Delegated to the shared canonical helper (src/lib/turnstile.js). The
  // previous inline version defaulted to Cloudflare's TEST secret, which
  // makes siteverify return success for ANY token — so if the env var was
  // ever unset in production, this endpoint had no bot protection at all
  // while still appearing to be protected. The helper fails closed instead.
  const captchaFailure = await turnstileGuard(req, turnstileToken);
  if (captchaFailure) return captchaFailure;

  if (!supabaseAdmin) {
    // Never acknowledge a signup we cannot store. Returning ok:true here is
    // exactly the bug this route is being fixed for.
    console.error("[waitlist] No service client — cannot persist signup.");
    return Response.json(
      { ok: false, error: "Signups are temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }

  // `waitlist_email_key` is a UNIQUE index on the raw column, so the address
  // must be normalised or Test@x.com and test@x.com become two Founding
  // Members. Normalisation happens in the schema above (trim + lowercase), so
  // `email` is already canonical here — done there rather than here so the
  // validated value and the stored value can never diverge.
  const { error } = await supabaseAdmin
    .from("waitlist")
    .insert({ email, role: role ?? null, tier: tier ?? null, source });

  // 23505 = unique_violation → already on the list. That is a success from the
  // visitor's point of view, and re-submitting must not look like a failure.
  if (error && error.code !== "23505") {
    // Log the failure, never the address — this is the PII the route exists to
    // protect, and Vercel logs are not a safe place for it.
    console.error("[waitlist] Insert failed:", error.message);
    return Response.json({ ok: false, error: "Could not save signup." }, { status: 500 });
  }

  return Response.json({ ok: true, alreadyRegistered: error?.code === "23505" });
}
