import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["connected", "pending", "accepted", "closed", "declined", "reported"]),
  mockOwnerId: z.string().optional(),
});

export async function PATCH(request, { params }) {
  try {
    const { id: dealId } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { status, mockOwnerId } = parsed.data;

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

    const updateData = { status };
    if (status === "closed" || status === "declined" || status === "reported") {
       updateData.closed_at = new Date().toISOString();
    } else {
       updateData.closed_at = null;
    }

    const { error: updateError } = await supabaseAdmin
      .from("deals")
      .update(updateData)
      .eq("id", dealId);

    if (updateError) {
      console.error("[DEALS API] Failed to update status:", updateError);
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: updateData.status });
  } catch (err) {
    console.error("[DEALS API] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
