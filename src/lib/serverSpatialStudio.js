// ═══════════════════════════════════════════════════════════════════════════
// ScoutIt Spatial Studio — Server-Side Queue & Revision Handlers
//
// Dual-CMS Golden Rule:
//   Airtable = Public read-only property directory.
//   Supabase = Private user data, generation queues, and revision requests.
// ═══════════════════════════════════════════════════════════════════════════

import {
  SPATIAL_STYLE_PRESETS,
  resolveSpatialEntitlement,
  SPATIAL_SLA_HOURS,
  DEFAULT_MATERIAL_CONFIG,
} from "./spatialStudio";
import { findProperty } from "./propertyLookup";

function getMonthStartTimestamp() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Submits a new 3D spatial generation request to the concierge queue.
 */
export async function submitSpatialGenerationRequest({
  supabaseClient,
  user,
  propertyId,
  stylePreset,
  fileUrl = null,
  notes = "",
  currentTier = "starry",
  currentConnects = 0,
}) {
  if (!user?.id) {
    return { success: false, error: "Authentication required", code: "unauthenticated" };
  }

  if (!propertyId) {
    return { success: false, error: "Property ID is required", code: "missing_property" };
  }

  if (!stylePreset || !SPATIAL_STYLE_PRESETS[stylePreset]) {
    return {
      success: false,
      error: `Invalid style preset '${stylePreset}'. Must be one of: ${Object.keys(SPATIAL_STYLE_PRESETS).join(", ")}`,
      code: "invalid_style_preset",
    };
  }

  // Count requests made by this user in the current calendar month
  let monthlyGenerationsUsed = 0;
  if (supabaseClient) {
    try {
      const monthStart = getMonthStartTimestamp();
      const { count, error } = await supabaseClient
        .from("property_spatial_requests")
        .select("id", { count: "exact", head: true })
        .eq("requester_id", user.id)
        .gte("created_at", monthStart);

      if (!error && typeof count === "number") {
        monthlyGenerationsUsed = count;
      }
    } catch {
      // Degrade gracefully if table unmigrated
    }
  }

  // Resolve entitlement: tier allowance vs 3 Connects overflow
  const entitlement = resolveSpatialEntitlement({
    tier: currentTier,
    monthlyGenerationsUsed,
    currentConnects,
  });

  if (!entitlement.canProceed) {
    return {
      success: false,
      error: entitlement.reason,
      code: "insufficient_entitlement",
      requiresConnects: entitlement.connectCostRequired,
      remainingAllowance: entitlement.remainingAllowance,
    };
  }

  // Verify ownership: fail-closed if property missing or caller is not owner
  let resolvedPropertyId = propertyId;
  if (supabaseClient) {
    try {
      const { property, error: propErr } = await findProperty(
        supabaseClient,
        propertyId,
        ["id", "owner_id"]
      );

      if (propErr) {
        console.error("[serverSpatialStudio] Property lookup error:", propErr);
        return {
          success: false,
          error: "Failed to verify property ownership",
          code: "server_error",
        };
      }

      if (!property) {
        return {
          success: false,
          error: "Property not found",
          code: "not_found",
        };
      }

      if (!property.owner_id || property.owner_id !== user.id) {
        return {
          success: false,
          error: "Only the property owner can request 3D spatial generation",
          code: "forbidden",
        };
      }

      resolvedPropertyId = property.id || propertyId;
    } catch (err) {
      console.error("[serverSpatialStudio] Property ownership check failed:", err);
      return {
        success: false,
        error: "Only the property owner can request 3D spatial generation",
        code: "forbidden",
      };
    }
  }

  const connectsSpent = entitlement.connectCostRequired;
  const targetSlaHours = SPATIAL_SLA_HOURS.standard;

  // Deduct Connects atomically via spend_connects RPC if required
  let spentViaRpc = false;
  if (connectsSpent > 0 && supabaseClient && typeof supabaseClient.rpc === "function") {
    const { error: spendError } = await supabaseClient.rpc("spend_connects", {
      p_user_id: user.id,
      p_amount: connectsSpent,
      p_reason: `3D Spatial Studio generation for property ${resolvedPropertyId}`,
      p_ref_type: "spatial_generation",
      p_ref_id: String(resolvedPropertyId),
    });

    if (spendError) {
      return {
        success: false,
        error: "Insufficient Connects balance or wallet error.",
        code: "insufficient_connects",
        requiresConnects: connectsSpent,
      };
    }
    spentViaRpc = true;
  }

  const refundConnectsOnSystemFailure = async (failureReason) => {
    if (!spentViaRpc || connectsSpent <= 0 || !supabaseClient || typeof supabaseClient.rpc !== "function") {
      return false;
    }
    try {
      await supabaseClient.rpc("refund_connects_system_error", {
        p_user_id: user.id,
        p_amount: connectsSpent,
        p_reason: failureReason,
        p_staff_id: "system_auto_refund",
        p_ref_id: String(resolvedPropertyId),
      });
      return true;
    } catch (refundErr) {
      console.error("[SPATIAL STUDIO] Critical: failed to refund Connects after queue error:", refundErr);
      return false;
    }
  };

  let requestId = `spatial-${Date.now()}`;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("property_spatial_requests")
        .insert({
          property_id: String(resolvedPropertyId),
          requester_id: user.id,
          status: "REQUESTED",
          style_preset: stylePreset,
          file_url: fileUrl,
          notes: notes?.slice(0, 2000) || null,
          is_express: false,
          target_sla_hours: targetSlaHours,
          connects_spent: connectsSpent,
          material_config: DEFAULT_MATERIAL_CONFIG,
        })
        .select("id")
        .single();

      if (error) {
        if (spentViaRpc) {
          const refunded = await refundConnectsOnSystemFailure(
            `System error: failed to enqueue 3D Spatial Studio request for property ${resolvedPropertyId}`
          );
          return {
            success: false,
            error: "Failed to enqueue spatial generation request. Your Connects have been refunded.",
            code: "queue_insert_failed",
            refunded,
          };
        }
      } else if (data?.id) {
        requestId = data.id;
      }

      // Best effort update on properties row
      await supabaseClient
        .from("properties")
        .update({
          spatial_generation_status: "REQUESTED",
          spatial_style_preset: stylePreset,
        })
        .eq("id", propertyId);
    } catch {
      if (spentViaRpc) {
        const refunded = await refundConnectsOnSystemFailure(
          `System exception: failed to enqueue 3D Spatial Studio request for property ${propertyId}`
        );
        return {
          success: false,
          error: "Failed to enqueue spatial generation request. Your Connects have been refunded.",
          code: "queue_insert_failed",
          refunded,
        };
      }
      // Degrade gracefully if Supabase offline/unmigrated and no RPC spend occurred
    }
  }

  return {
    success: true,
    requestId,
    status: "REQUESTED",
    stylePreset,
    isExpress: false,
    connectsSpent,
    targetSlaHours,
    coveredByTier: entitlement.coveredByTier,
    remainingAllowance: entitlement.remainingAllowance,
  };
}

/**
 * Transitions a spatial generation request to FAILED and automatically refunds
 * any Connects spent by the requester (GAP-42).
 */
export async function handleSpatialGenerationFailure({
  supabaseClient,
  requestId,
  reason = "3D Spatial Studio generation failed",
}) {
  if (!supabaseClient || !requestId) {
    return { success: false, error: "Missing supabaseClient or requestId", code: "invalid_input" };
  }

  try {
    const reqQuery = supabaseClient
      .from("property_spatial_requests")
      .select("id, property_id, requester_id, status, connects_spent")
      .eq("id", requestId);
    const reqRes = reqQuery.maybeSingle ? await reqQuery.maybeSingle() : await reqQuery.single?.();
    const requestRow = reqRes?.data;

    if (!requestRow) {
      return { success: false, error: "Spatial request not found", code: "not_found" };
    }

    const alreadyFailed = String(requestRow.status || "").toUpperCase() === "FAILED";
    const connectsToRefund = !alreadyFailed ? Number(requestRow.connects_spent || 0) : 0;

    await supabaseClient
      .from("property_spatial_requests")
      .update({
        status: "FAILED",
        notes: reason ? String(reason).slice(0, 2000) : null,
      })
      .eq("id", requestId);

    if (requestRow.property_id) {
      await supabaseClient
        .from("properties")
        .update({ spatial_generation_status: "FAILED" })
        .eq("id", requestRow.property_id);
    }

    let refunded = false;
    if (connectsToRefund > 0 && requestRow.requester_id && typeof supabaseClient.rpc === "function") {
      const { error: refundErr } = await supabaseClient.rpc("refund_connects_system_error", {
        p_user_id: requestRow.requester_id,
        p_amount: connectsToRefund,
        p_reason: `Auto-refund: ${reason}`,
        p_staff_id: "system_auto_refund",
        p_ref_id: String(requestRow.id),
      });
      refunded = !refundErr;
    }

    return {
      success: true,
      requestId: requestRow.id,
      status: "FAILED",
      connectsRefunded: refunded ? connectsToRefund : 0,
      refunded,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || "Failed to transition spatial generation request",
      code: "transition_failed",
    };
  }
}

/**
 * Submits an express revision request (4–12h SLA) for an existing 3D twin.
 */
export async function submitSpatialRevisionRequest({
  supabaseClient,
  user,
  propertyId,
  revisionNotes,
  targetElements = [],
}) {
  if (!user?.id) {
    return { success: false, error: "Authentication required", code: "unauthenticated" };
  }

  if (!propertyId) {
    return { success: false, error: "Property ID is required", code: "missing_property" };
  }

  if (!revisionNotes || typeof revisionNotes !== "string" || revisionNotes.trim().length < 5) {
    return {
      success: false,
      error: "Detailed revision instructions (minimum 5 characters) are required",
      code: "invalid_revision_notes",
    };
  }

  // Enforce strict property ownership on revision submissions (fail-closed)
  let resolvedPropertyId = propertyId;
  if (supabaseClient) {
    try {
      const { property, error: propErr } = await findProperty(
        supabaseClient,
        propertyId,
        ["id", "owner_id"]
      );

      if (propErr) {
        console.error("[serverSpatialStudio] Revision property lookup error:", propErr);
        return {
          success: false,
          error: "Failed to verify property ownership",
          code: "server_error",
        };
      }

      if (!property) {
        return {
          success: false,
          error: "Property not found",
          code: "not_found",
        };
      }

      if (!property.owner_id || property.owner_id !== user.id) {
        return {
          success: false,
          error: "Only the property owner can submit spatial revisions",
          code: "forbidden",
        };
      }

      resolvedPropertyId = property.id || propertyId;
    } catch (err) {
      console.error("[serverSpatialStudio] Revision ownership check failed:", err);
      return {
        success: false,
        error: "Only the property owner can submit spatial revisions",
        code: "forbidden",
      };
    }
  }

  const targetSlaHours = SPATIAL_SLA_HOURS.express;
  let requestId = `rev-${Date.now()}`;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("property_spatial_requests")
        .insert({
          property_id: String(resolvedPropertyId),
          requester_id: user.id,
          status: "REVISION_REQUESTED",
          style_preset: "minimalist_organic", // fallback preset
          notes: revisionNotes.trim().slice(0, 2000),
          is_express: true,
          target_sla_hours: targetSlaHours,
          connects_spent: 0, // Revisions included under express SLA
          material_config: { targetElements },
        })
        .select("id")
        .single();

      if (!error && data?.id) {
        requestId = data.id;
      }

      // Best effort update on properties row
      await supabaseClient
        .from("properties")
        .update({
          spatial_generation_status: "REVISION_REQUESTED",
        })
        .eq("id", resolvedPropertyId);
    } catch {
      // Degrade gracefully
    }
  }

  return {
    success: true,
    requestId,
    status: "REVISION_REQUESTED",
    isExpress: true,
    targetSlaHours,
    slaLabel: "4–12 Hours (Express Priority)",
  };
}

/**
 * Gets spatial generation status and material configuration for a property.
 */
export async function getSpatialPropertyStatus({
  supabaseClient,
  propertyId,
}) {
  if (!propertyId) {
    return { status: "NONE", stylePreset: null, materialConfig: DEFAULT_MATERIAL_CONFIG };
  }

  if (!supabaseClient) {
    return { status: "NONE", stylePreset: null, materialConfig: DEFAULT_MATERIAL_CONFIG };
  }

  try {
    let resolvedId = propertyId;
    if (typeof findProperty === "function") {
      try {
        const { property } = await findProperty(supabaseClient, propertyId, ["id"]);
        if (property?.id) {
          resolvedId = property.id;
        }
      } catch {
        // Fall back to original propertyId
      }
    }

    const { data: latestRequest } = await supabaseClient
      .from("property_spatial_requests")
      .select("*")
      .eq("property_id", String(resolvedId))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRequest) {
      return {
        status: latestRequest.status,
        stylePreset: latestRequest.style_preset,
        materialConfig: latestRequest.material_config || DEFAULT_MATERIAL_CONFIG,
        isExpress: Boolean(latestRequest.is_express),
        targetSlaHours: latestRequest.target_sla_hours || 48,
        createdAt: latestRequest.created_at,
      };
    }
  } catch {
    // Degrade gracefully
  }

  return { status: "NONE", stylePreset: null, materialConfig: DEFAULT_MATERIAL_CONFIG };
}
