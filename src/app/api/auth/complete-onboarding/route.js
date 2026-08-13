import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { monthlyAllowance } from "@/lib/entitlements";
import { statusFromDateOfBirth } from "@/lib/adultEligibility";
import {
  isPrcLicenseFormatValid,
  normalizeSignupPrimaryMode,
  sanitizeLocationFocus,
} from "@/lib/onboardingProfile";

function databaseRole(primaryMode) {
  return primaryMode === "buyer" ? "seeker" : primaryMode;
}

export async function POST(request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from("user_profiles")
      .select("adult_eligibility_status")
      .eq("id", user.id)
      .maybeSingle();
    if (existingProfileError) {
      console.error("[ONBOARDING API] Eligibility lookup failed:", existingProfileError);
      return NextResponse.json({ error: "Unable to verify account eligibility." }, { status: 500 });
    }
    // An explicit underage answer is sticky. Without this lookup, the same
    // account could immediately resubmit a different birth date.
    if (existingProfile?.adult_eligibility_status === "underage") {
      return NextResponse.json({ error: "You must be at least 18 to use ScoutIt." }, { status: 403 });
    }

    const payload = await request.json();
    const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 120) : "";
    const primaryMode = normalizeSignupPrimaryMode(payload.role);
    const locationFocus = primaryMode === "buyer"
      ? sanitizeLocationFocus(payload.locationFocus)
      : null;
    const prcLicense = typeof payload.prcLicense === "string"
      ? payload.prcLicense.trim().slice(0, 80)
      : "";

    if (!name || !primaryMode) {
      return NextResponse.json({ error: "Name and a valid primary role are required." }, { status: 400 });
    }
    if (primaryMode === "broker" && !isPrcLicenseFormatValid(prcLicense)) {
      return NextResponse.json({ error: "Enter a valid PRC broker license number." }, { status: 400 });
    }

    const ageCheck = statusFromDateOfBirth(payload.dateOfBirth);
    if (!ageCheck.ok) {
      if (ageCheck.status === "underage") {
        await supabaseAdmin.from("user_profiles").upsert({
          id: user.id,
          adult_eligibility_status: "underage",
        });
      }
      return NextResponse.json(
        { error: ageCheck.error || "A valid date of birth is required." },
        { status: 403 },
      );
    }

    const role = databaseRole(primaryMode);
    const startingAllowance = monthlyAllowance(role, "starry");

    // Keep the completion marker null until every required resource exists.
    // A retry is safe: the profile is an upsert and the wallet never resets an
    // existing balance.
    const { error: profileError } = await supabaseAdmin.from("user_profiles").upsert({
      id: user.id,
      display_name: name,
      role,
      active_roles: [primaryMode],
      primary_mode: primaryMode,
      location_focus: locationFocus,
      provider_type: null,
      prc_license: primaryMode === "broker" ? prcLicense : null,
      subscription_tier: "starry",
      connects_balance: startingAllowance,
      date_of_birth: payload.dateOfBirth,
      adult_eligibility_status: ageCheck.status,
      onboarding_completed_at: null,
    });
    if (profileError) {
      console.error("[ONBOARDING API] Profile upsert failed:", profileError);
      return NextResponse.json({ error: "Failed to create the private profile." }, { status: 500 });
    }

    const { error: walletError } = await supabaseAdmin.from("connect_balances").upsert(
      {
        user_id: user.id,
        granted_balance: startingAllowance,
        purchased_balance: 0,
        earned_balance: 0,
        last_granted_reset: new Date().toISOString().slice(0, 10),
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    if (walletError) {
      console.error("[ONBOARDING API] Wallet provisioning failed:", walletError);
      return NextResponse.json(
        { error: "Profile saved, but account provisioning is incomplete. Please retry." },
        { status: 500 },
      );
    }

    const completedAt = new Date().toISOString();
    const { error: completionError } = await supabaseAdmin
      .from("user_profiles")
      .update({ onboarding_completed_at: completedAt })
      .eq("id", user.id);
    if (completionError) {
      console.error("[ONBOARDING API] Completion marker failed:", completionError);
      return NextResponse.json(
        { error: "Account provisioning is incomplete. Please retry." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      activeRoles: [primaryMode],
      primaryMode,
      onboardingCompletedAt: completedAt,
    });
  } catch (error) {
    console.error("[ONBOARDING API] Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
