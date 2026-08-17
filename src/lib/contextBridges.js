/**
 * @file contextBridges.js
 * @description Context Bridge Foundation for ScoutIt Space Intelligence Platform.
 * Enforces canonical relational mapping between core entities (Properties, Units, Deals, Intelligence, Activities)
 * and provides deterministic deep-link route resolution and Return Brief aggregation.
 */

export const ENTITY_TYPES = Object.freeze({
  PROPERTY: "property",
  UNIT: "unit",
  DEAL: "deal",
  INTELLIGENCE: "intelligence",
  ACTIVITY: "activity",
  NOTIFICATION: "notification",
});

export const WORKSPACE_CONTEXTS = Object.freeze({
  BUYER: "buyer",
  OWNER: "owner",
  BROKER: "broker",
  PROVIDER: "provider",
  OPERATOR: "operator",
});

export const BRIDGE_EVENT_TYPES = Object.freeze({
  PRICE_UPDATE: "PRICE_UPDATE",
  AVAILABILITY_CHANGE: "AVAILABILITY_CHANGE",
  INTEL_PUBLISHED: "INTEL_PUBLISHED",
  DEAL_OFFER_SUBMITTED: "DEAL_OFFER_SUBMITTED",
  DEAL_COUNTER_OFFER: "DEAL_COUNTER_OFFER",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  VIEWING_REQUESTED: "VIEWING_REQUESTED",
  VIEWING_CONFIRMED: "VIEWING_CONFIRMED",
  STATUS_CHANGE: "STATUS_CHANGE",
});

/**
 * Validates a context bridge payload
 * @param {Object} payload
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateContextBridgePayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Payload must be a non-null object"] };
  }

  if (!payload.entity_type || !Object.values(ENTITY_TYPES).includes(payload.entity_type)) {
    errors.push(`Invalid entity_type: "${payload.entity_type}". Must be one of: ${Object.values(ENTITY_TYPES).join(", ")}`);
  }

  if (!payload.entity_id || typeof payload.entity_id !== "string" || !payload.entity_id.trim()) {
    errors.push("Missing or invalid entity_id. Must be a non-empty string.");
  }

  if (!payload.event_type || !Object.values(BRIDGE_EVENT_TYPES).includes(payload.event_type)) {
    errors.push(`Invalid event_type: "${payload.event_type}". Must be one of: ${Object.values(BRIDGE_EVENT_TYPES).join(", ")}`);
  }

  if (payload.workspace_context && !Object.values(WORKSPACE_CONTEXTS).includes(payload.workspace_context)) {
    errors.push(`Invalid workspace_context: "${payload.workspace_context}". Must be one of: ${Object.values(WORKSPACE_CONTEXTS).join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a structured Context Bridge event
 * @param {Object} params
 * @returns {Object} Canonical context bridge event
 */
export function createContextBridgeEvent({
  entity_type,
  entity_id,
  related_entity_type = null,
  related_entity_id = null,
  event_type,
  workspace_context = WORKSPACE_CONTEXTS.BUYER,
  actor_id = null,
  target_user_id = null,
  summary = "",
  metadata = {},
  timestamp = new Date().toISOString(),
}) {
  const payload = {
    entity_type,
    entity_id: String(entity_id || "").trim(),
    related_entity_type: related_entity_type ? String(related_entity_type) : null,
    related_entity_id: related_entity_id ? String(related_entity_id).trim() : null,
    event_type,
    workspace_context,
    actor_id: actor_id ? String(actor_id) : null,
    target_user_id: target_user_id ? String(target_user_id) : null,
    summary: String(summary || "").trim(),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
    timestamp: timestamp || new Date().toISOString(),
  };

  const validation = validateContextBridgePayload(payload);
  if (!validation.valid) {
    throw new Error(`Context Bridge validation failed: ${validation.errors.join("; ")}`);
  }

  return payload;
}

/**
 * Resolves the deterministic frontend route for any context entity or bridge event
 * @param {Object} entityOrEvent
 * @param {Object} options
 * @returns {string} Fully resolved internal URL path
 */
export function resolveContextRoute(entityOrEvent, options = {}) {
  if (!entityOrEvent) return "/dashboard";

  const entityType = entityOrEvent.entity_type;
  const entityId = entityOrEvent.entity_id;
  const metadata = entityOrEvent.metadata || {};
  const workspace = options.workspace || entityOrEvent.workspace_context || WORKSPACE_CONTEXTS.BUYER;
  const slug = metadata.slug || entityOrEvent.slug || entityId;

  switch (entityType) {
    case ENTITY_TYPES.PROPERTY: {
      if (workspace === WORKSPACE_CONTEXTS.OWNER) {
        return `/dashboard/owner/listings/${entityId}`;
      }
      return `/property/${encodeURIComponent(slug)}`;
    }
    case ENTITY_TYPES.UNIT: {
      const parentSlug = metadata.parent_slug || metadata.parentSlug || "overview";
      return `/property/${encodeURIComponent(parentSlug)}?unit=${encodeURIComponent(entityId)}`;
    }
    case ENTITY_TYPES.INTELLIGENCE: {
      return `/intel/${encodeURIComponent(slug)}`;
    }
    case ENTITY_TYPES.DEAL: {
      return `/dashboard/deals/${encodeURIComponent(entityId)}`;
    }
    case ENTITY_TYPES.ACTIVITY:
    case ENTITY_TYPES.NOTIFICATION: {
      if (entityOrEvent.related_entity_type && entityOrEvent.related_entity_id) {
        return resolveContextRoute({
          entity_type: entityOrEvent.related_entity_type,
          entity_id: entityOrEvent.related_entity_id,
          metadata: entityOrEvent.metadata,
          workspace_context: workspace,
        }, options);
      }
      return `/dashboard/notifications`;
    }
    default:
      return `/dashboard`;
  }
}

/**
 * Transforms unread bridge notifications/events into a high-signal Return Brief
 * @param {Array} events - Array of context bridge events or notification records
 * @param {string} workspace - Current workspace context
 * @param {number} maxItems - Maximum items to summarize
 * @returns {{ title: string, hasUpdates: boolean, items: Array<{ id: string, summary: string, route: string, category: string, timestamp: string }> }}
 */
export function buildReturnBrief(events = [], workspace = WORKSPACE_CONTEXTS.BUYER, maxItems = 4) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      title: "Since your last visit",
      hasUpdates: false,
      items: [],
    };
  }

  const items = events
    .slice(0, maxItems)
    .map((evt) => {
      const route = resolveContextRoute(evt, { workspace });
      let category = "Update";
      if (evt.event_type === BRIDGE_EVENT_TYPES.PRICE_UPDATE) category = "Pricing";
      else if (evt.event_type === BRIDGE_EVENT_TYPES.AVAILABILITY_CHANGE) category = "Availability";
      else if (evt.event_type === BRIDGE_EVENT_TYPES.INTEL_PUBLISHED) category = "Intelligence";
      else if (evt.event_type?.startsWith("DEAL_")) category = "Deal";
      else if (evt.event_type?.startsWith("VIEWING_")) category = "Viewing";

      return {
        id: evt.id || evt.entity_id || String(Math.random()),
        summary: evt.summary || `${category} update for ${evt.entity_type} ${evt.entity_id}`,
        route,
        category,
        timestamp: evt.timestamp || new Date().toISOString(),
      };
    });

  return {
    title: "Since your last visit",
    hasUpdates: items.length > 0,
    items,
  };
}
