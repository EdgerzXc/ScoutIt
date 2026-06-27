// ═══════════════════════════════════════════════════════════════
// Founding Waitlist — pre-launch intent capture.
//
// Storage is intentionally NOT wired to Supabase yet: the database is
// mid-security-reset. This client helper posts to /api/waitlist (a stub that
// validates + acks) and keeps a local dedupe list so a visitor isn't asked
// twice on the same device. After the Supabase reset, uncomment the insert in
// /api/waitlist/route.js — the request contract here already matches the
// `waitlist` table documented in SUPABASE_REBUILD_GUIDE.md. No frontend change
// will be needed.
// ═══════════════════════════════════════════════════════════════

const LOCAL_KEY = "scoutit_waitlist";

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

// Emails this device has already submitted (so we can show "you're already in").
function readLocal() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

export function hasJoined(email) {
  return readLocal().includes(String(email || "").trim().toLowerCase());
}

function rememberLocal(email) {
  if (typeof window === "undefined") return;
  try {
    const list = readLocal();
    const e = String(email).trim().toLowerCase();
    if (!list.includes(e)) {
      list.push(e);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    }
  } catch {}
}

// Submit a signup. Returns { ok, already, error }.
export async function joinWaitlist({ email, role = null, tier = null, source = "site", turnstileToken = null }) {
  const clean = String(email || "").trim().toLowerCase();
  if (!isValidEmail(clean)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (hasJoined(clean)) {
    return { ok: true, already: true };
  }

  try {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: clean, role, tier, source, turnstileToken }),
    });
    // The stub route always 200s today; once Supabase is wired it may report
    // duplicates or validation errors. Treat a non-OK as a soft failure.
    if (!res.ok) {
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  } catch {
    // Network/stub failure shouldn't block the local confirmation pre-launch.
  }

  rememberLocal(clean);
  return { ok: true };
}
