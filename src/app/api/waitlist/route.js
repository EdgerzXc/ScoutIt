// Founding Waitlist intake — pre-launch.
//
// ⚠️ Storage is deliberately a STUB right now: Supabase is mid-security-reset,
// so we do not persist PII into a dev-open database. This route validates the
// payload and acknowledges. After the reset (see SUPABASE_REBUILD_GUIDE.md →
// `waitlist` table), uncomment the insert block below — the request shape from
// src/lib/waitlist.js already matches the table columns, so no other change is
// needed.

// import { supabase } from "@/lib/supabaseClient";

const VALID_ROLES = ["seeker", "owner", "broker", "photographer", "researcher", null];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const role = body?.role ?? null;
  const tier = body?.tier ?? null;
  const source = String(body?.source || "site").slice(0, 60);

  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "Invalid email." }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return Response.json({ ok: false, error: "Invalid role." }, { status: 400 });
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
