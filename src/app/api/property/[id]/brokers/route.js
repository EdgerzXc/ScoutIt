import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";
import { getPropertyLeadRecipients } from "@/lib/serverBrokerRouting";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: "Roster service unavailable" }, { status: 503 });
    const { id: slug } = await params;
    if (!slug) return NextResponse.json({ error: "Missing property slug" }, { status: 400 });

    const propertySelect = "id, title, owner_id, slug, canonical_slug, lifecycle_state, pipeline_status";
    const canonicalLookup = await supabaseAdmin.from("properties").select(propertySelect).eq("canonical_slug", slug).maybeSingle();
    const propertyResult = canonicalLookup.data ? canonicalLookup : await supabaseAdmin.from("properties").select(propertySelect).eq("slug", slug).maybeSingle();
    const property = propertyResult.data;
    const propertyError = propertyResult.error;

    if (propertyError) {
      console.error("[PROPERTY BROKERS API] Property lookup failed:", propertyError);
      return NextResponse.json({ error: "Property roster unavailable" }, { status: 503 });
    }
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (normalizeLifecycleState(property) !== PROPERTY_LIFECYCLE_STATES.LIVE) {
      return NextResponse.json({ error: "Property roster is not publicly available" }, { status: 404 });
    }

    const routing = await getPropertyLeadRecipients(supabaseAdmin, property.id);
    if (!routing.ok) return NextResponse.json({ error: "Property roster unavailable" }, { status: 503 });

    const brokerIds = routing.roster.map((recipient) => recipient.recipientId);
    if (brokerIds.length === 0) {
      return NextResponse.json({ property: { id: property.id, title: property.title, slug: property.canonical_slug || property.slug }, brokers: [], represented: false });
    }

    const [{ data: profiles, error: profilesError }, { data: brokerProfiles, error: brokerProfilesError }] = await Promise.all([
      supabaseAdmin.from("user_profiles").select("id, display_name, avatar_url, headline, bio, firm, prc_license, is_profile_public").in("id", brokerIds),
      supabaseAdmin.from("broker_profiles").select("user_id, scout_rating, verified_closures, specializations").in("user_id", brokerIds),
    ]);
    if (profilesError || brokerProfilesError) {
      console.error("[PROPERTY BROKERS API] Profile lookup failed:", profilesError || brokerProfilesError);
      return NextResponse.json({ error: "Property roster unavailable" }, { status: 503 });
    }

    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const metricsById = new Map((brokerProfiles || []).map((profile) => [profile.user_id, profile]));
    const brokers = routing.roster
      .map((recipient) => {
        const profile = profileById.get(recipient.recipientId);
        if (!profile) return null;
        const metrics = metricsById.get(recipient.recipientId) || {};
        return {
          id: recipient.recipientId,
          representationId: recipient.representationId,
          name: profile.display_name || "Authorized Broker",
          image: profile.avatar_url || "",
          headline: profile.headline || "",
          bio: profile.bio || "",
          firm: profile.firm || "",
          license: profile.prc_license || "",
          rating: Number(metrics.scout_rating) || 0,
          closures: Number(metrics.verified_closures) || 0,
          specializations: metrics.specializations || [],
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      property: { id: property.id, title: property.title, slug: property.canonical_slug || property.slug },
      brokers,
      represented: brokers.length > 0,
    });
  } catch (error) {
    console.error("[PROPERTY BROKERS API] Error:", error);
    return NextResponse.json({ error: "Property roster unavailable" }, { status: 503 });
  }
}
