import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function publicBadgeGrantsByUserId(userIds) {
  const ids = [...new Set((userIds || []).map((id) => String(id || "").trim()).filter(Boolean))];
  const grants = new Map();
  if (!ids.length || !supabaseAdmin) return grants;
  const { data, error } = await supabaseAdmin
    .from("user_badges")
    .select("user_id, badge_id, earned_at")
    .in("user_id", ids);
  if (error) {
    console.warn("[professional provenance] Public badge grants could not be resolved:", error.code || error.message);
    return grants;
  }
  for (const row of data || []) {
    const current = grants.get(row.user_id) || [];
    current.push({ id: row.badge_id, minted_at: row.earned_at });
    grants.set(row.user_id, current);
  }
  return grants;
}
