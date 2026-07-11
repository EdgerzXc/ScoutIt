import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { monthlyAllowance } from "@/lib/entitlements";

// Maps an onboarding intent tag to the single legacy `role` column value the
// rest of the app reads for wallet lookups (DashboardContext.handleUserLogin,
// connectsWallet.js) and entitlements (CONNECTS_ALLOWANCE keys: seeker/owner/
// broker/photographer/researcher). 'buyer' -> 'seeker' matches the wallet
// convention already documented in connectsWallet.js; providers resolve to
// their specific sub-type so their real Connects allowance applies instead
// of silently falling back to the seeker tier.
function resolveRole(primaryMode, providerType) {
  if (primaryMode === "buyer" || primaryMode === "exploring") return "seeker";
  if (primaryMode === "provider") return providerType || "provider";
  return primaryMode; // owner | broker
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const payload = await request.json();
    const { name, role: primaryMode, tags, providerType, prcLicense } = payload;

    if (!name || !primaryMode) {
      return NextResponse.json({ error: "Missing required profile fields" }, { status: 400 });
    }

    // Validate against the real onboarding intent tags — this previously
    // whitelisted ['owner','broker','investor','tenant'], none of which match
    // the actual tag ids onboarding/page.js collects ('buyer','owner','broker',
    // 'provider','exploring'). Every buyer, provider, and "just exploring"
    // signup was silently coerced to 'owner' here.
    const allowedModes = ["buyer", "owner", "broker", "provider", "exploring"];
    if (!allowedModes.includes(primaryMode)) {
      console.warn(`[ONBOARDING API] Rejected unrecognized primaryMode "${primaryMode}" for user ${user.id}`);
      return NextResponse.json({ error: "Invalid role specified" }, { status: 403 });
    }

    const allowedProviderTypes = ["photographer", "researcher", "designer"];
    const safeProviderType = providerType && allowedProviderTypes.includes(providerType) ? providerType : null;

    // Multi-role tags (buyer/owner/broker/provider/exploring subset) power
    // the dashboard's mode switcher and public-profile role panels
    // (profileClient.js checks active_roles) — previously never persisted at
    // all, so every account effectively had zero switchable capabilities.
    const safeTags = Array.isArray(tags) ? tags.filter((t) => allowedModes.includes(t)) : [primaryMode];

    // Force secure defaults on the server. Columns must match the live
    // user_profiles schema exactly — this previously wrote `email`,
    // `full_name`, and `profile_completeness`, none of which exist as columns
    // (confirmed via information_schema: id/display_name/avatar_url/location/
    // headline/bio/firm/service/prc_license/provider_type/
    // provider_availability/member_since/subscription_tier/connects_balance/
    // active_roles/is_profile_public/role/... ). Every real onboarding
    // attempt failed at this upsert with Postgres error PGRST204 ("Could not
    // find the 'email' column"), silently trapping every real signup on
    // /onboarding — this was never just a role-mapping bug.
    const resolvedRole = resolveRole(primaryMode, safeProviderType);
    const startingAllowance = monthlyAllowance(resolvedRole, "starry");

    const finalUser = {
      id: user.id,
      display_name: name,
      role: resolvedRole,
      active_roles: safeTags,
      provider_type: safeProviderType,
      prc_license: primaryMode === "broker" && prcLicense ? prcLicense : null,
      subscription_tier: "starry",
      connects_balance: startingAllowance,
    };

    const { error: upsertError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(finalUser);

    if (upsertError) {
      console.error("[ONBOARDING API] Upsert Error:", upsertError);
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    // Provision the REAL server-side wallet spend_connects() reads from.
    // connect_balances has never had an auto-provisioning path anywhere
    // (no signup trigger, no default row) — the client's localStorage wallet
    // simulation (connectsWallet.js) shows the correct starting allowance and
    // lets the UI light up "Send Handshake" / "Connect" buttons, but every
    // real spend attempt hit spend_connects()'s `raise exception 'no wallet
    // found'`, so no real user could ever actually complete a paid action
    // (broker pitch, owner invite, buyer inquiry) on their first session.
    // onConflict + ignoreDuplicates: re-running onboarding (e.g. the user
    // changes their primary mode later) must never reset an existing wallet.
    const { error: walletError } = await supabaseAdmin
      .from('connect_balances')
      .upsert(
        {
          user_id: user.id,
          granted_balance: startingAllowance,
          purchased_balance: 0,
          earned_balance: 0,
          last_granted_reset: new Date().toISOString().slice(0, 10),
        },
        { onConflict: 'user_id', ignoreDuplicates: true }
      );

    if (walletError) {
      // Don't fail onboarding over this — but log loudly, since a missing
      // wallet silently blocks every paid action later.
      console.error("[ONBOARDING API] Wallet provisioning failed:", walletError);
    }

    return NextResponse.json({ success: true, activeRoles: safeTags, primaryMode });

  } catch (err) {
    console.error("[ONBOARDING API] Server Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
