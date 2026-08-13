import * as Sentry from "@sentry/nextjs";
import { supabase } from "./supabaseClient";

/**
 * Sends an error or user-submitted problem report to the configured Sentry
 * project. Session Replay remains disabled; reports contain only the submitted
 * text, bounded diagnostic context, the page path, and an optional verified
 * opaque Supabase user id.
 * Best-effort: never throws (we do not want the logger to cause errors).
 * @param {{ kind?: 'crash'|'user_report', message?: string, stack?: string, context?: object }} payload
 */
export async function reportError(payload = {}) {
  try {
    const client = Sentry.getClient();
    if (!client?.getOptions?.().dsn) return false;

    const message = String(payload.message || "").trim().slice(0, 2000);
    if (!message) return false;

    const { data } = await supabase.auth.getUser();
    const kind = payload.kind === "user_report" ? "user_report" : "crash";
    const pagePath = typeof window !== "undefined" ? window.location.pathname : "";

    Sentry.withScope((scope) => {
      scope.setTag("scoutit.report_kind", kind);
      scope.setContext("scoutit_report", {
        page_path: pagePath,
        context: payload.context || {},
      });
      if (data?.user?.id) scope.setUser({ id: data.user.id });

      if (kind === "user_report") {
        Sentry.captureMessage(message, "info");
        return;
      }

      const error = new Error(message);
      error.name = "ScoutItClientCrash";
      if (payload.stack) error.stack = String(payload.stack).slice(0, 8000);
      Sentry.captureException(error);
    });

    return await Sentry.flush(2000);
  } catch {
    return false;
  }
}