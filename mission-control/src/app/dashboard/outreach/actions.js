"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, logAction, TIERS } from "@/lib/rbac";
import {
  parseRawOutreachSnippet,
  generateClaimDraftPayload,
  SEED_PROSPECTS,
  resolveProspectsResult,
} from "@/lib/outreachPolicy.mjs";

const ALLOWED_OUTREACH_STATUSES = new Set([
  "discovered",
  "contacted",
  "no_reply",
  "replied",
  "onboarded",
  "archived",
  "declined",
]);

function boundText(value, maxLength = 300) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function loadOutreachProspects(demoMode = false) {
  const staff = await getCurrentStaff();
  if (!staff) throw new Error("Unauthorized staff session");
  assertTier(staff, TIERS.OPS_MANAGER);

  const admin = createAdminClient();
  try {
    const { data, error } = await admin
      .from("outreach_prospects")
      .select("*")
      .order("created_at", { ascending: false });

    return resolveProspectsResult({ data, error, demoMode });
  } catch (err) {
    return resolveProspectsResult({ error: err, demoMode });
  }
}

export async function ingestOutreachLead(rawSnippet) {
  const staff = await getCurrentStaff();
  if (!staff) throw new Error("Unauthorized staff session");
  assertTier(staff, TIERS.OPS_MANAGER);

  if (typeof rawSnippet !== "string" || !rawSnippet.trim() || rawSnippet.length > 5000) {
    throw new Error("Invalid outreach snippet");
  }

  const parsed = parseRawOutreachSnippet(rawSnippet.trim());
  const newProspect = {
    id: `prospect-${Date.now()}`,
    property_name: parsed.propertyName,
    property_address: parsed.propertyAddress,
    district_city: parsed.districtCity,
    google_maps_url: parsed.googleMapsUrl,
    latitude: parsed.coordinates?.latitude || null,
    longitude: parsed.coordinates?.longitude || null,
    contact_name: "Property Leasing Desk",
    contact_role: "owner",
    phone_number: parsed.phoneNumber,
    email: parsed.email,
    source: "google_maps",
    status: "discovered",
    touchpoint_count: 0,
    last_contacted_at: null,
    replied_at: null,
    created_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  try {
    await admin.from("outreach_prospects").insert(newProspect);
  } catch (err) {
    // Fail-open for preview environment
  }

  await logAction({
    staff,
    action: "outreach.lead.ingest",
    targetTable: "outreach_prospects",
    targetId: newProspect.id,
    metadata: {
      source: newProspect.source,
      districtCity: newProspect.district_city || null,
    },
  });

  return { success: true, prospect: newProspect };
}

export async function updateOutreachStatus(prospectId, newStatus) {
  const staff = await getCurrentStaff();
  if (!staff) throw new Error("Unauthorized staff session");
  assertTier(staff, TIERS.OPS_MANAGER);

  if (typeof prospectId !== "string" || !prospectId.trim() || prospectId.length > 120) {
    throw new Error("Invalid prospect identifier");
  }
  if (!ALLOWED_OUTREACH_STATUSES.has(newStatus)) {
    throw new Error("Invalid outreach status");
  }
  const cleanProspectId = prospectId.trim();

  const updates = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "contacted") {
    updates.last_contacted_at = new Date().toISOString();
  } else if (newStatus === "replied") {
    updates.replied_at = new Date().toISOString();
  }

  const admin = createAdminClient();
  try {
    await admin.from("outreach_prospects").update(updates).eq("id", cleanProspectId);
  } catch (err) {
    // Fail-open for preview
  }

  await logAction({
    staff,
    action: "outreach.lead.status_update",
    targetTable: "outreach_prospects",
    targetId: cleanProspectId,
    metadata: { newStatus },
  });

  return { success: true, updates };
}

export async function convertToClaimableDraft(prospect) {
  const staff = await getCurrentStaff();
  if (!staff) throw new Error("Unauthorized staff session");
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!prospect || typeof prospect !== "object" || Array.isArray(prospect)) {
    throw new Error("Invalid outreach prospect payload");
  }

  const safeProspectId = boundText(prospect.id, 120);
  const lat = prospect.latitude != null ? Number(prospect.latitude) : NaN;
  const lng = prospect.longitude != null ? Number(prospect.longitude) : NaN;

  const { dbPropertyRow, claimToken, claimUrl } = generateClaimDraftPayload({
    propertyName: boundText(prospect.property_name, 200),
    propertyAddress: boundText(prospect.property_address, 300),
    districtCity: boundText(prospect.district_city, 120),
    coordinates:
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { latitude: lat, longitude: lng }
        : null,
    phoneNumber: boundText(prospect.phone_number, 64),
    email: boundText(prospect.email, 254),
  });

  const admin = createAdminClient();
  const { data: insertedProperty, error: insertError } = await admin
    .from("properties")
    .insert(dbPropertyRow)
    .select("id")
    .maybeSingle();

  if (insertError) {
    console.error("[outreach] Failed to create claimable draft property:", insertError);
    throw new Error("Failed to create claimable draft property.");
  }

  if (safeProspectId) {
    try {
      await admin
        .from("outreach_prospects")
        .update({
          status: "onboarded",
          claim_token: claimToken,
        })
        .eq("id", safeProspectId);
    } catch {
      // outreach_prospects table may still be on seed fixture in preview
    }
  }

  await logAction({
    staff,
    action: "outreach.lead.convert_to_draft",
    targetTable: "properties",
    targetId: insertedProperty?.id || safeProspectId || "draft",
    metadata: {
      prospectId: safeProspectId || null,
      claimToken,
    },
  });

  return {
    success: true,
    propertyId: insertedProperty?.id || null,
    claimToken,
    claimUrl,
  };
}
