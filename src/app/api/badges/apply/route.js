import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import {
  BADGE_DEFINITIONS,
  isPioneerBadge,
  hasAnyPioneerBadge,
} from "@/lib/BadgeEngine";

const checkApplyRate = createRateLimiter({ limit: 5, windowMs: 600_000, maxKeys: 2000 });

const REQUIRED_ROLES = {
  PIONEER_BROKER: ["broker"],
  PIONEER_OWNER: ["owner"],
  PIONEER_CREATOR: ["provider", "photographer", "designer", "researcher", "creator"],
};

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Please sign in." }, { status: 401 });
    }

    const ip = clientIp(request);
    const rate = checkApplyRate(`apply:${ip}:${userId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many application submissions. Please wait a few minutes before submitting another dossier." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds || 600) } }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: database client unavailable." }, { status: 500 });
    }

    const body = await request.json();
    const {
      badgeId,
      annualVolumeTier,
      proofDocumentUrl,
    } = body || {};

    const cleanAgency = String(body?.agencyName || body?.organization || body?.agency || "").trim();
    const cleanTerritory = String(body?.territory || "Metro Manila / Prime Corridors").trim();
    const cleanFullName = String(body?.fullName || body?.name || "").trim();
    const cleanLicense = String(body?.licenseNumber || body?.proofReference || "").trim();
    const cleanStatement = String(body?.statement || body?.notes || "").trim();

    if (!badgeId || !isPioneerBadge(badgeId)) {
      return NextResponse.json({ error: "Invalid Pioneer badge ID specified." }, { status: 400 });
    }

    if (!cleanAgency && !cleanFullName) {
      return NextResponse.json(
        { error: "Full legal name or agency organization is required." },
        { status: 400 }
      );
    }

    // 1. Check Mutual Exclusivity: Reject if user already has ANY Pioneer badge
    const { data: existingBadges } = await supabaseAdmin
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId);

    if (hasAnyPioneerBadge(existingBadges)) {
      return NextResponse.json(
        { error: "Account already holds a Pioneer Charter. Limit is strictly one Pioneer seat per account." },
        { status: 409 }
      );
    }

    // 2. Role Check
    const required = REQUIRED_ROLES[badgeId];
    if (required) {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("role, active_roles")
        .eq("id", userId)
        .maybeSingle();

      const userRoles = new Set(
        [profile?.role, ...(Array.isArray(profile?.active_roles) ? profile.active_roles : [])]
          .filter(Boolean)
          .map((r) => String(r).toLowerCase())
      );

      if (!required.some((r) => userRoles.has(r))) {
        return NextResponse.json(
          { error: `Requires accredited ${required[0]} role to apply for this charter.` },
          { status: 403 }
        );
      }
    }

    // 3. Proof of Caliber Check: Must have at least 1 published property or draft
    const { count: propertyCount, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);

    if (propErr || (propertyCount || 0) < 1) {
      return NextResponse.json(
        {
          error: "Charter Candidacy requires at least 1 property asset or listing registered on ScoutIt to demonstrate market commitment.",
        },
        { status: 422 }
      );
    }

    // 4. Check for existing pending application
    const { data: existingApp } = await supabaseAdmin
      .from("charter_applications")
      .select("id, status")
      .eq("user_id", userId)
      .eq("badge_id", badgeId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingApp) {
      return NextResponse.json(
        { error: "You already have a pending Charter application under review.", applicationId: existingApp.id },
        { status: 409 }
      );
    }

    // 5. Insert application record
    const { data: newApp, error: insertErr } = await supabaseAdmin
      .from("charter_applications")
      .insert({
        user_id: userId,
        badge_id: badgeId,
        agency_name: cleanAgency || cleanFullName,
        territory: cleanTerritory,
        full_name: cleanFullName || null,
        organization: cleanAgency || null,
        license_number: cleanLicense || null,
        statement: cleanStatement || null,
        annual_volume_tier: annualVolumeTier || null,
        proof_document_url: proofDocumentUrl || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[CHARTER APPLY API] Insert error:", insertErr);
      return NextResponse.json({ error: "Failed to submit charter application." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Charter candidacy successfully submitted. Our team reviews dossiers within 24 hours.",
      application: newApp,
    });
  } catch (err) {
    console.error("[CHARTER APPLY API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
