import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/crmActivity";
import { z } from "zod";
import { turnstileGuard } from "@/lib/turnstile";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

// A-144 (§13 Enterprise Free Inquiry, §15 abuse): the public form is the most
// abusable free-contact path. Meter per IP before any other work; the IP is
// metering-only and never stored (same promise as /api/reactions).
const checkInquiryRate = createRateLimiter({ limit: 10, windowMs: 60_000, maxKeys: 20_000 });
import { getPropertyLeadRecipients, formatRoutingMetadata } from "@/lib/serverBrokerRouting";
import { resolveEnterpriseForm } from "@/lib/enterpriseForms";
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
  // A-144 §13: Enterprise-configured entry points identify themselves. Absent
  // means the legacy public property form (still 0-Connect, still logged-out,
  // now explicitly labeled so it can be scoped to Enterprise without a
  // breaking change when the forms table lands under O-004).
  enterprise_form_id: z.string().max(120).optional(),
});

export async function POST(req) {
  try {
    const rate = checkInquiryRate(clientIp(req));
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many inquiries. Please wait and try again.", analytics_event: "enterprise_inquiry_throttled" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid inquiry format" }, { status: 400 });
    }
    const { propertyId, propertySlug, name, email, phone, message, turnstileToken, preferredBrokerId, enterprise_form_id } = parsed.data;
    // A-144: label the zero-cost path at the boundary (invariant #9). Only an
    // explicitly Enterprise-configured form may call itself Free Inquiry.
    const isEnterpriseFreeInquiry = typeof enterprise_form_id === "string" && enterprise_form_id.trim() !== "";

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

    // A-144 §10.10: "Free Inquiry" is an enabled, server-validated Enterprise
    // form — never a nonempty string the caller typed. Forged, disabled or
    // unknown forms deliver nothing (0 debit either way: this path is free).
    // Pre-migration the tables do not exist and the check defers gracefully.
    const enterpriseCheck = await resolveEnterpriseForm(supabaseAdmin, enterprise_form_id);
    if (!enterpriseCheck.ok) {
      const reason = enterpriseCheck.reason === "disabled_form"
        ? "That inquiry form is no longer accepting responses."
        : "That inquiry form isn't recognized.";
      return NextResponse.json({ success: false, message: reason }, { status: 403 });
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
        source: isEnterpriseFreeInquiry ? "enterprise_free_inquiry" : "public_form",
        enterprise_form_id: enterprise_form_id || null,
        entry_label: isEnterpriseFreeInquiry ? "Free Inquiry" : "Public inquiry (sign in + Connect to continue)",
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

    return NextResponse.json({ success: true, message: "Inquiry received", routedToRoster: routing.routedToRoster, recipientCount: routing.recipients.length, free_inquiry: isEnterpriseFreeInquiry, analytics_event: isEnterpriseFreeInquiry ? "enterprise_inquiry_submitted" : "inquiry_sent" }, { status: 200 });
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return NextResponse.json({ success: false, message: "Failed to process inquiry" }, { status: 500 });
  }
}
