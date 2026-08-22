import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { monthlyAllowance } from "@/lib/entitlements";
import { isCanonicalConnectWalletActive } from "@/lib/connectsSchemaGate";
import {
  CURRENT_TERMS_VERSION,
  isCurrentTermsAcceptance,
  legalAcceptanceEvidence,
} from "@/lib/legalAcceptance";

const NO_STORE = { "Cache-Control": "private, no-store" };

function parseDateOfBirth(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function evaluateAdultEligibility(dateOfBirth) {
  if (!dateOfBirth) return "underage";
  const now = new Date();
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dateOfBirth.getUTCDate())) {
    age -= 1;
  }
  return age >= 18 ? "confirmed" : "underage";
}

function normalizeLicense(value) {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 8 ? digits : null;
}

function normalizeLocationFocus(value) {
  if (typeof value !== "string") return null;
  const normalized = value
    .split(",")
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join(", ");
  return normalized.length > 0 ? normalized : null;
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "").trim();

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, dateOfBirth, prcLicense, locationFocus, termsVersion } = body;

    const allowedRoles = ["buyer", "seeker", "owner", "broker"];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role selection" }, { status: 400 });
    }

    const trimmedName = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!isCurrentTermsAcceptance(termsVersion)) {
      return NextResponse.json(
        { error: "Accept the current Terms and Privacy notice to continue.", currentTermsVersion: CURRENT_TERMS_VERSION },
        { status: 409, headers: NO_STORE },
      );
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("adult_eligibility_status, onboarding_completed_at, active_roles, primary_mode, role, subscription_tier")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile?.adult_eligibility_status === "underage") {
      return NextResponse.json(
        { error: "Account ineligible under ScoutIt age requirement." },
        { status: 403 },
      );
    }

    const parsedDob = parseDateOfBirth(dateOfBirth);
    const adultStatus = evaluateAdultEligibility(parsedDob);
    if (adultStatus !== "confirmed") {
      return NextResponse.json(
        { error: "You must be at least 18 years old to use ScoutIt." },
        { status: 403 },
      );
    }

    let normalizedPrc = null;
    if (role === "broker") {
      normalizedPrc = normalizeLicense(prcLicense);
      if (!normalizedPrc) {
        return NextResponse.json(
          { error: "Brokers must provide a valid 7- or 8-digit PRC license number." },
          { status: 400 },
        );
      }
    }

    const normalizedLocation = normalizeLocationFocus(locationFocus);
    const primaryMode = role === "seeker" ? "buyer" : role;
    const dbRole = role === "buyer" ? "seeker" : role;
    const tier = "starry";
    const startingAllowance = monthlyAllowance(dbRole, tier);
    const acceptedAt = new Date().toISOString();
    const evidence = legalAcceptanceEvidence(request);

    const { error: acceptanceError } = await supabaseAdmin
      .from("terms_acceptances")
      .insert({
        user_id: user.id,
        terms_version: CURRENT_TERMS_VERSION,
        accepted_at: acceptedAt,
        ...evidence,
      });

    if (acceptanceError && acceptanceError.code !== "23505") {
      console.error("[ONBOARDING API] Terms acceptance persistence failed:", acceptanceError);
      return NextResponse.json(
        { error: "Your acceptance could not be recorded. No account setup was completed." },
        { status: 500, headers: NO_STORE },
      );
    }

    let recordedAcceptedAt = acceptedAt;
    if (acceptanceError?.code === "23505") {
      const { data: existingAcceptance } = await supabaseAdmin
        .from("terms_acceptances")
        .select("accepted_at")
        .eq("user_id", user.id)
        .eq("terms_version", CURRENT_TERMS_VERSION)
        .single();
      recordedAcceptedAt = existingAcceptance?.accepted_at || acceptedAt;
    }

    // ── RE-CONSENT ────────────────────────────────────────────────────────
    // An account that already finished onboarding is here because a new Terms
    // version was published, not because it is being set up again. The form
    // cannot express what such an account already is: it offers three signup
    // roles, one active role, and the starter tier. Running first-time
    // provisioning over it would collapse a multi-role account to a single
    // role and reset a paid tier to the starter one — silently, on the way
    // through a consent checkbox. Record the acceptance and change nothing
    // else.
    if (existingProfile?.onboarding_completed_at) {
      const { error: reconsentError } = await supabaseAdmin
        .from("user_profiles")
        .update({ terms_accepted_at: recordedAcceptedAt, terms_version: CURRENT_TERMS_VERSION })
        .eq("id", user.id);

      if (reconsentError) {
        console.error("[ONBOARDING API] Re-consent persistence failed:", reconsentError);
        return NextResponse.json(
          { error: "Your acceptance could not be recorded. Please try again." },
          { status: 500, headers: NO_STORE },
        );
      }

      return NextResponse.json({
        success: true,
        reconsent: true,
        activeRoles: existingProfile.active_roles || [],
        primaryMode: existingProfile.primary_mode || null,
        onboardingCompletedAt: existingProfile.onboarding_completed_at,
        termsVersion: CURRENT_TERMS_VERSION,
      });
    }

    const { error: profileError } = await supabaseAdmin.from("user_profiles").upsert(
      {
        id: user.id,
        display_name: trimmedName,
        role: dbRole,
        active_roles: [primaryMode],
        primary_mode: primaryMode,
        date_of_birth: dateOfBirth,
        adult_eligibility_status: adultStatus,
        prc_license: normalizedPrc,
        location_focus: normalizedLocation,
        subscription_tier: tier,
        terms_accepted_at: recordedAcceptedAt,
        terms_version: CURRENT_TERMS_VERSION,
        onboarding_completed_at: null,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error("[ONBOARDING API] Profile upsert failed:", profileError);
      return NextResponse.json({ error: "Failed to create the private profile." }, { status: 500 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const canonicalRole = role === "buyer" ? "seeker" : role;

    if (isCanonicalConnectWalletActive()) {
      // 1. Authoritative canonical provisioning: role wallet + account permanent pool
      const [{ error: canonicalWalletError }, { error: canonicalAcctError }] = await Promise.all([
        supabaseAdmin.from("user_connect_wallets").upsert(
          {
            user_id: user.id,
            role: canonicalRole,
            granted_balance: startingAllowance,
            granted_month: currentMonth,
          },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        ),
        supabaseAdmin.from("user_connect_accounts").upsert(
          {
            user_id: user.id,
            purchased_balance: 0,
            reward_balance: 0,
          },
          { onConflict: "user_id", ignoreDuplicates: true },
        ),
      ]);

      if (canonicalWalletError || canonicalAcctError) {
        console.error("[ONBOARDING API] Canonical wallet provisioning failed:", {
          canonicalWalletError,
          canonicalAcctError,
        });
        return NextResponse.json(
          { error: "Profile saved, but account provisioning is incomplete. Please retry." },
          { status: 500 },
        );
      }

      // 2. Transitional non-authoritative mirror to legacy connect_balances
      const { error: legacyWalletError } = await supabaseAdmin.from("connect_balances").upsert(
        {
          user_id: user.id,
          granted_balance: startingAllowance,
          purchased_balance: 0,
          earned_balance: 0,
          last_granted_reset: new Date().toISOString().slice(0, 10),
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
      if (legacyWalletError) {
        console.warn("[ONBOARDING API] Non-fatal legacy connect_balances mirror notice:", legacyWalletError);
      }
    } else {
      // Pre-migration stage: legacy connect_balances is authoritative
      const { error: legacyWalletError } = await supabaseAdmin.from("connect_balances").upsert(
        {
          user_id: user.id,
          granted_balance: startingAllowance,
          purchased_balance: 0,
          earned_balance: 0,
          last_granted_reset: new Date().toISOString().slice(0, 10),
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
      if (legacyWalletError) {
        console.error("[ONBOARDING API] Legacy wallet provisioning failed:", legacyWalletError);
        return NextResponse.json(
          { error: "Profile saved, but account provisioning is incomplete. Please retry." },
          { status: 500 },
        );
      }
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
      termsVersion: CURRENT_TERMS_VERSION,
    });
  } catch (error) {
    console.error("[ONBOARDING API] Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
