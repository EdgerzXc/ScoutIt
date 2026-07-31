import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Anon-key Supabase client scoped to the current staff member's own
 * session (server components / server actions only). Use this to find
 * out *who is logged in*. Never use this client to read or write
 * admin_users / mission_control_actions / moderation data directly —
 * those go through the service-role client in ./admin.js, gated by
 * lib/rbac.js.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no response to attach to.
            // Safe to ignore — middleware/route handlers refresh the session.
          }
        },
      },
    }
  );
}
