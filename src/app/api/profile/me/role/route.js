import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";

// The caller's own role, resolved server-side.
//
// WHY THIS EXISTS
// ---------------
// The page guide (src/lib/pageGuides.js) carries owner and broker variants that
// could not be switched on, because the only role signal reachable from a client
// component was `scoutit_user` in localStorage — a browser-only flag that §1.5
// forbids treating as authorization, and that Standing Rule 5 covers directly:
// a gate the client evaluates is a suggestion.
//
// This closes that gap the correct way round. The session is verified from the
// request by `resolveUserId`, and the role is then READ FROM THE DATABASE. The
// client cannot name its own role, and no request field influences the answer.
//
// SCOPE — read this before adding anything to the response
// --------------------------------------------------------
// This returns ONE field, for the caller, about the caller. It is a
// presentation hint for which copy to show, not an entitlement check. Anything
// that grants access must re-derive the role server-side at the point of use;
// never trust a value that has been through a browser.
//
// Do not extend this into a general profile endpoint. Each field added here is
// a field exposed to any script running on the page.

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);

    // Signed out is a normal, expected answer — most readers of a property page
    // are. Null role means the guide shows its role-neutral copy, which is
    // written to stand on its own.
    if (!userId) {
      return NextResponse.json({ role: null }, { status: 200 });
    }

    if (!supabaseAdmin) {
      // Fail to the neutral copy rather than 500: a missing service-role config
      // must not take a property page's guide down with it.
      return NextResponse.json({ role: null }, { status: 200 });
    }

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[Profile Role] Lookup failed", error.message);
      return NextResponse.json({ role: null }, { status: 200 });
    }

    return NextResponse.json(
      { role: data?.role || null },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err) {
    console.error("[Profile Role] Unexpected failure", err?.message);
    return NextResponse.json({ role: null }, { status: 200 });
  }
}
