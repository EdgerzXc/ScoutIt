import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    // 1. Extract token from Authorization header to prevent identity spoofing
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

    const userId = user.id;

    // role is a display/reason-text hint only, never persisted to a column —
    // connect_balances/connect_transactions have no `role` column in the live
    // schema (per-role wallets are a documented but unbuilt design; the
    // wallet is per user_id only). unitId is optional: set when this initiate
    // is scoped to one delegated unit (Unit Master Page "Your Move") or when
    // an operator (role: 'operator') is opening the initial ask to a building
    // owner about delegating units (SCOUTIT_MASTER_BUILD_SPEC.md §9.2) — left
    // null until the owner picks specific units to hand over.
    const { listingId, propertySlug, message, role = 'buyer', unitId } = await request.json();

    if (!listingId && !propertySlug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // Public property pages are sourced from Airtable and only ever carry an
    // Airtable record id, never the Supabase properties.id UUID that
    // deals.property_id actually foreign-keys to (Airtable has no such field
    // synced back yet — a separate, pre-existing gap, not something to patch
    // via an Airtable schema change while that work is paused). Callers that
    // only know the public slug pass propertySlug instead, and we resolve the
    // real UUID here — slug is already identical on both sides today.
    let resolvedListingId = listingId;
    if (!resolvedListingId && propertySlug) {
      const { data: propBySlug, error: slugErr } = await supabaseAdmin
        .from('properties')
        .select('id')
        .eq('slug', propertySlug)
        .single();
      if (slugErr || !propBySlug) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
      resolvedListingId = propBySlug.id;
    }

    // If this is a per-unit contact (Unit Master Page "Your Move"), look up
    // whether the unit has a delegated operator so the ledger reason text is
    // accurate about who's actually being contacted.
    let unitOperatorId = null;
    if (unitId) {
      const { data: unitRow } = await supabaseAdmin
        .from('property_units')
        .select('operator_id')
        .eq('id', unitId)
        .single();
      unitOperatorId = unitRow?.operator_id || null;
    }

    // 1. Insert the deal first — rolled back below if the Connect spend fails.
    // Expire 14 days from now.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const defaultMessage = role === 'operator'
      ? 'Operator requested to discuss operating units in this property.'
      : unitOperatorId
      ? 'Buyer contacted the unit operator.'
      : 'Buyer initiated contact.';

    const { data: dealData, error: dealError } = await supabaseAdmin.from('deals').insert([{
      property_id: resolvedListingId,
      buyer_id: userId,
      unit_id: unitId || null,
      status: 'connected',
      expires_at: expiresAt.toISOString(),
      pitch_message: message || defaultMessage
    }]).select();

    if (dealError || !dealData) {
      console.error("[INITIATE API] Failed to insert deal:", dealError);
      return NextResponse.json({ error: "Failed to initiate chat." }, { status: 500 });
    }

    // 2. Atomic Connect spend — balance check + 3-bucket deduction (granted → purchased →
    // earned) + ledger insert, all in one indivisible Postgres transaction (spend_connects RPC).
    // Matches the pattern already proven correct in /api/dashboard/invite/route.js.
    const { data: spendData, error: spendError } = await supabaseAdmin.rpc('spend_connects', {
      p_user_id: userId,
      p_amount: 1,
      p_reason: role === 'operator'
        ? 'Operator contacted building owner'
        : unitOperatorId
        ? 'Buyer contacted unit operator'
        : 'Buyer contacted owner',
      p_ref_type: 'initiate_chat',
      p_ref_id: resolvedListingId,
    });

    if (spendError) {
      console.error("[INITIATE API] Connect spend failed:", spendError);
      await supabaseAdmin.from('deals').delete().eq('id', dealData[0].id);
      const insufficient = spendError.message?.includes('insufficient balance') || spendError.message?.includes('no wallet found');
      return NextResponse.json(
        { error: insufficient ? "Insufficient Connects balance." : "Transaction failed. No Connects spent." },
        { status: insufficient ? 403 : 500 }
      );
    }

    const newBalance = spendData?.[0]?.total_balance ?? null;

    // Keep the user_profiles cache in sync (best-effort display cache; not the source of truth)
    if (newBalance !== null) {
      await supabaseAdmin.from('user_profiles').update({ connects_balance: newBalance }).eq('id', userId);
    }

    return NextResponse.json({ success: true, dealId: dealData[0].id, newBalance });

  } catch (err) {
    console.error("[INITIATE API] Error during initiate process:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
