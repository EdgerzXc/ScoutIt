import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { readBoardAccountSaves } from "@/lib/boardAccountSaves";
import { looksLikeUuid } from "@/lib/propertyLookup";

const privateResponse = { headers: { "Cache-Control": "private, no-store" } };

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Sign in to view account saves." }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Account saves are unavailable." }, { status: 503 });

    const items = await readBoardAccountSaves(supabaseAdmin, userId);
    return NextResponse.json({ items }, privateResponse);
  } catch (error) {
    console.warn("[WISHLIST] Could not read account saves:", error?.code || error?.name);
    return NextResponse.json({ error: "Account saves are unavailable." }, { status: 503 });
  }
}

export async function DELETE(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Sign in to remove an account save." }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Account saves are unavailable." }, { status: 503 });

    const body = await request.json().catch(() => null);
    if (!looksLikeUuid(body?.propertyId)) {
      return NextResponse.json({ error: "Invalid saved property ID." }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("saved_intel")
      .delete()
      .eq("user_id", userId)
      .eq("property_id", body.propertyId.trim());
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[WISHLIST] Could not remove account save:", error?.code || error?.name);
    return NextResponse.json({ error: "Couldn't remove this account save." }, { status: 503 });
  }
}
