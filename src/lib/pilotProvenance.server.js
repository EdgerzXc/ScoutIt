import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function activePilotParticipantIds(userIds) {
  const ids = [...new Set((userIds || []).map((id) => String(id || "").trim()).filter(Boolean))];
  if (!ids.length || !supabaseAdmin) return new Set();
  const { data, error } = await supabaseAdmin.from("pilot_participants")
    .select("user_id")
    .in("user_id", ids)
    .is("offboarded_at", null);
  if (error) {
    console.warn("[pilot provenance] Active participant state could not be resolved:", error.code || error.message);
    return new Set();
  }
  return new Set((data || []).map((row) => row.user_id));
}
