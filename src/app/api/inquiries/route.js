import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/crmActivity";
import { z } from "zod";
import { turnstileGuard } from "@/lib/turnstile";
import { getPropertyLeadRecipients, formatRoutingMetadata } from "@/lib/serverBrokerRouting";
import { routingFailureStatus } from "@/lib/brokerRepresentation";
import { normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";
import { validateSampleInquiryRecipients } from "@/lib/sampleInventory";

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
  // Public writes require a token in the request shape and server-side
  // verification below. There is no configuration-dependent bypass.
  turnstileToken: z.string().min(1, "Captcha token is required"),
  preferredBrokerId: z.string().max(200).optional(),
});

export async function POST(req) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid inquiry format" }, { status: 400 });
    }
    const { propertyId, propertySlug, name, email, phone, message, turnstileToken, preferredBrokerId } = parsed.data;

    // ── Bot check ──────────────────────────────────────────────────────
    // This is a PUBLIC, unauthenticated endpoint that writes to
    // crm_activity_log and fires a notification to the current routed recipient. Left
    // open it's a spam cannon aimed at recipient notification bells, and every
    // fake inquiry erodes trust in the one signal owners actually watch.
    //
    // Always fail closed. Missing production configuration is a security error,
    // not permission to accept unauthenticated service-role writes.
    const captchaFailure = await turnstileGuard(req, turnstileToken);
    if (captchaFailure) return captchaFailure;

    if (!propertyId && !propertySlug) {
      return NextResponse.json({ success: false, message: "Missing property reference" }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ success: false, message: "Provide an email or phone number so the property recipient can reach you" }, { status: 400 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Server error: missing service role configuration" }, { status: 500 });
    }

    let query = supabaseAdmin.from("properties").select("id, title, slug, owner_id, lifecycle_state, pipeline_status");
    query = propertyId ? query.eq("id", propertyId) : query.eq("slug", propertySlug);
    const { data: property, error: propError } = await query.single();

    if (propError || !property) {
      return NextResponse.json({ success: false, message: "Property not found" }, { status: 404 });
    }
    const propertyState = normalizeLifecycleState(property);
    if (propertyState === PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED) {
      return NextResponse.json({ success: false, message: "Property not found" }, { status: 410 });
    }
    if (propertyState !== PROPERTY_LIFECYCLE_STATES.LIVE) {
      return NextResponse.json({ success: false, message: "Property is not available for logged-out inquiry" }, { status: 404 });
    }

    const routing = await getPropertyLeadRecipients(supabaseAdmin, property.id, preferredBrokerId || null);
    if (!routing.ok) {
      const reason = routing.reason === "broker_not_contactable" ? "That broker is no longer available for this property." : "Lead routing is temporarily unavailable; please try again.";
      return NextResponse.json({ success: false, message: reason }, { status: routingFailureStatus(routing.reason) });
    }

    const sampleRouting = validateSampleInquiryRecipients({
      slug: property.slug || propertySlug,
      recipientIds: routing.recipients.map((recipient) => recipient.recipientId),
      allowlistValue: process.env.HUMAN_TEST_SAMPLE_RECIPIENT_IDS,
    });
    if (!sampleRouting.ok) {
      return NextResponse.json(
        { success: false, message: "Sample inquiries are unavailable until test routing is configured." },
        { status: 503 },
      );
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
        routing: formatRoutingMetadata(routing),
      },
    });

    if (!logged) {
      return NextResponse.json({ success: false, message: "Failed to record inquiry" }, { status: 500 });
    }

    for (const recipient of routing.recipients) {
      if (!recipient.recipientId) continue;
      await notifyUser(supabaseAdmin, {
        userId: recipient.recipientId,
        title: "New inquiry",
        desc: `${name || "Someone"} is asking about "${property.title}".`,
        icon: "ðŸ’¬",
        propertyId: property.id,
        notificationType: "new_inquiry",
      });
    }

    return NextResponse.json({ success: true, message: "Inquiry received", routedToRoster: routing.routedToRoster, recipientCount: routing.recipients.length }, { status: 200 });
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return NextResponse.json({ success: false, message: "Failed to process inquiry" }, { status: 500 });
  }
}
