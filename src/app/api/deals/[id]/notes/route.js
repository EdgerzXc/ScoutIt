import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

// Persists the "private scratchpad" per deal -- BrokerMode.js's Deal File
// Workspace already had this UI (dealNotes local state), it just never wrote
// anywhere; deals.private_notes has existed unused since the deal-file
// workspace was built. One shared note per deal (not per-role) matches how
// the existing UI already treats it -- whoever is viewing their Deal File
// can read/edit the same scratchpad, since it's meant as private working
// notes about the deal, not a per-party message.

const schema = z.object({
  note: z.string().max(5000),
  mockOwnerId: z.string().optional(),
});

export async function PATCH(request, { params }) {
  try {
    const { id: dealId } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { note, mockOwnerId } = parsed.data;

    const authHeader = request.headers.get("Authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    let userId = null;
    if (token && token.trim() !== "") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await authClient.auth.getUser(token);
      if (!error && user) userId = user.id;
    }
    if (!userId && mockOwnerId) userId = mockOwnerId;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("buyer_id, broker_id, properties(owner_id)")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId;

    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error: updateError } = await supabaseAdmin
      .from("deals")
      .update({ private_notes: note })
      .eq("id", dealId);

    if (updateError) {
      console.error("[DEAL NOTES API] Failed to save:", updateError);
      return NextResponse.json({ error: "Failed to save notes" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DEAL NOTES API] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
