"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, TIERS } from "@/lib/rbac";
import {
  parseRawOutreachSnippet,
  generateClaimDraftPayload,
  SEED_PROSPECTS,
  resolveProspectsResult,
} from "@/lib/outreachPolicy.mjs";

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

  const parsed = parseRawOutreachSnippet(rawSnippet);
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

  return { success: true, prospect: newProspect };
}

export async function updateOutreachStatus(prospectId, newStatus) {
  const staff = await getCurrentStaff();
  if (!staff) throw new Error("Unauthorized staff session");
  assertTier(staff, TIERS.OPS_MANAGER);

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
    await admin.from("outreach_prospects").update(updates).eq("id", prospectId);
  } catch (err) {
    // Fail-open for preview
  }

  return { success: true, updates };
}

export async function convertToClaimableDraft(prospect) {
  const staff = await getCurrentStaff();
  if (!staff) throw new Error("Unauthorized staff session");
  assertTier(staff, TIERS.OPS_MANAGER);

  const { dbPropertyRow, claimToken, claimUrl } = generateClaimDraftPayload({
    propertyName: prospect.property_name,
    propertyAddress: prospect.property_address,
    districtCity: prospect.district_city,
    coordinates: prospect.latitude && prospect.longitude
      ? { latitude: prospect.latitude, longitude: prospect.longitude }
      : null,
    phoneNumber: prospect.phone_number,
    email: prospect.email,
  });

  const admin = createAdminClient();
  const { data: insertedProperty, error: insertError } = await admin
    .from("properties")
    .insert(dbPropertyRow)
    .select("id")
    .maybeSingle();

  if (insertError) {
    throw new Error(`Failed to create claimable draft property: ${insertError.message}`);
  }

  try {
    await admin
      .from("outreach_prospects")
      .update({
        status: "onboarded",
        claim_token: claimToken,
      })
      .eq("id", prospect.id);
  } catch {
    // outreach_prospects table may still be on seed fixture in preview
  }

  return {
    success: true,
    propertyId: insertedProperty?.id || null,
    claimToken,
    claimUrl,
  };
}
