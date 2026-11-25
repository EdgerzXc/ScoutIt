import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { monthlyAllowance } from "@/lib/entitlements";
import { isCanonicalConnectWalletActive } from "@/lib/connectsSchemaGate";
import { stripAllTags } from "@/lib/sanitize";
import {
  CURRENT_TERMS_VERSION,
  isCurrentTermsAcceptance,
  legalAcceptanceEvidence,
} from "@/lib/legalAcceptance";

const NO_STORE = { "Cache-Control": "private, no-store" };

// Per-user in-flight serialization queue so concurrent first-time onboarding
// requests for the same account execute sequentially and converge on a single
// consistent role and wallet setup.
const activeUserOnboardingQueues = new Map();

function withUserOnboardingQueue(userId, task) {
  let entry = activeUserOnboardingQueues.get(userId);
  if (!entry) {
    entry = {
      tail: Promise.resolve(),
      refCount: 0,
      completedProfile: null,
      partialProfile: null,
    };
    activeUserOnboardingQueues.set(userId, entry);
  }
  entry.refCount += 1;

  const run = entry.tail.then(() => task(entry));
  entry.tail = run.catch(() => {});

  return run.finally(() => {
    entry.refCount -= 1;
    if (entry.refCount <= 0 && activeUserOnboardingQueues.get(userId) === entry) {
      activeUserOnboardingQueues.delete(userId);
    }
  });
}

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
    const token = /^Bearer\s+(.+)$/i.exec((request.headers.get("authorization") || "").trim())?.[1]?.trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid account setup details." }, { status: 400 });
    }
    const { name, role, dateOfBirth, prcLicense, locationFocus, termsVersion } = body;

    const allowedRoles = ["buyer", "seeker", "owner", "broker"];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role selection" }, { status: 400 });
    }

    const trimmedName = typeof name === "string" && name.length <= 120 ? stripAllTags(name) : "";
    if (trimmedName.length < 2) {
      return NextResponse.json({ error: "Enter a full name between 2 and 120 characters." }, { status: 400 });
    }
    if (locationFocus != null && (typeof locationFocus !== "string" || locationFocus.length > 160)) {
      return NextResponse.json({ error: "Use at most 160 characters for the scouting area." }, { status: 400 });
    }

    if (!isCurrentTermsAcceptance(termsVersion)) {
      return NextResponse.json(
        { error: "Accept the current Terms and Privacy notice to continue.", currentTermsVersion: CURRENT_TERMS_VERSION },
        { status: 409, headers: NO_STORE },
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Account setup is temporarily unavailable." }, { status: 503 });
    }

    const parsedDob = parseDateOfBirth(dateOfBirth);
    const adultStatus = evaluateAdultEligibility(parsedDob);

    let normalizedPrc = null;
    if (role === "broker") {
      normalizedPrc = typeof prcLicense === "string" && prcLicense.length <= 80 ? normalizeLicense(prcLicense) : null;
      if (!normalizedPrc) {
        return NextResponse.json(
          { error: "Brokers must provide a valid 7- or 8-digit PRC license number." },
          { status: 400 },
        );
      }
    }

    return await withUserOnboardingQueue(user.id, async (queueState) => {
      const { data: dbExistingProfile, error: profileReadError } = await supabaseAdmin
        .from("user_profiles")
        .select("adult_eligibility_status, onboarding_completed_at, active_roles, primary_mode, role, subscription_tier")
        .eq("id", user.id)
        .maybeSingle();

      if (profileReadError) {
        console.error("[ONBOARDING API] Profile lookup failed:", profileReadError.code);
        return NextResponse.json({ error: "We could not load your private profile. Please retry." }, { status: 503 });
      }

      const existingProfile =
        dbExistingProfile || queueState.completedProfile || queueState.partialProfile || null;

      if (existingProfile?.adult_eligibility_status === "underage") {
        return NextResponse.json(
          { error: "Account ineligible under ScoutIt age requirement." },
          { status: 403 },
        );
      }

      if (adultStatus !== "confirmed") {
        return NextResponse.json(
          { error: "You must be at least 18 years old to use ScoutIt." },
          { status: 403 },
        );
      }

      // A-356: If an incomplete profile already anchored a signup role on an
      // earlier partial attempt, preserve that role on retry so role and wallet
      // provisioning never diverge across retries.
      const existingSignupRole =
        !existingProfile?.onboarding_completed_at &&
        existingProfile &&
        allowedRoles.includes(existingProfile.primary_mode || existingProfile.role)
          ? (existingProfile.primary_mode || existingProfile.role)
          : null;
      const effectiveRole = existingSignupRole || role;

      const normalizedLocation = normalizeLocationFocus(stripAllTags(locationFocus));
      const primaryMode = effectiveRole === "seeker" ? "buyer" : effectiveRole;
      const dbRole = effectiveRole === "buyer" ? "seeker" : effectiveRole;
      const activeRoles = Array.isArray(existingProfile?.active_roles) && existingSignupRole
        ? existingProfile.active_roles
        : Array.from(new Set([primaryMode || "buyer", "buyer"]));
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
        const { data: existingAcceptance, error: acceptanceReadError } = await supabaseAdmin
          .from("terms_acceptances")
          .select("accepted_at")
          .eq("user_id", user.id)
          .eq("terms_version", CURRENT_TERMS_VERSION)
          .single();
        if (acceptanceReadError || !existingAcceptance?.accepted_at) {
          console.error("[ONBOARDING API] Terms acceptance lookup failed:", acceptanceReadError?.code);
          return NextResponse.json({ error: "We could not confirm your acceptance. Please retry." }, { status: 503, headers: NO_STORE });
        }
        recordedAcceptedAt = existingAcceptance.accepted_at;
      }

      // ── RE-CONSENT / CONCURRENT CONVERGENCE ───────────────────────────────
      // An account that already finished onboarding is here because a new Terms
      // version was published, or because a concurrent first-time onboarding
      // request just finished ahead of this one. Record the acceptance and
      // preserve the committed roles and tier without re-provisioning.
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
          active_roles: activeRoles,
          primary_mode: primaryMode || "buyer",
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

      queueState.partialProfile = {
        adult_eligibility_status: adultStatus,
        onboarding_completed_at: null,
        active_roles: activeRoles,
        primary_mode: primaryMode || "buyer",
        role: dbRole,
        subscription_tier: tier,
      };

      const currentMonth = new Date().toISOString().slice(0, 7);
      const canonicalRole = effectiveRole === "buyer" ? "seeker" : effectiveRole;

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

      queueState.completedProfile = {
        adult_eligibility_status: adultStatus,
        onboarding_completed_at: completedAt,
        active_roles: activeRoles,
        primary_mode: primaryMode || "buyer",
        role: dbRole,
        subscription_tier: tier,
      };

      return NextResponse.json({
        success: true,
        activeRoles,
        primaryMode,
        onboardingCompletedAt: completedAt,
        termsVersion: CURRENT_TERMS_VERSION,
      });
    });
  } catch (error) {
    console.error("[ONBOARDING API] Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
