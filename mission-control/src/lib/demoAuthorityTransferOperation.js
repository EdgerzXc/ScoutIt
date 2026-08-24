import "server-only";

import { createHash } from "node:crypto";

const SOURCE_ID = "master-dev";
const MISSING_RELATION_CODES = new Set(["42P01", "PGRST205"]);

export const DEMO_AUTHORITY_TRANSFER_OPERATION = Object.freeze({
  id: "supabase.demo_authority_transfer.v1",
  sourceId: SOURCE_ID,
  confirmationPhrase: "TRANSFER DEMO AUTHORITY",
});

export const REFERENCE_REGISTRY = Object.freeze([
  { table: "property_units", column: "operator_id", select: "id, property_id", className: "blocked", label: "Delegated operator units" },
  { table: "deals", column: "buyer_id", select: "id, property_id", className: "blocked", label: "Buyer deal identities" },
  { table: "deals", column: "broker_id", select: "id, property_id", className: "blocked", label: "Broker deal identities" },
  { table: "property_broker_representations", column: "broker_id", select: "id, property_id", className: "blocked", label: "Broker representations" },
  { table: "crm_tasks", column: "owner_user_id", select: "id, deal_id", className: "blocked", label: "Private CRM tasks" },
  { table: "calendar_events", column: "owner_user_id", select: "id", className: "blocked", label: "Private calendar events" },
  { table: "calendar_connections", column: "owner_user_id", select: "id, provider", className: "blocked", label: "OAuth calendar connections" },
  { table: "connect_balances", column: "user_id", select: "user_id", className: "blocked", label: "Legacy Connect balances" },
  { table: "user_connect_wallets", column: "user_id", select: "user_id, role_scope", className: "blocked", label: "Connect wallets" },
  { table: "user_connect_accounts", column: "user_id", select: "user_id", className: "blocked", label: "Connect accounts" },
  { table: "connect_wallet_ledger", column: "user_id", select: "id", className: "retained", label: "Connect ledger history" },
  { table: "crm_activity_log", column: "actor_id", select: "id, deal_id, property_id", className: "retained", label: "CRM activity history" },
  { table: "audit_logs", column: "user_id", select: "id", className: "retained", label: "Product audit history" },
  { table: "property_lifecycle_events", column: "actor_id", select: "id, property_id", className: "retained", label: "Property lifecycle history" },
  { table: "analytics_events", column: "user_id", select: "id", className: "retained", label: "Analytics history" },
]);

function normalizedEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 254) throw new Error("Enter one valid target account email.");
  return email;
}

async function resolveUniqueAuthUser(admin, targetEmail) {
  const email = normalizedEmail(targetEmail);
  const matches = [];
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Auth account lookup failed: ${error.message}`);
    const users = data?.users || [];
    matches.push(...users.filter((user) => String(user.email || "").trim().toLowerCase() === email));
    if (users.length < 1000) break;
  }
  if (matches.length !== 1) throw new Error(`Expected exactly one verified Auth account for ${email}; found ${matches.length}.`);
  return { id: matches[0].id, email };
}

async function loadReference(admin, reference, sourceId) {
  const { data, error } = await admin.from(reference.table).select(reference.select).eq(reference.column, sourceId);
  if (error && MISSING_RELATION_CODES.has(error.code)) return { ...reference, state: "not_deployed", rows: [] };
  if (error) throw new Error(`${reference.table}.${reference.column} inventory failed: ${error.message}`);
  return { ...reference, state: "available", rows: data || [] };
}

function hashPlan(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").toUpperCase();
}

async function loadRouteReferences(admin, sourceId, propertyIds, targetId) {
  const base = admin.from("deal_routing_recipients").select("deal_id, property_id, recipient_id, recipient_type, representation_id").eq("recipient_id", sourceId);
  const { data, error } = propertyIds.length ? await base.in("property_id", propertyIds) : { data: [], error: null };
  if (error && MISSING_RELATION_CODES.has(error.code)) return { state: "not_deployed", eligible: [], blocked: [], collisions: [] };
  if (error) throw new Error(`Owner routing inventory failed: ${error.message}`);
  const rows = data || [];
  const eligible = rows.filter((row) => row.recipient_type === "owner" && !row.representation_id);
  const blocked = rows.filter((row) => !eligible.includes(row));
  if (!eligible.length) return { state: "available", eligible, blocked, collisions: [] };
  const dealIds = [...new Set(eligible.map((row) => row.deal_id))];
  const collisionResult = await admin.from("deal_routing_recipients").select("deal_id, property_id, recipient_id").eq("recipient_id", targetId).in("deal_id", dealIds);
  if (collisionResult.error) throw new Error(`Owner routing collision check failed: ${collisionResult.error.message}`);
  return { state: "available", eligible, blocked, collisions: collisionResult.data || [] };
}

export async function getDemoAuthorityTransferStatus({ admin, targetEmail, sourceId = SOURCE_ID }) {
  if (!admin) throw new Error("Mission Control admin client is required.");
  const target = await resolveUniqueAuthUser(admin, targetEmail);
  const propertyResult = await admin.from("properties").select("id, title, slug, owner_id").eq("owner_id", sourceId);
  if (propertyResult.error) throw new Error(`Property ownership inventory failed: ${propertyResult.error.message}`);
  const properties = propertyResult.data || [];
  const propertyIds = properties.map((row) => row.id).sort();
  const [routing, ...references] = await Promise.all([
    loadRouteReferences(admin, sourceId, propertyIds, target.id),
    ...REFERENCE_REGISTRY.map((reference) => loadReference(admin, reference, sourceId)),
  ]);
  const blocked = [
    ...references.filter((item) => item.className === "blocked" && item.rows.length),
    ...(routing.blocked.length ? [{ label: "Non-owner routing identities", table: "deal_routing_recipients", rows: routing.blocked }] : []),
    ...(routing.collisions.length ? [{ label: "Target routing collisions", table: "deal_routing_recipients", rows: routing.collisions }] : []),
  ];
  const retained = references.filter((item) => item.className === "retained" && item.rows.length);
  const eligible = [
    { label: "Private properties", table: "properties", rows: properties },
    { label: "Owner-type deal routing", table: "deal_routing_recipients", rows: routing.eligible },
  ];
  const plan = {
    operationId: DEMO_AUTHORITY_TRANSFER_OPERATION.id,
    sourceId,
    targetId: target.id,
    propertyIds,
    ownerRouteKeys: routing.eligible.map((row) => `${row.deal_id}:${row.property_id}`).sort(),
    blocked: blocked.map((item) => ({ table: item.table, ids: item.rows.map((row) => row.id || row.deal_id || row.user_id).sort() })),
  };
  const planHash = hashPlan(plan);
  return {
    target,
    sourceId,
    eligible: eligible.map((item) => ({ ...item, count: item.rows.length })),
    blocked: blocked.map((item) => ({ ...item, count: item.rows.length })),
    retained: retained.map((item) => ({ ...item, count: item.rows.length })),
    notDeployed: references.filter((item) => item.state === "not_deployed").map((item) => `${item.table}.${item.column}`),
    propertyIds,
    routeCount: routing.eligible.length,
    planHash,
    canExecute: properties.length > 0 && blocked.length === 0,
  };
}

export async function verifyTransferredAuthority(admin, before) {
  const properties = await admin.from("properties").select("id, owner_id").in("id", before.propertyIds);
  if (properties.error) throw new Error(`Ownership post-verification failed: ${properties.error.message}`);
  if ((properties.data || []).length !== before.propertyIds.length || properties.data.some((row) => row.owner_id !== before.target.id)) {
    throw new Error("The atomic operation returned, but target property ownership did not verify.");
  }
  if (before.routeCount > 0) {
    const oldRoutes = await admin.from("deal_routing_recipients").select("deal_id").eq("recipient_id", before.sourceId).eq("recipient_type", "owner").in("property_id", before.propertyIds);
    if (oldRoutes.error) throw new Error(`Routing post-verification failed: ${oldRoutes.error.message}`);
    if ((oldRoutes.data || []).length) throw new Error("The atomic operation returned, but legacy owner routing remains.");
  }
  return { propertyCount: before.propertyIds.length, ownerRouteCount: before.routeCount };
}

export async function executeDemoAuthorityTransfer({ admin, targetEmail, expectedPlanHash }) {
  const before = await getDemoAuthorityTransferStatus({ admin, targetEmail });
  if (!before.canExecute) throw new Error("The reviewed transfer contains blocked authority or no eligible properties.");
  if (!expectedPlanHash || before.planHash !== expectedPlanHash) throw new Error("The transfer plan changed. Run the dry-run again.");
  const { data, error } = await admin.rpc("transfer_demo_authority_atomic", {
    p_source_id: before.sourceId,
    p_target_user_id: before.target.id,
    p_property_ids: before.propertyIds,
    p_expected_route_count: before.routeCount,
  });
  if (error) throw new Error(`Atomic transfer failed: ${error.message}`);
  const verified = await verifyTransferredAuthority(admin, before);
  return { before, result: data, verified };
}
