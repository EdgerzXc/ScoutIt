"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { notifyUser } from "@/lib/notifications";
import {
  fetchAirtableBrokers,
  setBrokerLiveStateInAirtable,
  setBrokerLicenseVerifiedInAirtable,
} from "@/lib/brokerCms";

function getAirtableCreds() {
  const apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  return { apiKey, baseId };
}

/**
 * Load all brokers from Airtable BROKERS_CMS paired with Supabase profile metadata (A-256).
 * Agent (Tier 1)+ for read access.
 */
export async function loadBrokers() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const { apiKey, baseId } = getAirtableCreds();
  if (!apiKey || !baseId) {
    return {
      brokers: [],
      error: "Airtable credentials (AIRTABLE_API_KEY / AIRTABLE_BASE_ID) not configured.",
    };
  }

  try {
    const rawBrokers = await fetchAirtableBrokers(apiKey, baseId);
    const admin = createAdminClient();

    // Collect Supabase BrokerIDs for enrichment
    const brokerAuthIds = rawBrokers
      .map((r) => r.fields?.BrokerID)
      .filter((id) => id && typeof id === "string" && id.length > 20);

    let profileMap = new Map();
    if (brokerAuthIds.length > 0) {
      const { data: profiles } = await admin
        .from("user_profiles")
        .select("id, email, full_name, kyc_verified, prc_license, is_verified")
        .in("id", brokerAuthIds);

      profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    }

    const brokers = rawBrokers.map((r) => {
      const f = r.fields || {};
      const supabaseUser = f.BrokerID ? profileMap.get(f.BrokerID) : null;

      const niche = f.Niche
        ? Array.isArray(f.Niche)
          ? f.Niche
          : String(f.Niche).split(",").map((n) => n.trim())
        : [];

      return {
        recordId: r.id,
        brokerId: f.BrokerID || null,
        name: f.Name || "Unnamed Advisor",
        title: f.Title || "",
        specialty: f.Specialty || "",
        location: f.Location || "",
        bio: f.Bio || "",
        image: f.Image || "",
        license: f.License || supabaseUser?.prc_license || "",
        isLive: Boolean(f.Approved_For_Live_Site),
        isLicenseVerified: Boolean(f.License_Verified),
        isExample: Boolean(f.Is_Example),
        niche,
        supabaseEmail: supabaseUser?.email || null,
        supabaseKyc: Boolean(supabaseUser?.kyc_verified || supabaseUser?.is_verified),
      };
    });

    return { brokers, error: null };
  } catch (err) {
    return { brokers: [], error: err.message || String(err) };
  }
}

/**
 * Toggle broker live status (takedown or restore to live directory).
 * Ops Manager (Tier 2)+.
 *
 * @param {object} params
 * @param {string} params.recordId - Airtable record ID
 * @param {string|null} params.brokerId - Supabase Auth ID if available
 * @param {boolean} params.isLive - Desired status
 * @param {string} params.reason - Explanation for audit and user notice
 */
export async function setBrokerLiveStatus({ recordId, brokerId, isLive, reason }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (!trimmedReason || trimmedReason.length < 10) {
    throw new Error("A substantive reason of at least 10 characters is required for staff audit.");
  }

  const { apiKey, baseId } = getAirtableCreds();
  if (!apiKey || !baseId) {
    throw new Error("Missing Airtable credentials.");
  }

  const result = await setBrokerLiveStateInAirtable({
    apiKey,
    baseId,
    recordId,
    isLive: Boolean(isLive),
  });

  const admin = createAdminClient();

  // Audit action
  await logActionStrict({
    staff,
    action: isLive ? "broker.publish" : "broker.takedown",
    targetTable: "BROKERS_CMS",
    targetId: recordId,
    reason: trimmedReason,
    metadata: {
      broker_id: brokerId || null,
      is_live: Boolean(isLive),
      cache: result.cache,
    },
  });

  // Notify broker if linked to Supabase account
  if (brokerId) {
    await notifyUser(admin, {
      userId: brokerId,
      title: isLive ? "Public Broker Profile Restored" : "Public Broker Profile Suspended",
      desc: isLive
        ? `Your public broker profile on ScoutIt has been restored to active status. Reason: ${trimmedReason}`
        : `Your public broker profile on ScoutIt was suspended from the live directory. Reason: ${trimmedReason}`,
      notificationType: "broker_status_change",
    });
  }

  revalidatePath("/dashboard/brokers");
  return { success: true, recordId, isLive: Boolean(isLive) };
}

/**
 * Toggle broker PRC license verification status in Airtable.
 * Ops Manager (Tier 2)+.
 *
 * @param {object} params
 * @param {string} params.recordId
 * @param {string|null} params.brokerId
 * @param {boolean} params.isVerified
 * @param {string} params.reason
 */
export async function setBrokerLicenseVerification({ recordId, brokerId, isVerified, reason }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (!trimmedReason || trimmedReason.length < 10) {
    throw new Error("A substantive reason of at least 10 characters is required for staff audit.");
  }

  const { apiKey, baseId } = getAirtableCreds();
  if (!apiKey || !baseId) {
    throw new Error("Missing Airtable credentials.");
  }

  const result = await setBrokerLicenseVerifiedInAirtable({
    apiKey,
    baseId,
    recordId,
    isVerified: Boolean(isVerified),
  });

  const admin = createAdminClient();

  // Audit action
  await logActionStrict({
    staff,
    action: isVerified ? "broker.prc_verify" : "broker.prc_revoke",
    targetTable: "BROKERS_CMS",
    targetId: recordId,
    reason: trimmedReason,
    metadata: {
      broker_id: brokerId || null,
      is_license_verified: Boolean(isVerified),
      cache: result.cache,
    },
  });

  // Update Supabase user profile if brokerId is present
  if (brokerId) {
    try {
      await admin
        .from("user_profiles")
        .update({
          prc_verified: Boolean(isVerified),
        })
        .eq("id", brokerId);
    } catch (profileErr) {
      console.warn("[setBrokerLicenseVerification] Could not sync user_profiles:", profileErr?.message);
    }

    await notifyUser(admin, {
      userId: brokerId,
      title: isVerified ? "PRC License Verified" : "PRC Verification Revoked",
      desc: isVerified
        ? `Your PRC real estate broker license was verified by ScoutIt staff. Reason: ${trimmedReason}`
        : `Your PRC license verification badge was revoked. Reason: ${trimmedReason}`,
      notificationType: "broker_prc_change",
    });
  }

  revalidatePath("/dashboard/brokers");
  return { success: true, recordId, isVerified: Boolean(isVerified) };
}
