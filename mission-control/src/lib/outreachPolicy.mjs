/**
 * Outbound Property Outreach CRM & Automation Policy
 * Task ID: A-202 — Ground-Truth Property Acquisition & Outreach Engine
 *
 * Implements:
 * 1. Smart Google Maps & Signage Parser (coordinates, PH phone numbers, emails, addresses)
 * 2. 72-Hour Pipeline Aging & Overdue Follow-up Detection
 * 3. Philippine-Optimized Multi-Channel Template Interpolation (A, B, C, D)
 * 4. 1-Click Conversion Bridge (Claimable Draft Listing Generator)
 */

import { randomUUID } from "node:crypto";

// 72 hours in milliseconds
export const AGING_THRESHOLD_MS = 72 * 60 * 60 * 1000;

/**
 * Extracts coordinates from Google Maps URLs and strings.
 * Supports:
 * - @14.554729,121.024441
 * - !3d14.554729!4d121.024441
 * - ?q=14.554729,121.024441 or ll=14.554729,121.024441
 */
export function extractCoordinatesFromInput(input) {
  if (!input || typeof input !== "string") return null;

  // Pattern 1: @lat,lng
  const atMatch = input.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      latitude: parseFloat(atMatch[1]),
      longitude: parseFloat(atMatch[2]),
    };
  }

  // Pattern 2: !3d[lat]!4d[lng]
  const embedMatch = input.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (embedMatch) {
    return {
      latitude: parseFloat(embedMatch[1]),
      longitude: parseFloat(embedMatch[2]),
    };
  }

  // Pattern 3: q=lat,lng or ll=lat,lng
  const queryMatch = input.match(/[?&](?:q|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (queryMatch) {
    return {
      latitude: parseFloat(queryMatch[1]),
      longitude: parseFloat(queryMatch[2]),
    };
  }

  // Pattern 4: raw comma-separated coordinates "14.5547, 121.0244"
  const rawMatch = input.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
  if (rawMatch) {
    return {
      latitude: parseFloat(rawMatch[1]),
      longitude: parseFloat(rawMatch[2]),
    };
  }

  return null;
}

/**
 * Extracts Philippine phone numbers (mobile 09XX / +63 9XX and landline (02) 8XXX / +63 2 8XXX).
 */
export function extractPhoneNumbers(text) {
  if (!text || typeof text !== "string") return [];
  const results = [];

  // Mobile: +63 9XX XXX XXXX or 09XX XXX XXXX
  const mobileRegex = /(?:\+63\s?9\d{2}|09\d{2})[-\s]?\d{3}[-\s]?\d{4}/g;
  let match;
  while ((match = mobileRegex.exec(text)) !== null) {
    const cleaned = match[0].replace(/[\s-]/g, "");
    if (!results.includes(cleaned)) results.push(cleaned);
  }

  // Landline: (02) 8XXX-XXXX, +63 2 8XXX XXXX, 02-8XXX-XXXX
  const landlineRegex = /(?:\+63\s?2|\(02\)|02)[-\s]?(?:8\d{3}|7\d{3})[-\s]?\d{4}/g;
  while ((match = landlineRegex.exec(text)) !== null) {
    const cleaned = match[0].replace(/[\s-()]/g, "");
    if (!results.includes(cleaned)) results.push(cleaned);
  }

  return results;
}

/**
 * Extracts email addresses.
 */
export function extractEmail(text) {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Parses raw text or Google Maps snippet into a structured property prospect.
 */
export function parseRawOutreachSnippet(rawInput) {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      propertyName: "",
      propertyAddress: "",
      districtCity: "",
      googleMapsUrl: "",
      coordinates: null,
      phoneNumber: "",
      email: "",
    };
  }

  const lines = rawInput
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let googleMapsUrl = "";
  const urlMatch = rawInput.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    googleMapsUrl = urlMatch[0];
  }

  const coordinates = extractCoordinatesFromInput(rawInput);
  const phones = extractPhoneNumbers(rawInput);
  const email = extractEmail(rawInput);

  // Line extraction heuristic:
  // First non-URL line is typically the Property/Building Name.
  // Second line is typically the Street Address or District.
  const textLines = lines.filter((l) => !l.startsWith("http"));
  const propertyName = textLines[0] || "Discovered Commercial Space";
  const propertyAddress = textLines.slice(1).join(", ") || "";

  // Extract District/City if detected in address
  const knownCities = ["BGC", "Taguig", "Makati", "Ortigas", "Pasig", "Mandaluyong", "Quezon City", "Manila", "Alabang", "Muntinlupa", "Cebu", "Clark"];
  let districtCity = "";
  for (const city of knownCities) {
    if (new RegExp(`\\b${city}\\b`, "i").test(propertyAddress) || new RegExp(`\\b${city}\\b`, "i").test(propertyName)) {
      districtCity = city;
      break;
    }
  }

  return {
    propertyName,
    propertyAddress,
    districtCity: districtCity || "Metro Manila",
    googleMapsUrl,
    coordinates,
    phoneNumber: phones[0] || "",
    email: email || "",
  };
}

/**
 * 72-Hour Pipeline Aging & Overdue Follow-up Detection.
 */
export function isAgingOverdue(lastContactedAt, status) {
  if (!lastContactedAt) return false;
  // Overdue applies only to contacted or unresponded states
  if (status !== "contacted" && status !== "no_reply") return false;

  const contactTime = new Date(lastContactedAt).getTime();
  if (isNaN(contactTime)) return false;

  const elapsed = Date.now() - contactTime;
  return elapsed >= AGING_THRESHOLD_MS;
}

/**
 * Multi-Channel Outreach Templates (Philippine Optimized)
 */
export const OUTREACH_TEMPLATES = {
  template_a_owner: {
    id: "template_a_owner",
    targetRole: "owner",
    name: "Template A: Building Owner (Space Radar Invitation)",
    channels: ["whatsapp", "viber", "email"],
    subject: "ScoutIt Space Intelligence — Featuring {propertyName}",
    body: `Good day {contactName}! Reaching out from ScoutIt (scoutit.space). We are currently mapping verified commercial and physical spaces in {district}, and noticed {propertyName} on Google Maps.

We would love to feature {propertyName} on our 3D Spatial Radar and directory for free, allowing verified corporate tenants and licensed brokers to discover your space.

Would it be alright if we send you a quick preview link to see how your building looks on the platform?

Warm regards,
{senderName} · ScoutIt Operations`,
  },
  template_b_leasing: {
    id: "template_b_leasing",
    targetRole: "property_admin",
    name: "Template B: Leasing Desk (Direct Tenant Inquiries)",
    channels: ["whatsapp", "email", "phone"],
    subject: "Commercial Leasing Inquiries — {propertyName}",
    body: `Hi {contactName}, hope all is well! This is {senderName} from ScoutIt. We have active corporate seekers and PRC-licensed brokers looking for commercial space in {district}.

Do you currently have available units or floors for lease at {propertyName}? If yes, we can list your available units so verified tenants can reach your leasing desk directly without third-party commission splits.

Best regards,
{senderName} · ScoutIt Spatial Intelligence`,
  },
  template_c_broker: {
    id: "template_c_broker",
    targetRole: "broker",
    name: "Template C: Licensed Broker (Position Zero VIA Link)",
    channels: ["whatsapp", "viber", "sms"],
    subject: "Position Zero Lead Routing for {propertyName}",
    body: `Hi {contactName}! Saw your listing for {propertyName}. Reaching out from ScoutIt. On ScoutIt, licensed brokers receive dedicated 'VIA Priority Links' where 100% of tenant inquiries on your assigned properties route directly to your private inbox.

No middleman, no lead fees. Would love to verify your PRC broker profile and get {propertyName} activated for you.

Cheers,
{senderName} · ScoutIt Partner Desk`,
  },
  template_d_followup: {
    id: "template_d_followup",
    targetRole: "overdue_followup",
    name: "Template D: Overdue Follow-up (Touchpoint #2)",
    channels: ["whatsapp", "email"],
    subject: "Following up — {propertyName} on ScoutIt Radar",
    body: `Hi {contactName}, just following up on my note regarding {propertyName}. We are finalizing our {district} commercial intelligence briefing for this month. Would you like us to include {propertyName} in the verified directory before we publish?

Kind regards,
{senderName} · ScoutIt`,
  },
};

/**
 * Interpolates variables into a template.
 */
export function interpolateTemplate(templateKey, variables = {}) {
  const template = OUTREACH_TEMPLATES[templateKey];
  if (!template) throw new Error(`Unknown template key: ${templateKey}`);

  const {
    propertyName = "Your Property",
    contactName = "Sir/Ma'am",
    district = "Metro Manila",
    senderName = "ScoutIt Team",
  } = variables;

  const replaceVars = (text) =>
    text
      .replace(/{propertyName}/g, propertyName)
      .replace(/{contactName}/g, contactName)
      .replace(/{district}/g, district)
      .replace(/{senderName}/g, senderName);

  return {
    subject: replaceVars(template.subject),
    body: replaceVars(template.body),
    channels: template.channels,
  };
}

/**
 * Generates claimable draft listing payload for 1-click bridge.
 */
export function generateClaimDraftPayload(prospect) {
  if (!prospect || !prospect.propertyName) {
    throw new Error("Invalid prospect: propertyName is required");
  }

  const claimToken = `claim_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const createdAt = new Date().toISOString();
  const address = prospect.propertyAddress || "Address Pending Verification";
  const district = prospect.districtCity || "Metro Manila";
  const coordinates = prospect.coordinates
    ? `${prospect.coordinates.latitude},${prospect.coordinates.longitude}`
    : null;
  const location = address !== "Address Pending Verification" ? `${address}, ${district}` : district;

  const details = {
    claim_token: claimToken,
    source_type: "staff_outreach",
    address,
    district,
    contact_phone: prospect.phoneNumber || null,
    contact_email: prospect.email || null,
  };

  // Canonical DB row matching actual public.properties columns (GAP-55)
  const dbPropertyRow = {
    title: prospect.propertyName,
    location,
    type: "commercial",
    space_category: "commercial",
    coordinates,
    lifecycle_state: "draft",
    pipeline_status: "pending",
    moderation_status: "pending",
    details,
    created_at: createdAt,
  };

  // Backwards-compatible payload descriptor + canonical schema fields
  const propertyPayload = {
    ...dbPropertyRow,
    address,
    district,
    lifecycle_status: "DRAFT",
    source_type: "staff_outreach",
    claim_token: claimToken,
    contact_phone: prospect.phoneNumber || null,
    contact_email: prospect.email || null,
  };

  return {
    propertyPayload,
    dbPropertyRow,
    claimToken,
    claimUrl: `https://scoutit.space/claim/${claimToken}`,
  };
}
