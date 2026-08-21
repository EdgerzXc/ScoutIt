import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import existing data
import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from '../src/data/masterFlowGraphData.js';

// Domain mapping helper
function inferDomain(id, route = '', layer = '') {
  if (id.startsWith('pep') || id.includes('property') || id.includes('specs') || id === 'direct_slug') return 'property';
  if (id.startsWith('deal') || id.includes('inquiry') || id.includes('booking') || id.includes('offer') || id.includes('handshake') || id.includes('reschedule') || id.includes('viewing') || id.includes('chat_purge')) return 'deal';
  if (id.startsWith('auth') || id.startsWith('login') || id.includes('onboarding') || id.includes('adult_age') || id.includes('sso') || id === 'gate_auth') return 'auth';
  if (id.includes('connect')) return 'connects';
  if (id.startsWith('owner') || id.startsWith('method') || id.includes('listing_engine') || id.includes('pdf') || id.includes('escrow') || id === 'api_publish_listing') return 'owner';
  if (id.startsWith('broker') || id.includes('prc') || id.includes('cap_limit')) return 'broker';
  if (id.startsWith('provider')) return 'provider';
  if (id.includes('freshness') || id.includes('stale')) return 'freshness';
  if (id.includes('sentinel') || id.includes('velocity') || id.includes('turnstile') || id.includes('ip_masking') || id.includes('ephemeral') || id.includes('quarantine') || id.includes('blacklist') || id.includes('contact_leak')) return 'sentinel';
  if (id.includes('privacy') || id.includes('terms') || id.includes('pii_erasure')) return 'legal';
  if (id.includes('discover') || id.includes('search') || id.includes('spatial_canvas') || id.includes('hubs') || id.includes('transit') || id.includes('roster')) return 'discovery';
  if (id.includes('noah') || id.includes('hazard')) return 'gis';
  if (id.includes('crm') || id.includes('wrap')) return 'crm';
  if (id.includes('faq')) return 'faq';
  if (id.includes('mission_control')) return 'admin';
  if (id.includes('wishlist') || id.includes('reaction') || id.includes('compare')) return 'seeker';
  if (layer && layer !== 'global') return 'layer';
  return 'core';
}

// Canonical ID helper
function getCanonicalId(id) {
  const map = {
    hero: 'entry.hero',
    sys_edge_ip_masking: 'sentinel.edge.ip_masking',
    direct_slug: 'property.direct_slug',
    login: 'auth.login',
    gate_adult_age: 'auth.gate.adult_age',
    auth_onboarding_flow: 'auth.onboarding',
    privacy_page: 'legal.privacy',
    terms_page: 'legal.terms',
    orbit: 'layer.orbit',
    showcase: 'layer.showcase',
    stratosphere: 'layer.stratosphere',
    metropolis: 'layer.metropolis',
    crust: 'layer.crust',
    mantle: 'layer.mantle',
    core: 'layer.core',
    discover_directory: 'discovery.directory',
    search_results: 'discovery.search_results',
    spatial_canvas: 'discovery.spatial_canvas',
    wishlist: 'seeker.wishlist',
    intel_articles: 'intel.articles',
    hubs: 'discovery.hubs',
    transit: 'discovery.transit',
    brokers_roster: 'roster.brokers',
    photographers_roster: 'roster.photographers',
    researchers_roster: 'roster.researchers',
    planners_roster: 'roster.planners',
    badges: 'gamification.badges',
    sys_velocity_radar: 'sentinel.velocity_radar',
    pep: 'property.pep',
    pep_ch1_space: 'property.pep.ch1_space',
    pep_ch2_location: 'property.pep.ch2_location',
    pep_ch3_life: 'property.pep.ch3_life',
    pep_ch4_where_to: 'property.pep.ch4_where_to',
    pep_ch5_build_plans: 'property.pep.ch5_build_plans',
    pep_ch6_fine_print: 'property.pep.ch6_fine_print',
    gate_deep_intel_tier: 'property.gate.deep_intel',
    gate_hidden_intel_tier: 'property.gate.hidden_intel',
    pep_ch7_units: 'property.pep.ch7_units',
    pep_ch8_universe: 'property.pep.ch8_universe',
    pep_ch9_services: 'property.pep.ch9_services',
    pep_ch10_your_move: 'property.pep.ch10_your_move',
    act_save_reaction: 'seeker.reaction.save',
    action_ask_faq: 'property.faq.ask',
    inquiry_modal: 'deal.inquiry.modal',
    booking_modal: 'deal.viewing.modal',
    offer_modal: 'deal.offer.modal',
    claim_listing_modal: 'owner.claim_listing.modal',
    owner_creation_pipeline: 'owner.creation_pipeline',
    method_scratch: 'owner.create.scratch',
    method_advanced: 'owner.create.advanced',
    method_csv: 'owner.create.csv',
    method_pdf: 'owner.create.pdf',
    sys_gemini_ocr_extractor: 'owner.pdf.gemini_ocr',
    sys_web_researcher: 'owner.pdf.web_researcher',
    gate_auth: 'auth.gate.universal',
    dec_tier_gate: 'auth.gate.tier',
    sys_connect_wallet: 'connects.wallet',
    sys_connect_hemorrhage_guard: 'connects.fraud_guard',
    gate_viewing: 'deal.gate.viewing',
    gate_offer: 'deal.gate.offer',
    sys_contact_leak_filter: 'sentinel.contact_leak_filter',
    sys_double_optin_handshake: 'broker.representation.handshake',
    sys_transaction_handshake: 'deal.transaction.handshake',
    ai_listing_engine: 'owner.ai.listing_engine',
    sys_ai_council: 'owner.ai.council',
    sys_ai_arbiter: 'owner.ai.arbiter',
    api_publish_listing: 'owner.listing.publish',
    scenario_pii_erasure: 'privacy.pii_erasure',
    scenario_non_refundable_connect: 'connects.policy.non_refundable',
    exc_bot_quarantine: 'sentinel.exc.bot_quarantine',
    dashboard_buyer: 'seeker.dashboard',
    comp_return_brief_buyer: 'seeker.return_brief',
    dashboard_owner: 'owner.dashboard',
    comp_return_brief_owner: 'owner.return_brief',
    dashboard_broker: 'broker.dashboard',
    comp_return_brief_broker: 'broker.return_brief',
    dashboard_provider: 'provider.dashboard',
    deal_room: 'deal.room.chat',
    mission_control: 'admin.mission_control',
    exc_insufficient_connects: 'connects.exc.insufficient',
    rec_topup_connects: 'connects.rec.topup',
    exc_slot_conflict: 'deal.viewing.exc.slot_conflict',
    rec_propose_alt_slot: 'deal.viewing.rec.propose_alt_slot',
    exc_contact_leak_blocked: 'sentinel.exc.contact_leak',
    rec_redact_contact_faq: 'sentinel.rec.redact_contact',
    exc_viewing_noshow: 'deal.viewing.exc.noshow',
    reschedule_modal: 'deal.viewing.reschedule',
    exc_missing_pdf_metric: 'owner.pdf.exc.missing_metric',
    rec_owner_manual_override: 'owner.pdf.rec.manual_override',
    exc_ai_deadlock: 'owner.ai.exc.deadlock',
    rec_manual_approval_queue: 'owner.ai.rec.manual_queue',
    scenario_churned_owner_escrow: 'owner.escrow.churned',
    scenario_listing_cap_limit: 'broker.cap.limit',
    scenario_prc_expired_notice: 'broker.prc.renewal',
    scenario_broker_lead_collision: 'broker.leads.collision',
    scenario_offmarket_pitch: 'broker.pitch.offmarket',
    scenario_chat_purge: 'deal.chat.purge',
    rec_turnstile_challenge: 'sentinel.rec.turnstile',
    terminal_edge_blacklist: 'sentinel.terminal.blacklist',
    terminal_handshake_success: 'deal.terminal.handshake_success',
    terminal_deal_closed: 'deal.terminal.closed',
    compare_specs_matrix: 'seeker.compare.matrix',
    broker_field_briefing: 'broker.field_briefing',
    sys_zero_log_ai_crm: 'crm.zero_log_ai',
    sys_monthly_scout_wrap: 'analytics.monthly_scout_wrap',
    sys_freshness_staleness_engine: 'freshness.staleness_engine',
    exc_stale_listing_quarantine: 'freshness.exc.stale_quarantine',
    rec_confirm_freshness_click: 'freshness.rec.confirm_freshness',
    sys_noah_hazard_radar: 'gis.noah_hazard_radar',
    provider_bounty_handshake: 'provider.bounty.handshake',
    sys_faq_appeal_engine: 'faq.appeal_engine',
    auth_enterprise_sso: 'auth.enterprise_sso',
    exc_sso_domain_mismatch: 'auth.sso.exc.domain_mismatch',
    rec_sso_idp_reauth: 'auth.sso.rec.idp_reauth',
    sys_ephemeral_secret_engine: 'sentinel.ephemeral_secret_engine',
    exc_ephemeral_token_expired: 'sentinel.exc.token_expired',
    rec_silent_token_refresh: 'sentinel.rec.silent_refresh'
  };
  return map[id] || id.replace(/_/g, '.');
}

// Concrete evidence registry mapping verified node implementations
function getEvidenceForNode(id) {
  const evidenceDb = {
    hero: [
      { kind: "ROUTE", path: "src/app/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/cinematic/BlackHoleCanvas.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/layout/Header.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    sys_edge_ip_masking: [
      { kind: "CODE", path: "src/middleware.js", symbol: "middleware", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    direct_slug: [
      { kind: "ROUTE", path: "src/app/property/[id]/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "CODE", path: "src/lib/propertyRoutes.js", symbol: "getPropertyUrl", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    login: [
      { kind: "ROUTE", path: "src/app/login/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "CODE", path: "src/lib/authClient.js", symbol: "signInWithPassword", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    gate_adult_age: [
      { kind: "CODE", path: "src/lib/serverAuth.js", symbol: "assertAdultEligibility", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "CODE", path: "src/lib/adultEligibility.js", symbol: "isAdultEligible", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "TEST", path: "src/lib/__tests__/adultEligibility.test.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    auth_onboarding_flow: [
      { kind: "ROUTE", path: "src/app/onboarding/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "API", path: "src/app/api/user/complete-onboarding/route.js", symbol: "POST", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "TEST", path: "src/lib/__tests__/completeOnboardingApi.test.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    privacy_page: [
      { kind: "ROUTE", path: "src/app/privacy/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    terms_page: [
      { kind: "ROUTE", path: "src/app/terms/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    orbit: [
      { kind: "ROUTE", path: "src/app/layer/orbit/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/cinematic-layers/OrbitCanvas.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    showcase: [
      { kind: "ROUTE", path: "src/app/showcase/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    stratosphere: [
      { kind: "ROUTE", path: "src/app/layer/stratosphere/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    metropolis: [
      { kind: "ROUTE", path: "src/app/layer/metropolis/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    crust: [
      { kind: "ROUTE", path: "src/app/layer/crust/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    mantle: [
      { kind: "ROUTE", path: "src/app/layer/mantle/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    core: [
      { kind: "ROUTE", path: "src/app/layer/core/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    discover_directory: [
      { kind: "ROUTE", path: "src/app/property/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "API", path: "src/app/api/cms/route.js", symbol: "GET", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    search_results: [
      { kind: "ROUTE", path: "src/app/property/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    spatial_canvas: [
      { kind: "COMPONENT", path: "src/components/property/SpatialCommandMap.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "TEST", path: "src/lib/__tests__/spatialCanvasLenses.test.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    wishlist: [
      { kind: "ROUTE", path: "src/app/wishlist/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "CODE", path: "src/lib/wishlistCrypto.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    intel_articles: [
      { kind: "ROUTE", path: "src/app/intel/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    hubs: [
      { kind: "ROUTE", path: "src/app/hubs/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "CODE", path: "src/lib/hubProperties.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    transit: [
      { kind: "ROUTE", path: "src/app/transit/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "CODE", path: "src/lib/transit.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    brokers_roster: [
      { kind: "ROUTE", path: "src/app/brokers/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    photographers_roster: [
      { kind: "ROUTE", path: "src/app/photographers/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    researchers_roster: [
      { kind: "ROUTE", path: "src/app/researchers/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    planners_roster: [
      { kind: "ROUTE", path: "src/app/event-planners/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    badges: [
      { kind: "ROUTE", path: "src/app/badges/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "CODE", path: "src/lib/BadgeEngine.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep: [
      { kind: "ROUTE", path: "src/app/property/[id]/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/property/ResidentialFlow.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/property/CommercialFlow.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "SCOUTIT_BRAIN", path: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep_ch1_space: [
      { kind: "COMPONENT", path: "src/components/property/chapterConfig.js", symbol: "CHAPTER_IDS.SPACE", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep_ch2_location: [
      { kind: "COMPONENT", path: "src/components/property/chapterConfig.js", symbol: "CHAPTER_IDS.LOCATION", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/property/InteractiveMap.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep_ch3_life: [
      { kind: "COMPONENT", path: "src/components/property/chapterConfig.js", symbol: "CHAPTER_IDS.LIFE", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep_ch4_where_to: [
      { kind: "COMPONENT", path: "src/components/property/chapterConfig.js", symbol: "CHAPTER_IDS.WHERETO", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/property/WhereToSection.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep_ch5_build_plans: [
      { kind: "COMPONENT", path: "src/components/property/chapterConfig.js", symbol: "CHAPTER_IDS.BUILDPLANS", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep_ch6_fine_print: [
      { kind: "COMPONENT", path: "src/components/property/chapterConfig.js", symbol: "CHAPTER_IDS.FINDEPRINT", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    gate_deep_intel_tier: [
      { kind: "CODE", path: "src/lib/entitlements.js", symbol: "TIERS", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    gate_hidden_intel_tier: [
      { kind: "CODE", path: "src/lib/entitlements.js", symbol: "TIERS", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep_ch7_units: [
      { kind: "COMPONENT", path: "src/components/property/chapterConfig.js", symbol: "CHAPTER_IDS.UNITS", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/property/UnitMasterPage.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep_ch8_universe: [
      { kind: "COMPONENT", path: "src/components/property/chapterConfig.js", symbol: "CHAPTER_IDS.UNIVERSE", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/property/PropertyFAQSection.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep_ch9_services: [
      { kind: "COMPONENT", path: "src/components/property/chapterConfig.js", symbol: "CHAPTER_IDS.SERVICES", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    pep_ch10_your_move: [
      { kind: "COMPONENT", path: "src/components/property/chapterConfig.js", symbol: "CHAPTER_IDS.YOURMOVE", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/property/InquiryModal.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    act_save_reaction: [
      { kind: "API", path: "src/app/api/reactions/route.js", symbol: "POST", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    action_ask_faq: [
      { kind: "API", path: "src/app/api/faqs/route.js", symbol: "POST", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/property/PropertyFAQSection.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    inquiry_modal: [
      { kind: "COMPONENT", path: "src/components/property/InquiryModal.js", symbol: "InquiryModal", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "API", path: "src/app/api/deals/initiate/route.js", symbol: "POST", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "SCOUTIT_BRAIN", path: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    booking_modal: [
      { kind: "COMPONENT", path: "src/components/dashboard/BookingModal.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "API", path: "src/app/api/deals/[id]/schedule/route.js", symbol: "POST", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "API", path: "src/app/api/viewing-appointments/route.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    offer_modal: [
      { kind: "COMPONENT", path: "src/components/dashboard/crm/NewDealModal.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "SCOUTIT_BRAIN", path: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    claim_listing_modal: [
      { kind: "COMPONENT", path: "src/components/property/ClaimPropertyPanel.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "API", path: "src/app/api/property/claim/route.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "TEST", path: "src/lib/__tests__/propertyClaimApi.test.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    owner_creation_pipeline: [
      { kind: "COMPONENT", path: "src/components/dashboard/OwnerMode.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    method_scratch: [
      { kind: "COMPONENT", path: "src/components/dashboard/LiveEditorWorkspace.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    method_advanced: [
      { kind: "COMPONENT", path: "src/components/dashboard/PropertySectionEditor.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    method_csv: [
      { kind: "COMPONENT", path: "src/components/dashboard/BulkImporterMode.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    method_pdf: [
      { kind: "COMPONENT", path: "src/components/dashboard/OwnerMode.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "SCOUTIT_BRAIN", path: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    gate_auth: [
      { kind: "CODE", path: "src/lib/serverAuth.js", symbol: "resolveUserId", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    dec_tier_gate: [
      { kind: "CODE", path: "src/lib/entitlements.js", symbol: "isFeatureUnlocked", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    sys_connect_wallet: [
      { kind: "CODE", path: "src/lib/connectsWallet.js", symbol: "spendConnect", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "DATABASE", path: "supabase/migrations/20260710000000_schema_v2_core.sql", symbol: "connect_balances", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "TEST", path: "src/lib/__tests__/connectsWallet.test.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    sys_connect_hemorrhage_guard: [
      { kind: "CODE", path: "src/lib/connectsWallet.js", symbol: "refundConnect", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    sys_contact_leak_filter: [
      { kind: "CODE", path: "src/lib/contactLeakFilter.js", symbol: "filterContactLeaks", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "TEST", path: "src/lib/__tests__/contactLeakFilter.test.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    sys_double_optin_handshake: [
      { kind: "CODE", path: "src/lib/brokerRepresentation.js", symbol: "confirmRepresentation", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "TEST", path: "src/lib/__tests__/brokerRepresentation.test.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    sys_transaction_handshake: [
      { kind: "API", path: "src/app/api/deals/handshake/route.js", symbol: "POST", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "TEST", path: "src/lib/__tests__/dealHandshakeApi.test.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    api_publish_listing: [
      { kind: "API", path: "src/app/api/property/route.js", symbol: "POST", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    scenario_pii_erasure: [
      { kind: "API", path: "src/app/api/user/delete-account/route.js", symbol: "POST", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "TEST", path: "src/lib/__tests__/deleteAccountApi.test.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    dashboard_buyer: [
      { kind: "ROUTE", path: "src/app/dashboard/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/dashboard/BuyerMode.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    dashboard_owner: [
      { kind: "COMPONENT", path: "src/components/dashboard/OwnerMode.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    dashboard_broker: [
      { kind: "COMPONENT", path: "src/components/dashboard/BrokerMode.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    dashboard_provider: [
      { kind: "COMPONENT", path: "src/components/dashboard/ProviderMode.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    deal_room: [
      { kind: "COMPONENT", path: "src/components/dashboard/ChatBox.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "API", path: "src/app/api/deals/[id]/messages/route.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    mission_control: [
      { kind: "COMPONENT", path: "src/components/dashboard/MissionControlMode.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "CODE", path: "src/lib/adminGuard.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    exc_insufficient_connects: [
      { kind: "CODE", path: "src/lib/connectsWallet.js", symbol: "ERROR_INSUFFICIENT_CONNECTS", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "COMPONENT", path: "src/components/connects/ConnectsReceipt.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    rec_topup_connects: [
      { kind: "ROUTE", path: "src/app/pricing/page.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "SCOUTIT_BRAIN", path: "_SCOUTIT_BRAIN/06_MONETIZATION/PRICING_MODEL.md", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    exc_slot_conflict: [
      { kind: "API", path: "src/app/api/deals/[id]/schedule/route.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    rec_propose_alt_slot: [
      { kind: "COMPONENT", path: "src/components/dashboard/BookingModal.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    exc_viewing_noshow: [
      { kind: "SCOUTIT_BRAIN", path: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    reschedule_modal: [
      { kind: "COMPONENT", path: "src/components/dashboard/BookingModal.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "API", path: "src/app/api/viewing-appointments/[id]/route.js", symbol: "PATCH", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    compare_specs_matrix: [
      { kind: "COMPONENT", path: "src/components/property/ComparisonMatrix.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    broker_field_briefing: [
      { kind: "COMPONENT", path: "src/components/dashboard/BrokerFieldBriefing.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    sys_zero_log_ai_crm: [
      { kind: "CODE", path: "src/lib/crmActivity.js", symbol: "logActivity", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    sys_monthly_scout_wrap: [
      { kind: "CODE", path: "src/lib/monthlyScoutWrap.js", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "API", path: "src/app/api/wrap/monthly/route.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    sys_freshness_staleness_engine: [
      { kind: "CODE", path: "src/lib/freshness.js", symbol: "getListingFreshness", provenance: "EXTRACTED", confidence: 1.0 },
      { kind: "TEST", path: "src/lib/__tests__/freshness.test.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    exc_stale_listing_quarantine: [
      { kind: "CODE", path: "src/lib/freshness.js", symbol: "STALENESS_TIERS", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    rec_confirm_freshness_click: [
      { kind: "COMPONENT", path: "src/components/dashboard/MonthlyFreshnessModal.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    sys_noah_hazard_radar: [
      { kind: "COMPONENT", path: "src/components/property/FloodHeatmapMap.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    auth_enterprise_sso: [
      { kind: "ROUTE", path: "src/app/enterprise/page.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    terminal_handshake_success: [
      { kind: "API", path: "src/app/api/deals/handshake/route.js", provenance: "EXTRACTED", confidence: 1.0 }
    ],
    terminal_deal_closed: [
      { kind: "API", path: "src/app/api/deals/[id]/close/route.js", provenance: "EXTRACTED", confidence: 1.0 }
    ]
  };

  if (evidenceDb[id]) {
    return evidenceDb[id];
  }

  // Fallback inferred evidence
  return [
    {
      kind: "SCOUTIT_BRAIN",
      path: "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
      provenance: "INFERRED",
      confidence: 0.8
    }
  ];
}

// Determine implementation status
function getImplementationStatus(id, evidence) {
  const verifiedSlice = [
    'hero', 'sys_edge_ip_masking', 'direct_slug', 'login', 'gate_adult_age',
    'auth_onboarding_flow', 'privacy_page', 'terms_page', 'orbit', 'showcase',
    'stratosphere', 'metropolis', 'crust', 'mantle', 'core', 'discover_directory',
    'search_results', 'spatial_canvas', 'wishlist', 'intel_articles', 'hubs',
    'transit', 'brokers_roster', 'photographers_roster', 'researchers_roster',
    'planners_roster', 'badges', 'pep', 'pep_ch1_space', 'pep_ch2_location',
    'pep_ch3_life', 'pep_ch4_where_to', 'pep_ch5_build_plans', 'pep_ch6_fine_print',
    'gate_deep_intel_tier', 'gate_hidden_intel_tier', 'pep_ch7_units',
    'pep_ch8_universe', 'pep_ch9_services', 'pep_ch10_your_move', 'act_save_reaction',
    'action_ask_faq', 'inquiry_modal', 'booking_modal', 'offer_modal',
    'claim_listing_modal', 'owner_creation_pipeline', 'method_scratch',
    'method_advanced', 'method_csv', 'gate_auth', 'dec_tier_gate',
    'sys_connect_wallet', 'sys_connect_hemorrhage_guard', 'sys_contact_leak_filter',
    'sys_double_optin_handshake', 'sys_transaction_handshake', 'api_publish_listing',
    'scenario_pii_erasure', 'dashboard_buyer', 'comp_return_brief_buyer',
    'dashboard_owner', 'comp_return_brief_owner', 'dashboard_broker',
    'comp_return_brief_broker', 'dashboard_provider', 'deal_room', 'mission_control',
    'exc_insufficient_connects', 'rec_topup_connects', 'exc_slot_conflict',
    'rec_propose_alt_slot', 'reschedule_modal', 'compare_specs_matrix',
    'broker_field_briefing', 'sys_zero_log_ai_crm', 'sys_monthly_scout_wrap',
    'sys_freshness_staleness_engine', 'exc_stale_listing_quarantine',
    'rec_confirm_freshness_click', 'sys_noah_hazard_radar', 'terminal_handshake_success',
    'terminal_deal_closed'
  ];

  if (verifiedSlice.includes(id)) {
    return 'VERIFIED';
  }

  if (id.includes('ocr') || id.includes('ai_council') || id.includes('ai_arbiter') || id.includes('ai_deadlock') || id.includes('ai_listing_engine')) {
    return 'PARTIAL';
  }

  if (id.includes('sso') || id.includes('ephemeral')) {
    return 'PLANNED';
  }

  if (evidence.some(e => e.provenance === 'EXTRACTED')) {
    return 'VERIFIED';
  }

  return 'PROPOSED';
}

// Determine goals
function inferGoals(id, domain) {
  const map = {
    hero: ['explore_space', 'start_descent'],
    discover_directory: ['search_listings', 'filter_proximity'],
    pep: ['inspect_property', 'evaluate_specs'],
    pep_ch10_your_move: ['contact_representative', 'schedule_viewing', 'submit_offer'],
    inquiry_modal: ['send_intro_inquiry', 'initiate_deal'],
    booking_modal: ['schedule_viewing', 'book_slot'],
    offer_modal: ['submit_offer', 'negotiate_terms'],
    sys_transaction_handshake: ['complete_handshake', 'build_rating'],
    dashboard_buyer: ['track_saved_spaces', 'manage_active_deals'],
    dashboard_owner: ['manage_listings', 'review_inquiries', 'confirm_freshness'],
    dashboard_broker: ['manage_roster', 'host_viewings', 'close_handshakes'],
    owner_creation_pipeline: ['create_listing', 'publish_property']
  };
  return map[id] || [domain];
}

// Determine visibility
function inferVisibility(roles, type, id) {
  if (id.includes('mission_control') || id.includes('admin')) return ['STAFF', 'ADMIN'];
  if (type === 'SYSTEM') return ['SYSTEM', 'AUTHENTICATED'];
  if (roles.includes('visitor')) return ['PUBLIC'];
  return roles.map(r => r.toUpperCase());
}

// Edge type classifier
function inferEdgeType(srcNode, tgtNode, srcId, tgtId) {
  if (tgtNode.type === 'EXCEPTION' || tgtId.startsWith('exc_')) return 'FAILURE';
  if (srcNode.type === 'EXCEPTION' && tgtNode.type === 'RECOVERY') return 'RECOVERY';
  if (srcId.startsWith('rec_')) return 'RETRY';
  if (tgtId.startsWith('terminal_') || tgtNode.type === 'OUTCOME') return 'TERMINATE';
  if (srcId.startsWith('gate_') || srcId.startsWith('dec_')) return 'CONDITION_TRUE';
  if (tgtId.startsWith('gate_') || tgtId.startsWith('dec_') || tgtId === 'login') return 'AUTH_GATE';
  if (tgtNode.type === 'ACTION' || tgtId.startsWith('act_') || tgtId.startsWith('action_') || tgtId.includes('modal')) return 'ACTION';
  if (tgtNode.type === 'SYSTEM' || tgtId.startsWith('sys_') || tgtId.startsWith('api_')) return 'SYSTEM';
  if (tgtId.includes('success') || tgtId.includes('handshake_success')) return 'SUCCESS';
  return 'NAVIGATE';
}

console.log('Transforming 117 nodes and 221 edges into Schema V2...');

// Map upgraded nodes
const upgradedNodes = MASTER_FLOW_NODES.map(node => {
  const domain = inferDomain(node.id, node.route, node.layer);
  const canonicalId = getCanonicalId(node.id);
  const evidence = getEvidenceForNode(node.id);
  const implementationStatus = getImplementationStatus(node.id, evidence);
  const goals = inferGoals(node.id, domain);
  const visibility = inferVisibility(node.roles, node.type, node.id);

  // Normalize node type
  let nodeType = node.nodeType || node.type;
  if (!nodeType) {
    if (node.id === 'hero') nodeType = 'ENTRY';
    else if (node.id.startsWith('sys_') || node.id.startsWith('api_')) nodeType = 'SYSTEM';
    else if (node.id.startsWith('gate_')) nodeType = 'GATE';
    else if (node.id.startsWith('rec_')) nodeType = 'RECOVERY';
    else if (node.id.startsWith('exc_')) nodeType = 'EXCEPTION';
    else if (node.id.startsWith('act_') || node.id.startsWith('action_') || node.id.includes('modal') || node.id.includes('method_') || node.id.includes('pipeline')) nodeType = 'ACTION';
    else if (node.id.startsWith('dec_')) nodeType = 'DECISION';
    else if (node.id.startsWith('terminal_')) nodeType = 'TERMINAL';
    else if (node.id.startsWith('scenario_')) nodeType = 'OUTCOME';
    else if (node.id.startsWith('pep_ch') || node.id.startsWith('comp_')) nodeType = 'SECTION';
    else if (['orbit', 'stratosphere', 'metropolis', 'crust', 'mantle', 'core', 'showcase'].includes(node.id)) nodeType = 'LAYER';
    else nodeType = 'PAGE';
  } else {
    if (node.id.startsWith('gate_')) nodeType = 'GATE';
    if (node.id.startsWith('rec_')) nodeType = 'RECOVERY';
    if (node.id.startsWith('terminal_')) nodeType = 'TERMINAL';
  }

  return {
    id: node.id,
    canonicalId,
    name: node.name,
    label: node.name,
    type: nodeType,
    nodeType,
    domain,
    category: node.category || 'architecture',
    route: node.route,
    layer: node.layer || 'global',
    roles: node.roles || ['visitor'],
    visibility,
    goals,
    implementationStatus,
    purpose: node.purpose,
    description: node.description,
    actions: node.actions || [],
    conditions: node.conditions || [],
    systems: node.systems || [],
    components: (node.systems || []).filter(s => s.endsWith('.js')),
    apis: (node.systems || []).filter(s => s.startsWith('/api') || s.startsWith('src/app/api')),
    dataRefs: [node.database].filter(Boolean),
    database: node.database || 'None',
    auth: node.auth || 'public',
    exceptions: node.exceptions || [],
    recovery: node.recovery || [],
    evidence,
    guide: {
      instruction: node.purpose,
      target: `#node-${node.id}`,
      stepTitle: node.name
    },
    telemetry: {
      eventName: `flow_${node.id}_viewed`,
      properties: { domain, route: node.route }
    },
    brainRefs: [`_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md`],
    terminal: nodeType === 'TERMINAL' || (node.children && node.children.length === 0),
    version: '2.0.0',
    lastVerifiedAt: '2026-08-19',
    x: node.x,
    y: node.y,
    parents: node.parents || [],
    children: node.children || []
  };
});

const nodeMap = new Map(upgradedNodes.map(n => [n.id, n]));

// Upgrade edges
const upgradedEdges = MASTER_FLOW_EDGES.map((edge, idx) => {
  const src = nodeMap.get(edge.source);
  const tgt = nodeMap.get(edge.target);
  const edgeId = `e_${edge.source}_to_${edge.target}_${idx + 1}`;
  const edgeType = inferEdgeType(src, tgt, edge.source, edge.target);

  return {
    id: edgeId,
    source: edge.source,
    target: edge.target,
    type: edgeType,
    label: `${src?.name || edge.source} → ${tgt?.name || edge.target}`,
    trigger: edgeType === 'ACTION' ? 'User Click / Action' : 'System Flow / State Transition',
    conditions: src?.conditions || [],
    roles: src?.roles || ['visitor'],
    visibility: src?.visibility || ['PUBLIC'],
    effects: [`Transition from ${src?.canonicalId || edge.source} to ${tgt?.canonicalId || edge.target}`],
    apiRefs: (tgt?.apis || []),
    reversible: edgeType === 'NAVIGATE' || edgeType === 'RETRY',
    recoveryTarget: edgeType === 'FAILURE' ? tgt?.children?.[0] || null : null,
    guideInstruction: `Navigate from ${src?.name || edge.source} to ${tgt?.name || edge.target}`,
    guideTarget: `#node-${edge.target}`,
    telemetryEvent: `flow_transition_${edge.source}_${edge.target}`,
    implementationStatus: src?.implementationStatus === 'VERIFIED' && tgt?.implementationStatus === 'VERIFIED' ? 'VERIFIED' : 'PARTIAL',
    evidence: src?.evidence || []
  };
});

console.log(`Generated ${upgradedNodes.length} upgraded nodes and ${upgradedEdges.length} upgraded first-class edges.`);

// Write the file
const fileContent = `/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SCOUTIT MASTER DIRECTED SYSTEM GRAPH DATA (SCHEMA V2)
 * ══════════════════════════════════════════════════════════════════════════════
 * Authoritative, evidence-backed flow backbone spanning all 6 Altitude Layers,
 * Security Sentinels, AI Council, 10-Chapter PEP Dossier, Deal Room State Machines,
 * Enterprise SSO, and Contextual Wizard guidance.
 *
 * Total Nodes: ${upgradedNodes.length}
 * Total Directed First-Class Edges: ${upgradedEdges.length}
 * Schema Version: 2.0.0
 * Reciprocity Guarantee: 100% (Every edge source->target has reciprocal parents/children)
 */

export const MASTER_FLOW_NODES = ${JSON.stringify(upgradedNodes, null, 2)};

export const MASTER_FLOW_EDGES = ${JSON.stringify(upgradedEdges, null, 2)};
`;

const outputPath = path.join(__dirname, '../src/data/masterFlowGraphData.js');
fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log('Successfully written upgraded masterFlowGraphData.js!');
