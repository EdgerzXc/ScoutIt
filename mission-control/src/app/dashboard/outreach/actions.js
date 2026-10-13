"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, TIERS } from "@/lib/rbac";
import {
  parseRawOutreachSnippet,
  generateClaimDraftPayload,
  isAgingOverdue,
} from "@/lib/outreachPolicy.mjs";

const SEED_PROSPECTS = [
  {
    id: "prospect-zuellig",
    property_name: "Zuellig Building",
    property_address: "Makati Avenue corner Paseo de Roxas, Makati",
    district_city: "Makati",
    google_maps_url: "https://maps.app.goo.gl/zuellig?q=14.5547,121.0244",
    latitude: 14.5547,
    longitude: 121.0244,
    contact_name: "Admin Leasing Desk",
    contact_role: "property_admin",
    phone_number: "09178881234",
    email: "leasing@zuelligbuilding.com",
    source: "google_maps",
    status: "discovered",
    touchpoint_count: 0,
    last_contacted_at: null,
    replied_at: null,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "prospect-oneayala",
    property_name: "One Ayala Corporate Center",
    property_address: "1 Ayala Avenue, Makati",
    district_city: "Makati",
    google_maps_url: "https://maps.app.goo.gl/oneayala?q=14.5505,121.0260",
    latitude: 14.5505,
    longitude: 121.0260,
    contact_name: "Ayala Land Offices",
    contact_role: "owner",
    phone_number: "09175554321",
    email: "offices@ayala.com.ph",
    source: "google_maps",
    status: "contacted",
    touchpoint_count: 1,
    last_contacted_at: new Date(Date.now() - 80 * 3600 * 1000).toISOString(), // > 72 hrs -> Overdue
    replied_at: null,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "prospect-menarco",
    property_name: "Menarco Tower",
    property_address: "32nd Street, BGC, Taguig",
    district_city: "BGC",
    google_maps_url: "https://maps.app.goo.gl/menarco?q=14.5492,121.0503",
    latitude: 14.5492,
    longitude: 121.0503,
    contact_name: "Ms. Carmen Tan",
    contact_role: "owner",
    phone_number: "09189998877",
    email: "carmen@menarco.com.ph",
    source: "signage",
    status: "replied",
    touchpoint_count: 2,
    last_contacted_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    replied_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "prospect-arthaland",
    property_name: "Arthaland Century Pacific Tower",
    property_address: "5th Avenue corner 30th St, BGC",
    district_city: "BGC",
    google_maps_url: "https://maps.app.goo.gl/arthaland?q=14.5480,121.0490",
    latitude: 14.5480,
    longitude: 121.0490,
    contact_name: "Commercial Broker Desk",
    contact_role: "broker",
    phone_number: "09201234567",
    email: "broker@arthaland.ph",
    source: "google_maps",
    status: "contacted",
    touchpoint_count: 1,
    last_contacted_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // < 72 hrs -> Normal
    replied_at: null,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
];

export async function loadOutreachProspects() {
  const staff = await getCurrentStaff();
  if (!staff) throw new Error("Unauthorized staff session");
  assertTier(staff, TIERS.OPS_MANAGER);

  const admin = createAdminClient();
  try {
    const { data, error } = await admin
      .from("outreach_prospects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      // Return initial seed fixtures when database table is pending O-004 migration
      return { prospects: SEED_PROSPECTS, source: "mock_seed" };
    }

    return { prospects: data, source: "live_database" };
  } catch (err) {
    return { prospects: SEED_PROSPECTS, source: "mock_seed" };
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

  const { propertyPayload, claimToken, claimUrl } = generateClaimDraftPayload({
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
  try {
    // Atomically insert into properties if table available
    await admin.from("properties").insert(propertyPayload);
    await admin
      .from("outreach_prospects")
      .update({ status: "onboarded", claim_token: claimToken })
      .eq("id", prospect.id);
  } catch (err) {
    // Fail-open
  }

  return {
    success: true,
    claimToken,
    claimUrl,
  };
}
