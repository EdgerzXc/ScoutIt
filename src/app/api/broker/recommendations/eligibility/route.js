import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { getCmsBundle } from "@/lib/cmsCache";
import { findPublicBroker, publicBrokerIdentity } from "@/lib/brokerDossier";
import { listRecommendationOpportunities } from "@/lib/brokerRecommendationEligibility";

// ═══════════════════════════════════════════════════════════════
// A-038 — "may I be asked?", answered before anyone is asked.
//
// The invitation panel must not render a prompt the POST route would then
// refuse. Both read the SAME rule from brokerRecommendationEligibility; this
// route adds only the display identity, which is Airtable's per the dual-CMS
// boundary — Supabase holds the relationship, Airtable holds who the advisor is.
//
// An empty list is a normal, honest answer. Most clients most of the time have
// nothing to be invited about, and the panel renders nothing at all rather than
// inventing an encouraging prompt.
// ═══════════════════════════════════════════════════════════════

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };
const json = (body, status = 200) =>
  NextResponse.json(body, { status, headers: PRIVATE_HEADERS });

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return json({ error: "Unauthorized" }, 401);
    if (!supabaseAdmin) return json({ error: "Recommendations are unavailable" }, 503);

    const result = await listRecommendationOpportunities(supabaseAdmin, { userId });
    if (!result.ok) return json({ error: "Could not check your connections" }, 503);
    if (!result.opportunities.length) return json({ invitations: [] });

    // Identity comes from the public broker feed. An advisor with no public
    // dossier is dropped rather than shown as a bare UUID — there would be
    // nowhere for the client to go and no name to recognise.
    let brokers = [];
    try {
      brokers = (await getCmsBundle())?.brokers || [];
    } catch (error) {
      console.error("[recommendation eligibility] broker feed failed:", sanitizeError(error));
      return json({ error: "Could not check your connections" }, 503);
    }

    const invitations = result.opportunities
      .map((opportunity) => {
        const identity = publicBrokerIdentity(findPublicBroker(brokers, opportunity.brokerId));
        if (!identity) return null;
        return {
          brokerId: opportunity.brokerId,
          brokerName: identity.name,
          brokerSlug: identity.id,
          // The handshake id is NOT returned. It is not the client's to hold,
          // and echoing it back would suggest it is something they submit.
          verifiedConnection: true,
        };
      })
      .filter(Boolean);

    return json({ invitations });
  } catch (error) {
    console.error("[recommendation eligibility] failed:", sanitizeError(error));
    return json({ error: "Could not check your connections" }, 500);
  }
}
