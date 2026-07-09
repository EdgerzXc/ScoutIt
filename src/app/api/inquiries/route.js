import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/crmActivity";
import { z } from "zod";

// Public lead capture. Previously a stub that console.logged the payload and
// returned fake success -- every inquiry posted here was silently dropped.
// Now: resolve the property, write an 'inquiry' row to crm_activity_log (so
// it appears on the owner's CRM Timeline immediately) and ping the owner's
// notification bell. No auth required -- this is the logged-out fallback;
// authenticated inquiries go through /api/deals/initiate, which creates a
// full deal + chat thread.

const schema = z.object({
  propertyId: z.string().uuid().optional(),
  propertySlug: z.string().max(200).optional(),
  name: z.string().max(120).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(40).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(req) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid inquiry format" }, { status: 400 });
    }
    const { propertyId, propertySlug, name, email, phone, message } = parsed.data;

    if (!propertyId && !propertySlug) {
      return NextResponse.json({ success: false, message: "Missing property reference" }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ success: false, message: "Provide an email or phone number so the owner can reach you" }, { status: 400 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Server error: missing service role configuration" }, { status: 500 });
    }

    let query = supabaseAdmin.from("properties").select("id, title, owner_id");
    query = propertyId ? query.eq("id", propertyId) : query.eq("slug", propertySlug);
    const { data: property, error: propError } = await query.single();

    if (propError || !property) {
      return NextResponse.json({ success: false, message: "Property not found" }, { status: 404 });
    }

    const logged = await logActivity(supabaseAdmin, {
      propertyId: property.id,
      activityType: "inquiry",
      metadata: {
        source: "public_form",
        name: name || null,
        email: email || null,
        phone: phone || null,
        message: message || null,
      },
    });

    if (!logged) {
      return NextResponse.json({ success: false, message: "Failed to record inquiry" }, { status: 500 });
    }

    if (property.owner_id) {
      await notifyUser(supabaseAdmin, {
        userId: property.owner_id,
        title: "New inquiry",
        desc: `${name || "Someone"} is asking about "${property.title}".`,
        icon: "💬",
        propertyId: property.id,
        notificationType: "new_inquiry",
      });
    }

    return NextResponse.json({ success: true, message: "Inquiry received" }, { status: 200 });
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return NextResponse.json({ success: false, message: "Failed to process inquiry" }, { status: 500 });
  }
}
