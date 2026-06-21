import { supabase } from "./supabaseClient";

/**
 * Logs an error or a user-submitted problem report to Supabase `error_reports`.
 * Best-effort: never throws (we don't want the logger to cause errors).
 * @param {{ kind?: 'crash'|'user_report', message?: string, stack?: string, context?: object }} payload
 */
export async function reportError(payload = {}) {
  try {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("scoutit_user") || "null");
    } catch {
      /* ignore */
    }
    await supabase.from("error_reports").insert([
      {
        kind: payload.kind || "crash",
        user_id: user?.id || null,
        user_name: user?.name || null,
        message: (payload.message || "").slice(0, 2000),
        stack: (payload.stack || "").slice(0, 8000),
        url: typeof window !== "undefined" ? window.location.href : "",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        context: payload.context || {},
      },
    ]);
    return true;
  } catch {
    return false;
  }
}
