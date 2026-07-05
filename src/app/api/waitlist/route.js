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

  // Verify Turnstile Token
  let TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
  if (!TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV === 'development') {
      TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
    } else {
      console.error("[waitlist] Missing TURNSTILE_SECRET_KEY in production.");
      return Response.json({ ok: false, error: "Server configuration error." }, { status: 500 });
    }
  }

  try {
    const cfFormData = new FormData();
    cfFormData.append('secret', TURNSTILE_SECRET_KEY);
    cfFormData.append('response', turnstileToken);

    const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: cfFormData
    });
    
    const cfData = await cfRes.json();
    if (!cfData.success) {
      return Response.json({ ok: false, error: "Captcha verification failed. Are you a bot?" }, { status: 403 });
    }
  } catch (error) {
    return Response.json({ ok: false, error: "Could not reach captcha service." }, { status: 500 });
  }

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
