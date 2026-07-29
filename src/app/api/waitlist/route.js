// Founding Waitlist intake — pre-launch.
//
// ⚠️ Storage is deliberately a STUB right now: Supabase is mid-security-reset,
// so we do not persist PII into a dev-open database. This route validates the
// payload and acknowledges. After the reset (see SUPABASE_REBUILD_GUIDE.md →
// `waitlist` table), uncomment the insert block below — the request shape from
// src/lib/waitlist.js already matches the table columns, so no other change is
// needed.

// import { supabase } from "@/lib/supabaseClient";
import { z } from "zod";
import { stripAllTags } from "@/lib/sanitize";
import { turnstileGuard } from "@/lib/turnstile";

const waitlistSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
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

  // ── POST-RESET: persist to Supabase ───────────────────────────────────────
  // const { error } = await supabase
  //   .from("waitlist")
  //   .insert({ email, role, tier, source });
  // // 23505 = unique_violation → already on the list, treat as success.
  // if (error && error.code !== "23505") {
  //   return Response.json({ ok: false, error: "Could not save signup." }, { status: 500 });
  // }
  // ──────────────────────────────────────────────────────────────────────────

  // Interim: acknowledge without persisting server-side. Visible in logs so the
  // owner can see signups are flowing before the DB is connected.
  console.log("[waitlist] signup (not yet persisted):", { email, role, tier, source });

  return Response.json({ ok: true });
}
