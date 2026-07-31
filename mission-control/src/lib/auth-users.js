import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Best-effort email lookup against Supabase Auth users (the real
 * auth.users table, NOT user_profiles — ScoutIt's end users currently
 * live in two separate id spaces: user_profiles.id (text, localStorage
 * era) and auth.users.id (uuid, used by the badge-claim flow and MFA).
 * There's no bridge column between them yet, so badge awarding works
 * against auth.users directly by email.
 *
 * There's no server-side email filter in the admin listUsers API, so
 * this pages through results and matches client-side — fine at
 * ScoutIt's current scale, worth replacing with a real lookup if the
 * user base grows past a few thousand accounts.
 *
 * @param {string} email
 * @returns {Promise<{id: string, email: string} | null>}
 */
export async function findAuthUserByEmail(email) {
  const admin = createAdminClient();
  const target = email.trim().toLowerCase();
  const perPage = 200;
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return { id: match.id, email: match.email };
    if (data.users.length < perPage) break;
  }

  return null;
}
