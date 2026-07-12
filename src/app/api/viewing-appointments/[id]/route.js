import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { logActivity, createTask } from "@/lib/crmActivity";
import { resolveUserId } from "@/lib/serverAuth";

const schema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed"]),
  });



export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { status  } = parsed.data;
    const userId = await resolveUserId(request);
    
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: appt, error: fetchError } = await supabaseAdmin
      .from("viewing_appointments")
      .select("host_id, guest_id, deal_id, deals(property_id, properties(title))")
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

    // CRM Timeline entry for the state change (viewing_confirmed /
    // viewing_cancelled / viewing_completed).
    await logActivity(supabaseAdmin, {
      dealId: appt.deal_id,
      propertyId: appt.deals?.property_id || null,
      activityType: `viewing_${status}`,
      actorId: userId,
      metadata: { appointmentId: id },
    });

    // The one auto-created task type: when the host marks a viewing
    // completed, drop a "Follow up" task on their list due in 24 hours.
    if (status === "completed") {
      const propertyTitle = appt.deals?.properties?.title;
      await createTask(supabaseAdmin, {
        ownerUserId: appt.host_id,
        title: propertyTitle ? `Follow up after viewing — ${propertyTitle}` : "Follow up after viewing",
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        dealId: appt.deal_id,
      });
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("[APPOINTMENTS API] PATCH error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
