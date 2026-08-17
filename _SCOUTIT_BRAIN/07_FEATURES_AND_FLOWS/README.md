---
section: "07_FEATURES_AND_FLOWS"
status: active
tags: [features, flows, moc, ux, scrollytelling]
updated: 2026-08-18
related: ["[[USER_FLOWS]]", "[[USER_EXPERIENCES]]", "[[SCOUTIT_SCROLLYTELLING_PROMPT]]", "[[BROKER_HANDSHAKE_CHAT]]"]
---

# ScoutIt — Features & Flows (section MOC)

User journeys, per-persona experience specs, the cinematic scrollytelling manifesto,
and the feature-level build specs (comparison tool, broker handshake chat, virtual
tours, onboarding). Start with [[USER_FLOWS]] for the plain mechanical journey, then
[[USER_EXPERIENCES]] for the fulfillment/emotional layer behind each persona.

---

## Files in this folder

- [[USER_FLOWS]] — the buyer and owner journeys: how a user moves through the
  platform, screen by screen, component by component (**active**).
- [[DASHBOARD_AND_WORKSPACE_COHESION_SPEC]] — implementation logic & definitions of done for Return Brief, Context Bridges, Workspace naming, simplified owner ingestion, broker opportunity matching, and Your Board intelligence (**locked**).
- [[USER_EXPERIENCES]] — the Council-driven, per-persona "unique & fulfilling"
  experience spec (Seeker, Owner, Broker, Photographer, Researcher, Event Designer,
  Event Planner) —
  the converged result, execute don't relitigate (**decided**).
- [[COMPARISON_TOOL_SPEC]] — side-by-side space-comparison feature spec, specs-only
  (no money shown), gated Solar+ (**draft** — plan first, build in a follow-up).
- [[SCOUTIT_SCROLLYTELLING_PROMPT]] — the master, verbatim build prompt for the UFO-click
  → molten-gold-crack homepage scrollytelling sequence (**locked** — paste-as-is spec).
- [[scrollytelling-mission-text]] — the six locked manifesto messages the scrollytelling
  build embeds at each crack node (**locked** copy).
- [[ORIGIN_STORY_SCROLLYTELLING]] — a separate, bigger full-Three.js origin-story
  scrollytelling concept (big-bang → ScoutIt → the six layers), fully designed but
  intentionally shelved (**parked** 2026-06-26).
- [[SCOUTIT_SCROLLYTELLING_PROMPT]] — a paste-into-a-fresh-session onboarding prompt for
  orienting an agent on ScoutIt and the scrollytelling branch state (**stale** — branch
  snapshot likely superseded by the master prompt above).
- [[BROKER_HANDSHAKE_CHAT]] — the Connect → Chat → Handshake → Represent feature spec:
  ephemeral chat, two-key handshake, `PROPERTY_BROKERS` linkage (**draft**, blocked on
  the Supabase reset/Auth/Realtime).
- [[VIRTUAL_TOUR_STRATEGY]] — the phased virtual-tour tech roadmap (Zillow 3D Home →
  Polycam → Luma AI → Matterport operator model) feeding the Spatial Vault (**decided**
  2026-06-27).
- [[BROKER_FIELD_BRIEFING_AND_VOICE_COPILOT_SPEC]] — mobile/PDF field briefing,
  offline-first voice copilot, and owner-intercom blueprint.
- [[LIFESTYLE_INTELLIGENCE_V2_SPEC]] — the deeper "Where To?" lifestyle and
  spatial-intelligence architecture behind the live location section.
- [[PROPERTY_FRESHNESS_AND_STALENESS_SPEC]] — listing aging, re-verification,
  stale-state, and off-market reliability rules.
- [[SPATIAL_NEWSROOM_SOCIAL_MEDIA_STRATEGY]] — the public-facing data-newsroom
  content strategy; its execution companion is
  [[SPATIAL_INTELLIGENCE_NEWSROOM_AND_OUTREACH_PLAYBOOK]].
- [[HEATMAP_DISTINCTION_AND_SPATIAL_VAULT]] — dual-heatmap architectural principle (MMC Seeker Demand Heatmap vs. Master Property Physical FLIR/Solar Thermal Heatmap) and Spatial Vault CSP fallback standards (**active**).
- [[ZERO_LOG_AI_CRM_SPEC]] — structured CRM intelligence that retains milestones
  without retaining raw private chat or audio content.
- [[SPATIAL_CANVAS_PLAN]] — the Spatial Canvas design plan for the 6-layer descent
  system and its atmospheric particle backgrounds (**active**).
- [[SPATIAL_CANVAS_BUILD_SCRIPT]] — the executable build script for the Spatial
  Canvas particle effects, orbit rings, and cosmic periphery systems (**active**).

- [[07_FEATURES_AND_FLOWS/SEO_STRATEGY/README|SEO Strategy]] - canonical search,
  structured-data, entity-graph, rollout, and validation logic curated for ScoutIt.

## Related sections

Monetization tie-ins (tiers, Connects, Vault gating) live in
[[06_MONETIZATION/README|Monetization README]] — see especially [[TIER_DISTINCTION]] and
[[VAULT_LISTING_LIFECYCLE]].

<!-- BEGIN:GENERATED_LOGIC_INDEX -->

## Complete logic index

> Generated navigation block. Keep human explanation above this marker; regenerate this block whenever files move.

- **Parent:** [[00_LOGIC_HIERARCHY|ScoutIt Logic Hierarchy]]

### Child logic folders

- [[07_FEATURES_AND_FLOWS/SEO_STRATEGY/README|SEO_STRATEGY]] - canonical SEO and structured-data logic

### Notes in this folder

- [[07_FEATURES_AND_FLOWS/00_FEATURE_INVENTORY|00_FEATURE_INVENTORY]] - 📊 FEATURE INVENTORY — what ScoutIt actually has (active)
- [[07_FEATURES_AND_FLOWS/BROKER_FIELD_BRIEFING_AND_VOICE_COPILOT_SPEC|BROKER_FIELD_BRIEFING_AND_VOICE_COPILOT_SPEC]] - ScoutIt — Broker Field Briefing, Voice Co-Pilot & Lifestyle Intelligence Blueprint (active)
- [[07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT|BROKER_HANDSHAKE_CHAT]] - Feature Spec — Connect → Chat → Handshake → Represent (draft)
- [[07_FEATURES_AND_FLOWS/COMPARISON_TOOL_SPEC|COMPARISON_TOOL_SPEC]] - ScoutIt — Comparison Tool Spec (Solar+ · Specs-Only) (draft)
- [[07_FEATURES_AND_FLOWS/CRM_INITIATIVE|CRM_INITIATIVE]] - CRM Initiative — Relationship Intelligence, Not Contact Management (active)
- [[07_FEATURES_AND_FLOWS/CRM_WORKFLOW_GRAVITY_AUTOMATIONS|CRM_WORKFLOW_GRAVITY_AUTOMATIONS]] - CRM Workflow Gravity — the concrete automations (atomic note, from Dump) (draft)
- [[07_FEATURES_AND_FLOWS/ENTERPRISE_MISSION_CONTROL_SPEC|ENTERPRISE_MISSION_CONTROL_SPEC]] - Enterprise Mission Control — hierarchy & module map (atomic note, from Dump) (draft)
- [[07_FEATURES_AND_FLOWS/FEATURE_BRIEFINGS_WHERE_TO_FAQS_SPEC|FEATURE_BRIEFINGS_WHERE_TO_FAQS_SPEC]] - ScoutIT Post-Launch Roadmap: Spatial Intelligence, Field Briefings & Community Q&A (active)
- [[07_FEATURES_AND_FLOWS/HEATMAP_DISTINCTION_AND_SPATIAL_VAULT|HEATMAP_DISTINCTION_AND_SPATIAL_VAULT]] - HEATMAP ARCHITECTURE & SPATIAL VAULT DISTINCTION (active)
- [[07_FEATURES_AND_FLOWS/HEATMAP_NOAH_INTEGRATION_PLAN|HEATMAP_NOAH_INTEGRATION_PLAN]] - Heatmap / Flood-Risk Map Layer — NOAH Integration Plan (research done, not yet built) (active)
- [[07_FEATURES_AND_FLOWS/LIFESTYLE_INTELLIGENCE_V2_SPEC|LIFESTYLE_INTELLIGENCE_V2_SPEC]] - ScoutIt — Lifestyle & Spatial Intelligence Engine ("Where To?" V2) (active)
- [[07_FEATURES_AND_FLOWS/MISSION_KANBAN_AUTOMATIONS|MISSION_KANBAN_AUTOMATIONS]] - Mission Kanban — extra automation triggers (atomic note, from Dump) (draft)
- [[07_FEATURES_AND_FLOWS/MONTHLY_SCOUT_WRAP_IMPLEMENTATION_PLAN|MONTHLY_SCOUT_WRAP_IMPLEMENTATION_PLAN]] - Monthly Scout Wrap — Property and Broker Implementation Plan (locked)
- [[07_FEATURES_AND_FLOWS/ORIGIN_STORY_SCROLLYTELLING|ORIGIN_STORY_SCROLLYTELLING]] - Origin-Story Scrollytelling — Full Spec (PARKED) (parked)
- [[07_FEATURES_AND_FLOWS/OSINT_INTEL_ARCHITECTURE|OSINT_INTEL_ARCHITECTURE]] - ScoutIt OSINT Intel & 3D Spatial Radar Master Architecture Blueprint (active)
- [[07_FEATURES_AND_FLOWS/PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS|PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS]] - Staff Permissions, Enterprise Accounts, Self-Serve Analytics, Notifications & Mission Control Foundation (active)
- [[07_FEATURES_AND_FLOWS/PROFESSIONAL_CRM_MODULE_MAP|PROFESSIONAL_CRM_MODULE_MAP]] - Professional CRM — module map by role (atomic note, from Dump) (draft)
- [[07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC|PROPERTY_FRESHNESS_AND_STALENESS_SPEC]] - 🟢 ScoutIt Property Freshness & Staleness Aging Spec (active)
- [[07_FEATURES_AND_FLOWS/SCENARIOS_AND_PLAYBOOKS|SCENARIOS_AND_PLAYBOOKS]] - ScoutIt Edge-Case Scenarios & Playbook Matrix (draft)
- [[07_FEATURES_AND_FLOWS/SCOUTIT_SCROLLYTELLING_PROMPT|SCOUTIT_SCROLLYTELLING_PROMPT]] - SCOUTIT SCROLLYTELLING — MASTER BUILD PROMPT (locked)
- [[07_FEATURES_AND_FLOWS/scrollytelling-mission-text|scrollytelling-mission-text]] - ScoutIt Scrollytelling — Mission Text (locked) (locked)
- [[07_FEATURES_AND_FLOWS/SPATIAL_INTELLIGENCE_NEWSROOM_AND_OUTREACH_PLAYBOOK|SPATIAL_INTELLIGENCE_NEWSROOM_AND_OUTREACH_PLAYBOOK]] - ScoutIt — Spatial Intelligence Newsroom & Direct Outreach Playbook (active)
- [[07_FEATURES_AND_FLOWS/SPATIAL_NEWSROOM_SOCIAL_MEDIA_STRATEGY|SPATIAL_NEWSROOM_SOCIAL_MEDIA_STRATEGY]] - ScoutIt — Spatial Intelligence Newsroom Social Media Strategy (active)
- [[07_FEATURES_AND_FLOWS/USER_EXPERIENCES|USER_EXPERIENCES]] - ScoutIT — Per-User Experience Spec (the "unique & fulfilling" build) (decided)
- [[07_FEATURES_AND_FLOWS/USER_FLOWS|USER_FLOWS]] - ScoutIt User Flows & Psychological Journey (active)
- [[07_FEATURES_AND_FLOWS/VIRTUAL_TOUR_STRATEGY|VIRTUAL_TOUR_STRATEGY]] - ScoutIt — Virtual Tour Strategy (decided)
- [[07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC|ZERO_LOG_AI_CRM_SPEC]] - 🛡️ ScoutIt Zero-Log, Intelligence-Only AI CRM Spec (active)

<!-- END:GENERATED_LOGIC_INDEX -->
