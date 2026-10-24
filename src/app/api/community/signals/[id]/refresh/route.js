import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { isMissingTable, countActiveSignals } from "@/lib/communityStore";
import { capacityCheck, signalTerminalState, SIGNAL_STATUSES, SIGNAL_EXPIRY_DAYS } from "@/lib/communityPosting";

function accountClassFor(profile) {
  const roles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
  if (roles.includes("broker")) return "broker";
  if (roles.includes("owner")) return "owner";
  return "standard";
}

// Refresh: the author confirms the signal is still active and extends its
// freshness window for another 7 days (1 week). Refuses fulfilled, withdrawn,
// or moderator-removed signals.
export async function POST(request, { params }) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json(
        { ok: false, error: "Server error: missing service role configuration" },
        { status: 500 }
      );
    }
    const { id } = await params;
    const { data: signal, error: loadError } = await supabaseAdmin
      .from("stratosphere_signals")
      .select("id, author_account_id, status, last_confirmed_at")
      .eq("id", id)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!signal) {
      return NextResponse.json({ ok: false, error: "Signal not found." }, { status: 404 });
    }
    if (signal.author_account_id !== userId) {
      return NextResponse.json(
        { ok: false, error: "Only the author can refresh this signal." },
        { status: 403 }
      );
    }

    const terminal = signalTerminalState({
      status: signal.status,
      lastConfirmedAt: signal.last_confirmed_at,
    });
    if (terminal === "served" || terminal === "withdrawn" || signal.status === SIGNAL_STATUSES.REMOVED) {
      return NextResponse.json(
        {
          ok: false,
          error: "Solved or withdrawn signals cannot be refreshed. Post a new signal if your need changed.",
        },
        { status: 409 }
      );
    }

    // If the signal already expired out of the 7-day window, verify the author
    // has an open capacity slot before re-activating it into the live feed.
    if (terminal === "expired") {
      const [{ data: profile }, counted] = await Promise.all([
        supabaseAdmin
          .from("user_profiles")
          .select("active_roles")
          .eq("id", userId)
          .maybeSingle(),
        countActiveSignals(userId),
      ]);
      if (!counted.missing) {
        const cap = capacityCheck(counted.count, accountClassFor(profile));
        if (!cap.allowed) {
          return NextResponse.json(
            {
              ok: false,
              error: `You already have ${cap.activeCount} of ${cap.cap} active signals. Close an active one before refreshing this expired signal.`,
            },
            { status: 403 }
          );
        }
      }
    }

    const nowIso = new Date().toISOString();
    const nextStatus =
      signal.status === SIGNAL_STATUSES.EXPIRED ? SIGNAL_STATUSES.LIVE : signal.status;
    const { error: updateError } = await supabaseAdmin
      .from("stratosphere_signals")
      .update({
        status: nextStatus,
        last_confirmed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", id);
    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      lastConfirmedAt: nowIso,
      expiryDays: SIGNAL_EXPIRY_DAYS,
    });
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json(
        { ok: false, error: "Community signals are opening soon." },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}
