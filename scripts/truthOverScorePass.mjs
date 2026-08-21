import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const graphDataPath = path.join(rootDir, 'src', 'data', 'masterFlowGraphData.js');
const { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } = await import(pathToFileURL(graphDataPath).href);

console.log(`Executing Truth Over Score Pass on ${MASTER_FLOW_NODES.length} nodes and ${MASTER_FLOW_EDGES.length} edges...`);

// 1. Audit and Reconcile Nodes
const updatedNodes = MASTER_FLOW_NODES.map(node => {
  const updated = { ...node };

  const hasBrainOnlyEvidence = (updated.evidence || []).every(e => e.kind === 'SCOUTIT_BRAIN' || e.kind === 'APPROVED_PRODUCT_DECISION');
  const hasCodeEvidence = (updated.evidence || []).some(e => ['CODE', 'ROUTE', 'COMPONENT', 'API', 'DATABASE', 'TEST'].includes(e.kind));

  if (updated.implementationStatus === 'VERIFIED') {
    updated.productStatus = 'APPROVED';
    updated.implementationStatus = hasCodeEvidence ? 'VERIFIED' : 'PARTIAL';
    updated.evidenceStatus = hasCodeEvidence ? 'CODE_GROUNDED' : (hasBrainOnlyEvidence ? 'DOCUMENTED' : 'UNVERIFIED');
  } else if (updated.implementationStatus === 'PARTIAL') {
    updated.productStatus = 'APPROVED';
    updated.implementationStatus = 'PARTIAL';
    updated.evidenceStatus = hasCodeEvidence ? 'CODE_GROUNDED' : 'DOCUMENTED';
  } else if (updated.implementationStatus === 'PLANNED') {
    updated.productStatus = 'PLANNED';
    updated.implementationStatus = 'NOT_STARTED';
    updated.evidenceStatus = hasBrainOnlyEvidence ? 'DOCUMENTED' : 'UNVERIFIED';
  } else if (updated.implementationStatus === 'PROPOSED') {
    updated.productStatus = 'PROPOSED';
    updated.implementationStatus = 'NOT_STARTED';
    updated.evidenceStatus = 'UNVERIFIED';
  } else {
    updated.productStatus = updated.productStatus || 'APPROVED';
    updated.implementationStatus = updated.implementationStatus || 'NOT_STARTED';
    updated.evidenceStatus = updated.evidenceStatus || 'UNVERIFIED';
  }

  updated.humanReviewedBy = null;
  updated.approvedAt = null;
  updated.machineVerifiedBy = 'Automated Grounding Engine';
  updated.machineVerificationStatus = updated.implementationStatus === 'VERIFIED' ? 'VERIFIED' : 'UNREVIEWED';
  updated.productReviewStatus = 'RESEARCHED';
  updated.securityReviewStatus = 'RESEARCHED';
  updated.legalReviewStatus = 'RESEARCHED';

  if (updated.governance) {
    updated.governance = {
      domainOwner: updated.governance.domainOwner || 'ScoutIt Core',
      reviewer: null,
      riskLevel: updated.governance.riskLevel || 'STANDARD',
      approvedAt: null,
      validFrom: null,
      reviewAfter: null,
      deprecatedBy: null,
      changeReason: null
    };
  }

  // Reconcile Routes & ViewStates
  if (updated.id === 'discover_directory') {
    updated.route = '/discover';
    updated.routeType = 'EXACT_MATCH';
  } else if (updated.id === 'pep' || updated.id === 'property_directory') {
    updated.route = '/property';
    updated.routeType = 'EXACT_MATCH';
  } else if (updated.id === 'login') {
    updated.route = '/login';
    updated.routeType = 'REDIRECT_ALIAS';
    updated.redirectTo = '/onboarding';
  } else if (updated.id === 'dashboard_owner') {
    updated.route = '/dashboard';
    updated.viewState = 'OWNER';
    updated.routeType = 'QUERY_STATE_VARIANT';
  } else if (updated.id === 'dashboard_broker') {
    updated.route = '/dashboard';
    updated.viewState = 'BROKER';
    updated.routeType = 'QUERY_STATE_VARIANT';
  } else if (updated.id === 'dashboard_seeker') {
    updated.route = '/dashboard';
    updated.viewState = 'BUYER';
    updated.routeType = 'QUERY_STATE_VARIANT';
  } else if (updated.id === 'dashboard_provider') {
    updated.route = '/dashboard';
    updated.viewState = 'PROVIDER';
    updated.routeType = 'QUERY_STATE_VARIANT';
  } else if (updated.id === 'dashboard_operator') {
    updated.route = '/dashboard';
    updated.viewState = 'OPERATOR';
    updated.routeType = 'QUERY_STATE_VARIANT';
  }

  if (Array.isArray(updated.claims)) {
    updated.claims = updated.claims.map(cl => ({
      ...cl,
      humanReviewedBy: null,
      machineVerifiedBy: 'Automated Grounding Engine',
      reviewStatus: 'RESEARCHED',
      reviewedAt: null
    }));
  }

  return updated;
});

// 2. Audit and Configure Edges (Predicates & State Transitions)
const domainPredicateMap = {
  // Auth Gates
  'e_gate_auth_to_login': { field: 'auth.isAuthenticated', operator: '==', value: false, quality: 'DOMAIN_DECISION' },
  'e_gate_auth_to_inquiry': { field: 'auth.isAuthenticated', operator: '==', value: true, quality: 'DOMAIN_DECISION' },
  'e_gate_auth_to_login_booking': { field: 'auth.isAuthenticated', operator: '==', value: false, quality: 'DOMAIN_DECISION' },
  'e_gate_auth_to_booking': { field: 'auth.isAuthenticated', operator: '==', value: true, quality: 'DOMAIN_DECISION' },
  'e_gate_auth_to_login_offer': { field: 'auth.isAuthenticated', operator: '==', value: false, quality: 'DOMAIN_DECISION' },
  'e_gate_auth_to_offer': { field: 'auth.isAuthenticated', operator: '==', value: true, quality: 'DOMAIN_DECISION' },

  // Connects & Inquiry
  'e_inquiry_modal_to_exc_insufficient_connects_101': { field: 'connects.balance', operator: '<', value: 1, quality: 'DOMAIN_DECISION' },
  'e_inquiry_modal_to_sys_connect_wallet_100': { field: 'connects.balance', operator: '>=', value: 1, quality: 'DOMAIN_DECISION' },
  'edge_inquiry_to_insufficient_connects': { field: 'connects.balance', operator: '<', value: 1, quality: 'DOMAIN_DECISION' },
  'e_gate_connects_to_rec_topup': { field: 'connects.balance', operator: '<', value: 1, quality: 'DOMAIN_DECISION' },
  'e_gate_connects_to_spend': { field: 'connects.balance', operator: '>=', value: 1, quality: 'DOMAIN_DECISION' },
  'edge_inquiry_to_deal_room': { field: 'connects.transactionStatus', operator: '==', value: 'SUCCESS', quality: 'DOMAIN_DECISION' },

  // Viewing Gate
  'e_gate_viewing_to_completed': { field: 'viewing.attendance', operator: '==', value: 'ATTENDED', quality: 'DOMAIN_DECISION' },
  'e_gate_viewing_to_reschedule': { field: 'viewing.status', operator: '==', value: 'RESCHEDULE_PROPOSED', quality: 'DOMAIN_DECISION' },
  'e_gate_viewing_to_noshow': { field: 'viewing.attendance', operator: '==', value: 'NO_SHOW', quality: 'DOMAIN_DECISION' },
  'e_gate_viewing_to_cancelled': { field: 'viewing.status', operator: '==', value: 'CANCELLED', quality: 'DOMAIN_DECISION' },

  // Offer Gate
  'e_gate_offer_to_accepted': { field: 'offer.status', operator: '==', value: 'ACCEPTED', quality: 'DOMAIN_DECISION' },
  'e_gate_offer_to_countered': { field: 'offer.status', operator: '==', value: 'COUNTERED', quality: 'DOMAIN_DECISION' },
  'e_gate_offer_to_rejected': { field: 'offer.status', operator: '==', value: 'REJECTED', quality: 'DOMAIN_DECISION' },
  'e_gate_offer_to_expired': { field: 'offer.status', operator: '==', value: 'EXPIRED', quality: 'DOMAIN_DECISION' },

  // Representation & Broker
  'e_gate_rep_to_active': { field: 'representation.status', operator: '==', value: 'ACTIVE', quality: 'DOMAIN_DECISION' },
  'e_gate_rep_to_pending': { field: 'representation.status', operator: '==', value: 'PENDING_PRC', quality: 'DOMAIN_DECISION' },
  'e_gate_kyc_to_failed': { field: 'broker.prcVerified', operator: '==', value: false, quality: 'DOMAIN_DECISION' },
  'e_gate_kyc_to_verified': { field: 'broker.prcVerified', operator: '==', value: true, quality: 'DOMAIN_DECISION' },

  // Sentinel & Security Gates
  'e_gate_turnstile_to_passed': { field: 'turnstile.isVerified', operator: '==', value: true, quality: 'DOMAIN_DECISION' },
  'e_gate_turnstile_to_failed': { field: 'turnstile.isVerified', operator: '==', value: false, quality: 'DOMAIN_DECISION' },
  'e_gate_rate_limit_to_throttled': { field: 'client.requestRate', operator: '>', value: 60, quality: 'DOMAIN_DECISION' },
  'e_gate_rate_limit_to_allowed': { field: 'client.requestRate', operator: '<=', value: 60, quality: 'DOMAIN_DECISION' },
  'e_gate_freshness_to_expired': { field: 'listing.daysSinceVerification', operator: '>', value: 30, quality: 'DOMAIN_DECISION' },
  'e_gate_freshness_to_valid': { field: 'listing.daysSinceVerification', operator: '<=', value: 30, quality: 'DOMAIN_DECISION' }
};

const explicitStateTransitionMap = {
  // Inquiry State Transitions
  'e_inquiry_modal_to_sys_connect_wallet_100': { fromState: 'DRAFT', toState: 'SUBMITTED' },
  'e_inquiry_modal_to_exc_insufficient_connects_101': { fromState: 'DRAFT', toState: 'BLOCKED' },
  'e_comp_return_brief_owner_to_deal_room': { fromState: 'SUBMITTED', toState: 'OPEN' },

  // Viewing State Transitions
  'e_booking_modal_to_deal_room_111': { fromState: 'REQUESTED', toState: 'CONFIRMED' },
  'e_booking_modal_to_exc_slot_conflict_108': { fromState: 'REQUESTED', toState: 'RESCHEDULE_PENDING' },
  'e_gate_viewing_to_completed': { fromState: 'CONFIRMED', toState: 'COMPLETED' },
  'e_gate_viewing_to_cancelled': { fromState: 'CONFIRMED', toState: 'CANCELLED' },
  'e_gate_viewing_to_noshow': { fromState: 'CONFIRMED', toState: 'NO_SHOW' },
  'e_gate_viewing_to_reschedule': { fromState: 'RESCHEDULE_PENDING', toState: 'CONFIRMED' },

  // Offer State Transitions
  'e_offer_modal_to_deal_room_118': { fromState: 'DRAFT', toState: 'SUBMITTED' },
  'e_gate_offer_to_accepted': { fromState: 'SUBMITTED', toState: 'ACCEPTED' },
  'e_gate_offer_to_countered': { fromState: 'SUBMITTED', toState: 'COUNTERED' },
  'e_gate_offer_to_rejected': { fromState: 'SUBMITTED', toState: 'REJECTED' },
  'e_gate_offer_to_expired': { fromState: 'SUBMITTED', toState: 'EXPIRED' },

  // Deal / Handshake State Transitions
  'e_sys_transaction_handshake_to_terminal_handshake_success_154': { fromState: 'HANDSHAKE_PENDING', toState: 'CLOSED' }
};

const updatedEdges = MASTER_FLOW_EDGES.map(edge => {
  const updated = { ...edge };

  if (domainPredicateMap[edge.id]) {
    updated.predicate = domainPredicateMap[edge.id];
    updated.quality = 'DOMAIN_DECISION';
  } else if (['FAILURE', 'RECOVERY', 'AUTH_GATE', 'PERMISSION_GATE', 'CONDITION_TRUE', 'CONDITION_FALSE'].includes(updated.type)) {
    if (updated.predicate) {
      updated.predicate.quality = 'DOMAIN_DECISION';
      updated.quality = 'DOMAIN_DECISION';
    }
  } else if (updated.predicate && updated.predicate.field === 'action.completed') {
    if (['NAVIGATE', 'ACTION'].includes(updated.type)) {
      updated.predicate = {
        field: 'navigation.action',
        operator: '==',
        value: updated.action || 'navigated',
        quality: 'GENERIC_NAVIGATION'
      };
      updated.quality = 'GENERIC_NAVIGATION';
    } else {
      updated.predicate = null;
      updated.quality = null;
    }
  } else if (updated.predicate) {
    updated.predicate.quality = updated.predicate.quality || 'GENERIC_NAVIGATION';
    updated.quality = updated.predicate.quality;
  }

  // Explicit state transition assignment
  if (explicitStateTransitionMap[edge.id]) {
    updated.stateTransition = explicitStateTransitionMap[edge.id];
  }

  // Synchronize conditions array
  if (updated.predicate && updated.predicate.field) {
    const valStr = typeof updated.predicate.value === 'string' ? `"${updated.predicate.value}"` : updated.predicate.value;
    const condStr = `${updated.predicate.field} ${updated.predicate.operator} ${valStr}`;
    const baseConditions = (updated.conditions || []).filter(c => !c.includes('==') && !c.includes('!=') && !c.includes('>') && !c.includes('<'));
    updated.conditions = [...baseConditions, condStr];
  }

  return updated;
});

const fileContent = `/**
 * SCOUTIT MASTER FLOW GRAPH — TRUTHFUL KNOWLEDGE BACKBONE (SCHEMA V2.1.0)
 *
 * Generated and hardened during Truth Over Score Pass.
 * Authoritative source representing current codebase truth and approved product intent.
 */

export const MASTER_FLOW_NODES = ${JSON.stringify(updatedNodes, null, 2)};

export const MASTER_FLOW_EDGES = ${JSON.stringify(updatedEdges, null, 2)};
`;

fs.writeFileSync(graphDataPath, fileContent, 'utf-8');
console.log(`Successfully updated masterFlowGraphData.js with domain predicates and explicit state machines.`);
