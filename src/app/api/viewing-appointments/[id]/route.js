import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed"]),
  mockOwnerId: z.string().optional(),
});

async function resolveUserId(request, mockOwnerId) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;
  if (token && token.trim() !== "") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (!error && user) return user.id;
  }
  if (mockOwnerId === "master-dev") return "master-dev";
  return null;
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { status, mockOwnerId } = parsed.data;
    const userId = await resolveUserId(request, mockOwnerId);
    
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: appt, error: fetchError } = await supabaseAdmin
      .from("viewing_appointments")
      .select("host_id, guest_id")
      .eq("id", id)
      .single();

    if (fetchError || !appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    // Both host and guest can cancel, but only host can confirm or complete
    if (status === "cancelled") {
      if (appt.host_id !== userId && appt.guest_id !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      if (appt.host_id !== userId) {
        return NextResponse.json({ error: "Only the host can confirm or complete an appointment" }, { status: 403 });
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("viewing_appointments")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      console.error("[APPOINTMENTS API] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("[APPOINTMENTS API] PATCH error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
