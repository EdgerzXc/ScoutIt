// ═══════════════════════════════════════════════════════════════
// RA 9646 — server-side read of a broker's operational credential state.
//
// Airtable holds the public content record; Supabase holds whether the PRC
// licence is still current. This reader crosses that boundary deliberately and
// narrowly: it selects only the credential columns, never profile content.
//
// Fail-closed like every other authority reader. A failed read returns null,
// which `buildBrokerCredential` treats as "we cannot say the licence is
// current" rather than as "it is".
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function loadBrokerCredentialRecord(authorityId) {
  if (!authorityId || !supabaseAdmin) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("prc_expiry, prc_verified, prc_verified_at, dhsud_number")
      .eq("id", authorityId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      prcExpiry: data.prc_expiry || null,
      prcVerified: data.prc_verified === true,
      prcVerifiedAt: data.prc_verified_at || null,
      // Read but NOT published. DHSUD registration renews annually and there
      // is no expiry column for it, so publishing the number would assert a
      // currency nothing here can check. Recorded as a known gap instead.
      dhsudNumber: data.dhsud_number || null,
    };
  } catch {
    return null;
  }
}
