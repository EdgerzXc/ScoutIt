import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { VALID_QUEST_SCOPES } from "@/lib/questitPolicyEngine";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

const checkBountyRate = createRateLimiter({ limit: 20, windowMs: 60_000, maxKeys: 10_000 });

export async function POST(request) {
  try {
    const rate = checkBountyRate(`bounty:${clientIp(request)}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many bounty requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required to raise a Data Quest" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { propertyId, questScope } = body || {};

    if (!propertyId || !questScope) {
      return NextResponse.json(
        { error: "Missing required fields: propertyId and questScope are required" },
        { status: 400 }
      );
    }

    // A-312: Scope allowlist check
    const normalizedScope = String(questScope).toLowerCase();
    if (!VALID_QUEST_SCOPES.includes(normalizedScope)) {
      return NextResponse.json(
        { error: `Invalid questScope '${questScope}'. Must be an authorized scope: ${VALID_QUEST_SCOPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    // A-312: Verify property exists and caller holds an authorized party relation
    if (typeof supabaseAdmin.from("properties")?.select === "function") {
      const { data: property, error: propErr } = await supabaseAdmin
        .from("properties")
        .select("id, owner_id")
        .eq("id", propertyId)
        .maybeSingle();

      if (propErr || !property) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }

      let isParty = property.owner_id === userId;
      if (!isParty && typeof supabaseAdmin.from("broker_representations")?.select === "function") {
        const { data: rep } = await supabaseAdmin
          .from("broker_representations")
          .select("id")
          .eq("property_id", property.id)
          .eq("broker_id", userId)
          .eq("status", "active")
          .maybeSingle();
        if (rep) isParty = true;
      }
      if (!isParty && typeof supabaseAdmin.from("user_profiles")?.select === "function") {
        const { data: profile } = await supabaseAdmin
          .from("user_profiles")
          .select("role, active_roles")
          .eq("id", userId)
          .maybeSingle();
        const roles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
        if (profile?.role === "admin" || profile?.role === "staff" || roles.includes("admin") || roles.includes("staff")) {
          isParty = true;
        }
      }
      if (!isParty) {
        return NextResponse.json(
          { error: "Forbidden: You must be an authorized party (owner or broker) for this property to raise a Data Quest" },
          { status: 403 }
        );
      }
    }

    const { data: bounty, error: insertError } = await supabaseAdmin
      .from("bounty_claims")
      .insert({
        target_field: questScope,
        property_id: propertyId,
        initiator_id: userId,
        status: "open",
        payout_connects: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[QUESTIT BOUNTY API] Failed to create bounty claim:", insertError);
      return NextResponse.json(
        { error: "Failed to create bounty claim" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bounty,
      message: `Data Quest raised for ${questScope} — Free to post`,
    });
  } catch (err) {
    console.error("[QUESTIT BOUNTY API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
