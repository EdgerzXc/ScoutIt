import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS entirely.
 *
 * HARD RULE: this file must only ever be imported from server-only code
 * (Server Actions, Route Handlers, Server Components that never pass the
 * client down as a prop). Never import this from a "use client" file.
 *
 * Every call site that mutates data with this client MUST go through
 * lib/rbac.js's tier check + logAction() first — this client has no
 * concept of who's calling it or whether they're allowed to.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() was called in the browser. The service-role key " +
        "must never reach a client bundle — check the import chain."
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service-role environment variables.");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
