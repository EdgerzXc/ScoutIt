"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { generateWaitlistCsv } from "@/lib/pipelinePolicy.mjs";

/**
 * Load operational pipeline data across waitlist, viewing appointments, leads, and bounties (A-261).
 * Gated strictly to Ops Manager (Tier 2)+.
 */
export async function loadPipelineData() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const admin = createAdminClient();

  // Parallel safe queries
  const [waitlistRes, viewingsRes, contactsRes, bountiesRes] = await Promise.all([
    admin
      .from("waitlist")
      .select("id, email, role, tier, source, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then((r) => ({ data: r.data || [], error: r.error?.message || null }))
      .catch((e) => ({ data: [], error: e.message })),

    admin
      .from("viewing_appointments")
      .select("id, property_id, host_id, guest_id, scheduled_at, ends_at, duration_minutes, status, meet_link, created_at")
      .order("scheduled_at", { ascending: false })
      .limit(200)
      .then((r) => ({ data: r.data || [], error: r.error?.message || null }))
      .catch((e) => ({ data: [], error: e.message })),

    admin
      .from("crm_contacts")
      .select("id, owner_user_id, full_name, email, phone, company_name, contact_type, source, requirements, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then((r) => ({ data: r.data || [], error: r.error?.message || null }))
      .catch((e) => ({ data: [], error: e.message })),

    admin
      .from("bounty_claims")
      .select("id, target_field, property_id, researcher_user_id, status, payout_connects, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then((r) => ({ data: r.data || [], error: r.error?.message || null }))
      .catch((e) => ({ data: [], error: e.message })),
  ]);

  // Resolve user identities across viewings, contacts, and bounties
  const allUserIds = new Set();
  (viewingsRes.data || []).forEach((v) => {
    if (v.host_id) allUserIds.add(v.host_id);
    if (v.guest_id) allUserIds.add(v.guest_id);
  });
  (contactsRes.data || []).forEach((c) => {
    if (c.owner_user_id) allUserIds.add(c.owner_user_id);
  });
  (bountiesRes.data || []).forEach((b) => {
    if (b.researcher_user_id) allUserIds.add(b.researcher_user_id);
  });

  let profileMap = new Map();
  if (allUserIds.size > 0) {
    try {
      const { data: profiles } = await admin
        .from("user_profiles")
        .select("id, full_name, email")
        .in("id", [...allUserIds]);

      profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    } catch {
      // Non-fatal if profile enrichment fails
    }
  }

  // Enrich viewings
  const enrichedViewings = (viewingsRes.data || []).map((v) => ({
    ...v,
    host_name: profileMap.get(v.host_id)?.full_name || null,
    host_email: profileMap.get(v.host_id)?.email || null,
    guest_name: profileMap.get(v.guest_id)?.full_name || null,
    guest_email: profileMap.get(v.guest_id)?.email || null,
  }));

  // Enrich contacts
  const enrichedContacts = (contactsRes.data || []).map((c) => ({
    ...c,
    owner_name: profileMap.get(c.owner_user_id)?.full_name || null,
    owner_email: profileMap.get(c.owner_user_id)?.email || null,
  }));

  // Enrich bounties
  const enrichedBounties = (bountiesRes.data || []).map((b) => ({
    ...b,
    researcher_name: profileMap.get(b.researcher_user_id)?.full_name || null,
    researcher_email: profileMap.get(b.researcher_user_id)?.email || null,
  }));

  return {
    waitlist: waitlistRes.data || [],
    viewings: enrichedViewings,
    contacts: enrichedContacts,
    bounties: enrichedBounties,
    errors: {
      waitlist: waitlistRes.error,
      viewings: viewingsRes.error,
      contacts: contactsRes.error,
      bounties: bountiesRes.error,
    },
  };
}

/**
 * Export waitlist signups as a CSV string with immutable audit logging.
 * Gated strictly to Ops Manager (Tier 2)+.
 */
export async function exportWaitlistCsv() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const admin = createAdminClient();
  const { data: waitlist, error } = await admin
    .from("waitlist")
    .select("id, email, role, tier, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch waitlist for export: ${error.message}`);
  }

  const csvContent = generateWaitlistCsv(waitlist || []);

  await logActionStrict({
    staff,
    action: "pipeline.export_waitlist",
    targetTable: "waitlist",
    targetId: "all",
    reason: "Staff exported Founding Waitlist signups for operational demand analysis",
    metadata: {
      record_count: (waitlist || []).length,
    },
  });

  return {
    success: true,
    csv: csvContent,
    recordCount: (waitlist || []).length,
  };
}
