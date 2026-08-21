/**
 * SCOUTIT MASTER FLOW GRAPH — TRUTHFUL KNOWLEDGE BACKBONE (SCHEMA V2.2.0)
 *
 * Grounded and hardened against Adversarial Deep Research Audit.
 * Commit bound to: cda10372d983a2cf9bb5f3a04274364fcb1a5d43
 */

export const MASTER_FLOW_NODES = [
  {
    "id": "hero",
    "canonicalId": "entry.hero",
    "name": "Hero Landing & Space Canvas",
    "label": "Hero Landing & Space Canvas",
    "type": "ENTRY",
    "nodeType": "ENTRY",
    "domain": "core",
    "category": "architecture",
    "route": "/",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "explore_space",
      "start_descent"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Primary platform launchpad with interactive black hole canvas and 6-layer spatial descent doorways.",
    "description": "Serves as the root landing environment. Directs visitors to the 6-layer altitude descent, curated showcase leaderboard, and searchable directory.",
    "actions": [
      "Enter 6-Layer Spatial Descent",
      "Explore Space Directory",
      "Open Orbit Showcase",
      "Trigger Founding Cohort Waitlist"
    ],
    "conditions": [
      "Publicly accessible without authentication"
    ],
    "systems": [
      "src/app/page.js",
      "BlackHoleCanvas.js",
      "NavigationDoors.js"
    ],
    "components": [
      "src/app/page.js",
      "BlackHoleCanvas.js",
      "NavigationDoors.js"
    ],
    "apis": [],
    "dataRefs": [
      "None"
    ],
    "database": "None",
    "auth": "public",
    "exceptions": [
      "Lite Mode fallback if WebGL GPU unsupported"
    ],
    "recovery": [
      "Automatically activates static 2D starfield and low-bandwidth asset mode"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Serves as the root landing environment. Directs visitors to the 6-layer altitude descent, curated showcase leaderboard, and searchable directory.",
      "target": "hero-search-input",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_hero_viewed",
      "properties": {
        "domain": "core",
        "route": "/"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 80,
    "y": 300,
    "parents": [],
    "children": [
      "sys_edge_ip_masking",
      "orbit",
      "stratosphere",
      "metropolis",
      "crust",
      "mantle",
      "core",
      "showcase",
      "discover_directory",
      "spatial_canvas",
      "wishlist",
      "intel_articles",
      "hubs",
      "transit",
      "brokers_roster",
      "photographers_roster",
      "researchers_roster",
      "planners_roster",
      "badges",
      "privacy_page",
      "terms_page",
      "login"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_hero_route",
        "text": "Root route \"/\" serves the interactive Hero landing page.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/page.js",
            "confidence": 1,
            "provenance": "Verified in Next.js App Router"
          }
        ],
        "confidence": 1,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      },
      {
        "id": "claim_hero_search_entry",
        "text": "Hero component provides keyword and natural-language entry to the Discover Directory.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/hero/Hero.js",
            "symbol": "Hero",
            "confidence": 1,
            "provenance": "Verified in Hero.js"
          }
        ],
        "confidence": 1,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      },
      {
        "id": "claim_hero_public_access",
        "text": "Hero is publicly viewable by unauthenticated visitors without requiring a login session.",
        "kind": "SCOUTIT_POLICY",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "TEST",
            "path": "src/lib/__tests__/masterGraphValidation.test.js",
            "symbol": "public_access_test",
            "confidence": 1,
            "provenance": "Verified in Auth Boundary Suite"
          }
        ],
        "confidence": 1,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "sys_edge_ip_masking",
    "canonicalId": "sentinel.edge.ip_masking",
    "name": "System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge)",
    "label": "System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge)",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "sentinel",
    "category": "architecture",
    "route": "/middleware.js",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "sentinel"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Converts raw IP address into an anonymous temporary session hash (e.g. session_8f3d9a) at the Vercel Edge layer.",
    "description": "Raw IPs are never stored in the database. Staff only see masked session IDs in Mission Control, eliminating RA 10173 breach liability.",
    "actions": [
      "Convert Raw IP to Session Hash",
      "Forward Masked Session Header",
      "Stream Behavioral Telemetry"
    ],
    "conditions": [
      "Every incoming HTTP request through Vercel Edge Middleware"
    ],
    "systems": [
      "middleware.js",
      "SentinelLayer.js"
    ],
    "components": [
      "middleware.js",
      "SentinelLayer.js"
    ],
    "apis": [],
    "dataRefs": [
      "None (Stateless Edge Hash)"
    ],
    "database": "None (Stateless Edge Hash)",
    "auth": "public",
    "exceptions": [
      "None (Stateless SHA-256 computation)"
    ],
    "recovery": [
      "Pass-through anonymous session token"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/middleware.js",
        "symbol": "middleware",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_edge_ip_masking_viewed",
      "properties": {
        "domain": "sentinel",
        "route": "/middleware.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 80,
    "y": 550,
    "parents": [
      "hero"
    ],
    "children": [
      "sys_velocity_radar",
      "sys_ephemeral_secret_engine"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_edge_ip_masking_behavior",
        "text": "System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge) enforces defined sentinel behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/middleware.js",
            "symbol": "middleware",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "direct_slug",
    "canonicalId": "property.direct_slug",
    "name": "Direct Canonical Slug URL",
    "label": "Direct Canonical Slug URL",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Direct deep-link to canonical Property Experience Page (PEP) from QR codes, social shares, or search engines.",
    "description": "Resolves canonical Airtable slug and loads complete 10-chapter Property Experience Page with OpenGraph metadata.",
    "actions": [
      "Load property briefing dossier",
      "Trigger view count telemetry"
    ],
    "conditions": [
      "Valid property slug required"
    ],
    "systems": [
      "src/app/property/[id]/page.js",
      "getCmsBundle()"
    ],
    "components": [
      "src/app/property/[id]/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable Formula Slug"
    ],
    "database": "Airtable Formula Slug",
    "auth": "public",
    "exceptions": [
      "404 Not Found if slug does not exist",
      "Historical 308 redirect if legacy slug changed"
    ],
    "recovery": [
      "Redirects to /property directory with trending property suggestion if slug is invalid"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/propertyRoutes.js",
        "symbol": "getPropertyUrl",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_direct_slug_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 80,
    "y": 850,
    "parents": [],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_direct_slug_behavior",
        "text": "Direct Canonical Slug URL enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/property/[id]/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "CODE",
            "path": "src/lib/propertyRoutes.js",
            "symbol": "getPropertyUrl",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "login",
    "canonicalId": "auth.login",
    "name": "Supabase Identity & Auth Portal",
    "label": "Supabase Identity & Auth Portal",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "auth",
    "category": "architecture",
    "route": "/login",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "auth"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Universal authentication gate providing Magic Link OTP, Google OAuth, and password login.",
    "description": "Authenticates users into Supabase Auth (`auth.users`) and verifies whether new-user onboarding has been completed.",
    "actions": [
      "Submit Email for OTP",
      "Sign in with Google OAuth",
      "Verify Adult Age Gate"
    ],
    "conditions": [
      "Valid email or OAuth provider account"
    ],
    "systems": [
      "src/app/auth/login/page.js",
      "supabase.auth.signInWithOtp()"
    ],
    "components": [
      "src/app/auth/login/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase auth.users & user_profiles"
    ],
    "database": "Supabase auth.users & user_profiles",
    "auth": "public",
    "exceptions": [
      "Expired OTP token",
      "Rate limit exceeded (Too many OTP requests)"
    ],
    "recovery": [
      "Prompt for OTP resend with 60s cooldown timer"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/login/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/authClient.js",
        "symbol": "signInWithPassword",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_login_viewed",
      "properties": {
        "domain": "auth",
        "route": "/auth/login"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 80,
    "y": 1200,
    "parents": [
      "hero"
    ],
    "children": [
      "gate_adult_age",
      "dashboard_buyer",
      "dashboard_owner",
      "dashboard_broker",
      "dashboard_provider",
      "mission_control",
      "auth_enterprise_sso",
      "sys_ephemeral_secret_engine"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_login_behavior",
        "text": "Supabase Identity & Auth Portal enforces defined auth behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/login/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "CODE",
            "path": "src/lib/authClient.js",
            "symbol": "signInWithPassword",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "CRITICAL",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "routeType": "REDIRECT_ALIAS",
    "redirectTo": "/onboarding",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "gate_adult_age",
    "canonicalId": "auth.gate.adult_age",
    "name": "Decision Gate: Adult Eligibility Check (NPC Circular 2024-03)",
    "label": "Decision Gate: Adult Eligibility Check (NPC Circular 2024-03)",
    "type": "GATE",
    "nodeType": "GATE",
    "domain": "auth",
    "category": "architecture",
    "route": "/api/user/verify-age",
    "layer": "global",
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "auth"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Server calculates age from private Date of Birth; rejects applicants under 18 years old.",
    "description": "Enforces NPC Circular 2024-03 minors protection protocol. The UI never asks for raw age; calculations occur server-side.",
    "actions": [
      "Calculate Age from Private DoB",
      "Verify >= 18 Years Threshold"
    ],
    "conditions": [
      "Authenticated Supabase user submitting onboarding profile"
    ],
    "systems": [
      "adultEligibility.js",
      "/api/user/complete-onboarding"
    ],
    "components": [
      "adultEligibility.js"
    ],
    "apis": [
      "/api/user/complete-onboarding"
    ],
    "dataRefs": [
      "Supabase user_profiles.dob"
    ],
    "database": "Supabase user_profiles.dob",
    "auth": "seeker",
    "exceptions": [
      "Applicant under 18 years old"
    ],
    "recovery": [
      "Reject registration with statutory compliance notice under Philippine Law"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/serverAuth.js",
        "symbol": "assertAdultEligibility",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/adultEligibility.js",
        "symbol": "isAdultEligible",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/adultEligibility.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_gate_adult_age_viewed",
      "properties": {
        "domain": "auth",
        "route": "/api/user/verify-age"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 80,
    "y": 1450,
    "parents": [
      "login"
    ],
    "children": [
      "auth_onboarding_flow"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_gate_adult_age_behavior",
        "text": "Decision Gate: Adult Eligibility Check (NPC Circular 2024-03) enforces defined auth behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/serverAuth.js",
            "symbol": "assertAdultEligibility",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "CODE",
            "path": "src/lib/adultEligibility.js",
            "symbol": "isAdultEligible",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "TEST",
            "path": "src/lib/__tests__/adultEligibility.test.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "CRITICAL",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "auth_onboarding_flow",
    "canonicalId": "auth.onboarding",
    "name": "New-User Onboarding & Role Workspace Selection",
    "label": "New-User Onboarding & Role Workspace Selection",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "auth",
    "category": "architecture",
    "route": "/onboarding",
    "layer": "global",
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "auth"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Flow 0: Profile setup, primary workspace role assignment, and initial Connects wallet provisioning.",
    "description": "Captures full name, private date of birth, optional scouting location, and initial primary role (Seeker, Owner, Broker, Provider). Provisions initial Connect balance.",
    "actions": [
      "Confirm Full Name & DoB",
      "Select Primary Workspace Role",
      "Submit PRC Claim if Broker",
      "Provision Connects Wallet"
    ],
    "conditions": [
      "Authenticated Supabase session without onboarding_completed_at"
    ],
    "systems": [
      "src/app/onboarding/page.js",
      "/api/user/complete-onboarding"
    ],
    "components": [
      "src/app/onboarding/page.js"
    ],
    "apis": [
      "/api/user/complete-onboarding"
    ],
    "dataRefs": [
      "Supabase user_profiles & connect_balances"
    ],
    "database": "Supabase user_profiles & connect_balances",
    "auth": "seeker",
    "exceptions": [
      "Underage applicant rejection",
      "Invalid PRC format"
    ],
    "recovery": [
      "Display clear validation guidance; allow safe retry of onboarding form"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/onboarding/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/user/complete-onboarding/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/completeOnboardingApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_auth_onboarding_flow_viewed",
      "properties": {
        "domain": "auth",
        "route": "/onboarding"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 80,
    "y": 1700,
    "parents": [
      "gate_adult_age"
    ],
    "children": [
      "dashboard_buyer",
      "dashboard_owner",
      "dashboard_broker",
      "dashboard_provider"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_auth_onboarding_flow_behavior",
        "text": "New-User Onboarding & Role Workspace Selection enforces defined auth behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/onboarding/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "API",
            "path": "src/app/api/user/complete-onboarding/route.js",
            "symbol": "POST",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "TEST",
            "path": "src/lib/__tests__/completeOnboardingApi.test.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "CRITICAL",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "privacy_page",
    "canonicalId": "legal.privacy",
    "name": "Privacy & Data Protection Policy (RA 10173)",
    "label": "Privacy & Data Protection Policy (RA 10173)",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "legal",
    "category": "architecture",
    "route": "/privacy",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "legal"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Data Privacy Act (RA 10173) compliance disclosure detailing on-device Ledger privacy, PII handling, and DPO rights.",
    "description": "Explains ScoutIt's Zero-Trace local wishlist, session telemetry, and the PII-Detachment protocol for right to erasure.",
    "actions": [
      "Review Data Processing Principles",
      "Submit DPO Data Subject Request"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/privacy/page.js"
    ],
    "components": [
      "src/app/privacy/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Static Compliance Text"
    ],
    "database": "Static Compliance Text",
    "auth": "public",
    "exceptions": [
      "None"
    ],
    "recovery": [
      "Standard customer support route"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/privacy/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_privacy_page_viewed",
      "properties": {
        "domain": "legal",
        "route": "/privacy"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/16_LEGAL_AND_COMPLIANCE/LEGAL_DOCUMENTATION_COMPLIANCE_MASTER_BLUEPRINT.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 80,
    "y": 2000,
    "parents": [
      "hero"
    ],
    "children": [],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_privacy_page_behavior",
        "text": "Privacy & Data Protection Policy (RA 10173) enforces defined legal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/privacy/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Legal & Compliance Team",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "terms_page",
    "canonicalId": "legal.terms",
    "name": "Platform Terms & RESA RA 9646 Compliance",
    "label": "Platform Terms & RESA RA 9646 Compliance",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "legal",
    "category": "architecture",
    "route": "/terms",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "legal"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Legal terms establishing ScoutIt as an Intelligence & Display Platform operating under Real Estate Service Act RA 9646.",
    "description": "Explicitly details broker representation rules, Connects non-refundable purchase terms, and intellectual property.",
    "actions": [
      "Review RESA RA 9646 Statement",
      "Inspect Connects Spend Terms"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/terms/page.js"
    ],
    "components": [
      "src/app/terms/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Static Compliance Text"
    ],
    "database": "Static Compliance Text",
    "auth": "public",
    "exceptions": [
      "None"
    ],
    "recovery": [
      "Standard customer support route"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/terms/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_terms_page_viewed",
      "properties": {
        "domain": "legal",
        "route": "/terms"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/16_LEGAL_AND_COMPLIANCE/LEGAL_DOCUMENTATION_COMPLIANCE_MASTER_BLUEPRINT.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 80,
    "y": 2250,
    "parents": [
      "hero"
    ],
    "children": [],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_terms_page_behavior",
        "text": "Platform Terms & RESA RA 9646 Compliance enforces defined legal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/terms/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Legal & Compliance Team",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "orbit",
    "canonicalId": "layer.orbit",
    "name": "Layer 01 — Orbit (The Board)",
    "label": "Layer 01 — Orbit (The Board)",
    "type": "LAYER",
    "nodeType": "LAYER",
    "domain": "layer",
    "category": "architecture",
    "route": "/layer/orbit",
    "layer": "orbit",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Highest altitude layer: cosmic macro demand rankings, planetary orbital tracks, and the curated Showcase.",
    "description": "Displays Metro Manila top-ranked spaces ranked by earned demand velocity and spatial intelligence merit.",
    "actions": [
      "Switch category view",
      "Select ranked property podium",
      "Launch Showcase HUD stage"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/layer/orbit/page.js",
      "BackgroundOrbit.js"
    ],
    "components": [
      "src/app/layer/orbit/page.js",
      "BackgroundOrbit.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Asset loading timeout on slow 3G"
    ],
    "recovery": [
      "Graceful degradation to static vector orbit paths"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/orbit/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic-layers/OrbitCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_orbit_viewed",
      "properties": {
        "domain": "layer",
        "route": "/layer/orbit"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 100,
    "parents": [
      "hero"
    ],
    "children": [
      "showcase",
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_orbit_behavior",
        "text": "Layer 01 — Orbit (The Board) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/layer/orbit/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/cinematic-layers/OrbitCanvas.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "showcase",
    "canonicalId": "layer.showcase",
    "name": "The Showcase Leaderboard (HUD Stage)",
    "label": "The Showcase Leaderboard (HUD Stage)",
    "type": "LAYER",
    "nodeType": "LAYER",
    "domain": "layer",
    "category": "architecture",
    "route": "/showcase",
    "layer": "orbit",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Curated 3-column spatial exhibition ranking top spaces by earned demand velocity and spatial merit.",
    "description": "Desktop 3-column HUD: Left panel = Inquiry Velocity & Key Numbers; Center = 16:9 verified media; Right panel = Showcase Distinction & Merits.",
    "actions": [
      "Inspect Demand Standing",
      "Review Inquiry Momentum",
      "Click Explore Full Briefing →"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "ShowcaseStage.js",
      "BoardPodium.js",
      "mockShowcase.js"
    ],
    "components": [
      "ShowcaseStage.js",
      "BoardPodium.js",
      "mockShowcase.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Missing property 4K video asset"
    ],
    "recovery": [
      "Fall back to high-resolution verified hero photo carousel"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/showcase/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_showcase_viewed",
      "properties": {
        "domain": "layer",
        "route": "/showcase"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 350,
    "parents": [
      "hero",
      "orbit"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_showcase_behavior",
        "text": "The Showcase Leaderboard (HUD Stage) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/showcase/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "stratosphere",
    "canonicalId": "layer.stratosphere",
    "name": "Layer 02 — Stratosphere (Intel & Atmosphere)",
    "label": "Layer 02 — Stratosphere (Intel & Atmosphere)",
    "type": "LAYER",
    "nodeType": "LAYER",
    "domain": "layer",
    "category": "architecture",
    "route": "/layer/stratosphere",
    "layer": "stratosphere",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Regional macro atmosphere: climate patterns, regional economic drivers, and transport flight corridors.",
    "description": "Presents macro-level market intelligence, infrastructure corridors, and spatial growth vectors across Philippine regions.",
    "actions": [
      "Filter by Economic Corridor",
      "Inspect Regional Climate Risk",
      "Read Spatial Intel Briefings"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/layer/stratosphere/page.js"
    ],
    "components": [
      "src/app/layer/stratosphere/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable INTEL_CMS"
    ],
    "database": "Airtable INTEL_CMS",
    "auth": "public",
    "exceptions": [
      "Airtable CMS API rate limit"
    ],
    "recovery": [
      "Serve cached ISR/SWR regional snapshot"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/stratosphere/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_stratosphere_viewed",
      "properties": {
        "domain": "layer",
        "route": "/layer/stratosphere"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 600,
    "parents": [
      "hero"
    ],
    "children": [
      "intel_articles",
      "hubs",
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_stratosphere_behavior",
        "text": "Layer 02 — Stratosphere (Intel & Atmosphere) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/layer/stratosphere/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "metropolis",
    "canonicalId": "layer.metropolis",
    "name": "Layer 03 — Metropolis (District Clusters)",
    "label": "Layer 03 — Metropolis (District Clusters)",
    "type": "LAYER",
    "nodeType": "LAYER",
    "domain": "layer",
    "category": "architecture",
    "route": "/layer/metropolis",
    "layer": "metropolis",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Urban district clusters: skyline vantage points, commercial district density, and arterial transit flow.",
    "description": "Focuses on CBD density (BGC, Makati, Ortigas, Alabang), transit hubs, and commercial cluster connectivity.",
    "actions": [
      "Filter by CBD Node",
      "Toggle Commercial Density Heatmap",
      "Inspect Transit Hub Proximity"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/layer/metropolis/page.js"
    ],
    "components": [
      "src/app/layer/metropolis/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "District polygon rendering bottleneck"
    ],
    "recovery": [
      "Reduce vector LOD on low-spec mobile devices"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/metropolis/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_metropolis_viewed",
      "properties": {
        "domain": "layer",
        "route": "/layer/metropolis"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 850,
    "parents": [
      "hero"
    ],
    "children": [
      "discover_directory",
      "spatial_canvas",
      "transit",
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_metropolis_behavior",
        "text": "Layer 03 — Metropolis (District Clusters) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/layer/metropolis/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "crust",
    "canonicalId": "layer.crust",
    "name": "Layer 04 — Crust (Neighborhood Reality)",
    "label": "Layer 04 — Crust (Neighborhood Reality)",
    "type": "LAYER",
    "nodeType": "LAYER",
    "domain": "layer",
    "category": "architecture",
    "route": "/layer/crust",
    "layer": "crust",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Street-level walkability, local foot traffic, community vibe, elevation, and NOAH flood risk layers.",
    "description": "Street-level intelligence grounding properties in their immediate physical reality, walkability score, and flood safety.",
    "actions": [
      "Toggle NOAH Flood Overlay",
      "Inspect Walk Score",
      "Explore Micro-Vibe Anchors"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/layer/crust/page.js",
      "NoahFloodLayer.js"
    ],
    "components": [
      "src/app/layer/crust/page.js",
      "NoahFloodLayer.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "NOAH API temporary outage"
    ],
    "recovery": [
      "Fall back to cached historical elevation and flood risk classification"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/crust/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_crust_viewed",
      "properties": {
        "domain": "layer",
        "route": "/layer/crust"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 1100,
    "parents": [
      "hero"
    ],
    "children": [
      "discover_directory",
      "brokers_roster",
      "photographers_roster",
      "researchers_roster",
      "planners_roster",
      "badges",
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_crust_behavior",
        "text": "Layer 04 — Crust (Neighborhood Reality) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/layer/crust/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "mantle",
    "canonicalId": "layer.mantle",
    "name": "Layer 05 — Mantle (Architectural Blueprints)",
    "label": "Layer 05 — Mantle (Architectural Blueprints)",
    "type": "LAYER",
    "nodeType": "LAYER",
    "domain": "layer",
    "category": "architecture",
    "route": "/layer/mantle",
    "layer": "mantle",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Architectural blueprints, building engineering, facade materials, MEP load, and shared facilities.",
    "description": "Deep structural view examining building materials, ceiling heights, floor load capacity, and architectural provenance.",
    "actions": [
      "Inspect Floor Plates",
      "Review Developer Provenance",
      "Check MEP / Electrical Load"
    ],
    "conditions": [
      "Publicly accessible; detailed MEP requires Solar+"
    ],
    "systems": [
      "src/app/layer/mantle/page.js"
    ],
    "components": [
      "src/app/layer/mantle/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Missing CAD/blueprint metadata"
    ],
    "recovery": [
      "Display Honest Blank placeholder with request-briefing action"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/mantle/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_mantle_viewed",
      "properties": {
        "domain": "layer",
        "route": "/layer/mantle"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 1350,
    "parents": [
      "hero"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_mantle_behavior",
        "text": "Layer 05 — Mantle (Architectural Blueprints) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/layer/mantle/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "core",
    "canonicalId": "layer.core",
    "name": "Layer 06 — Core (Private Unit Level)",
    "label": "Layer 06 — Core (Private Unit Level)",
    "type": "LAYER",
    "nodeType": "LAYER",
    "domain": "layer",
    "category": "architecture",
    "route": "/layer/core",
    "layer": "core",
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER",
      "ENTERPRISE"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Deepest altitude: 3D Spatial Vault, verified transaction ledgers, unit inventory, and private deal room.",
    "description": "Sub-surface level containing unit-specific floor plans, cap rate modeling, Matterport 360 scans, and deal negotiation cockpits.",
    "actions": [
      "Open 3D Spatial Vault",
      "Inspect Unit Inventory Grid",
      "Launch Deal Cockpit"
    ],
    "conditions": [
      "Requires authentication; 3D Vault requires Cluster+"
    ],
    "systems": [
      "src/app/layer/core/page.js",
      "SpatialVaultWidget.js"
    ],
    "components": [
      "src/app/layer/core/page.js",
      "SpatialVaultWidget.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties & units_inventory"
    ],
    "database": "Supabase properties & units_inventory",
    "auth": "seeker",
    "exceptions": [
      "Unauthorized free tier viewing locked 3D Vault"
    ],
    "recovery": [
      "Show blurred preview with 'Unlock with Verified Scout' CTA"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/core/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_core_viewed",
      "properties": {
        "domain": "layer",
        "route": "/layer/core"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 1600,
    "parents": [
      "hero",
      "dec_tier_gate"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER",
      "ENTERPRISE"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_core_behavior",
        "text": "Layer 06 — Core (Private Unit Level) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/layer/core/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "discover_directory",
    "canonicalId": "discovery.directory",
    "name": "Space Directory & Radius Radar",
    "label": "Space Directory & Radius Radar",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "discovery",
    "category": "architecture",
    "route": "/discover",
    "layer": "metropolis",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "search_listings",
      "filter_proximity"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Main searchable spatial directory with category filters, Mapbox geocoding, and Haversine distance Radar.",
    "description": "Fetches live Airtable properties via `/api/cms/route.js`. Allows filtering across 6 space categories and geographic radius.",
    "actions": [
      "Select Space Category",
      "Set Search Radius Radar",
      "Toggle Price/Sqm Sort",
      "Apply Life-Here Filters"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/property/page.js",
      "src/app/api/cms/route.js",
      "RadiusRadar.js"
    ],
    "components": [
      "src/app/property/page.js",
      "src/app/api/cms/route.js",
      "RadiusRadar.js"
    ],
    "apis": [
      "src/app/api/cms/route.js"
    ],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Geocoding normalization failure"
    ],
    "recovery": [
      "Fall back to text-based city/district matching"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/cms/route.js",
        "symbol": "GET",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Fetches live Airtable properties via `/api/cms/route.js`. Allows filtering across 6 space categories and geographic radius.",
      "target": "discover_directory",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_discover_directory_viewed",
      "properties": {
        "domain": "discovery",
        "route": "/property"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 1850,
    "parents": [
      "rec_turnstile_challenge",
      "hero",
      "metropolis",
      "crust"
    ],
    "children": [
      "search_results",
      "wishlist",
      "compare_specs_matrix",
      "sys_noah_hazard_radar"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_discover_directory_behavior",
        "text": "Space Directory & Radius Radar enforces defined discovery behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/property/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "API",
            "path": "src/app/api/cms/route.js",
            "symbol": "GET",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "routeType": "EXACT_MATCH",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "search_results",
    "canonicalId": "discovery.search_results",
    "name": "Search Results & Curated Discovery Grid",
    "label": "Search Results & Curated Discovery Grid",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "discovery",
    "category": "architecture",
    "route": "/property?view=grid",
    "layer": "metropolis",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "discovery"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Filtered results view displaying space cards with verified media, pricing signals, and distance metrics.",
    "description": "Dynamic result grid linking matching spaces directly to their individual Property Experience Pages.",
    "actions": [
      "Click Space Card",
      "Bookmark to Wishlist",
      "Adjust Active Filter Pills"
    ],
    "conditions": [
      "Directory query active"
    ],
    "systems": [
      "PropertyGrid.js",
      "PropertyCard.js"
    ],
    "components": [
      "PropertyGrid.js",
      "PropertyCard.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Zero matching properties found for query"
    ],
    "recovery": [
      "Display Honest Blank: suggest expanding radius or removing category filters"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Dynamic result grid linking matching spaces directly to their individual Property Experience Pages.",
      "target": "search_results-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_search_results_viewed",
      "properties": {
        "domain": "discovery",
        "route": "/property?view=grid"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 2050,
    "parents": [
      "discover_directory"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_search_results_behavior",
        "text": "Search Results & Curated Discovery Grid enforces defined discovery behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/property/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "spatial_canvas",
    "canonicalId": "discovery.spatial_canvas",
    "name": "Spatial Canvas (2D/3D Infinite Map)",
    "label": "Spatial Canvas (2D/3D Infinite Map)",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "discovery",
    "category": "architecture",
    "route": "/spatial-canvas",
    "layer": "metropolis",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "discovery"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Interactive spatial canvas plotting properties as geographic intelligence nodes across the archipelago.",
    "description": "Pan-and-zoom spatial interface with cluster markers, live inquiry pins, and district boundary overlays.",
    "actions": [
      "Pan & Zoom Archipelago Canvas",
      "Click Cluster Pin",
      "Preview Quick Space Card"
    ],
    "conditions": [
      "WebGL supported"
    ],
    "systems": [
      "src/app/spatial-canvas/page.js",
      "Mapbox GL / Leaflet"
    ],
    "components": [
      "src/app/spatial-canvas/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "WebGL context lost"
    ],
    "recovery": [
      "Restore Mapbox context or switch to 2D Leaflet mode"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/SpatialCommandMap.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/spatialCanvasLenses.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Pan-and-zoom spatial interface with cluster markers, live inquiry pins, and district boundary overlays.",
      "target": "spatial_canvas-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_spatial_canvas_viewed",
      "properties": {
        "domain": "discovery",
        "route": "/spatial-canvas"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 2250,
    "parents": [
      "hero",
      "metropolis"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_spatial_canvas_behavior",
        "text": "Spatial Canvas (2D/3D Infinite Map) enforces defined discovery behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/SpatialCommandMap.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "TEST",
            "path": "src/lib/__tests__/spatialCanvasLenses.test.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "wishlist",
    "canonicalId": "seeker.wishlist",
    "name": "The Ledger (Private Wishlist)",
    "label": "The Ledger (Private Wishlist)",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "seeker",
    "category": "architecture",
    "route": "/wishlist",
    "layer": "core",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "seeker"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Private on-device wishlist with 4 emotion/decision tags (Potential Fit, Interested, Inspired Me, Save).",
    "description": "Stores reactions in local `localStorage` without requiring an account. Authenticated users can explicitly merge into Supabase `saved_intel`.",
    "actions": [
      "Filter by Reaction Tag",
      "Export Wishlist PDF Briefing",
      "Explicitly Merge into Cloud Account"
    ],
    "conditions": [
      "Works anonymously on device or authenticated with Supabase"
    ],
    "systems": [
      "src/app/wishlist/page.js",
      "localStorage('scoutit_reactions')",
      "saved_intel table"
    ],
    "components": [
      "src/app/wishlist/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "LocalStorage / Supabase saved_intel"
    ],
    "database": "LocalStorage / Supabase saved_intel",
    "auth": "public",
    "exceptions": [
      "Local storage quota exceeded or cleared"
    ],
    "recovery": [
      "Prompt user to log in and sync to cloud Supabase storage"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/wishlist/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/wishlistCrypto.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Stores reactions in local `localStorage` without requiring an account. Authenticated users can explicitly merge into Supabase `saved_intel`.",
      "target": "wishlist-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_wishlist_viewed",
      "properties": {
        "domain": "seeker",
        "route": "/wishlist"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 2450,
    "parents": [
      "hero",
      "discover_directory",
      "act_save_reaction"
    ],
    "children": [
      "pep",
      "dashboard_buyer"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_wishlist_behavior",
        "text": "The Ledger (Private Wishlist) enforces defined seeker behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/wishlist/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "CODE",
            "path": "src/lib/wishlistCrypto.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "intel_articles",
    "canonicalId": "intel.articles",
    "name": "Spatial Intelligence Newsroom & Briefings",
    "label": "Spatial Intelligence Newsroom & Briefings",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "layer",
    "category": "architecture",
    "route": "/intel",
    "layer": "stratosphere",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Editorial briefings, spatial trend analysis, district evolution reports, and market signals.",
    "description": "Data-dense articles examining real estate yield shifts, zoning transformations, and lifestyle migration trends.",
    "actions": [
      "Read District Briefing",
      "Bookmark Article to Saved Intel",
      "Share Research Report"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/intel/page.js",
      "src/app/api/cms/route.js"
    ],
    "components": [
      "src/app/intel/page.js",
      "src/app/api/cms/route.js"
    ],
    "apis": [
      "src/app/api/cms/route.js"
    ],
    "dataRefs": [
      "Airtable INTEL_CMS"
    ],
    "database": "Airtable INTEL_CMS",
    "auth": "public",
    "exceptions": [
      "Article missing author attribution"
    ],
    "recovery": [
      "Display ScoutIt Editorial Board credit"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/intel/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Data-dense articles examining real estate yield shifts, zoning transformations, and lifestyle migration trends.",
      "target": "intel_articles-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_intel_articles_viewed",
      "properties": {
        "domain": "layer",
        "route": "/intel"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 2650,
    "parents": [
      "hero",
      "stratosphere"
    ],
    "children": [],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_intel_articles_behavior",
        "text": "Spatial Intelligence Newsroom & Briefings enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/intel/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "hubs",
    "canonicalId": "discovery.hubs",
    "name": "Regional Transport & Location Hubs",
    "label": "Regional Transport & Location Hubs",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "discovery",
    "category": "architecture",
    "route": "/hubs",
    "layer": "stratosphere",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "discovery"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Macro directory of transport hubs, airport corridors, seaport logistics zones, and intermodal terminals.",
    "description": "Catalogs major Philippine transit anchors and indexes spaces within commuter catchment zones.",
    "actions": [
      "Filter Properties by Transit Hub",
      "Inspect Commuter Catchment Radius"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/hubs/page.js"
    ],
    "components": [
      "src/app/hubs/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable HUBS_CMS"
    ],
    "database": "Airtable HUBS_CMS",
    "auth": "public",
    "exceptions": [
      "Hub transit timetable unavailable"
    ],
    "recovery": [
      "Display estimated peak vs off-peak commute bands"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/hubs/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/hubProperties.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Catalogs major Philippine transit anchors and indexes spaces within commuter catchment zones.",
      "target": "hubs-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_hubs_viewed",
      "properties": {
        "domain": "discovery",
        "route": "/hubs"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 2850,
    "parents": [
      "hero",
      "stratosphere"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_hubs_behavior",
        "text": "Regional Transport & Location Hubs enforces defined discovery behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/hubs/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "CODE",
            "path": "src/lib/hubProperties.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "transit",
    "canonicalId": "discovery.transit",
    "name": "Arterial Transit Corridors & LRT/MRT Lines",
    "label": "Arterial Transit Corridors & LRT/MRT Lines",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "discovery",
    "category": "architecture",
    "route": "/transit",
    "layer": "metropolis",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "discovery"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Interactive transit route explorer indexing MRT-3, LRT-1/2, Subway, and Skyway access nodes.",
    "description": "Maps properties along mass transit corridors with station walk times and arterial highway connections.",
    "actions": [
      "Select Transit Line",
      "Inspect Station Walking Isochrone",
      "Filter Near-Transit Spaces"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/transit/page.js"
    ],
    "components": [
      "src/app/transit/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Station entrance coordinates missing"
    ],
    "recovery": [
      "Mapbox geocoding falls back to station centroid"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/transit/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/transit.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Maps properties along mass transit corridors with station walk times and arterial highway connections.",
      "target": "transit-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_transit_viewed",
      "properties": {
        "domain": "discovery",
        "route": "/transit"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 3050,
    "parents": [
      "hero",
      "metropolis"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_transit_behavior",
        "text": "Arterial Transit Corridors & LRT/MRT Lines enforces defined discovery behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/transit/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "CODE",
            "path": "src/lib/transit.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "brokers_roster",
    "canonicalId": "roster.brokers",
    "name": "Verified Licensed Brokers Directory",
    "label": "Verified Licensed Brokers Directory",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "broker",
    "category": "architecture",
    "route": "/brokers",
    "layer": "crust",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "broker"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Public directory of licensed PRC real estate brokers with Scout Rating scores, active representation, and specialties.",
    "description": "Presents verified broker profiles with RESA RA 9646 license numbers, completed transaction handshake counts, and territory focus.",
    "actions": [
      "Search Broker by District",
      "Inspect Scout Rating & Deals",
      "Send Representation Pitch or Inquiry"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/brokers/page.js",
      "src/app/api/cms/route.js"
    ],
    "components": [
      "src/app/brokers/page.js",
      "src/app/api/cms/route.js"
    ],
    "apis": [
      "src/app/api/cms/route.js"
    ],
    "dataRefs": [
      "Airtable BROKERS_CMS"
    ],
    "database": "Airtable BROKERS_CMS",
    "auth": "public",
    "exceptions": [
      "Broker has expired PRC license (>30 days)"
    ],
    "recovery": [
      "Unverified badge displayed; representation pitches temporarily restricted"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/brokers/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Presents verified broker profiles with RESA RA 9646 license numbers, completed transaction handshake counts, and territory focus.",
      "target": "brokers_roster-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_brokers_roster_viewed",
      "properties": {
        "domain": "broker",
        "route": "/brokers"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 3250,
    "parents": [
      "hero",
      "crust"
    ],
    "children": [
      "pep",
      "dashboard_broker"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_brokers_roster_behavior",
        "text": "Verified Licensed Brokers Directory enforces defined broker behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/brokers/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.represent_client"
    ],
    "resourceRelationship": [
      "ASSIGNED_BROKER"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": true,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "photographers_roster",
    "canonicalId": "roster.photographers",
    "name": "Architectural & Drone Media Directory",
    "label": "Architectural & Drone Media Directory",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "discovery",
    "category": "architecture",
    "route": "/photographers",
    "layer": "crust",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "discovery"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Directory of verified architectural photographers, drone pilots, and Matterport 3D scan creators.",
    "description": "Connects owners and brokers with approved spatial media creators for 4K video reels and Spatial Vault capture.",
    "actions": [
      "View Photographer Portfolio",
      "Send Booking Request",
      "Review Drone Credentials"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/photographers/page.js"
    ],
    "components": [
      "src/app/photographers/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable CREATORS_CMS"
    ],
    "database": "Airtable CREATORS_CMS",
    "auth": "public",
    "exceptions": [
      "Provider unavailable in target province"
    ],
    "recovery": [
      "Suggest remote QuestIT bounty creation for traveling researchers"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/photographers/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Connects owners and brokers with approved spatial media creators for 4K video reels and Spatial Vault capture.",
      "target": "photographers_roster-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_photographers_roster_viewed",
      "properties": {
        "domain": "discovery",
        "route": "/photographers"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 3450,
    "parents": [
      "hero",
      "crust",
      "provider_bounty_handshake"
    ],
    "children": [
      "dashboard_provider"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_photographers_roster_behavior",
        "text": "Architectural & Drone Media Directory enforces defined discovery behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/photographers/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "researchers_roster",
    "canonicalId": "roster.researchers",
    "name": "Spatial Researchers & Bounty Workforce",
    "label": "Spatial Researchers & Bounty Workforce",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "discovery",
    "category": "architecture",
    "route": "/researchers",
    "layer": "crust",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "discovery"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Network of on-the-ground researchers and urban planners available for QuestIT spatial bounties.",
    "description": "Specialists who verify title status, foot traffic counts, zoning clearances, and local neighborhood dynamics.",
    "actions": [
      "Hire Researcher for Custom Bounty",
      "Inspect Completed Due Diligence Records"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/researchers/page.js"
    ],
    "components": [
      "src/app/researchers/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable CREATORS_CMS"
    ],
    "database": "Airtable CREATORS_CMS",
    "auth": "public",
    "exceptions": [
      "Bounty brief underspecified"
    ],
    "recovery": [
      "Trigger ScoutIt Bounty Scoping Template"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/researchers/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Specialists who verify title status, foot traffic counts, zoning clearances, and local neighborhood dynamics.",
      "target": "researchers_roster-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_researchers_roster_viewed",
      "properties": {
        "domain": "discovery",
        "route": "/researchers"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 3650,
    "parents": [
      "hero",
      "crust"
    ],
    "children": [
      "dashboard_provider"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_researchers_roster_behavior",
        "text": "Spatial Researchers & Bounty Workforce enforces defined discovery behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/researchers/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "planners_roster",
    "canonicalId": "roster.planners",
    "name": "Event Designers & Venue Curators",
    "label": "Event Designers & Venue Curators",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "discovery",
    "category": "architecture",
    "route": "/planners",
    "layer": "crust",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "discovery"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Specialist directory of venue spatial planners, acoustic designers, and hospitality experience creators.",
    "description": "Curated professionals for commercial fit-outs, restaurant concepts, and large-scale event production.",
    "actions": [
      "Explore Venue Fit-Out Case Studies",
      "Request Spatial Consultation"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/planners/page.js"
    ],
    "components": [
      "src/app/planners/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable CREATORS_CMS"
    ],
    "database": "Airtable CREATORS_CMS",
    "auth": "public",
    "exceptions": [
      "Venue capacity mismatch"
    ],
    "recovery": [
      "Re-filter by Production Capacity chapter parameters"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/event-planners/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Curated professionals for commercial fit-outs, restaurant concepts, and large-scale event production.",
      "target": "planners_roster-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_planners_roster_viewed",
      "properties": {
        "domain": "discovery",
        "route": "/planners"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 3850,
    "parents": [
      "hero",
      "crust"
    ],
    "children": [
      "dashboard_provider"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_planners_roster_behavior",
        "text": "Event Designers & Venue Curators enforces defined discovery behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/event-planners/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "badges",
    "canonicalId": "gamification.badges",
    "name": "Trust & Verification Badges Standard",
    "label": "Trust & Verification Badges Standard",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "layer",
    "category": "architecture",
    "route": "/badges",
    "layer": "crust",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Official documentation of ScoutIt's 4-tier verification protocol (Identity, PRC License, Title Authority, 3D Vault).",
    "description": "Details the verification standards that earn properties and brokers their gold shield badges.",
    "actions": [
      "Inspect Verification Requirements",
      "Submit Verification Documents"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "src/app/badges/page.js"
    ],
    "components": [
      "src/app/badges/page.js"
    ],
    "apis": [],
    "dataRefs": [
      "Static Documentation"
    ],
    "database": "Static Documentation",
    "auth": "public",
    "exceptions": [
      "Forged title document detected"
    ],
    "recovery": [
      "Permanent listing suspension and referral to Trust & Safety"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/badges/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/BadgeEngine.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Details the verification standards that earn properties and brokers their gold shield badges.",
      "target": "badges-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_badges_viewed",
      "properties": {
        "domain": "layer",
        "route": "/badges"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 4050,
    "parents": [
      "hero",
      "crust"
    ],
    "children": [],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_badges_behavior",
        "text": "Trust & Verification Badges Standard enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/badges/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "CODE",
            "path": "src/lib/BadgeEngine.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "sys_velocity_radar",
    "canonicalId": "sentinel.velocity_radar",
    "name": "System: Sentinel Velocity Radar & Trajectory Detection",
    "label": "System: Sentinel Velocity Radar & Trajectory Detection",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "sentinel",
    "category": "architecture",
    "route": "/lib/sentinel/velocityRadar.js",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "sentinel"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Monitors session request velocity (e.g. 50 properties in 60s), scraping trajectories, and 404 directory scanning.",
    "description": "Behavioral telemetry engine protecting Airtable 5 req/s CMS limits and Mapbox geocoding budgets without tracking raw identity.",
    "actions": [
      "Evaluate Request Velocity",
      "Analyze Access Trajectory",
      "Flag Automated Scraping Patterns"
    ],
    "conditions": [
      "Active session stream"
    ],
    "systems": [
      "velocityRadar.js",
      "SentinelLayer.js"
    ],
    "components": [
      "velocityRadar.js",
      "SentinelLayer.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase analytics_events"
    ],
    "database": "Supabase analytics_events",
    "auth": "public",
    "exceptions": [
      "Non-human scraper signature detected"
    ],
    "recovery": [
      "Trigger Automated Quarantine & Turnstile CAPTCHA Interception"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_velocity_radar_viewed",
      "properties": {
        "domain": "sentinel",
        "route": "/lib/sentinel/velocityRadar.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 750,
    "y": 4250,
    "parents": [
      "sys_edge_ip_masking"
    ],
    "children": [
      "exc_bot_quarantine"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_velocity_radar_behavior",
        "text": "System: Sentinel Velocity Radar & Trajectory Detection enforces defined sentinel behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "pep",
    "canonicalId": "property.pep",
    "name": "Property Experience Page (PEP)",
    "label": "Property Experience Page (PEP)",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "property",
    "category": "architecture",
    "route": "/property",
    "layer": "core",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "inspect_property",
      "evaluate_specs"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Canonical property master dossier rendering the 10-chapter registry reframed across 6 space categories.",
    "description": "High-altitude to unit-level briefing presenting verified photos, location transit, life/workday profile, build plans, unit inventory, and action cockpit.",
    "actions": [
      "Scroll 10 Chapter Registry",
      "Inspect 3D Spatial Vault",
      "Open Unit Floor Plan",
      "Trigger Your Move Action"
    ],
    "conditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "systems": [
      "src/app/property/[id]/page.js",
      "chapterConfig.js",
      "ResidentialFlow.js",
      "CommercialFlow.js"
    ],
    "components": [
      "src/app/property/[id]/page.js",
      "chapterConfig.js",
      "ResidentialFlow.js",
      "CommercialFlow.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS & Supabase units_inventory"
    ],
    "database": "Airtable PROPERTIES_CMS & Supabase units_inventory",
    "auth": "public",
    "exceptions": [
      "Slug belongs to withdrawn/off-market property"
    ],
    "recovery": [
      "Check viewer tier: allow if Cluster/Universe Seeker and 'Quietly open to offers'; else show Listing Removed marker"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "High-altitude to unit-level briefing presenting verified photos, location transit, life/workday profile, build plans, unit inventory, and action cockpit.",
      "target": "property-detail-container",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_pep_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 1100,
    "parents": [
      "direct_slug",
      "orbit",
      "showcase",
      "stratosphere",
      "metropolis",
      "crust",
      "mantle",
      "core",
      "search_results",
      "spatial_canvas",
      "wishlist",
      "hubs",
      "transit",
      "brokers_roster",
      "sys_contact_leak_filter",
      "api_publish_listing",
      "sys_double_optin_handshake",
      "scenario_offmarket_pitch",
      "scenario_pii_erasure",
      "compare_specs_matrix",
      "sys_freshness_staleness_engine",
      "rec_confirm_freshness_click"
    ],
    "children": [
      "pep_ch1_space",
      "pep_ch2_location",
      "pep_ch3_life",
      "pep_ch4_where_to",
      "pep_ch5_build_plans",
      "pep_ch6_fine_print",
      "pep_ch7_units",
      "pep_ch8_universe",
      "pep_ch9_services",
      "pep_ch10_your_move",
      "scenario_churned_owner_escrow",
      "compare_specs_matrix",
      "broker_field_briefing"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_behavior",
        "text": "Property Experience Page (PEP) enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/property/[id]/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/property/ResidentialFlow.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/property/CommercialFlow.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "routeType": "EXACT_MATCH",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "pep_ch1_space",
    "canonicalId": "property.pep.ch1_space",
    "name": "Chapter 01 — The Space / Floor Plate / Capacity",
    "label": "Chapter 01 — The Space / Floor Plate / Capacity",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]#the-space",
    "layer": "core",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Primary physical dimensions: sqm, bedrooms/baths, floor plate, kitchen grade, or production capacity.",
    "description": "Reframed per category: Residential (The Space), Commercial (The Floor Plate), STR (The Stay), Hospitality (The Grounds), Restaurant (Kitchen & Dining Room), Venue (Production Capacity).",
    "actions": [
      "Inspect Usable Floor Area",
      "Review Ceiling Height",
      "Check Kitchen / Floor Load Specs"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "TheSpaceChapter.js",
      "CategorySpecBlock.js"
    ],
    "components": [
      "TheSpaceChapter.js",
      "CategorySpecBlock.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Missing floor area metric"
    ],
    "recovery": [
      "Honest Blank Rule: field rendered blank with verification queue ticket"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.SPACE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_pep_ch1_space_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]#the-space"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 150,
    "parents": [
      "pep"
    ],
    "children": [],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_ch1_space_behavior",
        "text": "Chapter 01 — The Space / Floor Plate / Capacity enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/chapterConfig.js",
            "symbol": "CHAPTER_IDS.SPACE",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "pep_ch2_location",
    "canonicalId": "property.pep.ch2_location",
    "name": "Chapter 02 — Location & Transit Logistics",
    "label": "Chapter 02 — Location & Transit Logistics",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]#location",
    "layer": "crust",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Commute times, transit arterial access, airport transfer quality, delivery access, and valet drop-off.",
    "description": "Interactive Leaflet map displaying transit nodes, highway connectivity, and walking distance to primary CBD anchors.",
    "actions": [
      "Inspect CBD Drive Times",
      "Check Nearest Transit Station",
      "View Airport Logistics Route"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "LocationChapter.js",
      "LeafletMap.js"
    ],
    "components": [
      "LocationChapter.js",
      "LeafletMap.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Mapbox coordinate normalization failure"
    ],
    "recovery": [
      "Fallback to static district overview map"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.LOCATION",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InteractiveMap.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_pep_ch2_location_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]#location"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 350,
    "parents": [
      "pep",
      "sys_noah_hazard_radar"
    ],
    "children": [
      "sys_noah_hazard_radar"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_ch2_location_behavior",
        "text": "Chapter 02 — Location & Transit Logistics enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/chapterConfig.js",
            "symbol": "CHAPTER_IDS.LOCATION",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/property/InteractiveMap.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "pep_ch3_life",
    "canonicalId": "property.pep.ch3_life",
    "name": "Chapter 03 — Life Here / Workday / Atmosphere",
    "label": "Chapter 03 — Life Here / Workday / Atmosphere",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]#life-here",
    "layer": "core",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Experience-led chapter: acoustic profile, noise floor, natural light orientation, safety, and community vibe.",
    "description": "Captures what it actually feels like to exist in the space day-to-day. Reframed per category (e.g. Workday for Commercial, Vibe for Restaurants).",
    "actions": [
      "Check Noise Floor decibels",
      "Inspect Sun Path Orientation",
      "Review Safety & Security Rating"
    ],
    "conditions": [
      "Basic specs public; deep comfort/noise metrics require Solar+"
    ],
    "systems": [
      "LifeHereChapter.js"
    ],
    "components": [
      "LifeHereChapter.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Missing acoustic decibel rating"
    ],
    "recovery": [
      "Displays qualitative neighborhood vibe tag"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.LIFE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_pep_ch3_life_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]#life-here"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 550,
    "parents": [
      "pep"
    ],
    "children": [],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_ch3_life_behavior",
        "text": "Chapter 03 — Life Here / Workday / Atmosphere enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/chapterConfig.js",
            "symbol": "CHAPTER_IDS.LIFE",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "pep_ch4_where_to",
    "canonicalId": "property.pep.ch4_where_to",
    "name": "Chapter 04 — Where To? (The Neighborhood Radius)",
    "label": "Chapter 04 — Where To? (The Neighborhood Radius)",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]#where-to",
    "layer": "crust",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Curated points of interest within 500m-2km: coffee, schools, hospitals, banks, and demand anchors.",
    "description": "Radial map showing essential amenities and lifestyle destinations tailored to the property's category.",
    "actions": [
      "Filter POIs by Category",
      "Calculate Walking Distance to Anchor",
      "Explore Nearby Dining"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "WhereToChapter.js"
    ],
    "components": [
      "WhereToChapter.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS & OpenStreetMap POIs"
    ],
    "database": "Airtable PROPERTIES_CMS & OpenStreetMap POIs",
    "auth": "public",
    "exceptions": [
      "No POI data within 500m radius"
    ],
    "recovery": [
      "Expands search radius to 2km regional anchors"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.WHERETO",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/WhereToSection.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_pep_ch4_where_to_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]#where-to"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 750,
    "parents": [
      "pep"
    ],
    "children": [],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_ch4_where_to_behavior",
        "text": "Chapter 04 — Where To? (The Neighborhood Radius) enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/chapterConfig.js",
            "symbol": "CHAPTER_IDS.WHERETO",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/property/WhereToSection.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "pep_ch5_build_plans",
    "canonicalId": "property.pep.ch5_build_plans",
    "name": "Chapter 05 — Build Plans & Fit-Out Engineering",
    "label": "Chapter 05 — Build Plans & Fit-Out Engineering",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]#build-plans",
    "layer": "mantle",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Architectural provenance, zoning clearance, fit-out potential, electrical MEP load, and back-of-house specs.",
    "description": "Technical chapter for architects, operators, and developers. Default collapsed for restaurants/venues with 'For Operators →' toggle.",
    "actions": [
      "Review MEP / Electrical Specs",
      "Inspect Expansion Potential",
      "Check Short-Let Legality Block"
    ],
    "conditions": [
      "Basic public; detailed MEP requires Solar+"
    ],
    "systems": [
      "BuildPlansChapter.js"
    ],
    "components": [
      "BuildPlansChapter.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Zoning documentation pending verification"
    ],
    "recovery": [
      "Displays 'Under Verification by ScoutIt Council' notice"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.BUILDPLANS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_pep_ch5_build_plans_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]#build-plans"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 950,
    "parents": [
      "pep"
    ],
    "children": [],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_ch5_build_plans_behavior",
        "text": "Chapter 05 — Build Plans & Fit-Out Engineering enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/chapterConfig.js",
            "symbol": "CHAPTER_IDS.BUILDPLANS",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "pep_ch6_fine_print",
    "canonicalId": "property.pep.ch6_fine_print",
    "name": "Chapter 06 — The Fine Print (Deep & Hidden Intel)",
    "label": "Chapter 06 — The Fine Print (Deep & Hidden Intel)",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]#fine-print",
    "layer": "core",
    "roles": [
      "seeker",
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Financial intelligence: cap rate, estimated yield, transaction history, association dues, and appreciation model.",
    "description": "Deep quantitative analysis panel. Free Starry tier sees blurred values; Solar+ unlocks deep intel; Cluster+ unlocks full market panel.",
    "actions": [
      "Reveal Cap Rate & Yield Benchmark",
      "Review Association Dues Breakdown",
      "Inspect Historical Capital Growth Model"
    ],
    "conditions": [
      "Gated by canSee('deepIntel', tier) — Solar+ required"
    ],
    "systems": [
      "FinePrintChapter.js",
      "deepIntelSchema.js",
      "entitlements.js"
    ],
    "components": [
      "FinePrintChapter.js",
      "deepIntelSchema.js",
      "entitlements.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS & Supabase financial_models"
    ],
    "database": "Airtable PROPERTIES_CMS & Supabase financial_models",
    "auth": "seeker",
    "exceptions": [
      "Free tier user attempts to inspect network payload for real cap rate"
    ],
    "recovery": [
      "Server-side masking: API sends null values for un-entitled tiers (no client-side CSS-only leak)"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.FINDEPRINT",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_pep_ch6_fine_print_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]#fine-print"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 1150,
    "parents": [
      "pep",
      "dec_tier_gate"
    ],
    "children": [
      "gate_deep_intel_tier",
      "gate_hidden_intel_tier"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker",
      "enterprise"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_ch6_fine_print_behavior",
        "text": "Chapter 06 — The Fine Print (Deep & Hidden Intel) enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/chapterConfig.js",
            "symbol": "CHAPTER_IDS.FINDEPRINT",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "gate_deep_intel_tier",
    "canonicalId": "property.gate.deep_intel",
    "name": "Decision Gate: Deep Intel Tier Entitlement (Solar+)",
    "label": "Decision Gate: Deep Intel Tier Entitlement (Solar+)",
    "type": "GATE",
    "nodeType": "GATE",
    "domain": "layer",
    "category": "architecture",
    "route": "/lib/entitlements.js#deep-intel",
    "layer": "core",
    "roles": [
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Evaluates whether user has Solar+ tier to view cap rate benchmark, acoustic decibel noise floor, and association dues.",
    "description": "Un-entitled Starry users receive server-masked null values with gold blur presentation.",
    "actions": [
      "Evaluate Solar+ Entitlement",
      "Unmask Cap Rate & Dues Data"
    ],
    "conditions": [
      "subscription_tier in ['solar', 'cluster', 'universe']"
    ],
    "systems": [
      "entitlements.js",
      "FinePrintChapter.js"
    ],
    "components": [
      "entitlements.js",
      "FinePrintChapter.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase user_profiles.subscription_tier"
    ],
    "database": "Supabase user_profiles.subscription_tier",
    "auth": "seeker",
    "exceptions": [
      "Starry (₱0) user requests deep intel"
    ],
    "recovery": [
      "Render Solar tier upgrade prompt"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/entitlements.js",
        "symbol": "TIERS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_gate_deep_intel_tier_viewed",
      "properties": {
        "domain": "layer",
        "route": "/lib/entitlements.js#deep-intel"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 1250,
    "parents": [
      "pep_ch6_fine_print"
    ],
    "children": [
      "dec_tier_gate"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_gate_deep_intel_tier_behavior",
        "text": "Decision Gate: Deep Intel Tier Entitlement (Solar+) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/entitlements.js",
            "symbol": "TIERS",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "gate_hidden_intel_tier",
    "canonicalId": "property.gate.hidden_intel",
    "name": "Decision Gate: Hidden Intel & Valuation Models (Cluster+)",
    "label": "Decision Gate: Hidden Intel & Valuation Models (Cluster+)",
    "type": "GATE",
    "nodeType": "GATE",
    "domain": "layer",
    "category": "architecture",
    "route": "/lib/entitlements.js#hidden-intel",
    "layer": "core",
    "roles": [
      "seeker",
      "enterprise"
    ],
    "visibility": [
      "SEEKER",
      "ENTERPRISE"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Evaluates whether user has Cluster+ tier to view 10-year capital appreciation projection and historical transaction ledger.",
    "description": "Cluster/Universe enterprise tier unlocks proprietary quantitative valuation algorithms.",
    "actions": [
      "Evaluate Cluster+ Entitlement",
      "Unmask 10-Year Valuation Engine"
    ],
    "conditions": [
      "subscription_tier in ['cluster', 'universe']"
    ],
    "systems": [
      "entitlements.js",
      "FinePrintChapter.js"
    ],
    "components": [
      "entitlements.js",
      "FinePrintChapter.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase user_profiles.subscription_tier"
    ],
    "database": "Supabase user_profiles.subscription_tier",
    "auth": "seeker",
    "exceptions": [
      "Solar tier user requests institutional financial models"
    ],
    "recovery": [
      "Render Cluster tier upgrade prompt"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/entitlements.js",
        "symbol": "TIERS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_gate_hidden_intel_tier_viewed",
      "properties": {
        "domain": "layer",
        "route": "/lib/entitlements.js#hidden-intel"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 1300,
    "parents": [
      "pep_ch6_fine_print"
    ],
    "children": [
      "dec_tier_gate"
    ],
    "actorRoles": [
      "seeker",
      "enterprise"
    ],
    "uiAudience": [
      "SEEKER",
      "ENTERPRISE"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_gate_hidden_intel_tier_behavior",
        "text": "Decision Gate: Hidden Intel & Valuation Models (Cluster+) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/entitlements.js",
            "symbol": "TIERS",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "pep_ch7_units",
    "canonicalId": "property.pep.ch7_units",
    "name": "Chapter 07 — Units & Spaces (Inventory Grid)",
    "label": "Chapter 07 — Units & Spaces (Inventory Grid)",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]#units",
    "layer": "core",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Multi-unit inventory breakdown with floor-grouping, unit sizes, floor plan photos, and feature chips.",
    "description": "Renders real `units_inventory` JSON array from Supabase. Supports high-volume buildings with 20+ units organized by floor.",
    "actions": [
      "Filter Units by Floor",
      "Inspect Unit Floor Plan Photo",
      "Check Unit Feature Chips",
      "Inquire on Specific Unit"
    ],
    "conditions": [
      "Publicly accessible; unit photos limited to 1 for Free tier vs 5 for PRO"
    ],
    "systems": [
      "UnitsChapter.js",
      "ResidentialFlow.js",
      "CommercialFlow.js"
    ],
    "components": [
      "UnitsChapter.js",
      "ResidentialFlow.js",
      "CommercialFlow.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties.details.units_inventory & Airtable Units_JSON"
    ],
    "database": "Supabase properties.details.units_inventory & Airtable Units_JSON",
    "auth": "public",
    "exceptions": [
      "Property has 0 registered individual units"
    ],
    "recovery": [
      "Collapse chapter automatically or display whole-building single-occupancy badge"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.UNITS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/UnitMasterPage.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_pep_ch7_units_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]#units"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 1450,
    "parents": [
      "pep"
    ],
    "children": [
      "scenario_broker_lead_collision"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_ch7_units_behavior",
        "text": "Chapter 07 — Units & Spaces (Inventory Grid) enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/chapterConfig.js",
            "symbol": "CHAPTER_IDS.UNITS",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/property/UnitMasterPage.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "pep_ch8_universe",
    "canonicalId": "property.pep.ch8_universe",
    "name": "Chapter 08 — Property Universe & Developer Credentials",
    "label": "Chapter 08 — Property Universe & Developer Credentials",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]#universe",
    "layer": "orbit",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Developer track record, master-plan context, architect credentials, and associated sister properties.",
    "description": "Situates the property inside the developer's wider portfolio and master-planned township ecosystem.",
    "actions": [
      "Explore Developer Portfolio",
      "View Sister Properties",
      "Inspect Township Masterplan"
    ],
    "conditions": [
      "Publicly accessible"
    ],
    "systems": [
      "PropertyUniverseChapter.js"
    ],
    "components": [
      "PropertyUniverseChapter.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable PROPERTIES_CMS"
    ],
    "database": "Airtable PROPERTIES_CMS",
    "auth": "public",
    "exceptions": [
      "Independent owner with no corporate developer"
    ],
    "recovery": [
      "Display Individual Private Landlord credential verified badge"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.UNIVERSE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/PropertyFAQSection.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_pep_ch8_universe_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]#universe"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 1650,
    "parents": [
      "pep",
      "sys_faq_appeal_engine"
    ],
    "children": [
      "sys_faq_appeal_engine"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_ch8_universe_behavior",
        "text": "Chapter 08 — Property Universe & Developer Credentials enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/chapterConfig.js",
            "symbol": "CHAPTER_IDS.UNIVERSE",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/property/PropertyFAQSection.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "pep_ch9_services",
    "canonicalId": "property.pep.ch9_services",
    "name": "Chapter 09 — Ecosystem Services & Creator Booking",
    "label": "Chapter 09 — Ecosystem Services & Creator Booking",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]#services",
    "layer": "crust",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Direct booking portal for hiring certified photographers, spatial researchers, and event designers.",
    "description": "Allows owners and prospective buyers to commission 3D scans, title due diligence, or acoustic fit-out consultations.",
    "actions": [
      "Book Matterport 3D Scan",
      "Order Title & Tax Due Diligence",
      "Hire Drone Pilot"
    ],
    "conditions": [
      "Requires Connects wallet balance"
    ],
    "systems": [
      "ServicesChapter.js",
      "CreatorBookingModal.js"
    ],
    "components": [
      "ServicesChapter.js",
      "CreatorBookingModal.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals & connect_balances"
    ],
    "database": "Supabase deals & connect_balances",
    "auth": "seeker",
    "exceptions": [
      "Insufficient Connects balance"
    ],
    "recovery": [
      "Trigger Top-Up Wallet modal with Stripe/PayMongo checkout"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.SERVICES",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_pep_ch9_services_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]#services"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 1850,
    "parents": [
      "pep"
    ],
    "children": [
      "sys_connect_wallet"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_ch9_services_behavior",
        "text": "Chapter 09 — Ecosystem Services & Creator Booking enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/chapterConfig.js",
            "symbol": "CHAPTER_IDS.SERVICES",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "pep_ch10_your_move",
    "canonicalId": "property.pep.ch10_your_move",
    "name": "Chapter 10 — Your Move (Action Cockpit)",
    "label": "Chapter 10 — Your Move (Action Cockpit)",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "property",
    "category": "architecture",
    "route": "/property/[slug]#your-move",
    "layer": "core",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "contact_representative",
      "schedule_viewing",
      "submit_offer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Conversion cockpit: Save to Board, Ask Public Question FAQ, Contact Broker, Schedule Viewing, Make Offer.",
    "description": "The pivotal conversion hub connecting public property discovery into private deal workflows and verified representation.",
    "actions": [
      "Save Property to Board",
      "Ask Public FAQ Question",
      "Contact Assigned Broker (1 Connect)",
      "Schedule Private Viewing",
      "Submit Purchase Intent Offer"
    ],
    "conditions": [
      "Public reactions open; direct broker contact requires 1 Connect"
    ],
    "systems": [
      "YourMoveChapter.js",
      "ReactionButtons.js",
      "ContactModal.js",
      "ViewingScheduler.js"
    ],
    "components": [
      "YourMoveChapter.js",
      "ReactionButtons.js",
      "ContactModal.js",
      "ViewingScheduler.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals & saved_intel"
    ],
    "database": "Supabase deals & saved_intel",
    "auth": "public",
    "exceptions": [
      "Property unrepresented by broker (leads route to lister)"
    ],
    "recovery": [
      "Route inquiry directly to owner/lister contact queue"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.YOURMOVE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InquiryModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "The pivotal conversion hub connecting public property discovery into private deal workflows and verified representation.",
      "target": "property-your-move-actions",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_pep_ch10_your_move_viewed",
      "properties": {
        "domain": "property",
        "route": "/property/[slug]#your-move"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1500,
    "y": 2050,
    "parents": [
      "pep",
      "broker_field_briefing"
    ],
    "children": [
      "act_save_reaction",
      "action_ask_faq",
      "inquiry_modal",
      "booking_modal",
      "offer_modal",
      "claim_listing_modal"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_pep_ch10_your_move_behavior",
        "text": "Chapter 10 — Your Move (Action Cockpit) enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/chapterConfig.js",
            "symbol": "CHAPTER_IDS.YOURMOVE",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/property/InquiryModal.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "act_save_reaction",
    "canonicalId": "seeker.reaction.save",
    "name": "Action: Save to Board / Reaction",
    "label": "Action: Save to Board / Reaction",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "seeker",
    "category": "architecture",
    "route": "/property/[slug]",
    "layer": "core",
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "seeker"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Tag space with 1 of 4 reactions (Potential Fit, Interested, Inspired Me, Save) into local Ledger.",
    "description": "Instant on-device interaction. No account wall or friction. Updates `localStorage` immediately.",
    "actions": [
      "Select Reaction Tag",
      "Increment Reaction Counter"
    ],
    "conditions": [
      "Browser localStorage enabled"
    ],
    "systems": [
      "ReactionButtons.js",
      "localStorage('scoutit_reactions')"
    ],
    "components": [
      "ReactionButtons.js"
    ],
    "apis": [],
    "dataRefs": [
      "LocalStorage / Supabase saved_intel"
    ],
    "database": "LocalStorage / Supabase saved_intel",
    "auth": "public",
    "exceptions": [
      "Browser private browsing blocks localStorage"
    ],
    "recovery": [
      "Store state in memory for active tab session"
    ],
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/reactions/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_act_save_reaction_viewed",
      "properties": {
        "domain": "seeker",
        "route": "/property/[slug]"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 150,
    "parents": [
      "pep_ch10_your_move"
    ],
    "children": [
      "wishlist"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_act_save_reaction_behavior",
        "text": "Action: Save to Board / Reaction enforces defined seeker behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "API",
            "path": "src/app/api/reactions/route.js",
            "symbol": "POST",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "action_ask_faq",
    "canonicalId": "property.faq.ask",
    "name": "Action: Ask Public Question (Community FAQ)",
    "label": "Action: Ask Public Question (Community FAQ)",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "faq",
    "category": "architecture",
    "route": "/api/faq/ask",
    "layer": "core",
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "faq"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Submit a public question about the property to be answered by the verified broker or owner.",
    "description": "Questions are filtered through a Regex leak detector to redact phone numbers, emails, and off-platform contact attempts.",
    "actions": [
      "Submit Question Text",
      "Scan for PII / Contact Leaks",
      "Post to Property Public FAQ Board"
    ],
    "conditions": [
      "Non-empty question text"
    ],
    "systems": [
      "FaqWidget.js",
      "/api/faq/ask",
      "sanitize.js"
    ],
    "components": [
      "FaqWidget.js",
      "sanitize.js"
    ],
    "apis": [
      "/api/faq/ask"
    ],
    "dataRefs": [
      "Supabase property_faqs"
    ],
    "database": "Supabase property_faqs",
    "auth": "public",
    "exceptions": [
      "Seeker inputs phone number or Viber handle inside public question"
    ],
    "recovery": [
      "Contact leak filter redacts number to [CONTACT REDACTED: SPEND 1 CONNECT TO MESSAGE BROKER]"
    ],
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/faqs/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/PropertyFAQSection.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_action_ask_faq_viewed",
      "properties": {
        "domain": "faq",
        "route": "/api/faq/ask"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 400,
    "parents": [
      "pep_ch10_your_move",
      "rec_redact_contact_faq"
    ],
    "children": [
      "sys_contact_leak_filter",
      "exc_contact_leak_blocked",
      "sys_faq_appeal_engine"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_action_ask_faq_behavior",
        "text": "Action: Ask Public Question (Community FAQ) enforces defined faq behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "API",
            "path": "src/app/api/faqs/route.js",
            "symbol": "POST",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/property/PropertyFAQSection.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "inquiry_modal",
    "canonicalId": "deal.inquiry.modal",
    "name": "Inquiry & Direct Lead Modal (1 Connect)",
    "label": "Inquiry & Direct Lead Modal (1 Connect)",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "deal",
    "category": "architecture",
    "route": "/api/deals/initiate",
    "layer": "core",
    "roles": [
      "seeker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "PROVIDER"
    ],
    "goals": [
      "send_intro_inquiry",
      "initiate_deal"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Initiate direct private contact with the assigned broker, deducting exactly 1 Connect from the user's wallet.",
    "description": "Deducts 1 Connect (Monthly → Purchased → Reward order). Discloses non-refundable terms before spend.",
    "actions": [
      "Review 1 Connect Cost",
      "Confirm Non-Refundable Notice",
      "Dispatch Private Message"
    ],
    "conditions": [
      "Connect balance >= 1"
    ],
    "systems": [
      "ContactModal.js",
      "/api/deals/initiate",
      "spend_connects RPC"
    ],
    "components": [
      "ContactModal.js"
    ],
    "apis": [
      "/api/deals/initiate"
    ],
    "dataRefs": [
      "Supabase deals & connect_balances"
    ],
    "database": "Supabase deals & connect_balances",
    "auth": "seeker",
    "exceptions": [
      "Broker at listing cap limit (Pending state)",
      "User has 0 Connects"
    ],
    "recovery": [
      "Prompt Seeker to top-up Connects wallet or notify broker to upgrade tier"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InquiryModal.js",
        "symbol": "InquiryModal",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/initiate/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Deducts 1 Connect (Monthly → Purchased → Reward order). Discloses non-refundable terms before spend.",
      "target": "send-inquiry-modal-btn",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_inquiry_modal_viewed",
      "properties": {
        "domain": "deal",
        "route": "/api/deals/initiate"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 700,
    "parents": [
      "pep_ch10_your_move",
      "rec_topup_connects",
      "compare_specs_matrix"
    ],
    "children": [
      "sys_connect_wallet",
      "exc_insufficient_connects"
    ],
    "actorRoles": [
      "seeker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_inquiry_connect_spend",
        "text": "Initiating a verified direct inquiry commits 1 non-refundable Connect token from user wallet.",
        "kind": "SCOUTIT_POLICY",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "API",
            "path": "src/app/api/connects/spend/route.js",
            "symbol": "POST",
            "confidence": 1,
            "provenance": "Verified in connects spend route"
          }
        ],
        "confidence": 1,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      },
      {
        "id": "claim_inquiry_auth_required",
        "text": "Inquiry dispatch requires active authenticated session and valid session token.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/deal/InquiryModal.js",
            "symbol": "InquiryModal",
            "confidence": 1,
            "provenance": "Verified in InquiryModal.js"
          }
        ],
        "confidence": 1,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "pilotState": "DRAFT",
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "booking_modal",
    "canonicalId": "deal.viewing.modal",
    "name": "Viewing Booking & Schedule Modal",
    "label": "Viewing Booking & Schedule Modal",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "deal",
    "category": "architecture",
    "route": "/api/deals/schedule-viewing",
    "layer": "core",
    "roles": [
      "seeker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "PROVIDER"
    ],
    "goals": [
      "schedule_viewing",
      "book_slot"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Select preferred viewing date, time slot, and attendance type (In-Person or Live 3D Stream).",
    "description": "Initiates calendar booking request. Verifies broker calendar availability and checks for scheduling conflicts.",
    "actions": [
      "Choose Viewing Date & Time",
      "Select Viewing Mode (In-Person vs 3D Stream)",
      "Submit Viewing Request"
    ],
    "conditions": [
      "Authenticated Seeker account; active broker representation"
    ],
    "systems": [
      "ViewingScheduler.js",
      "/api/deals/schedule-viewing"
    ],
    "components": [
      "ViewingScheduler.js"
    ],
    "apis": [
      "/api/deals/schedule-viewing"
    ],
    "dataRefs": [
      "Supabase deals & viewing_schedules"
    ],
    "database": "Supabase deals & viewing_schedules",
    "auth": "seeker",
    "exceptions": [
      "Double-booking conflict with existing confirmed viewing"
    ],
    "recovery": [
      "Display alternative available time slots on same day"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BookingModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/schedule/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/viewing-appointments/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Initiates calendar booking request. Verifies broker calendar availability and checks for scheduling conflicts.",
      "target": "schedule-viewing-time-slots",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_booking_modal_viewed",
      "properties": {
        "domain": "deal",
        "route": "/api/deals/schedule-viewing"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 1000,
    "parents": [
      "pep_ch10_your_move",
      "rec_propose_alt_slot"
    ],
    "children": [
      "exc_slot_conflict",
      "deal_room"
    ],
    "actorRoles": [
      "seeker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_booking_modal_behavior",
        "text": "Viewing Booking & Schedule Modal enforces defined deal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/BookingModal.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "API",
            "path": "src/app/api/deals/[id]/schedule/route.js",
            "symbol": "POST",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "API",
            "path": "src/app/api/viewing-appointments/route.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "pilotState": "REQUESTED",
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "offer_modal",
    "canonicalId": "deal.offer.modal",
    "name": "Deal Negotiation & Offer Proposal",
    "label": "Deal Negotiation & Offer Proposal",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "deal",
    "category": "architecture",
    "route": "/api/deals/make-offer",
    "layer": "core",
    "roles": [
      "seeker",
      "enterprise"
    ],
    "visibility": [
      "SEEKER",
      "ENTERPRISE"
    ],
    "goals": [
      "submit_offer",
      "negotiate_terms"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Negotiation workspace for proposing deal terms, counter-offers, and transaction parameters in the active Deal Room.",
    "description": "Enables deal parties to draft, submit, and review structured proposal terms with AI counter-offer suggestions and status mutations.",
    "actions": [
      "Input Offer Amount",
      "Select Payment Terms (Cash / Bank Financing)",
      "Sign Digital LOI"
    ],
    "conditions": [
      "Authenticated verified Seeker account"
    ],
    "systems": [
      "src/components/dashboard/crm/DealRoom.js",
      "src/app/api/ai/counter-offer/route.js"
    ],
    "components": [
      "DealRoom.js",
      "ChatBox.js"
    ],
    "apis": [
      "/api/ai/counter-offer",
      "/api/deals"
    ],
    "dataRefs": [
      "Supabase deals & offers"
    ],
    "database": "Supabase deals & offers",
    "auth": "seeker",
    "exceptions": [
      "Offer submitted on off-market property not open to offers"
    ],
    "recovery": [
      "Reject offer with notice that property is strictly in dormant archive mode"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/crm/NewDealModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Encrypts proposed terms into the private Deal Room and notifies the owner and verified broker.",
      "target": "submit-offer-form-btn",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_offer_modal_viewed",
      "properties": {
        "domain": "deal",
        "route": "/api/deals/make-offer"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 1300,
    "parents": [
      "pep_ch10_your_move"
    ],
    "children": [
      "gate_offer"
    ],
    "actorRoles": [
      "seeker",
      "enterprise"
    ],
    "uiAudience": [
      "SEEKER",
      "ENTERPRISE"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_offer_modal_negotiation",
        "text": "Parties negotiate terms within the Deal Room and submit proposals with real-time status transitions (pending, accepted, declined, withdrawn).",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/components/dashboard/crm/DealRoom.js",
            "symbol": "DealRoom",
            "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43",
            "confidence": 0.95,
            "provenance": "Observed DealRoom negotiation implementation"
          },
          {
            "kind": "API",
            "path": "src/app/api/ai/counter-offer/route.js",
            "symbol": "POST",
            "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43",
            "confidence": 0.95,
            "provenance": "AI Counter-offer generation endpoint"
          }
        ],
        "confidence": 0.95,
        "reviewedBy": null,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "pilotState": "DRAFT",
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "claim_listing_modal",
    "canonicalId": "owner.claim_listing.modal",
    "name": "Claim Listing Due Diligence Modal",
    "label": "Claim Listing Due Diligence Modal",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "layer",
    "category": "architecture",
    "route": "/api/properties/claim",
    "layer": "core",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Title authority verification workflow allowing legitimate owners or brokers to claim unassigned listings.",
    "description": "Requires upload of Land Title (TCT/CCT), Tax Declaration, and valid government ID for staff review in Mission Control.",
    "actions": [
      "Upload Land Title (TCT)",
      "Submit Government ID",
      "Initiate Title Verification Queue Item"
    ],
    "conditions": [
      "Authenticated Owner or Broker account"
    ],
    "systems": [
      "ClaimListingModal.js",
      "/api/properties/claim"
    ],
    "components": [
      "ClaimListingModal.js"
    ],
    "apis": [
      "/api/properties/claim"
    ],
    "dataRefs": [
      "Supabase property_claims"
    ],
    "database": "Supabase property_claims",
    "auth": "owner",
    "exceptions": [
      "Conflicting title deed uploaded by competing claimant"
    ],
    "recovery": [
      "Owner Sovereignty Playbook 1.1: Default to registered title owner, route to Disputes Hub"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ClaimPropertyPanel.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/property/claim/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/propertyClaimApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Requires upload of Land Title (TCT/CCT), Tax Declaration, and valid government ID for staff review in Mission Control.",
      "target": "claim_listing_modal",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_claim_listing_modal_viewed",
      "properties": {
        "domain": "layer",
        "route": "/api/properties/claim"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 1600,
    "parents": [
      "pep_ch10_your_move"
    ],
    "children": [
      "mission_control"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_claim_listing_modal_behavior",
        "text": "Claim Listing Due Diligence Modal enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/ClaimPropertyPanel.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "API",
            "path": "src/app/api/property/claim/route.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "TEST",
            "path": "src/lib/__tests__/propertyClaimApi.test.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "owner_creation_pipeline",
    "canonicalId": "owner.creation_pipeline",
    "name": "Owner Listing Creation Hub",
    "label": "Owner Listing Creation Hub",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "owner",
    "category": "architecture",
    "route": "/dashboard/create",
    "layer": "core",
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "goals": [
      "create_listing",
      "publish_property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Central portal for creating new property listings across 4 distinct intake methods into one Review Workspace.",
    "description": "Offers Build from Scratch, Advanced 10-Chapter Editor, CSV Portfolio Import, and PDF Pitch Deck Extraction.",
    "actions": [
      "Select Creation Intake Method",
      "Review Listing Cap Usage",
      "Access Property Review Workspace"
    ],
    "conditions": [
      "Authenticated Owner or Broker account within listing tier limit"
    ],
    "systems": [
      "src/app/dashboard/create/page.js",
      "ListingMethodSelector.js"
    ],
    "components": [
      "src/app/dashboard/create/page.js",
      "ListingMethodSelector.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties (drafts)"
    ],
    "database": "Supabase properties (drafts)",
    "auth": "owner",
    "exceptions": [
      "Owner at listing cap limit (Starry: 1, Solar: 5, Cluster: 20)"
    ],
    "recovery": [
      "Prompt owner to upgrade subscription tier to unlock additional listing slots"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Offers Build from Scratch, Advanced 10-Chapter Editor, CSV Portfolio Import, and PDF Pitch Deck Extraction.",
      "target": "owner_creation_pipeline",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_owner_creation_pipeline_viewed",
      "properties": {
        "domain": "owner",
        "route": "/dashboard/create"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 1950,
    "parents": [
      "dashboard_owner"
    ],
    "children": [
      "method_scratch",
      "method_advanced",
      "method_csv",
      "method_pdf"
    ],
    "actorRoles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_owner_creation_pipeline_behavior",
        "text": "Owner Listing Creation Hub enforces defined owner behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/OwnerMode.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "method_scratch",
    "canonicalId": "owner.create.scratch",
    "name": "Method 1 — Build from Scratch (Streamlined)",
    "label": "Method 1 — Build from Scratch (Streamlined)",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "owner",
    "category": "architecture",
    "route": "/dashboard/create/scratch",
    "layer": "core",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "owner"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Rapid 5-minute listing creator capturing essential photos, title, price, location, and key specs.",
    "description": "Streamlined workflow designed for fast listing creation. Bypasses deep financial modeling for quick publishing.",
    "actions": [
      "Upload 7 Photos (Supabase bucket)",
      "Input Price & Title",
      "Set Mapbox Location",
      "Publish Listing"
    ],
    "conditions": [
      "Max 7 photos on Free tier"
    ],
    "systems": [
      "ScratchEditor.js",
      "Supabase Storage property_photos"
    ],
    "components": [
      "ScratchEditor.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties"
    ],
    "database": "Supabase properties",
    "auth": "owner",
    "exceptions": [
      "Attempt to paste Google Drive image URL"
    ],
    "recovery": [
      "Strict No-URL policy enforcement: prompt for direct drag-and-drop file upload"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/LiveEditorWorkspace.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_method_scratch_viewed",
      "properties": {
        "domain": "owner",
        "route": "/dashboard/create/scratch"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 2200,
    "parents": [
      "owner_creation_pipeline"
    ],
    "children": [
      "api_publish_listing"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_method_scratch_behavior",
        "text": "Method 1 — Build from Scratch (Streamlined) enforces defined owner behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/LiveEditorWorkspace.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "method_advanced",
    "canonicalId": "owner.create.advanced",
    "name": "Method 2 — Advanced 10-Chapter Editor",
    "label": "Method 2 — Advanced 10-Chapter Editor",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "owner",
    "category": "architecture",
    "route": "/dashboard/create/advanced",
    "layer": "core",
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "goals": [
      "owner"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Full chapter-by-chapter intelligence builder exposing cap rates, MEP load, unit inventory, and fine print.",
    "description": "Deep editor for luxury residences, commercial floors, and hospitality assets. Includes full units inventory manager.",
    "actions": [
      "Configure 10 Chapters",
      "Populate Deep Intel Schema",
      "Manage Units Inventory Grid",
      "Attach Spatial Vault Assets"
    ],
    "conditions": [
      "Requires Solar+ for deep intel fields"
    ],
    "systems": [
      "AdvancedChapterEditor.js",
      "InventoryGridManager.js"
    ],
    "components": [
      "AdvancedChapterEditor.js",
      "InventoryGridManager.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties & units_inventory"
    ],
    "database": "Supabase properties & units_inventory",
    "auth": "owner",
    "exceptions": [
      "Unit inventory unsaved before tab switch"
    ],
    "recovery": [
      "Debounced auto-save (1s) and explicit state-machine Save button"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/PropertySectionEditor.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_method_advanced_viewed",
      "properties": {
        "domain": "owner",
        "route": "/dashboard/create/advanced"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 2450,
    "parents": [
      "owner_creation_pipeline"
    ],
    "children": [
      "api_publish_listing"
    ],
    "actorRoles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_method_advanced_behavior",
        "text": "Method 2 — Advanced 10-Chapter Editor enforces defined owner behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/PropertySectionEditor.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "method_csv",
    "canonicalId": "owner.create.csv",
    "name": "Method 3 — CSV Portfolio Bulk Import",
    "label": "Method 3 — CSV Portfolio Bulk Import",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "owner",
    "category": "architecture",
    "route": "/dashboard/create/csv",
    "layer": "core",
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "goals": [
      "owner"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Bulk import pipeline for developer portfolios and multi-property commercial owners.",
    "description": "Validates uploaded CSV columns against ScoutIt Field Registry and stages listings in draft state for review.",
    "actions": [
      "Upload CSV File",
      "Map CSV Headers to Schema",
      "Review Staged Drafts",
      "Batch Publish"
    ],
    "conditions": [
      "Valid CSV structure matching field registry aliases"
    ],
    "systems": [
      "CsvBulkImporter.js",
      "/api/dashboard/bulk-insert"
    ],
    "components": [
      "CsvBulkImporter.js"
    ],
    "apis": [
      "/api/dashboard/bulk-insert"
    ],
    "dataRefs": [
      "Supabase properties"
    ],
    "database": "Supabase properties",
    "auth": "owner",
    "exceptions": [
      "Unrecognized column headers in CSV"
    ],
    "recovery": [
      "Interactive column mapping wizard allowing user to resolve schema aliases manually"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BulkImporterMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_method_csv_viewed",
      "properties": {
        "domain": "owner",
        "route": "/dashboard/create/csv"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 2700,
    "parents": [
      "owner_creation_pipeline"
    ],
    "children": [
      "api_publish_listing"
    ],
    "actorRoles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_method_csv_behavior",
        "text": "Method 3 — CSV Portfolio Bulk Import enforces defined owner behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/BulkImporterMode.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "method_pdf",
    "canonicalId": "owner.create.pdf",
    "name": "Method 4 — PDF Pitch Deck Intake",
    "label": "Method 4 — PDF Pitch Deck Intake",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "owner",
    "category": "architecture",
    "route": "/dashboard/create/pdf",
    "layer": "core",
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "goals": [
      "owner"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Upload developer PDF brochure for automated fact extraction by the AI Listing Engine pipeline.",
    "description": "Receives raw PDF brochure or pitch deck, establishes processing job, and hands off to Gemini OCR extractor.",
    "actions": [
      "Upload Developer Pitch Deck PDF",
      "Initiate AI Listing Job",
      "Monitor Extraction Progress"
    ],
    "conditions": [
      "PDF file size <= 35MB"
    ],
    "systems": [
      "PdfExtractor.js",
      "ingestExtractor.js"
    ],
    "components": [
      "PdfExtractor.js",
      "ingestExtractor.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties (draft state)"
    ],
    "database": "Supabase properties (draft state)",
    "auth": "owner",
    "exceptions": [
      "Corrupt PDF file or unreadable formatting"
    ],
    "recovery": [
      "Prompt for valid PDF or direct to Method 1 Scratch Creator"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_method_pdf_viewed",
      "properties": {
        "domain": "owner",
        "route": "/dashboard/create/pdf"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 2950,
    "parents": [
      "owner_creation_pipeline"
    ],
    "children": [
      "ai_listing_engine"
    ],
    "actorRoles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_method_pdf_behavior",
        "text": "Method 4 — PDF Pitch Deck Intake enforces defined owner behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/OwnerMode.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "sys_gemini_ocr_extractor",
    "canonicalId": "owner.pdf.gemini_ocr",
    "name": "System: Gemini OCR & Fact Extractor (Phase-1 Ingest)",
    "label": "System: Gemini OCR & Fact Extractor (Phase-1 Ingest)",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "layer",
    "category": "architecture",
    "route": "/lib/ingestExtractor.js",
    "layer": "mantle",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "PARTIAL",
    "purpose": "Extracts hard factual dimensions (FloorSqm, LotSqm, Beds, Baths, Parking, YearBuilt) directly from PDF source.",
    "description": "Maps PDF text into structured fields. If a fact is missing from the PDF, it strictly leaves the field blank.",
    "actions": [
      "Run OCR & Text Extraction",
      "Map Hard Facts to Schema",
      "Attach PDF Page Citations"
    ],
    "conditions": [
      "PDF upload completed"
    ],
    "systems": [
      "ingestExtractor.js",
      "Google Gemini Flash API"
    ],
    "components": [
      "ingestExtractor.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties (private draft)"
    ],
    "database": "Supabase properties (private draft)",
    "auth": "owner",
    "exceptions": [
      "Low-resolution scanned image without text layer"
    ],
    "recovery": [
      "Trigger OCR fallback or prompt owner for manual text entry"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_gemini_ocr_extractor_viewed",
      "properties": {
        "domain": "layer",
        "route": "/lib/ingestExtractor.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 3200,
    "parents": [
      "ai_listing_engine"
    ],
    "children": [
      "sys_web_researcher"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_gemini_ocr_extractor_behavior",
        "text": "System: Gemini OCR & Fact Extractor (Phase-1 Ingest) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PARTIAL",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "LIMITED_LIVE"
  },
  {
    "id": "sys_web_researcher",
    "canonicalId": "owner.pdf.web_researcher",
    "name": "System: Web Researcher Agent & Citation Verifier",
    "label": "System: Web Researcher Agent & Citation Verifier",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "discovery",
    "category": "architecture",
    "route": "/lib/webResearcher.js",
    "layer": "mantle",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "discovery"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Finds cited external spatial facts and performs Same-Property Verification to prevent namesake misattribution.",
    "description": "Enriches the cold-start draft with cited coordinates, nearby anchors, and developer provenance.",
    "actions": [
      "Search External Spatial Data",
      "Verify Same-Property Identity",
      "Attach Verifiable Source Citations"
    ],
    "conditions": [
      "Phase-1 extraction complete"
    ],
    "systems": [
      "webResearcher.js",
      "Mapbox Geocoding API"
    ],
    "components": [
      "webResearcher.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties.details.citations"
    ],
    "database": "Supabase properties.details.citations",
    "auth": "owner",
    "exceptions": [
      "Namesake building detected in different city"
    ],
    "recovery": [
      "Same-Property Verification check discards citation to prevent data contamination"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_web_researcher_viewed",
      "properties": {
        "domain": "discovery",
        "route": "/lib/webResearcher.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2250,
    "y": 3450,
    "parents": [
      "sys_gemini_ocr_extractor"
    ],
    "children": [
      "sys_ai_council"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_web_researcher_behavior",
        "text": "System: Web Researcher Agent & Citation Verifier enforces defined discovery behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "gate_auth",
    "canonicalId": "auth.gate.universal",
    "name": "Decision Gate: Auth & Capability Verification",
    "label": "Decision Gate: Auth & Capability Verification",
    "type": "GATE",
    "nodeType": "GATE",
    "domain": "auth",
    "category": "architecture",
    "route": "/lib/serverAuth.js",
    "layer": "global",
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff",
      "enterprise"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER",
      "STAFF",
      "ENTERPRISE"
    ],
    "goals": [
      "auth"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Validates active Supabase session and checks if target action requires specific role capability.",
    "description": "Evaluates permissions before allowing access to private deal rooms, listing building, or Connects spend.",
    "actions": [
      "Verify Supabase JWT Session",
      "Check Role Capability in user_profiles"
    ],
    "conditions": [
      "Session JWT present in authorization header"
    ],
    "systems": [
      "serverAuth.js",
      "supabase.auth.getUser()"
    ],
    "components": [
      "serverAuth.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase auth.users & user_profiles"
    ],
    "database": "Supabase auth.users & user_profiles",
    "auth": "public",
    "exceptions": [
      "Expired or invalid session token"
    ],
    "recovery": [
      "Redirect to /auth/login with return_to query parameter"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/serverAuth.js",
        "symbol": "resolveUserId",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_gate_auth_viewed",
      "properties": {
        "domain": "auth",
        "route": "/lib/serverAuth.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 150,
    "parents": [],
    "children": [],
    "actorRoles": [
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff",
      "enterprise"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER",
      "STAFF",
      "ENTERPRISE"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_gate_auth_routing",
        "text": "Gate Auth routes unauthenticated users to /login?return_to=... and authorized users directly to target modal.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/auth/AuthBoundary.js",
            "symbol": "requireAuth",
            "confidence": 1,
            "provenance": "Verified in Auth Boundary"
          }
        ],
        "confidence": 1,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "CRITICAL",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "resumeIntent": "RESUME_INTENDED_ACTION",
    "returnTarget": "inquiry_modal",
    "originNode": "pep_ch10_your_move",
    "continuationTarget": "inquiry_modal",
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "dec_tier_gate",
    "canonicalId": "auth.gate.tier",
    "name": "Decision Gate: Tier Entitlement Check",
    "label": "Decision Gate: Tier Entitlement Check",
    "type": "DECISION",
    "nodeType": "DECISION",
    "domain": "core",
    "category": "architecture",
    "route": "/lib/entitlements.js",
    "layer": "global",
    "roles": [
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "core"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Evaluates `canSee(feature, getCurrentTier())` to determine access to Deep Intel, 3D Vault, or listing slots.",
    "description": "Strict entitlement gate separating Starry (₱0), Solar (₱149/mo), Cluster (₱499/mo), and Universe (₱2,499/mo).",
    "actions": [
      "Evaluate User Role & Tier",
      "Authorize Full Data Payload or Redacted Response"
    ],
    "conditions": [
      "Authenticated user context with subscription_tier"
    ],
    "systems": [
      "src/lib/entitlements.js",
      "DashboardContext.js"
    ],
    "components": [
      "src/lib/entitlements.js",
      "DashboardContext.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase user_profiles.subscription_tier"
    ],
    "database": "Supabase user_profiles.subscription_tier",
    "auth": "public",
    "exceptions": [
      "Free tier attempting access to Cluster-gated 3D Vault"
    ],
    "recovery": [
      "Render 'Unlock with Verified Scout' upgrade prompt with pricing tier breakdown"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/entitlements.js",
        "symbol": "isFeatureUnlocked",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_dec_tier_gate_viewed",
      "properties": {
        "domain": "core",
        "route": "/lib/entitlements.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 400,
    "parents": [
      "gate_deep_intel_tier",
      "gate_hidden_intel_tier"
    ],
    "children": [
      "pep_ch6_fine_print",
      "core",
      "sys_connect_wallet"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_dec_tier_gate_behavior",
        "text": "Decision Gate: Tier Entitlement Check enforces defined core behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/entitlements.js",
            "symbol": "isFeatureUnlocked",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "sys_connect_wallet",
    "canonicalId": "connects.wallet",
    "name": "System: Connects Wallet & Deduct RPC",
    "label": "System: Connects Wallet & Deduct RPC",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "connects",
    "category": "architecture",
    "route": "/api/deals/spend-connect",
    "layer": "global",
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "connects"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Atomic spend engine consuming Connects in strict order: 1) Monthly, 2) Purchased, 3) Reward.",
    "description": "Executes `spend_connects` stored procedure in Supabase. Ensures expiring monthly balances are used before permanent ones.",
    "actions": [
      "Check Balance Availability",
      "Execute Atomic Spend RPC",
      "Record Immutable Transaction Log"
    ],
    "conditions": [
      "Total Connects balance >= cost"
    ],
    "systems": [
      "src/app/api/deals/spend-connect/route.js",
      "spend_connects SQL RPC"
    ],
    "components": [
      "src/app/api/deals/spend-connect/route.js"
    ],
    "apis": [
      "src/app/api/deals/spend-connect/route.js"
    ],
    "dataRefs": [
      "Supabase connect_balances & connect_transactions"
    ],
    "database": "Supabase connect_balances & connect_transactions",
    "auth": "seeker",
    "exceptions": [
      "Zero balance across all 3 buckets"
    ],
    "recovery": [
      "Trigger Top-Up Wallet modal with Stripe/PayMongo payment packs"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/connectsWallet.js",
        "symbol": "spendConnect",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "DATABASE",
        "path": "supabase/migrations/20260710000000_schema_v2_core.sql",
        "symbol": "connect_balances",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/connectsWallet.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_connect_wallet_viewed",
      "properties": {
        "domain": "connects",
        "route": "/api/deals/spend-connect"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 650,
    "parents": [
      "pep_ch9_services",
      "inquiry_modal",
      "scenario_churned_owner_escrow",
      "dec_tier_gate",
      "sys_ephemeral_secret_engine"
    ],
    "children": [
      "deal_room",
      "scenario_non_refundable_connect",
      "sys_connect_hemorrhage_guard"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_connect_wallet_behavior",
        "text": "System: Connects Wallet & Deduct RPC enforces defined connects behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/connectsWallet.js",
            "symbol": "spendConnect",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "DATABASE",
            "path": "supabase/migrations/20260710000000_schema_v2_core.sql",
            "symbol": "connect_balances",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "TEST",
            "path": "src/lib/__tests__/connectsWallet.test.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PRIVATE_PILOT"
  },
  {
    "id": "sys_connect_hemorrhage_guard",
    "canonicalId": "connects.fraud_guard",
    "name": "System: Connects Hemorrhage Guard (Economy Radar)",
    "label": "System: Connects Hemorrhage Guard (Economy Radar)",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "connects",
    "category": "architecture",
    "route": "/lib/sentinel/hemorrhageGuard.js",
    "layer": "global",
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER",
      "STAFF"
    ],
    "goals": [
      "connects"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Detects anomalous high-frequency Connects generation or spending spikes (e.g. bounty farming script).",
    "description": "Auto-freezes affected wallet and drops a critical investigation ticket into Mission Control's Kanban.",
    "actions": [
      "Analyze Spend Frequency Anomaly",
      "Auto-Freeze Compromised Wallet",
      "Create Urgent Mission Control Ticket"
    ],
    "conditions": [
      "Spend velocity > 20 Connects/minute"
    ],
    "systems": [
      "hemorrhageGuard.js",
      "DisputesHub.js"
    ],
    "components": [
      "hemorrhageGuard.js",
      "DisputesHub.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase connect_balances.is_frozen"
    ],
    "database": "Supabase connect_balances.is_frozen",
    "auth": "seeker",
    "exceptions": [
      "Legitimate high-volume enterprise user trigger"
    ],
    "recovery": [
      "Staff manual review and unfreeze in Mission Control"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/connectsWallet.js",
        "symbol": "refundConnect",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_connect_hemorrhage_guard_viewed",
      "properties": {
        "domain": "connects",
        "route": "/lib/sentinel/hemorrhageGuard.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 800,
    "parents": [
      "sys_connect_wallet"
    ],
    "children": [
      "mission_control"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER",
      "STAFF"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_connect_hemorrhage_guard_behavior",
        "text": "System: Connects Hemorrhage Guard (Economy Radar) enforces defined connects behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/connectsWallet.js",
            "symbol": "refundConnect",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PRIVATE_PILOT"
  },
  {
    "id": "gate_viewing",
    "canonicalId": "deal.gate.viewing",
    "name": "Decision Gate: Viewing Attendance Confirmation",
    "label": "Decision Gate: Viewing Attendance Confirmation",
    "type": "GATE",
    "nodeType": "GATE",
    "domain": "deal",
    "category": "architecture",
    "route": "/api/deals/viewing-status",
    "layer": "core",
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "deal"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Verifies whether a scheduled viewing was attended in person or if an exception (No-Show) occurred.",
    "description": "Routes viewing outcome to deal progression or to the viewing reschedule recovery modal.",
    "actions": [
      "Check Broker & Buyer Attendance Check-in",
      "Trigger Milestone Update"
    ],
    "conditions": [
      "Viewing scheduled time elapsed"
    ],
    "systems": [
      "ViewingCalendar.js",
      "deal_milestones"
    ],
    "components": [
      "ViewingCalendar.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals & viewing_schedules"
    ],
    "database": "Supabase deals & viewing_schedules",
    "auth": "seeker",
    "exceptions": [
      "Buyer or broker fails to attend scheduled viewing"
    ],
    "recovery": [
      "Route to Reschedule Modal for alternative slot selection"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_gate_viewing_viewed",
      "properties": {
        "domain": "deal",
        "route": "/api/deals/viewing-status"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 950,
    "parents": [
      "deal_room"
    ],
    "children": [
      "exc_viewing_noshow",
      "sys_transaction_handshake"
    ],
    "actorRoles": [
      "seeker",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_gate_viewing_behavior",
        "text": "Decision Gate: Viewing Attendance Confirmation enforces defined deal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "gate_offer",
    "canonicalId": "deal.gate.offer",
    "name": "Decision Gate: Offer Evaluation & Terms Counter",
    "label": "Decision Gate: Offer Evaluation & Terms Counter",
    "type": "GATE",
    "nodeType": "GATE",
    "domain": "deal",
    "category": "architecture",
    "route": "/api/deals/offer-review",
    "layer": "core",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "deal"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Owner reviews purchase offer terms: Accept, Counter, or Decline Letter of Intent.",
    "description": "Directs accepted offers toward the transaction handshake or counter-offer renegotiation.",
    "actions": [
      "Review Proposed Price & Terms",
      "Accept / Counter / Decline Offer"
    ],
    "conditions": [
      "Valid offer submitted in deal room"
    ],
    "systems": [
      "OfferReviewPanel.js",
      "deal_offers"
    ],
    "components": [
      "OfferReviewPanel.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals & offers"
    ],
    "database": "Supabase deals & offers",
    "auth": "owner",
    "exceptions": [
      "Offer rejected outright without counter"
    ],
    "recovery": [
      "Deal room archives with option to submit revised proposal"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_gate_offer_viewed",
      "properties": {
        "domain": "deal",
        "route": "/api/deals/offer-review"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 1200,
    "parents": [
      "offer_modal"
    ],
    "children": [
      "deal_room"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_gate_offer_behavior",
        "text": "Decision Gate: Offer Evaluation & Terms Counter enforces defined deal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "sys_contact_leak_filter",
    "canonicalId": "sentinel.contact_leak_filter",
    "name": "System: Regex Contact Leak Detector",
    "label": "System: Regex Contact Leak Detector",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "sentinel",
    "category": "architecture",
    "route": "/lib/sanitize.js",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "sentinel"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Scans public FAQs and inquiries for phone numbers, email addresses, and Viber/Telegram handles to prevent bypass.",
    "description": "Dependency-free regex scanner (`stripAllTags`, `sanitizeObject`). Redacts leak patterns while preserving legitimate text.",
    "actions": [
      "Scan Input Text Stream",
      "Redact Contact Information",
      "Flag Potential Platform Bypass"
    ],
    "conditions": [
      "Any public text submission"
    ],
    "systems": [
      "src/lib/sanitize.js"
    ],
    "components": [
      "src/lib/sanitize.js"
    ],
    "apis": [],
    "dataRefs": [
      "None"
    ],
    "database": "None",
    "auth": "public",
    "exceptions": [
      "Obfuscated phone number pattern (e.g. zero-nine-one-seven)"
    ],
    "recovery": [
      "Secondary word-to-number normalizer catches phonetic phone strings and redacts"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/contactLeakFilter.js",
        "symbol": "filterContactLeaks",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/contactLeakFilter.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_contact_leak_filter_viewed",
      "properties": {
        "domain": "sentinel",
        "route": "/lib/sanitize.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 1450,
    "parents": [
      "action_ask_faq"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_contact_leak_filter_behavior",
        "text": "System: Regex Contact Leak Detector enforces defined sentinel behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/contactLeakFilter.js",
            "symbol": "filterContactLeaks",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "TEST",
            "path": "src/lib/__tests__/contactLeakFilter.test.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "sys_double_optin_handshake",
    "canonicalId": "broker.representation.handshake",
    "name": "System: Two-Sided Representation Handshake",
    "label": "System: Two-Sided Representation Handshake",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "deal",
    "category": "architecture",
    "route": "/api/dashboard/invite",
    "layer": "crust",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "deal"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Enforces double opt-in for broker representation (Owner invites broker OR Broker pitches owner).",
    "description": "Paid by the initiator (1 Connect). Recipient confirms for free. Link becomes Active only after mutual confirmation.",
    "actions": [
      "Deduct 1 Connect from Initiator",
      "Create Pending Representation Link",
      "Notify Recipient",
      "Confirm & Activate"
    ],
    "conditions": [
      "Initiator pays 1 Connect; broker selected from verified directory"
    ],
    "systems": [
      "/api/dashboard/invite",
      "/api/deals/pitch",
      "deals table"
    ],
    "components": [],
    "apis": [
      "/api/dashboard/invite",
      "/api/deals/pitch"
    ],
    "dataRefs": [
      "Supabase deals & Airtable BROKERS_CMS"
    ],
    "database": "Supabase deals & Airtable BROKERS_CMS",
    "auth": "owner",
    "exceptions": [
      "Broker declines representation invite or request times out"
    ],
    "recovery": [
      "No automatic Connects refund (Rule 3.1); property returns to unrepresented state"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/brokerRepresentation.js",
        "symbol": "confirmRepresentation",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/brokerRepresentation.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_double_optin_handshake_viewed",
      "properties": {
        "domain": "deal",
        "route": "/api/dashboard/invite"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 1700,
    "parents": [
      "dashboard_broker",
      "dashboard_owner"
    ],
    "children": [
      "scenario_listing_cap_limit",
      "pep"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_double_optin_handshake_behavior",
        "text": "System: Two-Sided Representation Handshake enforces defined deal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/brokerRepresentation.js",
            "symbol": "confirmRepresentation",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "TEST",
            "path": "src/lib/__tests__/brokerRepresentation.test.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.represent_client",
      "deal.participate"
    ],
    "resourceRelationship": [
      "ASSIGNED_BROKER",
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": true,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "sys_transaction_handshake",
    "canonicalId": "deal.transaction.handshake",
    "name": "System: Two-Sided Transaction Handshake",
    "label": "System: Two-Sided Transaction Handshake",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "deal",
    "category": "architecture",
    "route": "/api/deals/handshake",
    "layer": "core",
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "complete_handshake",
      "build_rating"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Post-viewing completion handshake inside ScoutIt that increments broker Scout Rating and issues platform incentives.",
    "description": "Distinct from representation handshake. Requires both buyer and broker confirmation after viewing or transaction close.",
    "actions": [
      "Submit Handshake Confirmation",
      "Verify Viewing Completed",
      "Increment Scout Rating Count",
      "Award Platform Incentives"
    ],
    "conditions": [
      "Completed private viewing record in deal room"
    ],
    "systems": [
      "/api/deals/handshake",
      "deal_milestones"
    ],
    "components": [],
    "apis": [
      "/api/deals/handshake"
    ],
    "dataRefs": [
      "Supabase deals & user_profiles.scout_rating"
    ],
    "database": "Supabase deals & user_profiles.scout_rating",
    "auth": "seeker",
    "exceptions": [
      "One party fails to confirm transaction completion"
    ],
    "recovery": [
      "7-day reminder window before closing case without rating increment"
    ],
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/deals/handshake/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/dealHandshakeApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_transaction_handshake_viewed",
      "properties": {
        "domain": "deal",
        "route": "/api/deals/handshake"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 1950,
    "parents": [
      "gate_viewing",
      "deal_room"
    ],
    "children": [
      "terminal_handshake_success"
    ],
    "actorRoles": [
      "seeker",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_handshake_co_confirmation",
        "text": "Handshake requires two-sided digital confirmation between buyer and broker/owner to mark transaction milestones.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "API",
            "path": "src/app/api/deal/handshake/route.js",
            "symbol": "POST",
            "confidence": 1,
            "provenance": "Verified in deal handshake API"
          }
        ],
        "confidence": 1,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      },
      {
        "id": "claim_handshake_resa_compliance",
        "text": "Handshake execution records PRC broker accreditation ID in immutable audit log complying with RESA Law (RA 9646).",
        "kind": "LAW",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/LEGAL_COMPLIANCE/RESA_LAW_PHILIPPINES.md",
            "confidence": 0.95,
            "provenance": "Referenced from ScoutIt Brain Legal SOP"
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "pilotState": "HANDSHAKE_PENDING",
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "ai_listing_engine",
    "canonicalId": "owner.ai.listing_engine",
    "name": "System: AI Listing Engine Coordinator",
    "label": "System: AI Listing Engine Coordinator",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "owner",
    "category": "architecture",
    "route": "/lib/aiListingEngine.js",
    "layer": "mantle",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "owner"
    ],
    "implementationStatus": "PARTIAL",
    "purpose": "Coordinates the entire extraction pipeline: OCR ingest, web research, multi-voice council deliberation, and Arbiter routing.",
    "description": "Turns thin PDF documents into rich, factually honest property dossiers. Enforces Honest Blank and Holder of Truth rules.",
    "actions": [
      "Coordinate AI Sub-Pipelines",
      "Manage Fact vs Editorial Routing",
      "Publish Verified Drafts"
    ],
    "conditions": [
      "PDF upload or listing ingestion request"
    ],
    "systems": [
      "aiListingEngine.js",
      "ingestExtractor.js",
      "MultiLlmPipeline.js"
    ],
    "components": [
      "aiListingEngine.js",
      "ingestExtractor.js",
      "MultiLlmPipeline.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties"
    ],
    "database": "Supabase properties",
    "auth": "owner",
    "exceptions": [
      "AI cannot find specific metric (e.g. ceiling height)",
      "AI Council detects document contradiction"
    ],
    "recovery": [
      "Honest Blank Rule: leaves field empty and flags for human queue or owner override"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_ai_listing_engine_viewed",
      "properties": {
        "domain": "owner",
        "route": "/lib/aiListingEngine.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 2150,
    "parents": [
      "method_pdf"
    ],
    "children": [
      "sys_gemini_ocr_extractor",
      "exc_missing_pdf_metric",
      "exc_ai_deadlock",
      "api_publish_listing"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_ai_listing_engine_behavior",
        "text": "System: AI Listing Engine Coordinator enforces defined owner behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PARTIAL",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "LIMITED_LIVE"
  },
  {
    "id": "sys_ai_council",
    "canonicalId": "owner.ai.council",
    "name": "System: The AI Council (4-Voice Expert Panel)",
    "label": "System: The AI Council (4-Voice Expert Panel)",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "layer",
    "category": "architecture",
    "route": "/lib/aiCouncil.js",
    "layer": "mantle",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "PARTIAL",
    "purpose": "4-voice panel debating facts vs editorial: Design Expert, Owner Advocate, Buyer Advocate, Category Master.",
    "description": "Weighs sourced evidence per field. Domain experts frame aesthetic tags; Owner vs Buyer advocates balance honesty vs presentation.",
    "actions": [
      "Convene 4-Voice Panel",
      "Adjudicate Sourced Facts",
      "Craft Editorial Stories (SpaceStory, Hook)"
    ],
    "conditions": [
      "PDF fact extraction and citations compiled"
    ],
    "systems": [
      "aiCouncil.js",
      "MultiLlmPipeline.js"
    ],
    "components": [
      "aiCouncil.js",
      "MultiLlmPipeline.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties"
    ],
    "database": "Supabase properties",
    "auth": "owner",
    "exceptions": [
      "Conflicting facts between PDF and cited web sources"
    ],
    "recovery": [
      "Pass conflict to Arbiter for escalation or human flag"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_ai_council_viewed",
      "properties": {
        "domain": "layer",
        "route": "/lib/aiCouncil.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 2350,
    "parents": [
      "sys_web_researcher"
    ],
    "children": [
      "sys_ai_arbiter"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_ai_council_behavior",
        "text": "System: The AI Council (4-Voice Expert Panel) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PARTIAL",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "LIMITED_LIVE"
  },
  {
    "id": "sys_ai_arbiter",
    "canonicalId": "owner.ai.arbiter",
    "name": "System: The AI Arbiter & Loop Cap Judge",
    "label": "System: The AI Arbiter & Loop Cap Judge",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "layer",
    "category": "architecture",
    "route": "/lib/aiArbiter.js",
    "layer": "mantle",
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "PARTIAL",
    "purpose": "Independent judge evaluating council output against hard rules; enforces 2-round maximum loop cap.",
    "description": "Routes high confidence to publishing queue; borderlines back to Council (max 2 rounds); stalemates to human approval.",
    "actions": [
      "Check Field Sourcing Confidence",
      "Enforce Max 2 Round Loop Cap",
      "Route to Publish or Human Escalation"
    ],
    "conditions": [
      "AI Council deliberation completed"
    ],
    "systems": [
      "aiArbiter.js"
    ],
    "components": [
      "aiArbiter.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties"
    ],
    "database": "Supabase properties",
    "auth": "owner",
    "exceptions": [
      "Persistent disagreement after 2 rounds"
    ],
    "recovery": [
      "Force route to Mission Control human review queue"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_ai_arbiter_viewed",
      "properties": {
        "domain": "layer",
        "route": "/lib/aiArbiter.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 2550,
    "parents": [
      "sys_ai_council"
    ],
    "children": [
      "exc_missing_pdf_metric",
      "exc_ai_deadlock",
      "api_publish_listing"
    ],
    "actorRoles": [
      "owner",
      "broker",
      "staff"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_ai_arbiter_behavior",
        "text": "System: The AI Arbiter & Loop Cap Judge enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PARTIAL",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "LIMITED_LIVE"
  },
  {
    "id": "api_publish_listing",
    "canonicalId": "owner.listing.publish",
    "name": "System: Dual-CMS Publishing Bridge",
    "label": "System: Dual-CMS Publishing Bridge",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "owner",
    "category": "architecture",
    "route": "/api/dashboard/publish",
    "layer": "global",
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "goals": [
      "owner"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Syncs verified Supabase property draft to Airtable PROPERTIES_CMS and computes canonical public slug.",
    "description": "Transfers text metadata and Supabase Storage photo URLs to Airtable. Freezes canonical slug for permanent indexing.",
    "actions": [
      "Validate Field Registry",
      "Push Record to Airtable PROPERTIES_CMS",
      "Freeze Permanent Canonical Slug",
      "Set Live Status"
    ],
    "conditions": [
      "Owner attestation or staff approval check passed"
    ],
    "systems": [
      "src/app/api/dashboard/publish/route.js",
      "getCmsBundle()"
    ],
    "components": [
      "src/app/api/dashboard/publish/route.js"
    ],
    "apis": [
      "src/app/api/dashboard/publish/route.js"
    ],
    "dataRefs": [
      "Supabase properties & Airtable PROPERTIES_CMS"
    ],
    "database": "Supabase properties & Airtable PROPERTIES_CMS",
    "auth": "owner",
    "exceptions": [
      "Airtable API connection timeout during publish"
    ],
    "recovery": [
      "Retry queue in Supabase with exponential backoff"
    ],
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/property/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_api_publish_listing_viewed",
      "properties": {
        "domain": "owner",
        "route": "/api/dashboard/publish"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 2750,
    "parents": [
      "method_scratch",
      "method_advanced",
      "method_csv",
      "sys_ai_arbiter",
      "ai_listing_engine",
      "rec_owner_manual_override",
      "rec_manual_approval_queue",
      "sys_ephemeral_secret_engine"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "owner",
      "broker",
      "staff"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_api_publish_listing_behavior",
        "text": "System: Dual-CMS Publishing Bridge enforces defined owner behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "API",
            "path": "src/app/api/property/route.js",
            "symbol": "POST",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "scenario_pii_erasure",
    "canonicalId": "privacy.pii_erasure",
    "name": "System: PII-Detachment & Estate Retention (RA 10173)",
    "label": "System: PII-Detachment & Estate Retention (RA 10173)",
    "type": "OUTCOME",
    "nodeType": "OUTCOME",
    "domain": "legal",
    "category": "scenario",
    "route": "/api/user/dpo-erasure",
    "layer": "global",
    "roles": [
      "staff",
      "enterprise"
    ],
    "visibility": [
      "STAFF",
      "ENTERPRISE"
    ],
    "goals": [
      "legal"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "DPO-authorized Right to Erasure protocol: hard-purges human PII while retaining spatial intelligence assets.",
    "description": "Hard-deletes name, phone, email, and PRC license from `user_profiles` and `auth.users`. Retains Spatial Vault 3D media with `owner_id: null`.",
    "actions": [
      "Verify DPO Authorization",
      "Hard-Purge PII Fields",
      "Nullify Property Owner ID",
      "Revert Listing to Unclaimed Estate"
    ],
    "conditions": [
      "Formal Data Privacy Act RA 10173 request verified by DPO"
    ],
    "systems": [
      "/api/user/dpo-erasure",
      "SentinelLayer.js"
    ],
    "components": [
      "SentinelLayer.js"
    ],
    "apis": [
      "/api/user/dpo-erasure"
    ],
    "dataRefs": [
      "Supabase user_profiles, auth.users, properties"
    ],
    "database": "Supabase user_profiles, auth.users, properties",
    "auth": "staff",
    "exceptions": [
      "Active legal dispute on property prevents immediate erasure"
    ],
    "recovery": [
      "Hold in legal compliance quarantine pending dispute resolution"
    ],
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/user/delete-account/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/deleteAccountApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_scenario_pii_erasure_viewed",
      "properties": {
        "domain": "legal",
        "route": "/api/user/dpo-erasure"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/16_LEGAL_AND_COMPLIANCE/LEGAL_DOCUMENTATION_COMPLIANCE_MASTER_BLUEPRINT.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 2950,
    "parents": [
      "mission_control"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "staff",
      "enterprise"
    ],
    "uiAudience": [
      "STAFF",
      "ENTERPRISE"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_scenario_pii_erasure_behavior",
        "text": "System: PII-Detachment & Estate Retention (RA 10173) enforces defined legal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "API",
            "path": "src/app/api/user/delete-account/route.js",
            "symbol": "POST",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "TEST",
            "path": "src/lib/__tests__/deleteAccountApi.test.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Legal & Compliance Team",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "scenario_non_refundable_connect",
    "canonicalId": "connects.policy.non_refundable",
    "name": "Playbook 3.1 — Non-Refundable Connect Spend & Discretionary Correction",
    "label": "Playbook 3.1 — Non-Refundable Connect Spend & Discretionary Correction",
    "type": "OUTCOME",
    "nodeType": "OUTCOME",
    "domain": "connects",
    "category": "scenario",
    "route": "/lib/connectRules.js",
    "layer": "global",
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER",
      "STAFF"
    ],
    "goals": [
      "connects"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Enforces that spent Connects are non-refundable on decline, timeout, or non-response.",
    "description": "Protects platform tokenomics. Only severe administrative errors receive discretionary staff corrections in Mission Control.",
    "actions": [
      "Enforce Non-Refundable Spend Rule",
      "Log Delivered Gesture Record"
    ],
    "conditions": [
      "Inquiry or pitch sent"
    ],
    "systems": [
      "connectRules.js",
      "DisputesHub.js"
    ],
    "components": [
      "connectRules.js",
      "DisputesHub.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase connect_transactions"
    ],
    "database": "Supabase connect_transactions",
    "auth": "seeker",
    "exceptions": [
      "Confirmed administrative platform bug caused delivery failure"
    ],
    "recovery": [
      "Discretionary staff manual credit adjustment via Mission Control"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_scenario_non_refundable_connect_viewed",
      "properties": {
        "domain": "connects",
        "route": "/lib/connectRules.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 3200,
    "parents": [
      "sys_connect_wallet"
    ],
    "children": [],
    "actorRoles": [
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER",
      "STAFF"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_scenario_non_refundable_connect_behavior",
        "text": "Playbook 3.1 — Non-Refundable Connect Spend & Discretionary Correction enforces defined connects behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "PRIVATE_PILOT"
  },
  {
    "id": "exc_bot_quarantine",
    "canonicalId": "sentinel.exc.bot_quarantine",
    "name": "Exception: Sentinel Automated Session Quarantine",
    "label": "Exception: Sentinel Automated Session Quarantine",
    "type": "EXCEPTION",
    "nodeType": "EXCEPTION",
    "domain": "sentinel",
    "category": "scenario",
    "route": "/api/sentinel/quarantine",
    "layer": "global",
    "roles": [
      "visitor",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "sentinel"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Triggered when masked session crosses velocity or scraping trajectory thresholds.",
    "description": "Flags session hash and serves an invisible Cloudflare Turnstile human verification challenge.",
    "actions": [
      "Write Session Hash to blocked_sessions",
      "Serve Turnstile CAPTCHA Challenge"
    ],
    "conditions": [
      "Session velocity threshold crossed"
    ],
    "systems": [
      "SentinelLayer.js",
      "Cloudflare Turnstile"
    ],
    "components": [
      "SentinelLayer.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase blocked_sessions"
    ],
    "database": "Supabase blocked_sessions",
    "auth": "public",
    "exceptions": [
      "Repeated failure of human verification challenge"
    ],
    "recovery": [
      "Short-circuit and drop connection at Cloudflare/Vercel Edge level"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_exc_bot_quarantine_viewed",
      "properties": {
        "domain": "sentinel",
        "route": "/api/sentinel/quarantine"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3050,
    "y": 3450,
    "parents": [
      "sys_velocity_radar"
    ],
    "children": [
      "rec_turnstile_challenge",
      "terminal_edge_blacklist"
    ],
    "actorRoles": [
      "visitor",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_exc_bot_quarantine_behavior",
        "text": "Exception: Sentinel Automated Session Quarantine enforces defined sentinel behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "dashboard_buyer",
    "canonicalId": "seeker.dashboard",
    "name": "Buyer Workspace (Management & Continuity)",
    "label": "Buyer Workspace (Management & Continuity)",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "layer",
    "category": "architecture",
    "route": "/dashboard?workspace=buyer",
    "layer": "core",
    "roles": [
      "seeker"
    ],
    "visibility": [
      "SEEKER"
    ],
    "goals": [
      "track_saved_spaces",
      "manage_active_deals"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Personal decision cockpit: Your Board, Saved Intelligence, Area Watches, Recent Changes, and Return Brief.",
    "description": "Central workspace for buyers. Does not duplicate public discovery; focuses on continuity, comparisons, and active viewings.",
    "actions": [
      "Review Return Brief",
      "Manage Saved Properties",
      "Track Watched Areas",
      "Continue Comparing Spaces"
    ],
    "conditions": [
      "Authenticated Seeker"
    ],
    "systems": [
      "BuyerMode.js",
      "ReturnBrief.js",
      "DashboardContext.js"
    ],
    "components": [
      "BuyerMode.js",
      "ReturnBrief.js",
      "DashboardContext.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase saved_intel & deals"
    ],
    "database": "Supabase saved_intel & deals",
    "auth": "seeker",
    "exceptions": [
      "No recent changes since last login"
    ],
    "recovery": [
      "Confident All-Clear State: 'You are up to date. Everything you follow is unchanged.'"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/dashboard/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BuyerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Central workspace for buyers. Does not duplicate public discovery; focuses on continuity, comparisons, and active viewings.",
      "target": "dashboard_buyer",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_dashboard_buyer_viewed",
      "properties": {
        "domain": "layer",
        "route": "/dashboard?workspace=buyer"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3850,
    "y": 250,
    "parents": [
      "login",
      "auth_onboarding_flow",
      "wishlist"
    ],
    "children": [
      "comp_return_brief_buyer",
      "compare_specs_matrix"
    ],
    "actorRoles": [
      "seeker"
    ],
    "uiAudience": [
      "SEEKER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_dashboard_buyer_behavior",
        "text": "Buyer Workspace (Management & Continuity) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/dashboard/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/BuyerMode.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "comp_return_brief_buyer",
    "canonicalId": "seeker.return_brief",
    "name": "Component: Buyer Return Brief Catchup",
    "label": "Component: Buyer Return Brief Catchup",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "layer",
    "category": "architecture",
    "route": "/dashboard#return-brief",
    "layer": "core",
    "roles": [
      "seeker"
    ],
    "visibility": [
      "SEEKER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "PARTIAL",
    "purpose": "30-second catchup banner summarizing price changes, status updates, and new spaces in watched areas since last login.",
    "description": "Eliminates repetitive re-scouting. If nothing changed, renders confident all-clear acknowledgment.",
    "actions": [
      "Inspect Changed Spaces",
      "Review Inactive Status Flags",
      "Dismiss Return Brief"
    ],
    "conditions": [
      "User logged in after >= 1 hour absence"
    ],
    "systems": [
      "ReturnBrief.js",
      "dashboardState.js"
    ],
    "components": [
      "ReturnBrief.js",
      "dashboardState.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase saved_intel & properties"
    ],
    "database": "Supabase saved_intel & properties",
    "auth": "seeker",
    "exceptions": [
      "All followed spaces deleted or inactive"
    ],
    "recovery": [
      "Suggest fresh spaces from matching district clusters"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_comp_return_brief_buyer_viewed",
      "properties": {
        "domain": "layer",
        "route": "/dashboard#return-brief"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3850,
    "y": 450,
    "parents": [
      "dashboard_buyer"
    ],
    "children": [],
    "actorRoles": [
      "seeker"
    ],
    "uiAudience": [
      "SEEKER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_comp_return_brief_buyer_behavior",
        "text": "Component: Buyer Return Brief Catchup enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "LIMITED_LIVE"
  },
  {
    "id": "dashboard_owner",
    "canonicalId": "owner.dashboard",
    "name": "Owner Workspace & Property Management",
    "label": "Owner Workspace & Property Management",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "layer",
    "category": "architecture",
    "route": "/dashboard",
    "layer": "core",
    "roles": [
      "owner"
    ],
    "visibility": [
      "OWNER"
    ],
    "goals": [
      "manage_listings",
      "review_inquiries",
      "confirm_freshness"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Owner portal: active listings, inquiry inbox, unit inventory management, and representation invitations.",
    "description": "Dashboard for individual property owners. Displays live leads, freshness reminders, and representation status.",
    "actions": [
      "Launch Listing Creator",
      "Manage Unit Inventory",
      "Invite Verified Broker (1 Connect)",
      "Review Buyer Inquiries"
    ],
    "conditions": [
      "Authenticated Owner"
    ],
    "systems": [
      "OwnerMode.js",
      "InventoryGridManager.js",
      "DashboardContext.js"
    ],
    "components": [
      "OwnerMode.js",
      "InventoryGridManager.js",
      "DashboardContext.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties & deals"
    ],
    "database": "Supabase properties & deals",
    "auth": "owner",
    "exceptions": [
      "Owner listing over tier limit after downgrade"
    ],
    "recovery": [
      "Oldest listing soft-locked until tier upgraded (Rule 1.2)"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Dashboard for individual property owners. Displays live leads, freshness reminders, and representation status.",
      "target": "dashboard_owner",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_dashboard_owner_viewed",
      "properties": {
        "domain": "layer",
        "route": "/dashboard?workspace=owner"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3850,
    "y": 700,
    "parents": [
      "login",
      "auth_onboarding_flow",
      "sys_monthly_scout_wrap",
      "rec_confirm_freshness_click",
      "auth_enterprise_sso"
    ],
    "children": [
      "owner_creation_pipeline",
      "sys_double_optin_handshake",
      "comp_return_brief_owner",
      "scenario_offmarket_pitch",
      "sys_monthly_scout_wrap",
      "sys_freshness_staleness_engine"
    ],
    "actorRoles": [
      "owner"
    ],
    "uiAudience": [
      "OWNER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_dashboard_owner_behavior",
        "text": "Owner Workspace & Property Management enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/OwnerMode.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "viewState": "OWNER",
    "routeType": "QUERY_STATE_VARIANT",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "comp_return_brief_owner",
    "canonicalId": "owner.return_brief",
    "name": "Component: Owner Leads & Freshness Brief",
    "label": "Component: Owner Leads & Freshness Brief",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "layer",
    "category": "architecture",
    "route": "/dashboard#owner-brief",
    "layer": "core",
    "roles": [
      "owner"
    ],
    "visibility": [
      "OWNER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "PARTIAL",
    "purpose": "Highlights unread buyer leads, pending broker representation pitches, and 90-day listing freshness check.",
    "description": "Provides owners immediate operational clarity on who is engaging with their spaces.",
    "actions": [
      "Review Unread Inquiries",
      "Accept/Decline Broker Pitch",
      "Confirm Listing Freshness Attestation"
    ],
    "conditions": [
      "Owner has active listings"
    ],
    "systems": [
      "OwnerMode.js",
      "FreshnessReminder.js"
    ],
    "components": [
      "OwnerMode.js",
      "FreshnessReminder.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals & properties"
    ],
    "database": "Supabase deals & properties",
    "auth": "owner",
    "exceptions": [
      "Freshness check expired (>90 days)"
    ],
    "recovery": [
      "Prompt 1-click confirmation: 'Yes, this property is still available at stated terms'"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_comp_return_brief_owner_viewed",
      "properties": {
        "domain": "layer",
        "route": "/dashboard#owner-brief"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3850,
    "y": 900,
    "parents": [
      "dashboard_owner"
    ],
    "children": [],
    "actorRoles": [
      "owner"
    ],
    "uiAudience": [
      "OWNER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_comp_return_brief_owner_behavior",
        "text": "Component: Owner Leads & Freshness Brief enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "LIMITED_LIVE"
  },
  {
    "id": "dashboard_broker",
    "canonicalId": "broker.dashboard",
    "name": "Broker Workspace & Deal Pipeline",
    "label": "Broker Workspace & Deal Pipeline",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "layer",
    "category": "architecture",
    "route": "/dashboard",
    "layer": "core",
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "goals": [
      "manage_roster",
      "host_viewings",
      "close_handshakes"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Broker portal: active listings against tier cap, client deal pipeline, viewing schedule, and representation pitches.",
    "description": "Professional cockpit for PRC brokers. Tracks active listings against tier cap (Starry: 3, Solar: 15, Cluster: 50, Universe: ∞).",
    "actions": [
      "Pitch Owner for Representation (1 Connect)",
      "Accept Viewing Request",
      "Manage Active Deal Room",
      "Trigger Transaction Handshake"
    ],
    "conditions": [
      "Authenticated Licensed Broker"
    ],
    "systems": [
      "BrokerMode.js",
      "DealPipeline.js",
      "DashboardContext.js"
    ],
    "components": [
      "BrokerMode.js",
      "DealPipeline.js",
      "DashboardContext.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals & properties"
    ],
    "database": "Supabase deals & properties",
    "auth": "broker",
    "exceptions": [
      "Broker at listing cap limit when receiving new representation invite"
    ],
    "recovery": [
      "Show pending invite banner with 'Free a slot or upgrade tier to accept' prompt"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BrokerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Professional cockpit for PRC brokers. Tracks active listings against tier cap (Starry: 3, Solar: 15, Cluster: 50, Universe: ∞).",
      "target": "dashboard_broker",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_dashboard_broker_viewed",
      "properties": {
        "domain": "layer",
        "route": "/dashboard?workspace=broker"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3850,
    "y": 1150,
    "parents": [
      "login",
      "auth_onboarding_flow",
      "brokers_roster",
      "sys_zero_log_ai_crm",
      "sys_monthly_scout_wrap",
      "rec_confirm_freshness_click",
      "auth_enterprise_sso"
    ],
    "children": [
      "sys_double_optin_handshake",
      "comp_return_brief_broker",
      "broker_field_briefing",
      "sys_monthly_scout_wrap",
      "sys_freshness_staleness_engine"
    ],
    "actorRoles": [
      "broker"
    ],
    "uiAudience": [
      "BROKER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_dashboard_broker_behavior",
        "text": "Broker Workspace & Deal Pipeline enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/BrokerMode.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.represent_client"
    ],
    "resourceRelationship": [
      "ASSIGNED_BROKER"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": true,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "viewState": "BROKER",
    "routeType": "QUERY_STATE_VARIANT",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "comp_return_brief_broker",
    "canonicalId": "broker.return_brief",
    "name": "Component: Broker Schedule & Pipeline Brief",
    "label": "Component: Broker Schedule & Pipeline Brief",
    "type": "SECTION",
    "nodeType": "SECTION",
    "domain": "layer",
    "category": "architecture",
    "route": "/dashboard#broker-brief",
    "layer": "core",
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "PARTIAL",
    "purpose": "Summarizes today's viewing appointments, pending client representation responses, and active deal milestones.",
    "description": "Focuses broker attention on time-critical viewing logistics and active buyer negotiations.",
    "actions": [
      "Check Today's Viewing Agenda",
      "Open Pending Client Deal Rooms",
      "Review Listing Cap Usage"
    ],
    "conditions": [
      "Broker has active deals or representation"
    ],
    "systems": [
      "BrokerMode.js",
      "ViewingCalendar.js"
    ],
    "components": [
      "BrokerMode.js",
      "ViewingCalendar.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals & viewing_schedules"
    ],
    "database": "Supabase deals & viewing_schedules",
    "auth": "broker",
    "exceptions": [
      "Viewing scheduled within next 2 hours"
    ],
    "recovery": [
      "Highlight with high-priority amber notification banner"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_comp_return_brief_broker_viewed",
      "properties": {
        "domain": "layer",
        "route": "/dashboard#broker-brief"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3850,
    "y": 1350,
    "parents": [
      "dashboard_broker"
    ],
    "children": [],
    "actorRoles": [
      "broker"
    ],
    "uiAudience": [
      "BROKER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_comp_return_brief_broker_behavior",
        "text": "Component: Broker Schedule & Pipeline Brief enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.represent_client"
    ],
    "resourceRelationship": [
      "ASSIGNED_BROKER"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": true,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "LIMITED_LIVE"
  },
  {
    "id": "dashboard_provider",
    "canonicalId": "provider.dashboard",
    "name": "Provider Workspace & QuestIT Bounties",
    "label": "Provider Workspace & QuestIT Bounties",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "layer",
    "category": "architecture",
    "route": "/dashboard",
    "layer": "core",
    "roles": [
      "provider"
    ],
    "visibility": [
      "PROVIDER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Workspace for photographers, researchers, and event designers: active assignments, deliverables, and QuestIT bounties.",
    "description": "Enables spatial creators and researchers to earn Connects and bounties by completing verified spatial assignments.",
    "actions": [
      "Browse QuestIT Board",
      "Submit Spatial Bounty Proposal",
      "Upload Completed Deliverable 3D Media"
    ],
    "conditions": [
      "Authenticated Provider profile"
    ],
    "systems": [
      "ProviderMode.js",
      "QuestItBoard.js",
      "DashboardContext.js"
    ],
    "components": [
      "ProviderMode.js",
      "QuestItBoard.js",
      "DashboardContext.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase bounties & deliverables"
    ],
    "database": "Supabase bounties & deliverables",
    "auth": "provider",
    "exceptions": [
      "Bad faith bounty deliverable submitted"
    ],
    "recovery": [
      "Quest resubmitted to board; hunter penalized with low rating (Rule 3.4)"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/ProviderMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Enables spatial creators and researchers to earn Connects and bounties by completing verified spatial assignments.",
      "target": "dashboard_provider",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_dashboard_provider_viewed",
      "properties": {
        "domain": "layer",
        "route": "/dashboard?workspace=provider"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3850,
    "y": 1600,
    "parents": [
      "login",
      "auth_onboarding_flow",
      "photographers_roster",
      "researchers_roster",
      "planners_roster",
      "provider_bounty_handshake"
    ],
    "children": [
      "deal_room",
      "provider_bounty_handshake"
    ],
    "actorRoles": [
      "provider"
    ],
    "uiAudience": [
      "PROVIDER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_dashboard_provider_behavior",
        "text": "Provider Workspace & QuestIT Bounties enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/ProviderMode.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "viewState": "PROVIDER",
    "routeType": "QUERY_STATE_VARIANT",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "deal_room",
    "canonicalId": "deal.room.chat",
    "name": "Private Deal Room & Scheduling Cockpit",
    "label": "Private Deal Room & Scheduling Cockpit",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "deal",
    "category": "architecture",
    "route": "/deal/[id]",
    "layer": "core",
    "roles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "goals": [
      "deal"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "End-to-end deal management cockpit: viewing calendar, chat messages, offer negotiation, and milestone tracking.",
    "description": "Encrypted workspace where buyer, broker, and owner coordinate viewings, review terms, and finalize handshakes.",
    "actions": [
      "Confirm Viewing Appointment",
      "Exchange In-App Chat Messages",
      "Counter Offer Terms",
      "Complete Two-Sided Handshake"
    ],
    "conditions": [
      "Authorized participant on private deal"
    ],
    "systems": [
      "DealRoomCockpit.js",
      "ChatBox.js",
      "ViewingCalendar.js"
    ],
    "components": [
      "DealRoomCockpit.js",
      "ChatBox.js",
      "ViewingCalendar.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals, messages, viewing_schedules"
    ],
    "database": "Supabase deals, messages, viewing_schedules",
    "auth": "seeker",
    "exceptions": [
      "Chat closed after deal completion"
    ],
    "recovery": [
      "7-day read-only grace period before permanent message content purge (Rule 8.1)"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/ChatBox.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/messages/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Encrypted workspace where buyer, broker, and owner coordinate viewings, review terms, and finalize handshakes.",
      "target": "deal-room-negotiation-panel",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_deal_room_viewed",
      "properties": {
        "domain": "deal",
        "route": "/deal/[id]"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3850,
    "y": 1900,
    "parents": [
      "sys_connect_wallet",
      "booking_modal",
      "gate_offer",
      "dashboard_provider",
      "reschedule_modal",
      "scenario_broker_lead_collision",
      "broker_field_briefing"
    ],
    "children": [
      "gate_viewing",
      "sys_transaction_handshake",
      "terminal_deal_closed",
      "sys_zero_log_ai_crm"
    ],
    "actorRoles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_deal_room_behavior",
        "text": "Private Deal Room & Scheduling Cockpit enforces defined deal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/ChatBox.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "API",
            "path": "src/app/api/deals/[id]/messages/route.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "pilotState": "OPEN",
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "mission_control",
    "canonicalId": "admin.mission_control",
    "name": "Mission Control (Staff Operations Hub)",
    "label": "Mission Control (Staff Operations Hub)",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "admin",
    "category": "architecture",
    "route": "/mission-control",
    "layer": "core",
    "roles": [
      "staff",
      "enterprise"
    ],
    "visibility": [
      "STAFF",
      "ADMIN"
    ],
    "goals": [
      "admin"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Staff-only exceptions-first operations hub: Disputes Hub, Mission Kanban, PRC compliance queue, and Sentinel Radar.",
    "description": "Internal operations center for ScoutIt operators. Resolves AI Council deadlocks, monitors scrapers, and audits listings.",
    "actions": [
      "Resolve Broker Dispute (Owner Sovereignty)",
      "Review AI Council Deadlock Queue",
      "Verify Broker PRC License",
      "Inspect Sentinel Velocity Radar"
    ],
    "conditions": [
      "Staff role authenticated via Supabase RLS"
    ],
    "systems": [
      "MissionControlDashboard.js",
      "DisputesHub.js",
      "SentinelRadar.js"
    ],
    "components": [
      "MissionControlDashboard.js",
      "DisputesHub.js",
      "SentinelRadar.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase staff_audit_log, disputes, properties"
    ],
    "database": "Supabase staff_audit_log, disputes, properties",
    "auth": "staff",
    "exceptions": [
      "Unauthorized non-staff access attempt"
    ],
    "recovery": [
      "Supabase RLS rejects request; redirect to /auth/login"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/MissionControlMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/adminGuard.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Internal operations center for ScoutIt operators. Resolves AI Council deadlocks, monitors scrapers, and audits listings.",
      "target": "mission_control",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_mission_control_viewed",
      "properties": {
        "domain": "admin",
        "route": "/mission-control"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ENTERPRISE_MISSION_CONTROL_SPEC.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3850,
    "y": 2300,
    "parents": [
      "login",
      "sys_connect_hemorrhage_guard",
      "claim_listing_modal",
      "sys_zero_log_ai_crm",
      "provider_bounty_handshake",
      "auth_enterprise_sso"
    ],
    "children": [
      "scenario_prc_expired_notice",
      "scenario_pii_erasure",
      "rec_manual_approval_queue",
      "sys_monthly_scout_wrap",
      "sys_freshness_staleness_engine"
    ],
    "actorRoles": [
      "staff",
      "enterprise"
    ],
    "uiAudience": [
      "STAFF",
      "ADMIN"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_mission_control_behavior",
        "text": "Mission Control (Staff Operations Hub) enforces defined admin behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/MissionControlMode.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "CODE",
            "path": "src/lib/adminGuard.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "staff.audit_access"
    ],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "exc_insufficient_connects",
    "canonicalId": "connects.exc.insufficient",
    "name": "Exception: Zero Connects Balance",
    "label": "Exception: Zero Connects Balance",
    "type": "EXCEPTION",
    "nodeType": "EXCEPTION",
    "domain": "connects",
    "category": "scenario",
    "route": "/api/deals/spend-connect",
    "layer": "global",
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "connects"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Triggered when a user attempts a paid action (inquiry or pitch) without available Connects in any of the 3 buckets.",
    "description": "Halts action dispatch and directs user to the Top-Up Connects Modal.",
    "actions": [
      "Block Message Dispatch",
      "Display Insufficient Balance Modal"
    ],
    "conditions": [
      "Connects balance === 0"
    ],
    "systems": [
      "spend_connects RPC",
      "ConnectsModal.js"
    ],
    "components": [
      "ConnectsModal.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase connect_balances"
    ],
    "database": "Supabase connect_balances",
    "auth": "seeker",
    "exceptions": [
      "Payment checkout canceled by user"
    ],
    "recovery": [
      "Return user to previous screen with unspent action staged"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/connectsWallet.js",
        "symbol": "ERROR_INSUFFICIENT_CONNECTS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/connects/ConnectsReceipt.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_exc_insufficient_connects_viewed",
      "properties": {
        "domain": "connects",
        "route": "/api/deals/spend-connect"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 100,
    "parents": [
      "inquiry_modal"
    ],
    "children": [
      "rec_topup_connects"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_exc_insufficient_connects_behavior",
        "text": "Exception: Zero Connects Balance enforces defined connects behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/connectsWallet.js",
            "symbol": "ERROR_INSUFFICIENT_CONNECTS",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "COMPONENT",
            "path": "src/components/connects/ConnectsReceipt.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "pilotState": "BLOCKED",
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PRIVATE_PILOT"
  },
  {
    "id": "rec_topup_connects",
    "canonicalId": "connects.rec.topup",
    "name": "Recovery: Top-Up Connects Pack Checkout",
    "label": "Recovery: Top-Up Connects Pack Checkout",
    "type": "RECOVERY",
    "nodeType": "RECOVERY",
    "domain": "connects",
    "category": "scenario",
    "route": "/checkout/connects",
    "layer": "global",
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "connects"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "User purchases a permanent Connects pack (PayMongo / GCash / Card) to replenish their wallet.",
    "description": "Adds permanent Purchased Connects to the user's wallet and returns them directly to their staged inquiry modal.",
    "actions": [
      "Select Connects Pack (5 / 15 / 50)",
      "Complete Secure Checkout",
      "Credit Purchased Balance"
    ],
    "conditions": [
      "Valid payment source"
    ],
    "systems": [
      "ConnectsCheckout.js",
      "connect_transactions"
    ],
    "components": [
      "ConnectsCheckout.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase connect_balances"
    ],
    "database": "Supabase connect_balances",
    "auth": "seeker",
    "exceptions": [
      "Payment processing gateway failure"
    ],
    "recovery": [
      "Retry with secondary payment provider or customer support ticket"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/pricing/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/06_MONETIZATION/PRICING_MODEL.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_rec_topup_connects_viewed",
      "properties": {
        "domain": "connects",
        "route": "/checkout/connects"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 300,
    "parents": [
      "exc_insufficient_connects"
    ],
    "children": [
      "inquiry_modal"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_rec_topup_connects_behavior",
        "text": "Recovery: Top-Up Connects Pack Checkout enforces defined connects behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/pricing/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/06_MONETIZATION/PRICING_MODEL.md",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PRIVATE_PILOT"
  },
  {
    "id": "exc_slot_conflict",
    "canonicalId": "deal.viewing.exc.slot_conflict",
    "name": "Exception: Viewing Slot Schedule Conflict",
    "label": "Exception: Viewing Slot Schedule Conflict",
    "type": "EXCEPTION",
    "nodeType": "EXCEPTION",
    "domain": "layer",
    "category": "scenario",
    "route": "/api/deals/schedule-viewing",
    "layer": "core",
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Triggered when chosen viewing slot is double-booked or falls outside broker working hours.",
    "description": "Prevents calendar collisions by evaluating current confirmed bookings.",
    "actions": [
      "Detect Calendar Collision",
      "Flag Conflict to Seeker"
    ],
    "conditions": [
      "Slot overlapping existing confirmed booking"
    ],
    "systems": [
      "ViewingScheduler.js"
    ],
    "components": [
      "ViewingScheduler.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase viewing_schedules"
    ],
    "database": "Supabase viewing_schedules",
    "auth": "seeker",
    "exceptions": [
      "No open slots on selected date"
    ],
    "recovery": [
      "Suggest nearby open dates with open broker availability"
    ],
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/schedule/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_exc_slot_conflict_viewed",
      "properties": {
        "domain": "layer",
        "route": "/api/deals/schedule-viewing"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 500,
    "parents": [
      "booking_modal"
    ],
    "children": [
      "rec_propose_alt_slot"
    ],
    "actorRoles": [
      "seeker",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_exc_slot_conflict_behavior",
        "text": "Exception: Viewing Slot Schedule Conflict enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "API",
            "path": "src/app/api/deals/[id]/schedule/route.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "rec_propose_alt_slot",
    "canonicalId": "deal.viewing.rec.propose_alt_slot",
    "name": "Recovery: Select Alternative Open Slot",
    "label": "Recovery: Select Alternative Open Slot",
    "type": "RECOVERY",
    "nodeType": "RECOVERY",
    "domain": "layer",
    "category": "scenario",
    "route": "/api/deals/schedule-viewing",
    "layer": "core",
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Seeker selects an alternative recommended time slot and resubmits the booking request.",
    "description": "Resolves calendar collision by choosing a verified open window.",
    "actions": [
      "Pick Available Time Slot",
      "Resubmit Booking Request"
    ],
    "conditions": [
      "Open slot selected"
    ],
    "systems": [
      "ViewingScheduler.js"
    ],
    "components": [
      "ViewingScheduler.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase viewing_schedules"
    ],
    "database": "Supabase viewing_schedules",
    "auth": "seeker",
    "exceptions": [
      "None"
    ],
    "recovery": [
      "Directly returns to booking modal with confirmed reservation"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BookingModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_rec_propose_alt_slot_viewed",
      "properties": {
        "domain": "layer",
        "route": "/api/deals/schedule-viewing"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 700,
    "parents": [
      "exc_slot_conflict"
    ],
    "children": [
      "booking_modal"
    ],
    "actorRoles": [
      "seeker",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_rec_propose_alt_slot_behavior",
        "text": "Recovery: Select Alternative Open Slot enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/BookingModal.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "pilotState": "RESCHEDULE_PENDING",
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "exc_contact_leak_blocked",
    "canonicalId": "sentinel.exc.contact_leak",
    "name": "Exception: Contact Information Leak Redacted",
    "label": "Exception: Contact Information Leak Redacted",
    "type": "EXCEPTION",
    "nodeType": "EXCEPTION",
    "domain": "sentinel",
    "category": "scenario",
    "route": "/lib/sanitize.js",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "sentinel"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Triggered when public FAQ question contains raw phone numbers, email addresses, or Viber handles.",
    "description": "The sanitize filter intercepts the string to prevent off-platform disintermediation.",
    "actions": [
      "Detect Regex Contact Match",
      "Trigger Redaction Warning"
    ],
    "conditions": [
      "Pattern matches phone/email regex in public FAQ"
    ],
    "systems": [
      "sanitize.js"
    ],
    "components": [
      "sanitize.js"
    ],
    "apis": [],
    "dataRefs": [
      "None"
    ],
    "database": "None",
    "auth": "public",
    "exceptions": [
      "Attempt to circumvent with spelled-out words"
    ],
    "recovery": [
      "Phonetic word normalizer catches spelled-out digits"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_exc_contact_leak_blocked_viewed",
      "properties": {
        "domain": "sentinel",
        "route": "/lib/sanitize.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 900,
    "parents": [
      "action_ask_faq"
    ],
    "children": [
      "rec_redact_contact_faq"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_exc_contact_leak_blocked_behavior",
        "text": "Exception: Contact Information Leak Redacted enforces defined sentinel behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "rec_redact_contact_faq",
    "canonicalId": "sentinel.rec.redact_contact",
    "name": "Recovery: Redact Contact & Post Safe FAQ Text",
    "label": "Recovery: Redact Contact & Post Safe FAQ Text",
    "type": "RECOVERY",
    "nodeType": "RECOVERY",
    "domain": "faq",
    "category": "scenario",
    "route": "/api/faq/ask",
    "layer": "core",
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "faq"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Replaces leaked contact string with safe token and posts redacted question to public board.",
    "description": "Inserts `[CONTACT REDACTED: SPEND 1 CONNECT TO MESSAGE BROKER]` in place of the leaked numbers.",
    "actions": [
      "Apply Tokenized Redaction",
      "Post Cleaned Question to Public FAQ"
    ],
    "conditions": [
      "Redacted text validated"
    ],
    "systems": [
      "FaqWidget.js",
      "sanitize.js"
    ],
    "components": [
      "FaqWidget.js",
      "sanitize.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase property_faqs"
    ],
    "database": "Supabase property_faqs",
    "auth": "public",
    "exceptions": [
      "None"
    ],
    "recovery": [
      "Question successfully published to property page"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_rec_redact_contact_faq_viewed",
      "properties": {
        "domain": "faq",
        "route": "/api/faq/ask"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 1100,
    "parents": [
      "exc_contact_leak_blocked"
    ],
    "children": [
      "action_ask_faq"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_rec_redact_contact_faq_behavior",
        "text": "Recovery: Redact Contact & Post Safe FAQ Text enforces defined faq behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "exc_viewing_noshow",
    "canonicalId": "deal.viewing.exc.noshow",
    "name": "Exception: Viewing No-Show / Cancellation",
    "label": "Exception: Viewing No-Show / Cancellation",
    "type": "EXCEPTION",
    "nodeType": "EXCEPTION",
    "domain": "deal",
    "category": "scenario",
    "route": "/api/deals/viewing-noshow",
    "layer": "core",
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "deal"
    ],
    "implementationStatus": "PARTIAL",
    "purpose": "Triggered when either buyer or broker cannot attend the confirmed viewing appointment.",
    "description": "Flags the viewing record and launches the Reschedule Recovery Modal.",
    "actions": [
      "Record Cancellation / Missed Check-in",
      "Notify Both Parties"
    ],
    "conditions": [
      "Appointment missed or canceled before arrival"
    ],
    "systems": [
      "ViewingCalendar.js",
      "deal_milestones"
    ],
    "components": [
      "ViewingCalendar.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals & viewing_schedules"
    ],
    "database": "Supabase deals & viewing_schedules",
    "auth": "seeker",
    "exceptions": [
      "Repeated bad-faith cancellations (>3 times)"
    ],
    "recovery": [
      "Flag account for staff review in Mission Control"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_exc_viewing_noshow_viewed",
      "properties": {
        "domain": "deal",
        "route": "/api/deals/viewing-noshow"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 1300,
    "parents": [
      "gate_viewing"
    ],
    "children": [
      "reschedule_modal"
    ],
    "actorRoles": [
      "seeker",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_exc_viewing_noshow_behavior",
        "text": "Exception: Viewing No-Show / Cancellation enforces defined deal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "LIMITED_LIVE"
  },
  {
    "id": "reschedule_modal",
    "canonicalId": "deal.viewing.reschedule",
    "name": "Recovery: Viewing Reschedule Modal",
    "label": "Recovery: Viewing Reschedule Modal",
    "type": "ACTION",
    "nodeType": "ACTION",
    "domain": "deal",
    "category": "scenario",
    "route": "/deal/[id]/reschedule",
    "layer": "core",
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "deal"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Allows parties to mutually agree on a new date and time slot without losing deal context.",
    "description": "Re-opens the calendar scheduler and updates the private deal room schedule record.",
    "actions": [
      "Select New Date & Slot",
      "Submit Reschedule Proposal",
      "Confirm Updated Appointment"
    ],
    "conditions": [
      "Active deal room session"
    ],
    "systems": [
      "RescheduleModal.js",
      "ViewingCalendar.js"
    ],
    "components": [
      "RescheduleModal.js",
      "ViewingCalendar.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase viewing_schedules"
    ],
    "database": "Supabase viewing_schedules",
    "auth": "seeker",
    "exceptions": [
      "None"
    ],
    "recovery": [
      "Restores deal room to scheduled viewing state"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BookingModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/viewing-appointments/[id]/route.js",
        "symbol": "PATCH",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Re-opens the calendar scheduler and updates the private deal room schedule record.",
      "target": "reschedule_modal",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_reschedule_modal_viewed",
      "properties": {
        "domain": "deal",
        "route": "/deal/[id]/reschedule"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 1500,
    "parents": [
      "exc_viewing_noshow"
    ],
    "children": [
      "deal_room"
    ],
    "actorRoles": [
      "seeker",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "AUTHENTICATED"
    ],
    "securityClassification": "AUTHENTICATED",
    "claims": [
      {
        "id": "claim_reschedule_modal_behavior",
        "text": "Recovery: Viewing Reschedule Modal enforces defined deal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/BookingModal.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "API",
            "path": "src/app/api/viewing-appointments/[id]/route.js",
            "symbol": "PATCH",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "pilotState": "RESCHEDULE_PENDING",
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "exc_missing_pdf_metric",
    "canonicalId": "owner.pdf.exc.missing_metric",
    "name": "Playbook 2.1 — Honest Blank Rule Exception",
    "label": "Playbook 2.1 — Honest Blank Rule Exception",
    "type": "EXCEPTION",
    "nodeType": "EXCEPTION",
    "domain": "owner",
    "category": "scenario",
    "route": "/lib/aiListingEngine.js",
    "layer": "mantle",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "owner"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Triggered when AI Listing Engine cannot locate a specific metric (e.g. ceiling height) in the owner's PDF.",
    "description": "The AI never invents or hallucinates data. It leaves the field blank and flags the record for the human review queue.",
    "actions": [
      "Flag Field as Honest Blank",
      "Create Verification Queue Item",
      "Prompt Owner for Manual Input"
    ],
    "conditions": [
      "Metric unverified in PDF source"
    ],
    "systems": [
      "aiListingEngine.js",
      "ListingEngineSop.md"
    ],
    "components": [
      "aiListingEngine.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties"
    ],
    "database": "Supabase properties",
    "auth": "owner",
    "exceptions": [
      "Owner attempts to publish with critical required field empty"
    ],
    "recovery": [
      "Prompt owner to manually type value in Property Review Workspace (Holder of Truth Rule 2.2)"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_exc_missing_pdf_metric_viewed",
      "properties": {
        "domain": "owner",
        "route": "/lib/aiListingEngine.js"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 1750,
    "parents": [
      "sys_ai_arbiter",
      "ai_listing_engine"
    ],
    "children": [
      "rec_owner_manual_override"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_exc_missing_pdf_metric_behavior",
        "text": "Playbook 2.1 — Honest Blank Rule Exception enforces defined owner behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "rec_owner_manual_override",
    "canonicalId": "owner.pdf.rec.manual_override",
    "name": "Playbook 2.2 — Holder of Truth (Owner Override)",
    "label": "Playbook 2.2 — Holder of Truth (Owner Override)",
    "type": "RECOVERY",
    "nodeType": "RECOVERY",
    "domain": "layer",
    "category": "scenario",
    "route": "/dashboard/create/advanced",
    "layer": "mantle",
    "roles": [
      "owner"
    ],
    "visibility": [
      "OWNER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Owner exercises absolute sovereignty to manually input or correct any field left blank by the AI.",
    "description": "Owner-supplied facts override AI extraction, preserving data integrity without forcing approval delays.",
    "actions": [
      "Input Verified Metric Manually",
      "Attest to Accuracy",
      "Clear Verification Queue Item"
    ],
    "conditions": [
      "Authenticated property owner"
    ],
    "systems": [
      "AdvancedChapterEditor.js"
    ],
    "components": [
      "AdvancedChapterEditor.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties"
    ],
    "database": "Supabase properties",
    "auth": "owner",
    "exceptions": [
      "Manual value contradicts title deed"
    ],
    "recovery": [
      "Route to Mission Control Title Verification Queue"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_rec_owner_manual_override_viewed",
      "properties": {
        "domain": "layer",
        "route": "/dashboard/create/advanced"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 1950,
    "parents": [
      "exc_missing_pdf_metric"
    ],
    "children": [
      "api_publish_listing"
    ],
    "actorRoles": [
      "owner"
    ],
    "uiAudience": [
      "OWNER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_rec_owner_manual_override_behavior",
        "text": "Playbook 2.2 — Holder of Truth (Owner Override) enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "exc_ai_deadlock",
    "canonicalId": "owner.ai.exc.deadlock",
    "name": "Playbook 2.3 — AI Council Deadlock Exception",
    "label": "Playbook 2.3 — AI Council Deadlock Exception",
    "type": "EXCEPTION",
    "nodeType": "EXCEPTION",
    "domain": "layer",
    "category": "scenario",
    "route": "/mission-control/deadlocks",
    "layer": "mantle",
    "roles": [
      "staff"
    ],
    "visibility": [
      "STAFF"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "PARTIAL",
    "purpose": "Triggered when government documentation contradicts the owner's pitch deck, creating an AI stalemate.",
    "description": "The AI Council forces a stalemate and routes the listing to Mission Control manual verification queue.",
    "actions": [
      "Freeze Automatic Publish",
      "Route to Mission Control Approval Queue",
      "Notify Staff Operator"
    ],
    "conditions": [
      "Contradictory data sources detected"
    ],
    "systems": [
      "aiCouncil.js",
      "DisputesHub.js"
    ],
    "components": [
      "aiCouncil.js",
      "DisputesHub.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase staff_audit_log"
    ],
    "database": "Supabase staff_audit_log",
    "auth": "staff",
    "exceptions": [
      "Staff operator unavailable for manual review"
    ],
    "recovery": [
      "Listing held in pending review state with owner notification"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_exc_ai_deadlock_viewed",
      "properties": {
        "domain": "layer",
        "route": "/mission-control/deadlocks"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 2150,
    "parents": [
      "sys_ai_arbiter",
      "ai_listing_engine"
    ],
    "children": [
      "rec_manual_approval_queue"
    ],
    "actorRoles": [
      "staff"
    ],
    "uiAudience": [
      "STAFF"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_exc_ai_deadlock_behavior",
        "text": "Playbook 2.3 — AI Council Deadlock Exception enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PARTIAL",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "LIMITED_LIVE"
  },
  {
    "id": "rec_manual_approval_queue",
    "canonicalId": "owner.ai.rec.manual_queue",
    "name": "Playbook 2.3 — Mission Control Approval Queue",
    "label": "Playbook 2.3 — Mission Control Approval Queue",
    "type": "RECOVERY",
    "nodeType": "RECOVERY",
    "domain": "layer",
    "category": "scenario",
    "route": "/mission-control/approval",
    "layer": "mantle",
    "roles": [
      "staff"
    ],
    "visibility": [
      "STAFF"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Human operator reviews contradictory documents, cross-checks registry, and resolves stalemate.",
    "description": "Staff verifies ground truth and manually approves or requests clarification from the owner.",
    "actions": [
      "Inspect Contradictory Records",
      "Confirm Ground Truth",
      "Authorize Listing Publication"
    ],
    "conditions": [
      "Authenticated staff credentials"
    ],
    "systems": [
      "MissionControlDashboard.js"
    ],
    "components": [
      "MissionControlDashboard.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties"
    ],
    "database": "Supabase properties",
    "auth": "staff",
    "exceptions": [
      "Document confirmed fraudulent"
    ],
    "recovery": [
      "Reject listing and ban fraudulent user profile"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_rec_manual_approval_queue_viewed",
      "properties": {
        "domain": "layer",
        "route": "/mission-control/approval"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 2350,
    "parents": [
      "exc_ai_deadlock",
      "mission_control"
    ],
    "children": [
      "api_publish_listing"
    ],
    "actorRoles": [
      "staff"
    ],
    "uiAudience": [
      "STAFF"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_rec_manual_approval_queue_behavior",
        "text": "Playbook 2.3 — Mission Control Approval Queue enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "scenario_churned_owner_escrow",
    "canonicalId": "owner.escrow.churned",
    "name": "Playbook 1.3 / 5.4 — Churned Owner Escrow Trap",
    "label": "Playbook 1.3 / 5.4 — Churned Owner Escrow Trap",
    "type": "OUTCOME",
    "nodeType": "OUTCOME",
    "domain": "owner",
    "category": "scenario",
    "route": "/api/deals/escrow-trap",
    "layer": "core",
    "roles": [
      "seeker",
      "owner"
    ],
    "visibility": [
      "SEEKER",
      "OWNER"
    ],
    "goals": [
      "owner"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "When owner cancels subscription, 3D Vault map remains active for Premium Seekers; inquiries are held in escrow.",
    "description": "The lead is held in an 'escrow trap' to entice the churned owner to resubscribe. If sold off-platform, passive retention applies.",
    "actions": [
      "Keep 3D Vault Map Active for Seekers",
      "Capture Seeker Inquiries in Escrow",
      "Dispatch Resubscription Notice to Churned Owner"
    ],
    "conditions": [
      "Owner subscription canceled; property has 3D Spatial Vault asset"
    ],
    "systems": [
      "/api/deals/escrow-trap",
      "VaultListingLifecycle.md"
    ],
    "components": [],
    "apis": [
      "/api/deals/escrow-trap"
    ],
    "dataRefs": [
      "Supabase properties & deals"
    ],
    "database": "Supabase properties & deals",
    "auth": "seeker",
    "exceptions": [
      "Churned owner sells property off-platform"
    ],
    "recovery": [
      "Passive Retention ('Let Them'): 3D map stays live in Vault for Seeker intelligence value"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_scenario_churned_owner_escrow_viewed",
      "properties": {
        "domain": "owner",
        "route": "/api/deals/escrow-trap"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 2600,
    "parents": [
      "pep"
    ],
    "children": [
      "sys_connect_wallet"
    ],
    "actorRoles": [
      "seeker",
      "owner"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_scenario_churned_owner_escrow_behavior",
        "text": "Playbook 1.3 / 5.4 — Churned Owner Escrow Trap enforces defined owner behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "property.manage_owned"
    ],
    "resourceRelationship": [
      "VERIFIED_OWNER"
    ],
    "ownershipRequirement": true,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "scenario_listing_cap_limit",
    "canonicalId": "broker.cap.limit",
    "name": "Playbook 1.2 — Broker Listing Cap Downgrade Soft-Lock",
    "label": "Playbook 1.2 — Broker Listing Cap Downgrade Soft-Lock",
    "type": "OUTCOME",
    "nodeType": "OUTCOME",
    "domain": "broker",
    "category": "scenario",
    "route": "/dashboard?workspace=broker",
    "layer": "crust",
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "goals": [
      "broker"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "When broker downgrades tier below active listing count, excess oldest listings flip to 'Locked (over limit)'.",
    "description": "Cards grey out and become unclickable (no contact, no leads) until broker upgrades tier or frees slots.",
    "actions": [
      "Detect Tier Downgrade Excess",
      "Soft-Lock Oldest Excess Listings",
      "Grey Out Public Broker Cards",
      "Prompt for Tier Upgrade"
    ],
    "conditions": [
      "Active listings > Tier cap (Starry: 3, Solar: 15, Cluster: 50)"
    ],
    "systems": [
      "BrokerMode.js",
      "TierDistinction.md"
    ],
    "components": [
      "BrokerMode.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties & deals"
    ],
    "database": "Supabase properties & deals",
    "auth": "broker",
    "exceptions": [
      "Owner removes locked broker from listing"
    ],
    "recovery": [
      "Next oldest locked property automatically unlocks into the freed slot"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_scenario_listing_cap_limit_viewed",
      "properties": {
        "domain": "broker",
        "route": "/dashboard?workspace=broker"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 2850,
    "parents": [
      "sys_double_optin_handshake"
    ],
    "children": [],
    "actorRoles": [
      "broker"
    ],
    "uiAudience": [
      "BROKER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_scenario_listing_cap_limit_behavior",
        "text": "Playbook 1.2 — Broker Listing Cap Downgrade Soft-Lock enforces defined broker behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.represent_client"
    ],
    "resourceRelationship": [
      "ASSIGNED_BROKER"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": true,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "scenario_prc_expired_notice",
    "canonicalId": "broker.prc.renewal",
    "name": "Playbook 5.1 — Expired PRC License 30-Day Notice",
    "label": "Playbook 5.1 — Expired PRC License 30-Day Notice",
    "type": "OUTCOME",
    "nodeType": "OUTCOME",
    "domain": "broker",
    "category": "scenario",
    "route": "/mission-control/prc-audit",
    "layer": "crust",
    "roles": [
      "broker",
      "staff"
    ],
    "visibility": [
      "BROKER",
      "STAFF"
    ],
    "goals": [
      "broker"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "When broker's PRC license expires, system provides a 30-day renewal grace period before badge downgrade.",
    "description": "Broker receives 30 days to upload renewal. If missed, badge downgrades to 'Unverified' and representation privileges freeze.",
    "actions": [
      "Send 30-Day Expiry Notice",
      "Track Renewal Countdown",
      "Downgrade Badge to Unverified if Unresolved"
    ],
    "conditions": [
      "PRC license expiration date reached"
    ],
    "systems": [
      "PrcComplianceJob.js",
      "DisputesHub.js"
    ],
    "components": [
      "PrcComplianceJob.js",
      "DisputesHub.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase user_profiles.prc_expiry"
    ],
    "database": "Supabase user_profiles.prc_expiry",
    "auth": "staff",
    "exceptions": [
      "Broker uploads valid renewal before 30-day deadline"
    ],
    "recovery": [
      "Staff verifies renewal in Mission Control and restores Gold Verified Badge"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_scenario_prc_expired_notice_viewed",
      "properties": {
        "domain": "broker",
        "route": "/mission-control/prc-audit"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 3100,
    "parents": [
      "mission_control"
    ],
    "children": [],
    "actorRoles": [
      "broker",
      "staff"
    ],
    "uiAudience": [
      "BROKER",
      "STAFF"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_scenario_prc_expired_notice_behavior",
        "text": "Playbook 5.1 — Expired PRC License 30-Day Notice enforces defined broker behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.represent_client"
    ],
    "resourceRelationship": [
      "ASSIGNED_BROKER"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": true,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "scenario_broker_lead_collision",
    "canonicalId": "broker.leads.collision",
    "name": "Playbook 4.3 — Unit Operator vs Building Broker Lead Isolation",
    "label": "Playbook 4.3 — Unit Operator vs Building Broker Lead Isolation",
    "type": "OUTCOME",
    "nodeType": "OUTCOME",
    "domain": "layer",
    "category": "scenario",
    "route": "/api/deals/route-lead",
    "layer": "core",
    "roles": [
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Strict routing isolation: unit-level inquiries route to Co-Working Operator; building-level route to Building Broker.",
    "description": "Prevents lead theft and operator collision by isolating inquiry endpoints based on the target entity.",
    "actions": [
      "Inspect Inquiry Target Entity",
      "Route Unit Leads to Co-Working Operator",
      "Route Property Leads to Building Broker"
    ],
    "conditions": [
      "Inquiry submitted on represented property with delegated units"
    ],
    "systems": [
      "/api/deals/route-lead",
      "DataDictionary.md"
    ],
    "components": [],
    "apis": [
      "/api/deals/route-lead"
    ],
    "dataRefs": [
      "Supabase deals"
    ],
    "database": "Supabase deals",
    "auth": "seeker",
    "exceptions": [
      "Seeker inquiries on both whole building and specific unit simultaneously"
    ],
    "recovery": [
      "System bifurcates into two distinct deal room records"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_scenario_broker_lead_collision_viewed",
      "properties": {
        "domain": "layer",
        "route": "/api/deals/route-lead"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 3350,
    "parents": [
      "pep_ch7_units"
    ],
    "children": [
      "deal_room"
    ],
    "actorRoles": [
      "seeker",
      "owner",
      "broker"
    ],
    "uiAudience": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_scenario_broker_lead_collision_behavior",
        "text": "Playbook 4.3 — Unit Operator vs Building Broker Lead Isolation enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.represent_client"
    ],
    "resourceRelationship": [
      "ASSIGNED_BROKER"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": true,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "scenario_offmarket_pitch",
    "canonicalId": "broker.pitch.offmarket",
    "name": "Playbook 5.3 — Off-Market Pitch Toggle ('Quietly open to offers')",
    "label": "Playbook 5.3 — Off-Market Pitch Toggle ('Quietly open to offers')",
    "type": "OUTCOME",
    "nodeType": "OUTCOME",
    "domain": "layer",
    "category": "scenario",
    "route": "/dashboard/property/[id]/settings",
    "layer": "core",
    "roles": [
      "owner",
      "seeker"
    ],
    "visibility": [
      "OWNER",
      "SEEKER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Owner toggle controlling whether dormant off-market Vault listings accept incoming buyer pitches.",
    "description": "Allows high-net-worth owners to test market interest without public listing exposure or pricing leak.",
    "actions": [
      "Toggle 'Quietly Open to Offers' State",
      "Permit Cluster+ Seekers to Submit Unsolicited Inquiries",
      "Block Pitches when Toggle Off"
    ],
    "conditions": [
      "Property marked off-market/withdrawn"
    ],
    "systems": [
      "PropertySettings.js",
      "VaultListingLifecycle.md"
    ],
    "components": [
      "PropertySettings.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties.is_quietly_open"
    ],
    "database": "Supabase properties.is_quietly_open",
    "auth": "owner",
    "exceptions": [
      "Unauthenticated user attempts to view off-market property"
    ],
    "recovery": [
      "Display non-contactable 'Listing Removed' placeholder marker"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_scenario_offmarket_pitch_viewed",
      "properties": {
        "domain": "layer",
        "route": "/dashboard/property/[id]/settings"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 3600,
    "parents": [
      "dashboard_owner"
    ],
    "children": [
      "pep"
    ],
    "actorRoles": [
      "owner",
      "seeker"
    ],
    "uiAudience": [
      "OWNER",
      "SEEKER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_scenario_offmarket_pitch_behavior",
        "text": "Playbook 5.3 — Off-Market Pitch Toggle ('Quietly open to offers') enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.represent_client"
    ],
    "resourceRelationship": [
      "ASSIGNED_BROKER"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": true,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "scenario_chat_purge",
    "canonicalId": "deal.chat.purge",
    "name": "Playbook 8.1 — 7-Day Read-Only Chat Retention & Purge",
    "label": "Playbook 8.1 — 7-Day Read-Only Chat Retention & Purge",
    "type": "OUTCOME",
    "nodeType": "OUTCOME",
    "domain": "deal",
    "category": "scenario",
    "route": "/api/cron/purge-messages",
    "layer": "core",
    "roles": [
      "staff",
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "STAFF",
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "goals": [
      "deal"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Closed deal chats become read-only for 7 days, after which message contents are permanently purged.",
    "description": "Enforces Data Privacy Act compliance. Message text is deleted while transaction metadata is retained for CRM integrity.",
    "actions": [
      "Mark Closed Deal Chat Read-Only",
      "Track 7-Day Expiry Window",
      "Purge Message Text from Database",
      "Retain Deal Audit Ledger"
    ],
    "conditions": [
      "Deal status = 'closed' or 'completed' for >= 7 days"
    ],
    "systems": [
      "/api/cron/purge-messages",
      "Supabase pg_cron"
    ],
    "components": [],
    "apis": [
      "/api/cron/purge-messages"
    ],
    "dataRefs": [
      "Supabase messages & deals"
    ],
    "database": "Supabase messages & deals",
    "auth": "staff",
    "exceptions": [
      "Chat reported to Trust & Safety for dispute"
    ],
    "recovery": [
      "Freeze purge job and quarantine messages until dispute resolved in Mission Control"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_scenario_chat_purge_viewed",
      "properties": {
        "domain": "deal",
        "route": "/api/cron/purge-messages"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 3850,
    "parents": [
      "terminal_deal_closed"
    ],
    "children": [
      "sys_zero_log_ai_crm"
    ],
    "actorRoles": [
      "staff",
      "seeker",
      "broker",
      "provider"
    ],
    "uiAudience": [
      "STAFF",
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_scenario_chat_purge_behavior",
        "text": "Playbook 8.1 — 7-Day Read-Only Chat Retention & Purge enforces defined deal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "rec_turnstile_challenge",
    "canonicalId": "sentinel.rec.turnstile",
    "name": "Recovery: Cloudflare Turnstile Human Verification Challenge",
    "label": "Recovery: Cloudflare Turnstile Human Verification Challenge",
    "type": "RECOVERY",
    "nodeType": "RECOVERY",
    "domain": "sentinel",
    "category": "scenario",
    "route": "/challenge",
    "layer": "global",
    "roles": [
      "visitor",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "sentinel"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Interactive challenge presented to quarantined sessions to confirm human agency and release temporary throttle.",
    "description": "Upon passing invisible Turnstile challenge, session hash is cleared from `blocked_sessions` and browsing resumes.",
    "actions": [
      "Solve Turnstile Challenge",
      "Clear Session Hash from blocked_sessions",
      "Resume Normal Navigation"
    ],
    "conditions": [
      "Session quarantined by Velocity Radar"
    ],
    "systems": [
      "Cloudflare Turnstile",
      "middleware.js"
    ],
    "components": [
      "middleware.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase blocked_sessions"
    ],
    "database": "Supabase blocked_sessions",
    "auth": "public",
    "exceptions": [
      "Challenge fails > 3 times"
    ],
    "recovery": [
      "Escalate to Terminal Edge Blacklist"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_rec_turnstile_challenge_viewed",
      "properties": {
        "domain": "sentinel",
        "route": "/challenge"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 4050,
    "parents": [
      "exc_bot_quarantine"
    ],
    "children": [
      "discover_directory"
    ],
    "actorRoles": [
      "visitor",
      "provider"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_rec_turnstile_challenge_behavior",
        "text": "Recovery: Cloudflare Turnstile Human Verification Challenge enforces defined sentinel behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "terminal_edge_blacklist",
    "canonicalId": "sentinel.terminal.blacklist",
    "name": "Outcome: Edge Connection Drop & Cloudflare Blacklist",
    "label": "Outcome: Edge Connection Drop & Cloudflare Blacklist",
    "type": "TERMINAL",
    "nodeType": "TERMINAL",
    "domain": "sentinel",
    "category": "scenario",
    "route": "/blocked",
    "layer": "global",
    "roles": [
      "visitor"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "sentinel"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Terminal defense outcome: drops network connection at the edge before hitting Next.js serverless execution or paid APIs.",
    "description": "Permanently blacklists confirmed malicious scrapers at the Cloudflare/Vercel edge level.",
    "actions": [
      "Drop Edge TCP Connection",
      "Enforce 403 Forbidden at Edge",
      "Shield Mapbox & Gemini API Quotas"
    ],
    "conditions": [
      "Quarantined session fails verification"
    ],
    "systems": [
      "Cloudflare WAF / Vercel Edge Firewall"
    ],
    "components": [],
    "apis": [],
    "dataRefs": [
      "Cloudflare Edge Blacklist"
    ],
    "database": "Cloudflare Edge Blacklist",
    "auth": "public",
    "exceptions": [
      "None (terminal security state)"
    ],
    "recovery": [
      "Connection dropped prior to Next.js execution"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_terminal_edge_blacklist_viewed",
      "properties": {
        "domain": "sentinel",
        "route": "/blocked"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": true,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 4250,
    "parents": [
      "exc_bot_quarantine"
    ],
    "children": [],
    "actorRoles": [
      "visitor"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_terminal_edge_blacklist_behavior",
        "text": "Outcome: Edge Connection Drop & Cloudflare Blacklist enforces defined sentinel behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": true,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "terminal_handshake_success",
    "canonicalId": "deal.terminal.handshake_success",
    "name": "Outcome: Verified Handshake & Rating Increment",
    "label": "Outcome: Verified Handshake & Rating Increment",
    "type": "TERMINAL",
    "nodeType": "TERMINAL",
    "domain": "deal",
    "category": "scenario",
    "route": "/deal/[id]/success",
    "layer": "core",
    "roles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "goals": [
      "deal"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Terminal success state: two-sided handshake completed, Scout Rating incremented, and platform reward distributed.",
    "description": "Final milestone of a successful ScoutIt journey. Solidifies broker reputation and awards QuestIT bounty rewards.",
    "actions": [
      "Award Scout Rating Point",
      "Issue QuestIT Connects Reward",
      "Archive Deal Room Record"
    ],
    "conditions": [
      "Both buyer and broker confirm transaction handshake"
    ],
    "systems": [
      "HandshakeSuccessModal.js",
      "deals table"
    ],
    "components": [
      "HandshakeSuccessModal.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals & user_profiles.scout_rating"
    ],
    "database": "Supabase deals & user_profiles.scout_rating",
    "auth": "seeker",
    "exceptions": [
      "None (terminal state)"
    ],
    "recovery": [
      "Record saved in historical transaction archive"
    ],
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/deals/handshake/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_terminal_handshake_success_viewed",
      "properties": {
        "domain": "deal",
        "route": "/deal/[id]/success"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": true,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 4450,
    "parents": [
      "sys_transaction_handshake"
    ],
    "children": [],
    "actorRoles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_terminal_handshake_success_behavior",
        "text": "Outcome: Verified Handshake & Rating Increment enforces defined deal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "API",
            "path": "src/app/api/deals/handshake/route.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": true,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "pilotState": "CLOSED",
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "terminal_deal_closed",
    "canonicalId": "deal.terminal.closed",
    "name": "Outcome: Deal Closed / Archived",
    "label": "Outcome: Deal Closed / Archived",
    "type": "TERMINAL",
    "nodeType": "TERMINAL",
    "domain": "layer",
    "category": "scenario",
    "route": "/deal/[id]/closed",
    "layer": "core",
    "roles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "goals": [
      "layer"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Terminal state for completed or declined deal rooms entering 7-day retention grace period.",
    "description": "Deal reaches conclusion; chat enters read-only mode prior to permanent content purge.",
    "actions": [
      "Set Deal Status Closed",
      "Initiate 7-Day Retention Timer",
      "Archive Deal Cockpit"
    ],
    "conditions": [
      "Deal concluded"
    ],
    "systems": [
      "DealRoomCockpit.js"
    ],
    "components": [
      "DealRoomCockpit.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deals"
    ],
    "database": "Supabase deals",
    "auth": "seeker",
    "exceptions": [
      "None (terminal state)"
    ],
    "recovery": [
      "Metadata retained permanently for user deal history"
    ],
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/close/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_terminal_deal_closed_viewed",
      "properties": {
        "domain": "layer",
        "route": "/deal/[id]/closed"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": true,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 4650,
    "y": 4650,
    "parents": [
      "deal_room"
    ],
    "children": [
      "scenario_chat_purge"
    ],
    "actorRoles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "uiAudience": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_terminal_deal_closed_behavior",
        "text": "Outcome: Deal Closed / Archived enforces defined layer behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "API",
            "path": "src/app/api/deals/[id]/close/route.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": true,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "compare_specs_matrix",
    "canonicalId": "seeker.compare.matrix",
    "name": "Side-by-Side Spatial Comparison Matrix",
    "label": "Side-by-Side Spatial Comparison Matrix",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "property",
    "category": "architecture",
    "route": "/compare",
    "layer": "crust",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "property"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Side-by-side specification comparison matrix (GLA, floor plate, parking, ceiling height, power) strictly hiding prices for RESA compliance.",
    "description": "Allows comparing up to 4 spaces side-by-side on technical specs only. Pricing and monetary rates are intentionally excluded to protect real estate broker compliance.",
    "actions": [
      "Select up to 4 Spaces",
      "Toggle Category Spec Filters",
      "Link to Individual PEP Dossiers",
      "Request Shared Viewing"
    ],
    "conditions": [
      "At least 2 properties selected from directory or saved ledger"
    ],
    "systems": [
      "src/app/compare/page.js",
      "CompareTray.js",
      "CategorySpecBlock.js"
    ],
    "components": [
      "src/app/compare/page.js",
      "CompareTray.js",
      "CategorySpecBlock.js"
    ],
    "apis": [],
    "dataRefs": [
      "Airtable Properties (Spec Twin Fields)"
    ],
    "database": "Airtable Properties (Spec Twin Fields)",
    "auth": "public",
    "exceptions": [
      "Cross-category comparison mismatch (e.g. comparing STR with Commercial Office)"
    ],
    "recovery": [
      "Aligns shared specification rows and displays clean dash indicators for non-matching category keys"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ComparisonMatrix.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "guide": {
      "instruction": "Allows comparing up to 4 spaces side-by-side on technical specs only. Pricing and monetary rates are intentionally excluded to protect real estate broker compliance.",
      "target": "compare_specs_matrix-view",
      "sequenceOrder": 1
    },
    "telemetry": {
      "eventName": "flow_compare_specs_matrix_viewed",
      "properties": {
        "domain": "property",
        "route": "/compare"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 880,
    "y": 1950,
    "parents": [
      "discover_directory",
      "pep",
      "dashboard_buyer"
    ],
    "children": [
      "pep",
      "inquiry_modal"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_compare_specs_matrix_behavior",
        "text": "Side-by-Side Spatial Comparison Matrix enforces defined property behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/ComparisonMatrix.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "broker_field_briefing",
    "canonicalId": "broker.field_briefing",
    "name": "Broker Tactical Field Briefing & Voice Copilot",
    "label": "Broker Tactical Field Briefing & Voice Copilot",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "broker",
    "category": "architecture",
    "route": "/property/[slug]/field-briefing",
    "layer": "core",
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "goals": [
      "broker"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "On-site tactical mobile & PDF manual with showing advice (sunlight reflection windows, peak traffic times) and RESA tax calculation breakdown.",
    "description": "Equips licensed brokers during live property showings with objection breaker cheat sheets, tax breakdown (CGT 6%, DST 1.5%, Transfer Tax), and offline Taglish voice copilot.",
    "actions": [
      "Export Field Briefing PDF",
      "Activate Voice Copilot",
      "Review Showing Sunlight Window",
      "Calculate Buyer Tax Liability"
    ],
    "conditions": [
      "Licensed PRC Broker authentication required"
    ],
    "systems": [
      "src/app/property/[slug]/field-briefing/page.js",
      "VoiceCopilotEngine.js",
      "TaxCalculator.js"
    ],
    "components": [
      "src/app/property/[slug]/field-briefing/page.js",
      "VoiceCopilotEngine.js",
      "TaxCalculator.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase properties & broker_field_notes"
    ],
    "database": "Supabase properties & broker_field_notes",
    "auth": "broker_session",
    "exceptions": [
      "Offline mobile network connectivity during basement showing"
    ],
    "recovery": [
      "Local-first service worker cache serves pre-downloaded PDF and speech synthesis model"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BrokerFieldBriefing.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_broker_field_briefing_viewed",
      "properties": {
        "domain": "broker",
        "route": "/property/[slug]/field-briefing"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1680,
    "y": 1350,
    "parents": [
      "pep",
      "dashboard_broker"
    ],
    "children": [
      "deal_room",
      "pep_ch10_your_move"
    ],
    "actorRoles": [
      "broker"
    ],
    "uiAudience": [
      "BROKER"
    ],
    "knowledgeScope": [
      "PUBLIC"
    ],
    "securityClassification": "PUBLIC",
    "claims": [
      {
        "id": "claim_broker_field_briefing_behavior",
        "text": "Broker Tactical Field Briefing & Voice Copilot enforces defined broker behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/BrokerFieldBriefing.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.represent_client"
    ],
    "resourceRelationship": [
      "ASSIGNED_BROKER"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": true,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "EXECUTABLE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "sys_zero_log_ai_crm",
    "canonicalId": "crm.zero_log_ai",
    "name": "System: Zero-Log AI Broker CRM & 7-Day Purge",
    "label": "System: Zero-Log AI Broker CRM & 7-Day Purge",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "crm",
    "category": "architecture",
    "route": "/api/crm/deal-summarizer",
    "layer": "core",
    "roles": [
      "broker",
      "staff"
    ],
    "visibility": [
      "BROKER",
      "STAFF"
    ],
    "goals": [
      "crm"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Generates structured 4-bullet deal milestones in deal_notes while auto-purging raw text and audio logs after 7 days (RA 10173 & RA 9646 shield).",
    "description": "Shields ScoutIt from commission liability and privacy overhead by extracting objective deal notes (budget, viewing slot, next actions) and permanently deleting verbatim chat and WebRTC audio after 7 days.",
    "actions": [
      "Extract 4-Bullet Milestone Summary",
      "Write to deal_notes",
      "Schedule 7-Day Purge Timer",
      "Trigger Follow-Up Reminders"
    ],
    "conditions": [
      "Deal Room conversation or WebRTC audio session concluded"
    ],
    "systems": [
      "src/lib/crm/zeroLogSummarizer.js",
      "EdgeAIWorker.js",
      "supabase.from('deal_notes')"
    ],
    "components": [
      "src/lib/crm/zeroLogSummarizer.js",
      "EdgeAIWorker.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase deal_notes & crm_activity_log"
    ],
    "database": "Supabase deal_notes & crm_activity_log",
    "auth": "broker_session",
    "exceptions": [
      "Ambiguous conversation with no agreed milestones"
    ],
    "recovery": [
      "Generates neutral status-quo note and prompts broker for manual note addition"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/crmActivity.js",
        "symbol": "logActivity",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_zero_log_ai_crm_viewed",
      "properties": {
        "domain": "crm",
        "route": "/api/crm/deal-summarizer"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2480,
    "y": 1350,
    "parents": [
      "deal_room",
      "scenario_chat_purge"
    ],
    "children": [
      "dashboard_broker",
      "mission_control"
    ],
    "actorRoles": [
      "broker",
      "staff"
    ],
    "uiAudience": [
      "BROKER",
      "STAFF"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_zero_log_ai_crm_behavior",
        "text": "System: Zero-Log AI Broker CRM & 7-Day Purge enforces defined crm behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/crmActivity.js",
            "symbol": "logActivity",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "sys_monthly_scout_wrap",
    "canonicalId": "analytics.monthly_scout_wrap",
    "name": "System: Monthly Scout Wrap Engine (Spotify-Style)",
    "label": "System: Monthly Scout Wrap Engine (Spotify-Style)",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "crm",
    "category": "architecture",
    "route": "/dashboard/wrap",
    "layer": "orbit",
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "goals": [
      "crm"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Monthly Spotify Wrapped-style spatial intelligence summary on the 1st of every month (eyes, dwell time, viewing conversion, verified freshness).",
    "description": "Generates an automated, cinematic monthly report for property owners and brokers tracking unique viewer keys, top chapter dwell time, and verified deal handshakes.",
    "actions": [
      "Calculate Monthly Spatial Analytics",
      "Render Interactive Wrap Carousel",
      "Export Social Share Card",
      "Deliver In-App Notification"
    ],
    "conditions": [
      "1st day of the calendar month (Asia/Manila time)"
    ],
    "systems": [
      "src/app/dashboard/wrap/page.js",
      "MonthlyWrapEngine.js",
      "supabase.rpc('get_monthly_scout_wrap')"
    ],
    "components": [
      "src/app/dashboard/wrap/page.js",
      "MonthlyWrapEngine.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase analytics_events & monthly_wrap_snapshots"
    ],
    "database": "Supabase analytics_events & monthly_wrap_snapshots",
    "auth": "owner_broker_session",
    "exceptions": [
      "New listing published < 7 days before month-end"
    ],
    "recovery": [
      "Displays initial onboarding velocity badge and defers comprehensive report to following cycle"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/monthlyScoutWrap.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/wrap/monthly/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_monthly_scout_wrap_viewed",
      "properties": {
        "domain": "crm",
        "route": "/dashboard/wrap"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2880,
    "y": 750,
    "parents": [
      "dashboard_owner",
      "dashboard_broker",
      "mission_control"
    ],
    "children": [
      "dashboard_owner",
      "dashboard_broker"
    ],
    "actorRoles": [
      "owner",
      "broker",
      "staff"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_monthly_scout_wrap_behavior",
        "text": "System: Monthly Scout Wrap Engine (Spotify-Style) enforces defined crm behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/monthlyScoutWrap.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "API",
            "path": "src/app/api/wrap/monthly/route.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "sys_freshness_staleness_engine",
    "canonicalId": "freshness.staleness_engine",
    "name": "System: 90-Day Freshness Loop & Staleness Radar",
    "label": "System: 90-Day Freshness Loop & Staleness Radar",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "freshness",
    "category": "architecture",
    "route": "/api/cron/check-stale-listings",
    "layer": "crust",
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "goals": [
      "freshness"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "4-tier staleness aging engine (<30d Fresh Gold, 30-60d Warning Amber, 60-180d Stale Orange, >180d High Staleness Risk Red).",
    "description": "Runs monthly automated verification audits synchronized with Connects wallet refills, prompting owners and brokers to re-confirm listing accuracy.",
    "actions": [
      "Evaluate Last_Verified_Date",
      "Apply Freshness Tier Badges",
      "Trigger Soft-Quarantine on Inactive Listings",
      "Send Re-Verification Reminders"
    ],
    "conditions": [
      "Daily automated background verification cron"
    ],
    "systems": [
      "src/app/api/cron/check-stale-listings/route.js",
      "FreshnessAuditEngine.js"
    ],
    "components": [
      "src/app/api/cron/check-stale-listings/route.js",
      "FreshnessAuditEngine.js"
    ],
    "apis": [
      "src/app/api/cron/check-stale-listings/route.js"
    ],
    "dataRefs": [
      "Airtable & Supabase properties.Last_Verified_Date"
    ],
    "database": "Airtable & Supabase properties.Last_Verified_Date",
    "auth": "cron_secret",
    "exceptions": [
      "Owner does not respond to re-verification notification after 60 days"
    ],
    "recovery": [
      "Applies Unverified Orange badge and applies soft-quarantine from top discovery ranks"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/freshness.js",
        "symbol": "getListingFreshness",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/freshness.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_freshness_staleness_engine_viewed",
      "properties": {
        "domain": "freshness",
        "route": "/api/cron/check-stale-listings"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 2880,
    "y": 1050,
    "parents": [
      "mission_control",
      "dashboard_owner",
      "dashboard_broker"
    ],
    "children": [
      "exc_stale_listing_quarantine",
      "rec_confirm_freshness_click",
      "pep"
    ],
    "actorRoles": [
      "owner",
      "broker",
      "staff"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_freshness_staleness_engine_behavior",
        "text": "System: 90-Day Freshness Loop & Staleness Radar enforces defined freshness behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/freshness.js",
            "symbol": "getListingFreshness",
            "provenance": "EXTRACTED",
            "confidence": 1
          },
          {
            "kind": "TEST",
            "path": "src/lib/__tests__/freshness.test.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "exc_stale_listing_quarantine",
    "canonicalId": "freshness.exc.stale_quarantine",
    "name": "Exception: Stale Listing Soft-Quarantine",
    "label": "Exception: Stale Listing Soft-Quarantine",
    "type": "EXCEPTION",
    "nodeType": "EXCEPTION",
    "domain": "freshness",
    "category": "architecture",
    "route": "/dashboard/owner/stale-audit",
    "layer": "crust",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "freshness"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Unverified listings older than 60 days are soft-locked from top search feeds until re-verified.",
    "description": "Protects buyer trust by preventing unverified, outdated property prices and availability from dominating search results.",
    "actions": [
      "Display Staleness Warning Banner",
      "Prompt One-Click Freshness Confirmation",
      "Offer Off-Market Archive Option"
    ],
    "conditions": [
      "Property Last_Verified_Date > 60 days"
    ],
    "systems": [
      "StalenessBanner.js",
      "OwnerPortfolioAuditModal.js"
    ],
    "components": [
      "StalenessBanner.js",
      "OwnerPortfolioAuditModal.js"
    ],
    "apis": [],
    "dataRefs": [
      "properties.freshness_tier = 'stale'"
    ],
    "database": "properties.freshness_tier = 'stale'",
    "auth": "owner_broker_session",
    "exceptions": [
      "Listing remains unverified for over 180 days"
    ],
    "recovery": [
      "Applies public buyer caveat notice and demotes listing until manual owner edit"
    ],
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/freshness.js",
        "symbol": "STALENESS_TIERS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_exc_stale_listing_quarantine_viewed",
      "properties": {
        "domain": "freshness",
        "route": "/dashboard/owner/stale-audit"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3280,
    "y": 1050,
    "parents": [
      "sys_freshness_staleness_engine"
    ],
    "children": [
      "rec_confirm_freshness_click"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_exc_stale_listing_quarantine_behavior",
        "text": "Exception: Stale Listing Soft-Quarantine enforces defined freshness behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "CODE",
            "path": "src/lib/freshness.js",
            "symbol": "STALENESS_TIERS",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "rec_confirm_freshness_click",
    "canonicalId": "freshness.rec.confirm_freshness",
    "name": "Action: One-Click Portfolio Freshness Re-Verification",
    "label": "Action: One-Click Portfolio Freshness Re-Verification",
    "type": "RECOVERY",
    "nodeType": "RECOVERY",
    "domain": "freshness",
    "category": "architecture",
    "route": "/api/property/confirm-freshness",
    "layer": "crust",
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "goals": [
      "freshness"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "One-click portfolio audit re-verification during monthly Connects claim to immediately restore Gold Fresh badge.",
    "description": "Allows owners and brokers to confirm 'No Changes — Specs & Price are Accurate' with one click, resetting Last_Verified_Date to NOW().",
    "actions": [
      "Update Last_Verified_Date to Current Timestamp",
      "Restore Gold Fresh Badge",
      "Boost Organic Search Priority",
      "Unlock Monthly Bonus Connects"
    ],
    "conditions": [
      "Authenticated property owner or authorized listing broker"
    ],
    "systems": [
      "src/app/api/property/confirm-freshness/route.js",
      "supabase.from('properties').update()"
    ],
    "components": [
      "src/app/api/property/confirm-freshness/route.js"
    ],
    "apis": [
      "src/app/api/property/confirm-freshness/route.js"
    ],
    "dataRefs": [
      "Supabase properties & Airtable sync"
    ],
    "database": "Supabase properties & Airtable sync",
    "auth": "owner_broker_session",
    "exceptions": [
      "Database update failure or network timeout"
    ],
    "recovery": [
      "Queues offline confirmation and syncs when connection is restored"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/MonthlyFreshnessModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_rec_confirm_freshness_click_viewed",
      "properties": {
        "domain": "freshness",
        "route": "/api/property/confirm-freshness"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3680,
    "y": 1050,
    "parents": [
      "sys_freshness_staleness_engine",
      "exc_stale_listing_quarantine"
    ],
    "children": [
      "pep",
      "dashboard_owner",
      "dashboard_broker"
    ],
    "actorRoles": [
      "owner",
      "broker"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_rec_confirm_freshness_click_behavior",
        "text": "Action: One-Click Portfolio Freshness Re-Verification enforces defined freshness behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/dashboard/MonthlyFreshnessModal.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "sys_noah_hazard_radar",
    "canonicalId": "gis.noah_hazard_radar",
    "name": "System: UP NOAH & HazardHunter GIS Flood/Fault Radar",
    "label": "System: UP NOAH & HazardHunter GIS Flood/Fault Radar",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "gis",
    "category": "architecture",
    "route": "/api/gis/noah-hazard",
    "layer": "metropolis",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "gis"
    ],
    "implementationStatus": "VERIFIED",
    "purpose": "Public GIS flood hazard inundation (5/25/100 yr) and fault line proximity scoring from UP NOAH & PHIVOLCS HazardHunterPH.",
    "description": "Queries open government vector tiles and point hazard assessment APIs to provide honest, unalterable flood and seismic safety intelligence.",
    "actions": [
      "Query Point Hazard Assessment",
      "Render 5/25/100-Year Flood Vector Overlays",
      "Display West Valley Fault Proximity Distance",
      "Calculate Honest Resilience Rating"
    ],
    "conditions": [
      "Valid property latitude/longitude coordinates"
    ],
    "systems": [
      "src/lib/gis/noahHazardService.js",
      "HazardHunterPHAPI",
      "Mapbox/Leaflet GIS Layer"
    ],
    "components": [
      "src/lib/gis/noahHazardService.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase property_hazard_cache"
    ],
    "database": "Supabase property_hazard_cache",
    "auth": "public",
    "exceptions": [
      "Government GIS server downtime or rate limit"
    ],
    "recovery": [
      "Serves cached spatial hazard polygon data from Supabase CDN"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/FloodHeatmapMap.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_noah_hazard_radar_viewed",
      "properties": {
        "domain": "gis",
        "route": "/api/gis/noah-hazard"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1280,
    "y": 1950,
    "parents": [
      "pep_ch2_location",
      "discover_directory"
    ],
    "children": [
      "pep_ch2_location"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_noah_hazard_radar_behavior",
        "text": "System: UP NOAH & HazardHunter GIS Flood/Fault Radar enforces defined gis behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "VERIFIED",
        "evidence": [
          {
            "kind": "COMPONENT",
            "path": "src/components/property/FloodHeatmapMap.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "VERIFIED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "APPROVED",
    "evidenceStatus": "CODE_GROUNDED",
    "releaseStatus": "PUBLIC_LIVE"
  },
  {
    "id": "provider_bounty_handshake",
    "canonicalId": "provider.bounty.handshake",
    "name": "Action: Spatial Creator Bounty Claim & Payout Handshake",
    "label": "Action: Spatial Creator Bounty Claim & Payout Handshake",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "deal",
    "category": "architecture",
    "route": "/bounties",
    "layer": "crust",
    "roles": [
      "provider",
      "staff"
    ],
    "visibility": [
      "PROVIDER",
      "STAFF"
    ],
    "goals": [
      "deal"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Verified spatial creators claim open floor plan & 3D scan bounties (₱500–₱3,500) on unclaimed properties; verified by Staff before payout.",
    "description": "Crowdsources spatial data collection by rewarding mobile LiDAR creators and drone pilots for capturing verified property dossiers.",
    "actions": [
      "Browse Open Geo-Fenced Bounties",
      "Reserve 48-Hour Capture Slot",
      "Upload Verified 3D Scan / Floor Plan",
      "Claim GCash/Bank Payout Upon Staff Approval"
    ],
    "conditions": [
      "Verified Provider account and active bounty escrow balance"
    ],
    "systems": [
      "src/app/bounties/page.js",
      "BountyEscrowManager.js",
      "supabase.from('bounties')"
    ],
    "components": [
      "src/app/bounties/page.js",
      "BountyEscrowManager.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase bounties & provider_wallets"
    ],
    "database": "Supabase bounties & provider_wallets",
    "auth": "provider_session",
    "exceptions": [
      "Low-quality scan rejected during Staff Quality QA"
    ],
    "recovery": [
      "Provides detailed QA feedback and offers 24-hour resubmission window before bounty re-opens to community"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_provider_bounty_handshake_viewed",
      "properties": {
        "domain": "deal",
        "route": "/bounties"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/ZERO_LOG_AI_CRM_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 3280,
    "y": 2250,
    "parents": [
      "dashboard_provider"
    ],
    "children": [
      "photographers_roster",
      "dashboard_provider",
      "mission_control"
    ],
    "actorRoles": [
      "provider",
      "staff"
    ],
    "uiAudience": [
      "PROVIDER",
      "STAFF"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_provider_bounty_handshake_behavior",
        "text": "Action: Spatial Creator Bounty Claim & Payout Handshake enforces defined deal behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [
      "deal.participate"
    ],
    "resourceRelationship": [
      "ACTIVE_DEAL_PARTY"
    ],
    "ownershipRequirement": false,
    "dealParticipationRequired": true,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Transactions Guild",
      "reviewer": null,
      "riskLevel": "HIGH",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "sys_faq_appeal_engine",
    "canonicalId": "faq.appeal_engine",
    "name": "System: Community FAQ Voting & Verification Engine",
    "label": "System: Community FAQ Voting & Verification Engine",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "faq",
    "category": "architecture",
    "route": "/api/property/faq-vote",
    "layer": "core",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "faq"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Community FAQ voting & verification engine with verified broker/owner response badges.",
    "description": "Maintains high signal-to-noise space intelligence by letting verified local residents and brokers answer common questions with community upvoting.",
    "actions": [
      "Submit Space Question",
      "Cast Upvote / Downvote",
      "Award Verified Broker Badge",
      "Pin Top Answer to Chapter 8"
    ],
    "conditions": [
      "Authenticated user session (Seeker, Owner, or Broker)"
    ],
    "systems": [
      "src/app/api/property/faq-vote/route.js",
      "supabase.from('property_faqs')"
    ],
    "components": [
      "src/app/api/property/faq-vote/route.js"
    ],
    "apis": [
      "src/app/api/property/faq-vote/route.js"
    ],
    "dataRefs": [
      "Supabase property_faqs & faq_votes"
    ],
    "database": "Supabase property_faqs & faq_votes",
    "auth": "public_read_auth_vote",
    "exceptions": [
      "Spam or promotional self-advertising in FAQ answers"
    ],
    "recovery": [
      "Automated keyword filter flags response for Staff Sentinel moderation"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_faq_appeal_engine_viewed",
      "properties": {
        "domain": "faq",
        "route": "/api/property/faq-vote"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1680,
    "y": 1950,
    "parents": [
      "pep_ch8_universe",
      "action_ask_faq"
    ],
    "children": [
      "pep_ch8_universe"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_faq_appeal_engine_behavior",
        "text": "System: Community FAQ Voting & Verification Engine enforces defined faq behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "auth_enterprise_sso",
    "canonicalId": "auth.enterprise_sso",
    "name": "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway",
    "label": "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway",
    "type": "PAGE",
    "nodeType": "PAGE",
    "domain": "auth",
    "category": "architecture",
    "route": "/auth/sso",
    "layer": "global",
    "roles": [
      "owner",
      "broker",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE",
      "STAFF"
    ],
    "goals": [
      "auth"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Enterprise SAML 2.0 / Okta / Azure AD Entra ID gateway with corporate domain validation and JIT provisioning.",
    "description": "Provides institutional developers, REITs, and enterprise brokerage teams with centralized corporate Single Sign-On.",
    "actions": [
      "Initiate SAML 2.0 Handshake",
      "Validate Corporate Email Domain",
      "Execute JIT User Provisioning",
      "Enforce Enterprise MFA Policy"
    ],
    "conditions": [
      "Configured enterprise corporate domain (e.g. @ayaland.com.ph)"
    ],
    "systems": [
      "src/app/auth/sso/page.js",
      "supabase.auth.signInWithSSO()",
      "SAMLProvider.js"
    ],
    "components": [
      "src/app/auth/sso/page.js",
      "SAMLProvider.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase auth.sso_providers & enterprise_accounts"
    ],
    "database": "Supabase auth.sso_providers & enterprise_accounts",
    "auth": "saml_enterprise",
    "exceptions": [
      "User email domain does not match enterprise SAML configuration"
    ],
    "recovery": [
      "Prompts user to sign in with corporate email or contact enterprise IT administrator"
    ],
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/enterprise/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_auth_enterprise_sso_viewed",
      "properties": {
        "domain": "auth",
        "route": "/auth/sso"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 80,
    "y": 1500,
    "parents": [
      "login",
      "rec_sso_idp_reauth"
    ],
    "children": [
      "exc_sso_domain_mismatch",
      "rec_sso_idp_reauth",
      "dashboard_owner",
      "dashboard_broker",
      "mission_control"
    ],
    "actorRoles": [
      "owner",
      "broker",
      "enterprise",
      "staff"
    ],
    "uiAudience": [
      "OWNER",
      "BROKER",
      "ENTERPRISE",
      "STAFF"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_auth_enterprise_sso_behavior",
        "text": "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway enforces defined auth behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PLANNED",
        "evidence": [
          {
            "kind": "ROUTE",
            "path": "src/app/enterprise/page.js",
            "provenance": "EXTRACTED",
            "confidence": 1
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "CRITICAL",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "MACRO",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PLANNED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "PRIVATE_PILOT"
  },
  {
    "id": "exc_sso_domain_mismatch",
    "canonicalId": "auth.sso.exc.domain_mismatch",
    "name": "Exception: Enterprise SSO Domain Mismatch",
    "label": "Exception: Enterprise SSO Domain Mismatch",
    "type": "EXCEPTION",
    "nodeType": "EXCEPTION",
    "domain": "auth",
    "category": "architecture",
    "route": "/auth/sso/error",
    "layer": "global",
    "roles": [
      "enterprise",
      "staff"
    ],
    "visibility": [
      "ENTERPRISE",
      "STAFF"
    ],
    "goals": [
      "auth"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Corporate email domain does not match enterprise SAML configuration.",
    "description": "Blocks unauthorized personal accounts (e.g. @gmail.com) from accessing private corporate developer workspaces.",
    "actions": [
      "Display Domain Error Notice",
      "Provide IT Support Contact Link",
      "Prompt Corporate Email Re-Entry"
    ],
    "conditions": [
      "SAML assertion domain != configured enterprise tenant domain"
    ],
    "systems": [
      "SSOErrorNotice.js",
      "EnterpriseAuthGuard.js"
    ],
    "components": [
      "SSOErrorNotice.js",
      "EnterpriseAuthGuard.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase sso_audit_logs"
    ],
    "database": "Supabase sso_audit_logs",
    "auth": "public",
    "exceptions": [
      "Repeated invalid login attempts from unauthorized domain"
    ],
    "recovery": [
      "Temporary 15-minute IP rate limit to prevent credential stuffing"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_exc_sso_domain_mismatch_viewed",
      "properties": {
        "domain": "auth",
        "route": "/auth/sso/error"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 480,
    "y": 1500,
    "parents": [
      "auth_enterprise_sso"
    ],
    "children": [
      "rec_sso_idp_reauth"
    ],
    "actorRoles": [
      "enterprise",
      "staff"
    ],
    "uiAudience": [
      "ENTERPRISE",
      "STAFF"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_exc_sso_domain_mismatch_behavior",
        "text": "Exception: Enterprise SSO Domain Mismatch enforces defined auth behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PLANNED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "CRITICAL",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PLANNED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "rec_sso_idp_reauth",
    "canonicalId": "auth.sso.rec.idp_reauth",
    "name": "Action: Corporate IdP Portal Re-Authentication",
    "label": "Action: Corporate IdP Portal Re-Authentication",
    "type": "RECOVERY",
    "nodeType": "RECOVERY",
    "domain": "auth",
    "category": "architecture",
    "route": "/auth/sso/reauth",
    "layer": "global",
    "roles": [
      "enterprise",
      "staff"
    ],
    "visibility": [
      "ENTERPRISE",
      "STAFF"
    ],
    "goals": [
      "auth"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Redirects to corporate IdP login portal with tenant ID.",
    "description": "Seamlessly routes enterprise users to their company's Okta or Azure AD login portal to complete multi-factor authentication.",
    "actions": [
      "Generate Secure SAML RelayState",
      "Redirect to Corporate IdP Endpoint",
      "Receive Verified Assertion Response"
    ],
    "conditions": [
      "Valid enterprise organization tenant identifier"
    ],
    "systems": [
      "IdPRedirectEngine.js",
      "supabase.auth.signInWithSSO()"
    ],
    "components": [
      "IdPRedirectEngine.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase sso_providers"
    ],
    "database": "Supabase sso_providers",
    "auth": "public",
    "exceptions": [
      "Corporate IdP endpoint unreachable or certificate expired"
    ],
    "recovery": [
      "Fallback to emergency break-glass admin OTP authentication"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_rec_sso_idp_reauth_viewed",
      "properties": {
        "domain": "auth",
        "route": "/auth/sso/reauth"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 880,
    "y": 1500,
    "parents": [
      "auth_enterprise_sso",
      "exc_sso_domain_mismatch"
    ],
    "children": [
      "auth_enterprise_sso"
    ],
    "actorRoles": [
      "enterprise",
      "staff"
    ],
    "uiAudience": [
      "ENTERPRISE",
      "STAFF"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_rec_sso_idp_reauth_behavior",
        "text": "Action: Corporate IdP Portal Re-Authentication enforces defined auth behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PLANNED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "CRITICAL",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PLANNED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "sys_ephemeral_secret_engine",
    "canonicalId": "sentinel.ephemeral_secret_engine",
    "name": "System: Scoped Ephemeral Secret & Token Engine",
    "label": "System: Scoped Ephemeral Secret & Token Engine",
    "type": "SYSTEM",
    "nodeType": "SYSTEM",
    "domain": "sentinel",
    "category": "architecture",
    "route": "/api/security/scoped-token",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "sentinel"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Issues 1-hour short-lived scoped JWT tokens with immutable audit logs in secret_audit_logs.",
    "description": "Enforces least-privilege security by issuing short-lived credentials bound to explicit scopes (properties:read, units:write, storage:upload) that die after 3,600s.",
    "actions": [
      "Issue Scoped Ephemeral Token",
      "Log Access Event to secret_audit_logs",
      "Enforce 60-Minute Hard Expiry",
      "Sanitize API Error Stacks"
    ],
    "conditions": [
      "Valid user session requesting privileged service operations"
    ],
    "systems": [
      "src/lib/security/ephemeralSecretEngine.js",
      "supabase.from('secret_audit_logs')"
    ],
    "components": [
      "src/lib/security/ephemeralSecretEngine.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase secret_audit_logs"
    ],
    "database": "Supabase secret_audit_logs",
    "auth": "jwt_scoped",
    "exceptions": [
      "Token expires during long multi-step media upload session"
    ],
    "recovery": [
      "Triggers silent background token refresh without disrupting active file transfer"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_sys_ephemeral_secret_engine_viewed",
      "properties": {
        "domain": "sentinel",
        "route": "/api/security/scoped-token"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 480,
    "y": 650,
    "parents": [
      "sys_edge_ip_masking",
      "login",
      "rec_silent_token_refresh"
    ],
    "children": [
      "exc_ephemeral_token_expired",
      "rec_silent_token_refresh",
      "api_publish_listing",
      "sys_connect_wallet"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_sys_ephemeral_secret_engine_behavior",
        "text": "System: Scoped Ephemeral Secret & Token Engine enforces defined sentinel behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PLANNED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PLANNED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "exc_ephemeral_token_expired",
    "canonicalId": "sentinel.exc.token_expired",
    "name": "Exception: Ephemeral Token Expired (401)",
    "label": "Exception: Ephemeral Token Expired (401)",
    "type": "EXCEPTION",
    "nodeType": "EXCEPTION",
    "domain": "sentinel",
    "category": "architecture",
    "route": "/api/security/token-expired",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "sentinel"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "401 error when 60-minute token expires.",
    "description": "Gracefully handles token expiration by trapping 401 Unauthorized responses before user sees an error screen.",
    "actions": [
      "Trap 401 Expired Token Event",
      "Hold Active Request in Retry Queue",
      "Request Refresh Token Exchange"
    ],
    "conditions": [
      "API call received with expired ephemeral JWT token"
    ],
    "systems": [
      "ApiClientInterceptor.js",
      "TokenExpiryGuard.js"
    ],
    "components": [
      "ApiClientInterceptor.js",
      "TokenExpiryGuard.js"
    ],
    "apis": [],
    "dataRefs": [
      "None"
    ],
    "database": "None",
    "auth": "public",
    "exceptions": [
      "Refresh token also revoked or expired"
    ],
    "recovery": [
      "Prompts user with non-destructive session re-auth modal preserving form state"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_exc_ephemeral_token_expired_viewed",
      "properties": {
        "domain": "sentinel",
        "route": "/api/security/token-expired"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 880,
    "y": 650,
    "parents": [
      "sys_ephemeral_secret_engine"
    ],
    "children": [
      "rec_silent_token_refresh"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_exc_ephemeral_token_expired_behavior",
        "text": "Exception: Ephemeral Token Expired (401) enforces defined sentinel behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PLANNED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PLANNED",
    "evidenceStatus": "DOCUMENTED",
    "releaseStatus": "NOT_DEPLOYED"
  },
  {
    "id": "rec_silent_token_refresh",
    "canonicalId": "sentinel.rec.silent_refresh",
    "name": "Action: Silent Background Refresh Token Rotation",
    "label": "Action: Silent Background Refresh Token Rotation",
    "type": "RECOVERY",
    "nodeType": "RECOVERY",
    "domain": "core",
    "category": "architecture",
    "route": "/api/auth/refresh",
    "layer": "global",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "goals": [
      "core"
    ],
    "implementationStatus": "NOT_STARTED",
    "purpose": "Automatic background refresh token rotation without disrupting active user flow.",
    "description": "Silently exchanges refresh token for fresh 60-minute scoped JWT and automatically replays pending network requests.",
    "actions": [
      "Exchange Refresh Token for Fresh JWT",
      "Replay Queued API Requests",
      "Update Local Session Cache"
    ],
    "conditions": [
      "Valid unrevoked refresh token in secure HTTP-only cookie"
    ],
    "systems": [
      "supabase.auth.refreshSession()",
      "SessionManager.js"
    ],
    "components": [
      "SessionManager.js"
    ],
    "apis": [],
    "dataRefs": [
      "Supabase auth.sessions"
    ],
    "database": "Supabase auth.sessions",
    "auth": "http_only_cookie",
    "exceptions": [
      "Concurrent refresh requests causing race condition"
    ],
    "recovery": [
      "Uses single-flight mutex lock to coalesce simultaneous refresh calls"
    ],
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "telemetry": {
      "eventName": "flow_rec_silent_token_refresh_viewed",
      "properties": {
        "domain": "core",
        "route": "/api/auth/refresh"
      }
    },
    "brainRefs": [
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
      "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md",
      "_SCOUTIT_BRAIN/00_LOGIC_HIERARCHY.md"
    ],
    "terminal": false,
    "version": "2.1.0",
    "lastVerifiedAt": "2026-08-19",
    "x": 1280,
    "y": 650,
    "parents": [
      "sys_ephemeral_secret_engine",
      "exc_ephemeral_token_expired"
    ],
    "children": [
      "sys_ephemeral_secret_engine"
    ],
    "actorRoles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "uiAudience": [
      "PUBLIC"
    ],
    "knowledgeScope": [
      "INTERNAL",
      "STAFF",
      "ADMIN"
    ],
    "securityClassification": "INTERNAL",
    "claims": [
      {
        "id": "claim_rec_silent_token_refresh_behavior",
        "text": "Action: Silent Background Refresh Token Rotation enforces defined core behavioral contracts and access rules.",
        "kind": "PRODUCT_BEHAVIOR",
        "status": "PROPOSED",
        "evidence": [
          {
            "kind": "SCOUTIT_BRAIN",
            "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
            "provenance": "INFERRED",
            "confidence": 0.8
          }
        ],
        "confidence": 0.95,
        "machineVerifiedBy": "Automated Grounding Engine",
        "humanReviewedBy": null,
        "reviewStatus": "RESEARCHED",
        "reviewedAt": null
      }
    ],
    "legalReviewStatus": "RESEARCHED",
    "requiredCapabilities": [],
    "resourceRelationship": [],
    "ownershipRequirement": false,
    "dealParticipationRequired": false,
    "representationRequired": false,
    "governance": {
      "domainOwner": "Core Product Engineering",
      "reviewer": null,
      "riskLevel": "STANDARD",
      "approvedAt": null,
      "validFrom": null,
      "reviewAfter": null,
      "deprecatedBy": null,
      "changeReason": null
    },
    "guideability": "NONE",
    "isTerminal": false,
    "machineVerifiedBy": "Automated Grounding Engine",
    "humanReviewedBy": null,
    "machineVerificationStatus": "UNREVIEWED",
    "approvedAt": null,
    "productReviewStatus": "RESEARCHED",
    "securityReviewStatus": "RESEARCHED",
    "productStatus": "PROPOSED",
    "evidenceStatus": "UNVERIFIED",
    "releaseStatus": "NOT_DEPLOYED"
  }
];

export const MASTER_FLOW_EDGES = [
  {
    "id": "e_hero_to_sys_edge_ip_masking_1",
    "source": "hero",
    "target": "sys_edge_ip_masking",
    "type": "SYSTEM",
    "label": "Hero Landing & Space Canvas → System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge)",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to sentinel.edge.ip_masking"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge)",
    "guideTarget": "sys_edge_ip_masking",
    "telemetryEvent": "flow_transition_hero_sys_edge_ip_masking",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_SYS_EDGE_IP_MASKING",
    "predicate": null,
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to sentinel.edge.ip_masking"
    ],
    "quality": null
  },
  {
    "id": "e_sys_edge_ip_masking_to_sys_velocity_radar_2",
    "source": "sys_edge_ip_masking",
    "target": "sys_velocity_radar",
    "type": "SYSTEM",
    "label": "System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge) → System: Sentinel Velocity Radar & Trajectory Detection",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge) → System: Sentinel Velocity Radar & Trajectory Detection",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.edge.ip_masking to sentinel.velocity_radar"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge) to System: Sentinel Velocity Radar & Trajectory Detection",
    "guideTarget": "sys_velocity_radar",
    "telemetryEvent": "flow_transition_sys_edge_ip_masking_sys_velocity_radar",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/middleware.js",
        "symbol": "middleware",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_EDGE_IP_MASKING_TO_SYS_VELOCITY_RADAR",
    "predicate": null,
    "preconditions": [
      "Every incoming HTTP request through Vercel Edge Middleware"
    ],
    "postconditions": [
      "Transition from sentinel.edge.ip_masking to sentinel.velocity_radar"
    ],
    "quality": null
  },
  {
    "id": "e_sys_velocity_radar_to_exc_bot_quarantine_3",
    "source": "sys_velocity_radar",
    "target": "exc_bot_quarantine",
    "type": "FAILURE",
    "label": "System: Sentinel Velocity Radar & Trajectory Detection → Exception: Sentinel Automated Session Quarantine",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Sentinel Velocity Radar & Trajectory Detection → Exception: Sentinel Automated Session Quarantine",
      "status == \"ERROR\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.velocity_radar to sentinel.exc.bot_quarantine"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_turnstile_challenge",
    "guideInstruction": "Navigate from System: Sentinel Velocity Radar & Trajectory Detection to Exception: Sentinel Automated Session Quarantine",
    "guideTarget": "exc_bot_quarantine",
    "telemetryEvent": "flow_transition_sys_velocity_radar_exc_bot_quarantine",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "FAILURE_EXC_BOT_QUARANTINE",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "ERROR",
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "Active session stream"
    ],
    "postconditions": [
      "Transition from sentinel.velocity_radar to sentinel.exc.bot_quarantine"
    ],
    "failureReason": "System: Sentinel Velocity Radar & Trajectory Detection → Exception: Sentinel Automated Session Quarantine",
    "quality": "DOMAIN_DECISION",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_exc_bot_quarantine_to_rec_turnstile_challenge_4",
    "source": "exc_bot_quarantine",
    "target": "rec_turnstile_challenge",
    "type": "RECOVERY",
    "label": "Exception: Sentinel Automated Session Quarantine → Recovery: Cloudflare Turnstile Human Verification Challenge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Exception: Sentinel Automated Session Quarantine → Recovery: Cloudflare Turnstile Human Verification Challenge",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.exc.bot_quarantine to sentinel.rec.turnstile"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_turnstile_challenge",
    "guideInstruction": "Navigate from Exception: Sentinel Automated Session Quarantine to Recovery: Cloudflare Turnstile Human Verification Challenge",
    "guideTarget": "rec_turnstile_challenge",
    "telemetryEvent": "flow_transition_exc_bot_quarantine_rec_turnstile_challenge",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_REC_TURNSTILE_CHALLENGE",
    "predicate": null,
    "preconditions": [
      "Session velocity threshold crossed"
    ],
    "postconditions": [
      "Transition from sentinel.exc.bot_quarantine to sentinel.rec.turnstile"
    ],
    "quality": null
  },
  {
    "id": "e_rec_turnstile_challenge_to_discover_directory_5",
    "source": "rec_turnstile_challenge",
    "target": "discover_directory",
    "type": "RETRY",
    "label": "Recovery: Cloudflare Turnstile Human Verification Challenge → Space Directory & Radius Radar",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Recovery: Cloudflare Turnstile Human Verification Challenge → Space Directory & Radius Radar",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.rec.turnstile to discovery.directory"
    ],
    "apiRefs": [
      "src/app/api/cms/route.js"
    ],
    "reversible": true,
    "recoveryTarget": "discover_directory",
    "guideInstruction": "Navigate from Recovery: Cloudflare Turnstile Human Verification Challenge to Space Directory & Radius Radar",
    "guideTarget": "discover_directory",
    "telemetryEvent": "flow_transition_rec_turnstile_challenge_discover_directory",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_DISCOVER_DIRECTORY",
    "predicate": null,
    "preconditions": [
      "Session quarantined by Velocity Radar"
    ],
    "postconditions": [
      "Transition from sentinel.rec.turnstile to discovery.directory"
    ],
    "quality": null
  },
  {
    "id": "e_exc_bot_quarantine_to_terminal_edge_blacklist_6",
    "source": "exc_bot_quarantine",
    "target": "terminal_edge_blacklist",
    "type": "TERMINATE",
    "label": "Exception: Sentinel Automated Session Quarantine → Outcome: Edge Connection Drop & Cloudflare Blacklist",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Exception: Sentinel Automated Session Quarantine → Outcome: Edge Connection Drop & Cloudflare Blacklist",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.exc.bot_quarantine to sentinel.terminal.blacklist"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Exception: Sentinel Automated Session Quarantine to Outcome: Edge Connection Drop & Cloudflare Blacklist",
    "guideTarget": "terminal_edge_blacklist",
    "telemetryEvent": "flow_transition_exc_bot_quarantine_terminal_edge_blacklist",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_EXC_BOT_QUARANTINE_TO_TERMINAL_EDGE_BLACKLIST",
    "predicate": null,
    "preconditions": [
      "Session velocity threshold crossed"
    ],
    "postconditions": [
      "Transition from sentinel.exc.bot_quarantine to sentinel.terminal.blacklist"
    ],
    "quality": null
  },
  {
    "id": "e_hero_to_orbit_7",
    "source": "hero",
    "target": "orbit",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Layer 01 — Orbit (The Board)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Layer 01 — Orbit (The Board)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to layer.orbit"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Layer 01 — Orbit (The Board)",
    "guideTarget": "orbit",
    "telemetryEvent": "flow_transition_hero_orbit",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_ORBIT",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to layer.orbit"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_stratosphere_8",
    "source": "hero",
    "target": "stratosphere",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Layer 02 — Stratosphere (Intel & Atmosphere)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Layer 02 — Stratosphere (Intel & Atmosphere)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to layer.stratosphere"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Layer 02 — Stratosphere (Intel & Atmosphere)",
    "guideTarget": "stratosphere",
    "telemetryEvent": "flow_transition_hero_stratosphere",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_STRATOSPHERE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to layer.stratosphere"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_metropolis_9",
    "source": "hero",
    "target": "metropolis",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Layer 03 — Metropolis (District Clusters)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Layer 03 — Metropolis (District Clusters)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to layer.metropolis"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Layer 03 — Metropolis (District Clusters)",
    "guideTarget": "metropolis",
    "telemetryEvent": "flow_transition_hero_metropolis",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_METROPOLIS",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to layer.metropolis"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_crust_10",
    "source": "hero",
    "target": "crust",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Layer 04 — Crust (Neighborhood Reality)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Layer 04 — Crust (Neighborhood Reality)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to layer.crust"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Layer 04 — Crust (Neighborhood Reality)",
    "guideTarget": "crust",
    "telemetryEvent": "flow_transition_hero_crust",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_CRUST",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to layer.crust"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_mantle_11",
    "source": "hero",
    "target": "mantle",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Layer 05 — Mantle (Architectural Blueprints)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Layer 05 — Mantle (Architectural Blueprints)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to layer.mantle"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Layer 05 — Mantle (Architectural Blueprints)",
    "guideTarget": "mantle",
    "telemetryEvent": "flow_transition_hero_mantle",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_MANTLE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to layer.mantle"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_core_12",
    "source": "hero",
    "target": "core",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Layer 06 — Core (Private Unit Level)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Layer 06 — Core (Private Unit Level)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to layer.core"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Layer 06 — Core (Private Unit Level)",
    "guideTarget": "core",
    "telemetryEvent": "flow_transition_hero_core",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_CORE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to layer.core"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_showcase_13",
    "source": "hero",
    "target": "showcase",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → The Showcase Leaderboard (HUD Stage)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → The Showcase Leaderboard (HUD Stage)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to layer.showcase"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to The Showcase Leaderboard (HUD Stage)",
    "guideTarget": "showcase",
    "telemetryEvent": "flow_transition_hero_showcase",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_SHOWCASE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to layer.showcase"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_discover_directory_14",
    "source": "hero",
    "target": "discover_directory",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Space Directory & Radius Radar",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Space Directory & Radius Radar",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to discovery.directory"
    ],
    "apiRefs": [
      "src/app/api/cms/route.js"
    ],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Space Directory & Radius Radar",
    "guideTarget": "discover_directory",
    "telemetryEvent": "flow_transition_hero_discover_directory",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_DISCOVER_DIRECTORY",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to discovery.directory"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_spatial_canvas_15",
    "source": "hero",
    "target": "spatial_canvas",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Spatial Canvas (2D/3D Infinite Map)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Spatial Canvas (2D/3D Infinite Map)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to discovery.spatial_canvas"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Spatial Canvas (2D/3D Infinite Map)",
    "guideTarget": "spatial_canvas",
    "telemetryEvent": "flow_transition_hero_spatial_canvas",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_SPATIAL_CANVAS",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to discovery.spatial_canvas"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_wishlist_16",
    "source": "hero",
    "target": "wishlist",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → The Ledger (Private Wishlist)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → The Ledger (Private Wishlist)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to seeker.wishlist"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to The Ledger (Private Wishlist)",
    "guideTarget": "wishlist",
    "telemetryEvent": "flow_transition_hero_wishlist",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_WISHLIST",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to seeker.wishlist"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_intel_articles_17",
    "source": "hero",
    "target": "intel_articles",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Spatial Intelligence Newsroom & Briefings",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Spatial Intelligence Newsroom & Briefings",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to intel.articles"
    ],
    "apiRefs": [
      "src/app/api/cms/route.js"
    ],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Spatial Intelligence Newsroom & Briefings",
    "guideTarget": "intel_articles",
    "telemetryEvent": "flow_transition_hero_intel_articles",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_INTEL_ARTICLES",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to intel.articles"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_hubs_18",
    "source": "hero",
    "target": "hubs",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Regional Transport & Location Hubs",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Regional Transport & Location Hubs",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to discovery.hubs"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Regional Transport & Location Hubs",
    "guideTarget": "hubs",
    "telemetryEvent": "flow_transition_hero_hubs",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_HUBS",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to discovery.hubs"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_transit_19",
    "source": "hero",
    "target": "transit",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Arterial Transit Corridors & LRT/MRT Lines",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Arterial Transit Corridors & LRT/MRT Lines",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to discovery.transit"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Arterial Transit Corridors & LRT/MRT Lines",
    "guideTarget": "transit",
    "telemetryEvent": "flow_transition_hero_transit",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_TRANSIT",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to discovery.transit"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_brokers_roster_20",
    "source": "hero",
    "target": "brokers_roster",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Verified Licensed Brokers Directory",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Verified Licensed Brokers Directory",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to roster.brokers"
    ],
    "apiRefs": [
      "src/app/api/cms/route.js"
    ],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Verified Licensed Brokers Directory",
    "guideTarget": "brokers_roster",
    "telemetryEvent": "flow_transition_hero_brokers_roster",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_BROKERS_ROSTER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to roster.brokers"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_photographers_roster_21",
    "source": "hero",
    "target": "photographers_roster",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Architectural & Drone Media Directory",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Architectural & Drone Media Directory",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to roster.photographers"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Architectural & Drone Media Directory",
    "guideTarget": "photographers_roster",
    "telemetryEvent": "flow_transition_hero_photographers_roster",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_PHOTOGRAPHERS_ROSTER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to roster.photographers"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_researchers_roster_22",
    "source": "hero",
    "target": "researchers_roster",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Spatial Researchers & Bounty Workforce",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Spatial Researchers & Bounty Workforce",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to roster.researchers"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Spatial Researchers & Bounty Workforce",
    "guideTarget": "researchers_roster",
    "telemetryEvent": "flow_transition_hero_researchers_roster",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_RESEARCHERS_ROSTER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to roster.researchers"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_planners_roster_23",
    "source": "hero",
    "target": "planners_roster",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Event Designers & Venue Curators",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Event Designers & Venue Curators",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to roster.planners"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Event Designers & Venue Curators",
    "guideTarget": "planners_roster",
    "telemetryEvent": "flow_transition_hero_planners_roster",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_PLANNERS_ROSTER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to roster.planners"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_badges_24",
    "source": "hero",
    "target": "badges",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Trust & Verification Badges Standard",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Trust & Verification Badges Standard",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to gamification.badges"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Trust & Verification Badges Standard",
    "guideTarget": "badges",
    "telemetryEvent": "flow_transition_hero_badges",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_BADGES",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to gamification.badges"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_privacy_page_25",
    "source": "hero",
    "target": "privacy_page",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Privacy & Data Protection Policy (RA 10173)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Privacy & Data Protection Policy (RA 10173)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to legal.privacy"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Privacy & Data Protection Policy (RA 10173)",
    "guideTarget": "privacy_page",
    "telemetryEvent": "flow_transition_hero_privacy_page",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_PRIVACY_PAGE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to legal.privacy"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_terms_page_26",
    "source": "hero",
    "target": "terms_page",
    "type": "NAVIGATE",
    "label": "Hero Landing & Space Canvas → Platform Terms & RESA RA 9646 Compliance",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Platform Terms & RESA RA 9646 Compliance",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to legal.terms"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Platform Terms & RESA RA 9646 Compliance",
    "guideTarget": "terms_page",
    "telemetryEvent": "flow_transition_hero_terms_page",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HERO_TO_TERMS_PAGE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to legal.terms"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hero_to_login_27",
    "source": "hero",
    "target": "login",
    "type": "AUTH_GATE",
    "label": "Hero Landing & Space Canvas → Supabase Identity & Auth Portal",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Hero Landing & Space Canvas → Supabase Identity & Auth Portal",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from entry.hero to auth.login"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Hero Landing & Space Canvas to Supabase Identity & Auth Portal",
    "guideTarget": "auth-login-submit-btn",
    "telemetryEvent": "flow_transition_hero_login",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic/BlackHoleCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/layout/Header.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "PERMISSION_VERIFICATION",
    "predicate": null,
    "preconditions": [
      "Publicly accessible without authentication"
    ],
    "postconditions": [
      "Transition from entry.hero to auth.login"
    ],
    "quality": null,
    "resumeIntent": "RESUME_AFTER_AUTH",
    "returnTarget": "inquiry_modal"
  },
  {
    "id": "e_direct_slug_to_pep_28",
    "source": "direct_slug",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Direct Canonical Slug URL → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Direct Canonical Slug URL → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.direct_slug to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Direct Canonical Slug URL to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_direct_slug_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/propertyRoutes.js",
        "symbol": "getPropertyUrl",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DIRECT_SLUG_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Valid property slug required"
    ],
    "postconditions": [
      "Transition from property.direct_slug to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_login_to_gate_adult_age_29",
    "source": "login",
    "target": "gate_adult_age",
    "type": "AUTH_GATE",
    "label": "Supabase Identity & Auth Portal → Decision Gate: Adult Eligibility Check (NPC Circular 2024-03)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Supabase Identity & Auth Portal → Decision Gate: Adult Eligibility Check (NPC Circular 2024-03)",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from auth.login to auth.gate.adult_age"
    ],
    "apiRefs": [
      "/api/user/complete-onboarding"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Supabase Identity & Auth Portal to Decision Gate: Adult Eligibility Check (NPC Circular 2024-03)",
    "guideTarget": "gate_adult_age",
    "telemetryEvent": "flow_transition_login_gate_adult_age",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/login/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/authClient.js",
        "symbol": "signInWithPassword",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "PERMISSION_VERIFICATION",
    "predicate": null,
    "preconditions": [
      "Valid email or OAuth provider account"
    ],
    "postconditions": [
      "Transition from auth.login to auth.gate.adult_age"
    ],
    "quality": null,
    "resumeIntent": "RESUME_AFTER_AUTH",
    "returnTarget": "inquiry_modal"
  },
  {
    "id": "e_gate_adult_age_to_auth_onboarding_flow_30",
    "source": "gate_adult_age",
    "target": "auth_onboarding_flow",
    "type": "CONDITION_TRUE",
    "label": "Decision Gate: Adult Eligibility Check (NPC Circular 2024-03) → New-User Onboarding & Role Workspace Selection",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Decision Gate: Adult Eligibility Check (NPC Circular 2024-03) → New-User Onboarding & Role Workspace Selection",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from auth.gate.adult_age to auth.onboarding"
    ],
    "apiRefs": [
      "/api/user/complete-onboarding"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Decision Gate: Adult Eligibility Check (NPC Circular 2024-03) to New-User Onboarding & Role Workspace Selection",
    "guideTarget": "auth_onboarding_flow",
    "telemetryEvent": "flow_transition_gate_adult_age_auth_onboarding_flow",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/serverAuth.js",
        "symbol": "assertAdultEligibility",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/adultEligibility.js",
        "symbol": "isAdultEligible",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/adultEligibility.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_GATE_ADULT_AGE_TO_AUTH_ONBOARDING_FLOW",
    "predicate": null,
    "preconditions": [
      "Authenticated Supabase user submitting onboarding profile"
    ],
    "postconditions": [
      "Transition from auth.gate.adult_age to auth.onboarding"
    ],
    "quality": null
  },
  {
    "id": "e_login_to_dashboard_buyer_31",
    "source": "login",
    "target": "dashboard_buyer",
    "type": "NAVIGATE",
    "label": "Supabase Identity & Auth Portal → Buyer Workspace (Management & Continuity)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Supabase Identity & Auth Portal → Buyer Workspace (Management & Continuity)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from auth.login to seeker.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Supabase Identity & Auth Portal to Buyer Workspace (Management & Continuity)",
    "guideTarget": "dashboard_buyer",
    "telemetryEvent": "flow_transition_login_dashboard_buyer",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/login/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/authClient.js",
        "symbol": "signInWithPassword",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_LOGIN_TO_DASHBOARD_BUYER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Valid email or OAuth provider account"
    ],
    "postconditions": [
      "Transition from auth.login to seeker.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_login_to_dashboard_owner_32",
    "source": "login",
    "target": "dashboard_owner",
    "type": "NAVIGATE",
    "label": "Supabase Identity & Auth Portal → Owner Workspace & Property Management",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Supabase Identity & Auth Portal → Owner Workspace & Property Management",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from auth.login to owner.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Supabase Identity & Auth Portal to Owner Workspace & Property Management",
    "guideTarget": "dashboard_owner",
    "telemetryEvent": "flow_transition_login_dashboard_owner",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/login/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/authClient.js",
        "symbol": "signInWithPassword",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_LOGIN_TO_DASHBOARD_OWNER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Valid email or OAuth provider account"
    ],
    "postconditions": [
      "Transition from auth.login to owner.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_login_to_dashboard_broker_33",
    "source": "login",
    "target": "dashboard_broker",
    "type": "NAVIGATE",
    "label": "Supabase Identity & Auth Portal → Broker Workspace & Deal Pipeline",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Supabase Identity & Auth Portal → Broker Workspace & Deal Pipeline",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from auth.login to broker.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Supabase Identity & Auth Portal to Broker Workspace & Deal Pipeline",
    "guideTarget": "dashboard_broker",
    "telemetryEvent": "flow_transition_login_dashboard_broker",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/login/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/authClient.js",
        "symbol": "signInWithPassword",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_LOGIN_TO_DASHBOARD_BROKER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Valid email or OAuth provider account"
    ],
    "postconditions": [
      "Transition from auth.login to broker.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_login_to_dashboard_provider_34",
    "source": "login",
    "target": "dashboard_provider",
    "type": "NAVIGATE",
    "label": "Supabase Identity & Auth Portal → Provider Workspace & QuestIT Bounties",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Supabase Identity & Auth Portal → Provider Workspace & QuestIT Bounties",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from auth.login to provider.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Supabase Identity & Auth Portal to Provider Workspace & QuestIT Bounties",
    "guideTarget": "dashboard_provider",
    "telemetryEvent": "flow_transition_login_dashboard_provider",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/login/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/authClient.js",
        "symbol": "signInWithPassword",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_LOGIN_TO_DASHBOARD_PROVIDER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Valid email or OAuth provider account"
    ],
    "postconditions": [
      "Transition from auth.login to provider.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_login_to_mission_control_35",
    "source": "login",
    "target": "mission_control",
    "type": "NAVIGATE",
    "label": "Supabase Identity & Auth Portal → Mission Control (Staff Operations Hub)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Supabase Identity & Auth Portal → Mission Control (Staff Operations Hub)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from auth.login to admin.mission_control"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Supabase Identity & Auth Portal to Mission Control (Staff Operations Hub)",
    "guideTarget": "mission_control",
    "telemetryEvent": "flow_transition_login_mission_control",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/login/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/authClient.js",
        "symbol": "signInWithPassword",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_LOGIN_TO_MISSION_CONTROL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Valid email or OAuth provider account"
    ],
    "postconditions": [
      "Transition from auth.login to admin.mission_control"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_auth_onboarding_flow_to_dashboard_buyer_36",
    "source": "auth_onboarding_flow",
    "target": "dashboard_buyer",
    "type": "NAVIGATE",
    "label": "New-User Onboarding & Role Workspace Selection → Buyer Workspace (Management & Continuity)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "New-User Onboarding & Role Workspace Selection → Buyer Workspace (Management & Continuity)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from auth.onboarding to seeker.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from New-User Onboarding & Role Workspace Selection to Buyer Workspace (Management & Continuity)",
    "guideTarget": "dashboard_buyer",
    "telemetryEvent": "flow_transition_auth_onboarding_flow_dashboard_buyer",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/onboarding/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/user/complete-onboarding/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/completeOnboardingApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_AUTH_ONBOARDING_FLOW_TO_DASHBOARD_BUYER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Supabase session without onboarding_completed_at"
    ],
    "postconditions": [
      "Transition from auth.onboarding to seeker.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_auth_onboarding_flow_to_dashboard_owner_37",
    "source": "auth_onboarding_flow",
    "target": "dashboard_owner",
    "type": "NAVIGATE",
    "label": "New-User Onboarding & Role Workspace Selection → Owner Workspace & Property Management",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "New-User Onboarding & Role Workspace Selection → Owner Workspace & Property Management",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from auth.onboarding to owner.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from New-User Onboarding & Role Workspace Selection to Owner Workspace & Property Management",
    "guideTarget": "dashboard_owner",
    "telemetryEvent": "flow_transition_auth_onboarding_flow_dashboard_owner",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/onboarding/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/user/complete-onboarding/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/completeOnboardingApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_AUTH_ONBOARDING_FLOW_TO_DASHBOARD_OWNER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Supabase session without onboarding_completed_at"
    ],
    "postconditions": [
      "Transition from auth.onboarding to owner.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_auth_onboarding_flow_to_dashboard_broker_38",
    "source": "auth_onboarding_flow",
    "target": "dashboard_broker",
    "type": "NAVIGATE",
    "label": "New-User Onboarding & Role Workspace Selection → Broker Workspace & Deal Pipeline",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "New-User Onboarding & Role Workspace Selection → Broker Workspace & Deal Pipeline",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from auth.onboarding to broker.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from New-User Onboarding & Role Workspace Selection to Broker Workspace & Deal Pipeline",
    "guideTarget": "dashboard_broker",
    "telemetryEvent": "flow_transition_auth_onboarding_flow_dashboard_broker",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/onboarding/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/user/complete-onboarding/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/completeOnboardingApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_AUTH_ONBOARDING_FLOW_TO_DASHBOARD_BROKER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Supabase session without onboarding_completed_at"
    ],
    "postconditions": [
      "Transition from auth.onboarding to broker.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_auth_onboarding_flow_to_dashboard_provider_39",
    "source": "auth_onboarding_flow",
    "target": "dashboard_provider",
    "type": "NAVIGATE",
    "label": "New-User Onboarding & Role Workspace Selection → Provider Workspace & QuestIT Bounties",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "New-User Onboarding & Role Workspace Selection → Provider Workspace & QuestIT Bounties",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from auth.onboarding to provider.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from New-User Onboarding & Role Workspace Selection to Provider Workspace & QuestIT Bounties",
    "guideTarget": "dashboard_provider",
    "telemetryEvent": "flow_transition_auth_onboarding_flow_dashboard_provider",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/onboarding/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/user/complete-onboarding/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/completeOnboardingApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_AUTH_ONBOARDING_FLOW_TO_DASHBOARD_PROVIDER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Supabase session without onboarding_completed_at"
    ],
    "postconditions": [
      "Transition from auth.onboarding to provider.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_orbit_to_showcase_40",
    "source": "orbit",
    "target": "showcase",
    "type": "NAVIGATE",
    "label": "Layer 01 — Orbit (The Board) → The Showcase Leaderboard (HUD Stage)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 01 — Orbit (The Board) → The Showcase Leaderboard (HUD Stage)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.orbit to layer.showcase"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 01 — Orbit (The Board) to The Showcase Leaderboard (HUD Stage)",
    "guideTarget": "showcase",
    "telemetryEvent": "flow_transition_orbit_showcase",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/orbit/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic-layers/OrbitCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_ORBIT_TO_SHOWCASE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.orbit to layer.showcase"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_orbit_to_pep_41",
    "source": "orbit",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Layer 01 — Orbit (The Board) → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 01 — Orbit (The Board) → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.orbit to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 01 — Orbit (The Board) to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_orbit_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/orbit/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/cinematic-layers/OrbitCanvas.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_ORBIT_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.orbit to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_showcase_to_pep_42",
    "source": "showcase",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "The Showcase Leaderboard (HUD Stage) → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "The Showcase Leaderboard (HUD Stage) → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.showcase to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from The Showcase Leaderboard (HUD Stage) to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_showcase_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/showcase/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SHOWCASE_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.showcase to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_stratosphere_to_intel_articles_43",
    "source": "stratosphere",
    "target": "intel_articles",
    "type": "NAVIGATE",
    "label": "Layer 02 — Stratosphere (Intel & Atmosphere) → Spatial Intelligence Newsroom & Briefings",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 02 — Stratosphere (Intel & Atmosphere) → Spatial Intelligence Newsroom & Briefings",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.stratosphere to intel.articles"
    ],
    "apiRefs": [
      "src/app/api/cms/route.js"
    ],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 02 — Stratosphere (Intel & Atmosphere) to Spatial Intelligence Newsroom & Briefings",
    "guideTarget": "intel_articles",
    "telemetryEvent": "flow_transition_stratosphere_intel_articles",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/stratosphere/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_STRATOSPHERE_TO_INTEL_ARTICLES",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.stratosphere to intel.articles"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_stratosphere_to_hubs_44",
    "source": "stratosphere",
    "target": "hubs",
    "type": "NAVIGATE",
    "label": "Layer 02 — Stratosphere (Intel & Atmosphere) → Regional Transport & Location Hubs",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 02 — Stratosphere (Intel & Atmosphere) → Regional Transport & Location Hubs",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.stratosphere to discovery.hubs"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 02 — Stratosphere (Intel & Atmosphere) to Regional Transport & Location Hubs",
    "guideTarget": "hubs",
    "telemetryEvent": "flow_transition_stratosphere_hubs",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/stratosphere/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_STRATOSPHERE_TO_HUBS",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.stratosphere to discovery.hubs"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_stratosphere_to_pep_45",
    "source": "stratosphere",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Layer 02 — Stratosphere (Intel & Atmosphere) → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 02 — Stratosphere (Intel & Atmosphere) → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.stratosphere to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 02 — Stratosphere (Intel & Atmosphere) to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_stratosphere_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/stratosphere/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_STRATOSPHERE_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.stratosphere to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_metropolis_to_discover_directory_46",
    "source": "metropolis",
    "target": "discover_directory",
    "type": "NAVIGATE",
    "label": "Layer 03 — Metropolis (District Clusters) → Space Directory & Radius Radar",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 03 — Metropolis (District Clusters) → Space Directory & Radius Radar",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.metropolis to discovery.directory"
    ],
    "apiRefs": [
      "src/app/api/cms/route.js"
    ],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 03 — Metropolis (District Clusters) to Space Directory & Radius Radar",
    "guideTarget": "discover_directory",
    "telemetryEvent": "flow_transition_metropolis_discover_directory",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/metropolis/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_METROPOLIS_TO_DISCOVER_DIRECTORY",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.metropolis to discovery.directory"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_metropolis_to_spatial_canvas_47",
    "source": "metropolis",
    "target": "spatial_canvas",
    "type": "NAVIGATE",
    "label": "Layer 03 — Metropolis (District Clusters) → Spatial Canvas (2D/3D Infinite Map)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 03 — Metropolis (District Clusters) → Spatial Canvas (2D/3D Infinite Map)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.metropolis to discovery.spatial_canvas"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 03 — Metropolis (District Clusters) to Spatial Canvas (2D/3D Infinite Map)",
    "guideTarget": "spatial_canvas",
    "telemetryEvent": "flow_transition_metropolis_spatial_canvas",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/metropolis/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_METROPOLIS_TO_SPATIAL_CANVAS",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.metropolis to discovery.spatial_canvas"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_metropolis_to_transit_48",
    "source": "metropolis",
    "target": "transit",
    "type": "NAVIGATE",
    "label": "Layer 03 — Metropolis (District Clusters) → Arterial Transit Corridors & LRT/MRT Lines",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 03 — Metropolis (District Clusters) → Arterial Transit Corridors & LRT/MRT Lines",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.metropolis to discovery.transit"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 03 — Metropolis (District Clusters) to Arterial Transit Corridors & LRT/MRT Lines",
    "guideTarget": "transit",
    "telemetryEvent": "flow_transition_metropolis_transit",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/metropolis/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_METROPOLIS_TO_TRANSIT",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.metropolis to discovery.transit"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_metropolis_to_pep_49",
    "source": "metropolis",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Layer 03 — Metropolis (District Clusters) → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 03 — Metropolis (District Clusters) → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.metropolis to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 03 — Metropolis (District Clusters) to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_metropolis_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/metropolis/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_METROPOLIS_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.metropolis to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_crust_to_discover_directory_50",
    "source": "crust",
    "target": "discover_directory",
    "type": "NAVIGATE",
    "label": "Layer 04 — Crust (Neighborhood Reality) → Space Directory & Radius Radar",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 04 — Crust (Neighborhood Reality) → Space Directory & Radius Radar",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.crust to discovery.directory"
    ],
    "apiRefs": [
      "src/app/api/cms/route.js"
    ],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 04 — Crust (Neighborhood Reality) to Space Directory & Radius Radar",
    "guideTarget": "discover_directory",
    "telemetryEvent": "flow_transition_crust_discover_directory",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/crust/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_CRUST_TO_DISCOVER_DIRECTORY",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.crust to discovery.directory"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_crust_to_brokers_roster_51",
    "source": "crust",
    "target": "brokers_roster",
    "type": "NAVIGATE",
    "label": "Layer 04 — Crust (Neighborhood Reality) → Verified Licensed Brokers Directory",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 04 — Crust (Neighborhood Reality) → Verified Licensed Brokers Directory",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.crust to roster.brokers"
    ],
    "apiRefs": [
      "src/app/api/cms/route.js"
    ],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 04 — Crust (Neighborhood Reality) to Verified Licensed Brokers Directory",
    "guideTarget": "brokers_roster",
    "telemetryEvent": "flow_transition_crust_brokers_roster",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/crust/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_CRUST_TO_BROKERS_ROSTER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.crust to roster.brokers"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_crust_to_photographers_roster_52",
    "source": "crust",
    "target": "photographers_roster",
    "type": "NAVIGATE",
    "label": "Layer 04 — Crust (Neighborhood Reality) → Architectural & Drone Media Directory",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 04 — Crust (Neighborhood Reality) → Architectural & Drone Media Directory",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.crust to roster.photographers"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 04 — Crust (Neighborhood Reality) to Architectural & Drone Media Directory",
    "guideTarget": "photographers_roster",
    "telemetryEvent": "flow_transition_crust_photographers_roster",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/crust/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_CRUST_TO_PHOTOGRAPHERS_ROSTER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.crust to roster.photographers"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_crust_to_researchers_roster_53",
    "source": "crust",
    "target": "researchers_roster",
    "type": "NAVIGATE",
    "label": "Layer 04 — Crust (Neighborhood Reality) → Spatial Researchers & Bounty Workforce",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 04 — Crust (Neighborhood Reality) → Spatial Researchers & Bounty Workforce",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.crust to roster.researchers"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 04 — Crust (Neighborhood Reality) to Spatial Researchers & Bounty Workforce",
    "guideTarget": "researchers_roster",
    "telemetryEvent": "flow_transition_crust_researchers_roster",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/crust/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_CRUST_TO_RESEARCHERS_ROSTER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.crust to roster.researchers"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_crust_to_planners_roster_54",
    "source": "crust",
    "target": "planners_roster",
    "type": "NAVIGATE",
    "label": "Layer 04 — Crust (Neighborhood Reality) → Event Designers & Venue Curators",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 04 — Crust (Neighborhood Reality) → Event Designers & Venue Curators",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.crust to roster.planners"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 04 — Crust (Neighborhood Reality) to Event Designers & Venue Curators",
    "guideTarget": "planners_roster",
    "telemetryEvent": "flow_transition_crust_planners_roster",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/crust/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_CRUST_TO_PLANNERS_ROSTER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.crust to roster.planners"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_crust_to_badges_55",
    "source": "crust",
    "target": "badges",
    "type": "NAVIGATE",
    "label": "Layer 04 — Crust (Neighborhood Reality) → Trust & Verification Badges Standard",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 04 — Crust (Neighborhood Reality) → Trust & Verification Badges Standard",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.crust to gamification.badges"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 04 — Crust (Neighborhood Reality) to Trust & Verification Badges Standard",
    "guideTarget": "badges",
    "telemetryEvent": "flow_transition_crust_badges",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/crust/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_CRUST_TO_BADGES",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.crust to gamification.badges"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_crust_to_pep_56",
    "source": "crust",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Layer 04 — Crust (Neighborhood Reality) → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 04 — Crust (Neighborhood Reality) → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.crust to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 04 — Crust (Neighborhood Reality) to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_crust_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/crust/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_CRUST_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from layer.crust to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_mantle_to_pep_57",
    "source": "mantle",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Layer 05 — Mantle (Architectural Blueprints) → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 05 — Mantle (Architectural Blueprints) → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from layer.mantle to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 05 — Mantle (Architectural Blueprints) to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_mantle_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/mantle/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_MANTLE_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; detailed MEP requires Solar+"
    ],
    "postconditions": [
      "Transition from layer.mantle to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_core_to_pep_58",
    "source": "core",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Layer 06 — Core (Private Unit Level) → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Layer 06 — Core (Private Unit Level) → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from layer.core to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Layer 06 — Core (Private Unit Level) to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_core_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/layer/core/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_CORE_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Requires authentication; 3D Vault requires Cluster+"
    ],
    "postconditions": [
      "Transition from layer.core to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_discover_directory_to_search_results_59",
    "source": "discover_directory",
    "target": "search_results",
    "type": "NAVIGATE",
    "label": "Space Directory & Radius Radar → Search Results & Curated Discovery Grid",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Space Directory & Radius Radar → Search Results & Curated Discovery Grid",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from discovery.directory to discovery.search_results"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Space Directory & Radius Radar to Search Results & Curated Discovery Grid",
    "guideTarget": "search_results",
    "telemetryEvent": "flow_transition_discover_directory_search_results",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/cms/route.js",
        "symbol": "GET",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DISCOVER_DIRECTORY_TO_SEARCH_RESULTS",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from discovery.directory to discovery.search_results"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_discover_directory_to_wishlist_60",
    "source": "discover_directory",
    "target": "wishlist",
    "type": "NAVIGATE",
    "label": "Space Directory & Radius Radar → The Ledger (Private Wishlist)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Space Directory & Radius Radar → The Ledger (Private Wishlist)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from discovery.directory to seeker.wishlist"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Space Directory & Radius Radar to The Ledger (Private Wishlist)",
    "guideTarget": "wishlist",
    "telemetryEvent": "flow_transition_discover_directory_wishlist",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/cms/route.js",
        "symbol": "GET",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DISCOVER_DIRECTORY_TO_WISHLIST",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from discovery.directory to seeker.wishlist"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_search_results_to_pep_61",
    "source": "search_results",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Search Results & Curated Discovery Grid → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Search Results & Curated Discovery Grid → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from discovery.search_results to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Search Results & Curated Discovery Grid to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_search_results_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SEARCH_RESULTS_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Directory query active"
    ],
    "postconditions": [
      "Transition from discovery.search_results to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_spatial_canvas_to_pep_62",
    "source": "spatial_canvas",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Spatial Canvas (2D/3D Infinite Map) → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Spatial Canvas (2D/3D Infinite Map) → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from discovery.spatial_canvas to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Spatial Canvas (2D/3D Infinite Map) to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_spatial_canvas_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/SpatialCommandMap.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/spatialCanvasLenses.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SPATIAL_CANVAS_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "WebGL supported"
    ],
    "postconditions": [
      "Transition from discovery.spatial_canvas to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_wishlist_to_pep_63",
    "source": "wishlist",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "The Ledger (Private Wishlist) → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "The Ledger (Private Wishlist) → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from seeker.wishlist to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from The Ledger (Private Wishlist) to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_wishlist_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/wishlist/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/wishlistCrypto.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_WISHLIST_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Works anonymously on device or authenticated with Supabase"
    ],
    "postconditions": [
      "Transition from seeker.wishlist to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_wishlist_to_dashboard_buyer_64",
    "source": "wishlist",
    "target": "dashboard_buyer",
    "type": "NAVIGATE",
    "label": "The Ledger (Private Wishlist) → Buyer Workspace (Management & Continuity)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "The Ledger (Private Wishlist) → Buyer Workspace (Management & Continuity)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from seeker.wishlist to seeker.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from The Ledger (Private Wishlist) to Buyer Workspace (Management & Continuity)",
    "guideTarget": "dashboard_buyer",
    "telemetryEvent": "flow_transition_wishlist_dashboard_buyer",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/wishlist/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/wishlistCrypto.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_WISHLIST_TO_DASHBOARD_BUYER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Works anonymously on device or authenticated with Supabase"
    ],
    "postconditions": [
      "Transition from seeker.wishlist to seeker.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_hubs_to_pep_65",
    "source": "hubs",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Regional Transport & Location Hubs → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Regional Transport & Location Hubs → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from discovery.hubs to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Regional Transport & Location Hubs to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_hubs_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/hubs/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/hubProperties.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_HUBS_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from discovery.hubs to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_transit_to_pep_66",
    "source": "transit",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Arterial Transit Corridors & LRT/MRT Lines → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Arterial Transit Corridors & LRT/MRT Lines → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from discovery.transit to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Arterial Transit Corridors & LRT/MRT Lines to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_transit_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/transit/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/transit.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_TRANSIT_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from discovery.transit to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_brokers_roster_to_pep_67",
    "source": "brokers_roster",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Verified Licensed Brokers Directory → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Verified Licensed Brokers Directory → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from roster.brokers to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Verified Licensed Brokers Directory to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_brokers_roster_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/brokers/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_BROKERS_ROSTER_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from roster.brokers to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_brokers_roster_to_dashboard_broker_68",
    "source": "brokers_roster",
    "target": "dashboard_broker",
    "type": "NAVIGATE",
    "label": "Verified Licensed Brokers Directory → Broker Workspace & Deal Pipeline",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Verified Licensed Brokers Directory → Broker Workspace & Deal Pipeline",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from roster.brokers to broker.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Verified Licensed Brokers Directory to Broker Workspace & Deal Pipeline",
    "guideTarget": "dashboard_broker",
    "telemetryEvent": "flow_transition_brokers_roster_dashboard_broker",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/brokers/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_BROKERS_ROSTER_TO_DASHBOARD_BROKER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from roster.brokers to broker.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_photographers_roster_to_dashboard_provider_69",
    "source": "photographers_roster",
    "target": "dashboard_provider",
    "type": "NAVIGATE",
    "label": "Architectural & Drone Media Directory → Provider Workspace & QuestIT Bounties",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Architectural & Drone Media Directory → Provider Workspace & QuestIT Bounties",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from roster.photographers to provider.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Architectural & Drone Media Directory to Provider Workspace & QuestIT Bounties",
    "guideTarget": "dashboard_provider",
    "telemetryEvent": "flow_transition_photographers_roster_dashboard_provider",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/photographers/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PHOTOGRAPHERS_ROSTER_TO_DASHBOARD_PROVIDER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from roster.photographers to provider.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_researchers_roster_to_dashboard_provider_70",
    "source": "researchers_roster",
    "target": "dashboard_provider",
    "type": "NAVIGATE",
    "label": "Spatial Researchers & Bounty Workforce → Provider Workspace & QuestIT Bounties",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Spatial Researchers & Bounty Workforce → Provider Workspace & QuestIT Bounties",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from roster.researchers to provider.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Spatial Researchers & Bounty Workforce to Provider Workspace & QuestIT Bounties",
    "guideTarget": "dashboard_provider",
    "telemetryEvent": "flow_transition_researchers_roster_dashboard_provider",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/researchers/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_RESEARCHERS_ROSTER_TO_DASHBOARD_PROVIDER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from roster.researchers to provider.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_planners_roster_to_dashboard_provider_71",
    "source": "planners_roster",
    "target": "dashboard_provider",
    "type": "NAVIGATE",
    "label": "Event Designers & Venue Curators → Provider Workspace & QuestIT Bounties",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Event Designers & Venue Curators → Provider Workspace & QuestIT Bounties",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from roster.planners to provider.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Event Designers & Venue Curators to Provider Workspace & QuestIT Bounties",
    "guideTarget": "dashboard_provider",
    "telemetryEvent": "flow_transition_planners_roster_dashboard_provider",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/event-planners/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PLANNERS_ROSTER_TO_DASHBOARD_PROVIDER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from roster.planners to provider.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_pep_ch1_space_72",
    "source": "pep",
    "target": "pep_ch1_space",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Chapter 01 — The Space / Floor Plate / Capacity",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Chapter 01 — The Space / Floor Plate / Capacity",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to property.pep.ch1_space"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Chapter 01 — The Space / Floor Plate / Capacity",
    "guideTarget": "pep_ch1_space",
    "telemetryEvent": "flow_transition_pep_pep_ch1_space",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_PEP_CH1_SPACE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to property.pep.ch1_space"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_pep_ch2_location_73",
    "source": "pep",
    "target": "pep_ch2_location",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Chapter 02 — Location & Transit Logistics",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Chapter 02 — Location & Transit Logistics",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to property.pep.ch2_location"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Chapter 02 — Location & Transit Logistics",
    "guideTarget": "pep_ch2_location",
    "telemetryEvent": "flow_transition_pep_pep_ch2_location",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_PEP_CH2_LOCATION",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to property.pep.ch2_location"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_pep_ch3_life_74",
    "source": "pep",
    "target": "pep_ch3_life",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Chapter 03 — Life Here / Workday / Atmosphere",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Chapter 03 — Life Here / Workday / Atmosphere",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to property.pep.ch3_life"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Chapter 03 — Life Here / Workday / Atmosphere",
    "guideTarget": "pep_ch3_life",
    "telemetryEvent": "flow_transition_pep_pep_ch3_life",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_PEP_CH3_LIFE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to property.pep.ch3_life"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_pep_ch4_where_to_75",
    "source": "pep",
    "target": "pep_ch4_where_to",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Chapter 04 — Where To? (The Neighborhood Radius)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Chapter 04 — Where To? (The Neighborhood Radius)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to property.pep.ch4_where_to"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Chapter 04 — Where To? (The Neighborhood Radius)",
    "guideTarget": "pep_ch4_where_to",
    "telemetryEvent": "flow_transition_pep_pep_ch4_where_to",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_PEP_CH4_WHERE_TO",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to property.pep.ch4_where_to"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_pep_ch5_build_plans_76",
    "source": "pep",
    "target": "pep_ch5_build_plans",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Chapter 05 — Build Plans & Fit-Out Engineering",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Chapter 05 — Build Plans & Fit-Out Engineering",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to property.pep.ch5_build_plans"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Chapter 05 — Build Plans & Fit-Out Engineering",
    "guideTarget": "pep_ch5_build_plans",
    "telemetryEvent": "flow_transition_pep_pep_ch5_build_plans",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_PEP_CH5_BUILD_PLANS",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to property.pep.ch5_build_plans"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_pep_ch6_fine_print_77",
    "source": "pep",
    "target": "pep_ch6_fine_print",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Chapter 06 — The Fine Print (Deep & Hidden Intel)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Chapter 06 — The Fine Print (Deep & Hidden Intel)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to property.pep.ch6_fine_print"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Chapter 06 — The Fine Print (Deep & Hidden Intel)",
    "guideTarget": "pep_ch6_fine_print",
    "telemetryEvent": "flow_transition_pep_pep_ch6_fine_print",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_PEP_CH6_FINE_PRINT",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to property.pep.ch6_fine_print"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_pep_ch7_units_78",
    "source": "pep",
    "target": "pep_ch7_units",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Chapter 07 — Units & Spaces (Inventory Grid)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Chapter 07 — Units & Spaces (Inventory Grid)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to property.pep.ch7_units"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Chapter 07 — Units & Spaces (Inventory Grid)",
    "guideTarget": "pep_ch7_units",
    "telemetryEvent": "flow_transition_pep_pep_ch7_units",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_PEP_CH7_UNITS",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to property.pep.ch7_units"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_pep_ch8_universe_79",
    "source": "pep",
    "target": "pep_ch8_universe",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Chapter 08 — Property Universe & Developer Credentials",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Chapter 08 — Property Universe & Developer Credentials",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to property.pep.ch8_universe"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Chapter 08 — Property Universe & Developer Credentials",
    "guideTarget": "pep_ch8_universe",
    "telemetryEvent": "flow_transition_pep_pep_ch8_universe",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_PEP_CH8_UNIVERSE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to property.pep.ch8_universe"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_pep_ch9_services_80",
    "source": "pep",
    "target": "pep_ch9_services",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Chapter 09 — Ecosystem Services & Creator Booking",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Chapter 09 — Ecosystem Services & Creator Booking",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to property.pep.ch9_services"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Chapter 09 — Ecosystem Services & Creator Booking",
    "guideTarget": "pep_ch9_services",
    "telemetryEvent": "flow_transition_pep_pep_ch9_services",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_PEP_CH9_SERVICES",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to property.pep.ch9_services"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_pep_ch10_your_move_81",
    "source": "pep",
    "target": "pep_ch10_your_move",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Chapter 10 — Your Move (Action Cockpit)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Chapter 10 — Your Move (Action Cockpit)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to property.pep.ch10_your_move"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Chapter 10 — Your Move (Action Cockpit)",
    "guideTarget": "property-your-move-actions",
    "telemetryEvent": "flow_transition_pep_pep_ch10_your_move",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_PEP_CH10_YOUR_MOVE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to property.pep.ch10_your_move"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_ch6_fine_print_to_gate_deep_intel_tier_82",
    "source": "pep_ch6_fine_print",
    "target": "gate_deep_intel_tier",
    "type": "AUTH_GATE",
    "label": "Chapter 06 — The Fine Print (Deep & Hidden Intel) → Decision Gate: Deep Intel Tier Entitlement (Solar+)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Chapter 06 — The Fine Print (Deep & Hidden Intel) → Decision Gate: Deep Intel Tier Entitlement (Solar+)",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from property.pep.ch6_fine_print to property.gate.deep_intel"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 06 — The Fine Print (Deep & Hidden Intel) to Decision Gate: Deep Intel Tier Entitlement (Solar+)",
    "guideTarget": "gate_deep_intel_tier",
    "telemetryEvent": "flow_transition_pep_ch6_fine_print_gate_deep_intel_tier",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.FINDEPRINT",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "PERMISSION_VERIFICATION",
    "predicate": null,
    "preconditions": [
      "Gated by canSee('deepIntel', tier) — Solar+ required"
    ],
    "postconditions": [
      "Transition from property.pep.ch6_fine_print to property.gate.deep_intel"
    ],
    "quality": null,
    "resumeIntent": "RESUME_AFTER_AUTH",
    "returnTarget": "inquiry_modal"
  },
  {
    "id": "e_pep_ch6_fine_print_to_gate_hidden_intel_tier_83",
    "source": "pep_ch6_fine_print",
    "target": "gate_hidden_intel_tier",
    "type": "AUTH_GATE",
    "label": "Chapter 06 — The Fine Print (Deep & Hidden Intel) → Decision Gate: Hidden Intel & Valuation Models (Cluster+)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Chapter 06 — The Fine Print (Deep & Hidden Intel) → Decision Gate: Hidden Intel & Valuation Models (Cluster+)",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from property.pep.ch6_fine_print to property.gate.hidden_intel"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 06 — The Fine Print (Deep & Hidden Intel) to Decision Gate: Hidden Intel & Valuation Models (Cluster+)",
    "guideTarget": "gate_hidden_intel_tier",
    "telemetryEvent": "flow_transition_pep_ch6_fine_print_gate_hidden_intel_tier",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.FINDEPRINT",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "PERMISSION_VERIFICATION",
    "predicate": null,
    "preconditions": [
      "Gated by canSee('deepIntel', tier) — Solar+ required"
    ],
    "postconditions": [
      "Transition from property.pep.ch6_fine_print to property.gate.hidden_intel"
    ],
    "quality": null,
    "resumeIntent": "RESUME_AFTER_AUTH",
    "returnTarget": "inquiry_modal"
  },
  {
    "id": "e_gate_deep_intel_tier_to_dec_tier_gate_84",
    "source": "gate_deep_intel_tier",
    "target": "dec_tier_gate",
    "type": "CONDITION_TRUE",
    "label": "Decision Gate: Deep Intel Tier Entitlement (Solar+) → Decision Gate: Tier Entitlement Check",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Decision Gate: Deep Intel Tier Entitlement (Solar+) → Decision Gate: Tier Entitlement Check",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from property.gate.deep_intel to auth.gate.tier"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Decision Gate: Deep Intel Tier Entitlement (Solar+) to Decision Gate: Tier Entitlement Check",
    "guideTarget": "dec_tier_gate",
    "telemetryEvent": "flow_transition_gate_deep_intel_tier_dec_tier_gate",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/entitlements.js",
        "symbol": "TIERS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_GATE_DEEP_INTEL_TIER_TO_DEC_TIER_GATE",
    "predicate": null,
    "preconditions": [
      "subscription_tier in ['solar', 'cluster', 'universe']"
    ],
    "postconditions": [
      "Transition from property.gate.deep_intel to auth.gate.tier"
    ],
    "quality": null
  },
  {
    "id": "e_gate_hidden_intel_tier_to_dec_tier_gate_85",
    "source": "gate_hidden_intel_tier",
    "target": "dec_tier_gate",
    "type": "CONDITION_TRUE",
    "label": "Decision Gate: Hidden Intel & Valuation Models (Cluster+) → Decision Gate: Tier Entitlement Check",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Decision Gate: Hidden Intel & Valuation Models (Cluster+) → Decision Gate: Tier Entitlement Check",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "enterprise"
    ],
    "visibility": [
      "SEEKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from property.gate.hidden_intel to auth.gate.tier"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Decision Gate: Hidden Intel & Valuation Models (Cluster+) to Decision Gate: Tier Entitlement Check",
    "guideTarget": "dec_tier_gate",
    "telemetryEvent": "flow_transition_gate_hidden_intel_tier_dec_tier_gate",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/entitlements.js",
        "symbol": "TIERS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_GATE_HIDDEN_INTEL_TIER_TO_DEC_TIER_GATE",
    "predicate": null,
    "preconditions": [
      "subscription_tier in ['cluster', 'universe']"
    ],
    "postconditions": [
      "Transition from property.gate.hidden_intel to auth.gate.tier"
    ],
    "quality": null
  },
  {
    "id": "e_pep_ch7_units_to_scenario_broker_lead_collision_86",
    "source": "pep_ch7_units",
    "target": "scenario_broker_lead_collision",
    "type": "TERMINATE",
    "label": "Chapter 07 — Units & Spaces (Inventory Grid) → Playbook 4.3 — Unit Operator vs Building Broker Lead Isolation",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Chapter 07 — Units & Spaces (Inventory Grid) → Playbook 4.3 — Unit Operator vs Building Broker Lead Isolation",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep.ch7_units to broker.leads.collision"
    ],
    "apiRefs": [
      "/api/deals/route-lead"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 07 — Units & Spaces (Inventory Grid) to Playbook 4.3 — Unit Operator vs Building Broker Lead Isolation",
    "guideTarget": "scenario_broker_lead_collision",
    "telemetryEvent": "flow_transition_pep_ch7_units_scenario_broker_lead_collision",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.UNITS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/UnitMasterPage.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_CH7_UNITS_TO_SCENARIO_BROKER_LEAD_COLLISION",
    "predicate": null,
    "preconditions": [
      "Publicly accessible; unit photos limited to 1 for Free tier vs 5 for PRO"
    ],
    "postconditions": [
      "Transition from property.pep.ch7_units to broker.leads.collision"
    ],
    "quality": null
  },
  {
    "id": "e_pep_ch9_services_to_sys_connect_wallet_87",
    "source": "pep_ch9_services",
    "target": "sys_connect_wallet",
    "type": "SYSTEM",
    "label": "Chapter 09 — Ecosystem Services & Creator Booking → System: Connects Wallet & Deduct RPC",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Chapter 09 — Ecosystem Services & Creator Booking → System: Connects Wallet & Deduct RPC",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep.ch9_services to connects.wallet"
    ],
    "apiRefs": [
      "src/app/api/deals/spend-connect/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 09 — Ecosystem Services & Creator Booking to System: Connects Wallet & Deduct RPC",
    "guideTarget": "sys_connect_wallet",
    "telemetryEvent": "flow_transition_pep_ch9_services_sys_connect_wallet",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.SERVICES",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_CH9_SERVICES_TO_SYS_CONNECT_WALLET",
    "predicate": null,
    "preconditions": [
      "Requires Connects wallet balance"
    ],
    "postconditions": [
      "Transition from property.pep.ch9_services to connects.wallet"
    ],
    "quality": null
  },
  {
    "id": "e_pep_ch10_your_move_to_act_save_reaction_88",
    "source": "pep_ch10_your_move",
    "target": "act_save_reaction",
    "type": "ACTION",
    "label": "Chapter 10 — Your Move (Action Cockpit) → Action: Save to Board / Reaction",
    "trigger": "User Click / Action",
    "conditions": [
      "Chapter 10 — Your Move (Action Cockpit) → Action: Save to Board / Reaction",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep.ch10_your_move to seeker.reaction.save"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 10 — Your Move (Action Cockpit) to Action: Save to Board / Reaction",
    "guideTarget": "act_save_reaction",
    "telemetryEvent": "flow_transition_pep_ch10_your_move_act_save_reaction",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.YOURMOVE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InquiryModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_CH10_YOUR_MOVE_TO_ACT_SAVE_REACTION",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Public reactions open; direct broker contact requires 1 Connect"
    ],
    "postconditions": [
      "Transition from property.pep.ch10_your_move to seeker.reaction.save"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_ch10_your_move_to_action_ask_faq_89",
    "source": "pep_ch10_your_move",
    "target": "action_ask_faq",
    "type": "ACTION",
    "label": "Chapter 10 — Your Move (Action Cockpit) → Action: Ask Public Question (Community FAQ)",
    "trigger": "User Click / Action",
    "conditions": [
      "Chapter 10 — Your Move (Action Cockpit) → Action: Ask Public Question (Community FAQ)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep.ch10_your_move to property.faq.ask"
    ],
    "apiRefs": [
      "/api/faq/ask"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 10 — Your Move (Action Cockpit) to Action: Ask Public Question (Community FAQ)",
    "guideTarget": "action_ask_faq",
    "telemetryEvent": "flow_transition_pep_ch10_your_move_action_ask_faq",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.YOURMOVE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InquiryModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_CH10_YOUR_MOVE_TO_ACTION_ASK_FAQ",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Public reactions open; direct broker contact requires 1 Connect"
    ],
    "postconditions": [
      "Transition from property.pep.ch10_your_move to property.faq.ask"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_ch10_your_move_to_inquiry_modal_90",
    "source": "pep_ch10_your_move",
    "target": "inquiry_modal",
    "type": "ACTION",
    "label": "Chapter 10 — Your Move (Action Cockpit) → Inquiry & Direct Lead Modal (1 Connect)",
    "trigger": "User Click / Action",
    "conditions": [
      "Chapter 10 — Your Move (Action Cockpit) → Inquiry & Direct Lead Modal (1 Connect)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep.ch10_your_move to deal.inquiry.modal"
    ],
    "apiRefs": [
      "/api/deals/initiate"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 10 — Your Move (Action Cockpit) to Inquiry & Direct Lead Modal (1 Connect)",
    "guideTarget": "send-inquiry-modal-btn",
    "telemetryEvent": "flow_transition_pep_ch10_your_move_inquiry_modal",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.YOURMOVE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InquiryModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_CH10_YOUR_MOVE_TO_INQUIRY_MODAL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Public reactions open; direct broker contact requires 1 Connect"
    ],
    "postconditions": [
      "Transition from property.pep.ch10_your_move to deal.inquiry.modal"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_ch10_your_move_to_booking_modal_91",
    "source": "pep_ch10_your_move",
    "target": "booking_modal",
    "type": "ACTION",
    "label": "Chapter 10 — Your Move (Action Cockpit) → Viewing Booking & Schedule Modal",
    "trigger": "User Click / Action",
    "conditions": [
      "Chapter 10 — Your Move (Action Cockpit) → Viewing Booking & Schedule Modal",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep.ch10_your_move to deal.viewing.modal"
    ],
    "apiRefs": [
      "/api/deals/schedule-viewing"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 10 — Your Move (Action Cockpit) to Viewing Booking & Schedule Modal",
    "guideTarget": "schedule-viewing-time-slots",
    "telemetryEvent": "flow_transition_pep_ch10_your_move_booking_modal",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.YOURMOVE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InquiryModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_CH10_YOUR_MOVE_TO_BOOKING_MODAL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Public reactions open; direct broker contact requires 1 Connect"
    ],
    "postconditions": [
      "Transition from property.pep.ch10_your_move to deal.viewing.modal"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_ch10_your_move_to_offer_modal_92",
    "source": "pep_ch10_your_move",
    "target": "offer_modal",
    "type": "ACTION",
    "label": "Chapter 10 — Your Move (Action Cockpit) → Make Offer & Intent Submission Modal",
    "trigger": "User Click / Action",
    "conditions": [
      "Chapter 10 — Your Move (Action Cockpit) → Make Offer & Intent Submission Modal",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep.ch10_your_move to deal.offer.modal"
    ],
    "apiRefs": [
      "/api/deals/make-offer"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 10 — Your Move (Action Cockpit) to Make Offer & Intent Submission Modal",
    "guideTarget": "submit-offer-form-btn",
    "telemetryEvent": "flow_transition_pep_ch10_your_move_offer_modal",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.YOURMOVE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InquiryModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_CH10_YOUR_MOVE_TO_OFFER_MODAL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Public reactions open; direct broker contact requires 1 Connect"
    ],
    "postconditions": [
      "Transition from property.pep.ch10_your_move to deal.offer.modal"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_ch10_your_move_to_claim_listing_modal_93",
    "source": "pep_ch10_your_move",
    "target": "claim_listing_modal",
    "type": "ACTION",
    "label": "Chapter 10 — Your Move (Action Cockpit) → Claim Listing Due Diligence Modal",
    "trigger": "User Click / Action",
    "conditions": [
      "Chapter 10 — Your Move (Action Cockpit) → Claim Listing Due Diligence Modal",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep.ch10_your_move to owner.claim_listing.modal"
    ],
    "apiRefs": [
      "/api/properties/claim"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 10 — Your Move (Action Cockpit) to Claim Listing Due Diligence Modal",
    "guideTarget": "claim_listing_modal",
    "telemetryEvent": "flow_transition_pep_ch10_your_move_claim_listing_modal",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.YOURMOVE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InquiryModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_CH10_YOUR_MOVE_TO_CLAIM_LISTING_MODAL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Public reactions open; direct broker contact requires 1 Connect"
    ],
    "postconditions": [
      "Transition from property.pep.ch10_your_move to owner.claim_listing.modal"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_act_save_reaction_to_wishlist_94",
    "source": "act_save_reaction",
    "target": "wishlist",
    "type": "NAVIGATE",
    "label": "Action: Save to Board / Reaction → The Ledger (Private Wishlist)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Save to Board / Reaction → The Ledger (Private Wishlist)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from seeker.reaction.save to seeker.wishlist"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Action: Save to Board / Reaction to The Ledger (Private Wishlist)",
    "guideTarget": "wishlist",
    "telemetryEvent": "flow_transition_act_save_reaction_wishlist",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/reactions/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_ACT_SAVE_REACTION_TO_WISHLIST",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Browser localStorage enabled"
    ],
    "postconditions": [
      "Transition from seeker.reaction.save to seeker.wishlist"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_action_ask_faq_to_sys_contact_leak_filter_95",
    "source": "action_ask_faq",
    "target": "sys_contact_leak_filter",
    "type": "SYSTEM",
    "label": "Action: Ask Public Question (Community FAQ) → System: Regex Contact Leak Detector",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Ask Public Question (Community FAQ) → System: Regex Contact Leak Detector",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.faq.ask to sentinel.contact_leak_filter"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Action: Ask Public Question (Community FAQ) to System: Regex Contact Leak Detector",
    "guideTarget": "sys_contact_leak_filter",
    "telemetryEvent": "flow_transition_action_ask_faq_sys_contact_leak_filter",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/faqs/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/PropertyFAQSection.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_ACTION_ASK_FAQ_TO_SYS_CONTACT_LEAK_FILTER",
    "predicate": null,
    "preconditions": [
      "Non-empty question text"
    ],
    "postconditions": [
      "Transition from property.faq.ask to sentinel.contact_leak_filter"
    ],
    "quality": null
  },
  {
    "id": "e_action_ask_faq_to_exc_contact_leak_blocked_96",
    "source": "action_ask_faq",
    "target": "exc_contact_leak_blocked",
    "type": "FAILURE",
    "label": "Action: Ask Public Question (Community FAQ) → Exception: Contact Information Leak Redacted",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Ask Public Question (Community FAQ) → Exception: Contact Information Leak Redacted",
      "status == \"ERROR\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.faq.ask to sentinel.exc.contact_leak"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_redact_contact_faq",
    "guideInstruction": "Navigate from Action: Ask Public Question (Community FAQ) to Exception: Contact Information Leak Redacted",
    "guideTarget": "exc_contact_leak_blocked",
    "telemetryEvent": "flow_transition_action_ask_faq_exc_contact_leak_blocked",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/faqs/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/PropertyFAQSection.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "FAILURE_EXC_CONTACT_LEAK_BLOCKED",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "ERROR",
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "Non-empty question text"
    ],
    "postconditions": [
      "Transition from property.faq.ask to sentinel.exc.contact_leak"
    ],
    "failureReason": "Action: Ask Public Question (Community FAQ) → Exception: Contact Information Leak Redacted",
    "quality": "DOMAIN_DECISION",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_exc_contact_leak_blocked_to_rec_redact_contact_faq_97",
    "source": "exc_contact_leak_blocked",
    "target": "rec_redact_contact_faq",
    "type": "RECOVERY",
    "label": "Exception: Contact Information Leak Redacted → Recovery: Redact Contact & Post Safe FAQ Text",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Exception: Contact Information Leak Redacted → Recovery: Redact Contact & Post Safe FAQ Text",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.exc.contact_leak to sentinel.rec.redact_contact"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_redact_contact_faq",
    "guideInstruction": "Navigate from Exception: Contact Information Leak Redacted to Recovery: Redact Contact & Post Safe FAQ Text",
    "guideTarget": "rec_redact_contact_faq",
    "telemetryEvent": "flow_transition_exc_contact_leak_blocked_rec_redact_contact_faq",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_REC_REDACT_CONTACT_FAQ",
    "predicate": null,
    "preconditions": [
      "Pattern matches phone/email regex in public FAQ"
    ],
    "postconditions": [
      "Transition from sentinel.exc.contact_leak to sentinel.rec.redact_contact"
    ],
    "quality": null
  },
  {
    "id": "e_rec_redact_contact_faq_to_action_ask_faq_98",
    "source": "rec_redact_contact_faq",
    "target": "action_ask_faq",
    "type": "RETRY",
    "label": "Recovery: Redact Contact & Post Safe FAQ Text → Action: Ask Public Question (Community FAQ)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Recovery: Redact Contact & Post Safe FAQ Text → Action: Ask Public Question (Community FAQ)",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.rec.redact_contact to property.faq.ask"
    ],
    "apiRefs": [
      "/api/faq/ask"
    ],
    "reversible": true,
    "recoveryTarget": "action_ask_faq",
    "guideInstruction": "Navigate from Recovery: Redact Contact & Post Safe FAQ Text to Action: Ask Public Question (Community FAQ)",
    "guideTarget": "action_ask_faq",
    "telemetryEvent": "flow_transition_rec_redact_contact_faq_action_ask_faq",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_ACTION_ASK_FAQ",
    "predicate": null,
    "preconditions": [
      "Redacted text validated"
    ],
    "postconditions": [
      "Transition from sentinel.rec.redact_contact to property.faq.ask"
    ],
    "quality": null
  },
  {
    "id": "e_sys_contact_leak_filter_to_pep_99",
    "source": "sys_contact_leak_filter",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "System: Regex Contact Leak Detector → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Regex Contact Leak Detector → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.contact_leak_filter to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Regex Contact Leak Detector to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_sys_contact_leak_filter_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/contactLeakFilter.js",
        "symbol": "filterContactLeaks",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/contactLeakFilter.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_CONTACT_LEAK_FILTER_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Any public text submission"
    ],
    "postconditions": [
      "Transition from sentinel.contact_leak_filter to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_inquiry_modal_to_sys_connect_wallet_100",
    "source": "inquiry_modal",
    "target": "sys_connect_wallet",
    "type": "SYSTEM",
    "label": "Inquiry & Direct Lead Modal (1 Connect) → System: Connects Wallet & Deduct RPC",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Inquiry & Direct Lead Modal (1 Connect) → System: Connects Wallet & Deduct RPC",
      "connects.balance >= 1"
    ],
    "roles": [
      "seeker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.inquiry.modal to connects.wallet"
    ],
    "apiRefs": [
      "src/app/api/deals/spend-connect/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Inquiry & Direct Lead Modal (1 Connect) to System: Connects Wallet & Deduct RPC",
    "guideTarget": "sys_connect_wallet",
    "telemetryEvent": "flow_transition_inquiry_modal_sys_connect_wallet",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InquiryModal.js",
        "symbol": "InquiryModal",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/initiate/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "VERIFY_WALLET_BALANCE",
    "predicate": {
      "field": "connects.balance",
      "operator": ">=",
      "value": 1,
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "connects.balance >= 1",
      "auth.session.active == true"
    ],
    "postconditions": [
      "connects.balance -= 1",
      "deal.status = \"OPEN\""
    ],
    "stateTransition": {
      "fromState": "DRAFT",
      "toState": "SUBMITTED"
    },
    "temporal": {
      "idempotencyKey": "inq_submit_{userId}_{propertyId}",
      "timeout": "15s"
    },
    "quality": "DOMAIN_DECISION",
    "stateMachineId": "inquiry.lifecycle"
  },
  {
    "id": "e_inquiry_modal_to_exc_insufficient_connects_101",
    "source": "inquiry_modal",
    "target": "exc_insufficient_connects",
    "type": "FAILURE",
    "label": "Inquiry & Direct Lead Modal (1 Connect) → Exception: Zero Connects Balance",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Inquiry & Direct Lead Modal (1 Connect) → Exception: Zero Connects Balance",
      "connects.balance < 1"
    ],
    "roles": [
      "seeker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.inquiry.modal to connects.exc.insufficient"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_topup_connects",
    "guideInstruction": "Navigate from Inquiry & Direct Lead Modal (1 Connect) to Exception: Zero Connects Balance",
    "guideTarget": "exc_insufficient_connects",
    "telemetryEvent": "flow_transition_inquiry_modal_exc_insufficient_connects",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InquiryModal.js",
        "symbol": "InquiryModal",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/initiate/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "INSUFFICIENT_BALANCE",
    "predicate": {
      "field": "connects.balance",
      "operator": "<",
      "value": 1,
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "connects.balance < 1"
    ],
    "postconditions": [
      "workflow.blockedReason = \"INSUFFICIENT_CONNECTS\""
    ],
    "failureReason": "Connects wallet balance is zero or insufficient to initiate transaction inquiry",
    "temporal": {
      "timeout": "15s",
      "retryPolicy": {
        "maxRetries": 1
      }
    },
    "stateTransition": {
      "fromState": "DRAFT",
      "toState": "BLOCKED"
    },
    "quality": "DOMAIN_DECISION",
    "stateMachineId": "inquiry.lifecycle",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_exc_insufficient_connects_to_rec_topup_connects_102",
    "source": "exc_insufficient_connects",
    "target": "rec_topup_connects",
    "type": "RECOVERY",
    "label": "Exception: Zero Connects Balance → Recovery: Top-Up Connects Pack Checkout",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Exception: Zero Connects Balance → Recovery: Top-Up Connects Pack Checkout",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from connects.exc.insufficient to connects.rec.topup"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_topup_connects",
    "guideInstruction": "Navigate from Exception: Zero Connects Balance to Recovery: Top-Up Connects Pack Checkout",
    "guideTarget": "rec_topup_connects",
    "telemetryEvent": "flow_transition_exc_insufficient_connects_rec_topup_connects",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/connectsWallet.js",
        "symbol": "ERROR_INSUFFICIENT_CONNECTS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/connects/ConnectsReceipt.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_REC_TOPUP_CONNECTS",
    "predicate": null,
    "preconditions": [
      "Connects balance === 0"
    ],
    "postconditions": [
      "Transition from connects.exc.insufficient to connects.rec.topup"
    ],
    "quality": null
  },
  {
    "id": "e_rec_topup_connects_to_inquiry_modal_103",
    "source": "rec_topup_connects",
    "target": "inquiry_modal",
    "type": "RETRY",
    "label": "Recovery: Top-Up Connects Pack Checkout → Inquiry & Direct Lead Modal (1 Connect)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Recovery: Top-Up Connects Pack Checkout → Inquiry & Direct Lead Modal (1 Connect)",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from connects.rec.topup to deal.inquiry.modal"
    ],
    "apiRefs": [
      "/api/deals/initiate"
    ],
    "reversible": true,
    "recoveryTarget": "inquiry_modal",
    "guideInstruction": "Navigate from Recovery: Top-Up Connects Pack Checkout to Inquiry & Direct Lead Modal (1 Connect)",
    "guideTarget": "send-inquiry-modal-btn",
    "telemetryEvent": "flow_transition_rec_topup_connects_inquiry_modal",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/pricing/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/06_MONETIZATION/PRICING_MODEL.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_INQUIRY_MODAL",
    "predicate": null,
    "preconditions": [
      "Valid payment source"
    ],
    "postconditions": [
      "Transition from connects.rec.topup to deal.inquiry.modal"
    ],
    "quality": null
  },
  {
    "id": "e_sys_connect_wallet_to_deal_room_104",
    "source": "sys_connect_wallet",
    "target": "deal_room",
    "type": "NAVIGATE",
    "label": "System: Connects Wallet & Deduct RPC → Private Deal Room & Scheduling Cockpit",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Connects Wallet & Deduct RPC → Private Deal Room & Scheduling Cockpit",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from connects.wallet to deal.room.chat"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Connects Wallet & Deduct RPC to Private Deal Room & Scheduling Cockpit",
    "guideTarget": "deal-room-negotiation-panel",
    "telemetryEvent": "flow_transition_sys_connect_wallet_deal_room",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/connectsWallet.js",
        "symbol": "spendConnect",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "DATABASE",
        "path": "supabase/migrations/20260710000000_schema_v2_core.sql",
        "symbol": "connect_balances",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/connectsWallet.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_CONNECT_WALLET_TO_DEAL_ROOM",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Total Connects balance >= cost"
    ],
    "postconditions": [
      "Transition from connects.wallet to deal.room.chat"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_sys_connect_wallet_to_scenario_non_refundable_connect_105",
    "source": "sys_connect_wallet",
    "target": "scenario_non_refundable_connect",
    "type": "TERMINATE",
    "label": "System: Connects Wallet & Deduct RPC → Playbook 3.1 — Non-Refundable Connect Spend & Discretionary Correction",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Connects Wallet & Deduct RPC → Playbook 3.1 — Non-Refundable Connect Spend & Discretionary Correction",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from connects.wallet to connects.policy.non_refundable"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Connects Wallet & Deduct RPC to Playbook 3.1 — Non-Refundable Connect Spend & Discretionary Correction",
    "guideTarget": "scenario_non_refundable_connect",
    "telemetryEvent": "flow_transition_sys_connect_wallet_scenario_non_refundable_connect",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/connectsWallet.js",
        "symbol": "spendConnect",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "DATABASE",
        "path": "supabase/migrations/20260710000000_schema_v2_core.sql",
        "symbol": "connect_balances",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/connectsWallet.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_CONNECT_WALLET_TO_SCENARIO_NON_REFUNDABLE_CONNECT",
    "predicate": null,
    "preconditions": [
      "Total Connects balance >= cost"
    ],
    "postconditions": [
      "Transition from connects.wallet to connects.policy.non_refundable"
    ],
    "quality": null
  },
  {
    "id": "e_sys_connect_wallet_to_sys_connect_hemorrhage_guard_106",
    "source": "sys_connect_wallet",
    "target": "sys_connect_hemorrhage_guard",
    "type": "SYSTEM",
    "label": "System: Connects Wallet & Deduct RPC → System: Connects Hemorrhage Guard (Economy Radar)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Connects Wallet & Deduct RPC → System: Connects Hemorrhage Guard (Economy Radar)",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from connects.wallet to connects.fraud_guard"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Connects Wallet & Deduct RPC to System: Connects Hemorrhage Guard (Economy Radar)",
    "guideTarget": "sys_connect_hemorrhage_guard",
    "telemetryEvent": "flow_transition_sys_connect_wallet_sys_connect_hemorrhage_guard",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/connectsWallet.js",
        "symbol": "spendConnect",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "DATABASE",
        "path": "supabase/migrations/20260710000000_schema_v2_core.sql",
        "symbol": "connect_balances",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/connectsWallet.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_CONNECT_WALLET_TO_SYS_CONNECT_HEMORRHAGE_GUARD",
    "predicate": null,
    "preconditions": [
      "Total Connects balance >= cost"
    ],
    "postconditions": [
      "Transition from connects.wallet to connects.fraud_guard"
    ],
    "quality": null
  },
  {
    "id": "e_sys_connect_hemorrhage_guard_to_mission_control_107",
    "source": "sys_connect_hemorrhage_guard",
    "target": "mission_control",
    "type": "NAVIGATE",
    "label": "System: Connects Hemorrhage Guard (Economy Radar) → Mission Control (Staff Operations Hub)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Connects Hemorrhage Guard (Economy Radar) → Mission Control (Staff Operations Hub)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER",
      "PROVIDER",
      "STAFF"
    ],
    "effects": [
      "Transition from connects.fraud_guard to admin.mission_control"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Connects Hemorrhage Guard (Economy Radar) to Mission Control (Staff Operations Hub)",
    "guideTarget": "mission_control",
    "telemetryEvent": "flow_transition_sys_connect_hemorrhage_guard_mission_control",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/connectsWallet.js",
        "symbol": "refundConnect",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_CONNECT_HEMORRHAGE_GUARD_TO_MISSION_CONTROL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Spend velocity > 20 Connects/minute"
    ],
    "postconditions": [
      "Transition from connects.fraud_guard to admin.mission_control"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_booking_modal_to_exc_slot_conflict_108",
    "source": "booking_modal",
    "target": "exc_slot_conflict",
    "type": "FAILURE",
    "label": "Viewing Booking & Schedule Modal → Exception: Viewing Slot Schedule Conflict",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Viewing Booking & Schedule Modal → Exception: Viewing Slot Schedule Conflict",
      "viewing.slotAvailable == false"
    ],
    "roles": [
      "seeker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.viewing.modal to deal.viewing.exc.slot_conflict"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_propose_alt_slot",
    "guideInstruction": "Navigate from Viewing Booking & Schedule Modal to Exception: Viewing Slot Schedule Conflict",
    "guideTarget": "exc_slot_conflict",
    "telemetryEvent": "flow_transition_booking_modal_exc_slot_conflict",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BookingModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/schedule/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/viewing-appointments/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "SLOT_CONFLICT",
    "predicate": {
      "field": "viewing.slotAvailable",
      "operator": "==",
      "value": false,
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "Authenticated Seeker account; active broker representation"
    ],
    "postconditions": [
      "Transition from deal.viewing.modal to deal.viewing.exc.slot_conflict"
    ],
    "failureReason": "Requested viewing appointment slot is already booked by another seeker",
    "stateTransition": {
      "fromState": "REQUESTED",
      "toState": "RESCHEDULE_PENDING"
    },
    "temporal": {
      "timeout": "30s",
      "conflictPolicy": "FIRST_CLAIM_WINS"
    },
    "quality": "DOMAIN_DECISION",
    "stateMachineId": "viewing.lifecycle",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_exc_slot_conflict_to_rec_propose_alt_slot_109",
    "source": "exc_slot_conflict",
    "target": "rec_propose_alt_slot",
    "type": "RECOVERY",
    "label": "Exception: Viewing Slot Schedule Conflict → Recovery: Select Alternative Open Slot",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Exception: Viewing Slot Schedule Conflict → Recovery: Select Alternative Open Slot",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.viewing.exc.slot_conflict to deal.viewing.rec.propose_alt_slot"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_propose_alt_slot",
    "guideInstruction": "Navigate from Exception: Viewing Slot Schedule Conflict to Recovery: Select Alternative Open Slot",
    "guideTarget": "rec_propose_alt_slot",
    "telemetryEvent": "flow_transition_exc_slot_conflict_rec_propose_alt_slot",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/schedule/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_REC_PROPOSE_ALT_SLOT",
    "predicate": null,
    "preconditions": [
      "Slot overlapping existing confirmed booking"
    ],
    "postconditions": [
      "Transition from deal.viewing.exc.slot_conflict to deal.viewing.rec.propose_alt_slot"
    ],
    "quality": null
  },
  {
    "id": "e_rec_propose_alt_slot_to_booking_modal_110",
    "source": "rec_propose_alt_slot",
    "target": "booking_modal",
    "type": "RETRY",
    "label": "Recovery: Select Alternative Open Slot → Viewing Booking & Schedule Modal",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Recovery: Select Alternative Open Slot → Viewing Booking & Schedule Modal",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.viewing.rec.propose_alt_slot to deal.viewing.modal"
    ],
    "apiRefs": [
      "/api/deals/schedule-viewing"
    ],
    "reversible": true,
    "recoveryTarget": "booking_modal",
    "guideInstruction": "Navigate from Recovery: Select Alternative Open Slot to Viewing Booking & Schedule Modal",
    "guideTarget": "schedule-viewing-time-slots",
    "telemetryEvent": "flow_transition_rec_propose_alt_slot_booking_modal",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BookingModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_BOOKING_MODAL",
    "predicate": null,
    "preconditions": [
      "Open slot selected"
    ],
    "postconditions": [
      "Transition from deal.viewing.rec.propose_alt_slot to deal.viewing.modal"
    ],
    "quality": null
  },
  {
    "id": "e_booking_modal_to_deal_room_111",
    "source": "booking_modal",
    "target": "deal_room",
    "type": "SUCCESS",
    "label": "Viewing Booking & Schedule Modal → Private Deal Room & Scheduling Cockpit",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Viewing Booking & Schedule Modal → Private Deal Room & Scheduling Cockpit",
      "viewing.slotAvailable == true"
    ],
    "roles": [
      "seeker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.viewing.modal to deal.room.chat"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Viewing Booking & Schedule Modal to Private Deal Room & Scheduling Cockpit",
    "guideTarget": "deal-room-negotiation-panel",
    "telemetryEvent": "flow_transition_booking_modal_deal_room",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BookingModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/schedule/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/viewing-appointments/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "VIEWING_CONFIRMED",
    "predicate": {
      "field": "viewing.slotAvailable",
      "operator": "==",
      "value": true,
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Seeker account; active broker representation"
    ],
    "postconditions": [
      "Transition from deal.viewing.modal to deal.room.chat"
    ],
    "stateTransition": {
      "fromState": "REQUESTED",
      "toState": "CONFIRMED"
    },
    "temporal": {
      "timeout": "30s",
      "conflictPolicy": "FIRST_CLAIM_WINS"
    },
    "quality": "GENERIC_NAVIGATION",
    "stateMachineId": "viewing.lifecycle"
  },
  {
    "id": "e_offer_modal_to_gate_offer_112",
    "source": "offer_modal",
    "target": "gate_offer",
    "type": "AUTH_GATE",
    "label": "Make Offer & Intent Submission Modal → Decision Gate: Offer Evaluation & Terms Counter",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Make Offer & Intent Submission Modal → Decision Gate: Offer Evaluation & Terms Counter",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "enterprise"
    ],
    "visibility": [
      "SEEKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from deal.offer.modal to deal.gate.offer"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Make Offer & Intent Submission Modal to Decision Gate: Offer Evaluation & Terms Counter",
    "guideTarget": "gate_offer",
    "telemetryEvent": "flow_transition_offer_modal_gate_offer",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/crm/NewDealModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "PERMISSION_VERIFICATION",
    "predicate": null,
    "preconditions": [
      "Authenticated verified Seeker account"
    ],
    "postconditions": [
      "Transition from deal.offer.modal to deal.gate.offer"
    ],
    "quality": null,
    "resumeIntent": "RESUME_AFTER_AUTH",
    "returnTarget": "inquiry_modal"
  },
  {
    "id": "e_gate_offer_to_deal_room_113",
    "source": "gate_offer",
    "target": "deal_room",
    "type": "CONDITION_TRUE",
    "label": "Decision Gate: Offer Evaluation & Terms Counter → Private Deal Room & Scheduling Cockpit",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Decision Gate: Offer Evaluation & Terms Counter → Private Deal Room & Scheduling Cockpit",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from deal.gate.offer to deal.room.chat"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Decision Gate: Offer Evaluation & Terms Counter to Private Deal Room & Scheduling Cockpit",
    "guideTarget": "deal-room-negotiation-panel",
    "telemetryEvent": "flow_transition_gate_offer_deal_room",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_GATE_OFFER_TO_DEAL_ROOM",
    "predicate": null,
    "preconditions": [
      "Valid offer submitted in deal room"
    ],
    "postconditions": [
      "Transition from deal.gate.offer to deal.room.chat"
    ],
    "quality": null
  },
  {
    "id": "e_claim_listing_modal_to_mission_control_114",
    "source": "claim_listing_modal",
    "target": "mission_control",
    "type": "NAVIGATE",
    "label": "Claim Listing Due Diligence Modal → Mission Control (Staff Operations Hub)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Claim Listing Due Diligence Modal → Mission Control (Staff Operations Hub)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from owner.claim_listing.modal to admin.mission_control"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Claim Listing Due Diligence Modal to Mission Control (Staff Operations Hub)",
    "guideTarget": "mission_control",
    "telemetryEvent": "flow_transition_claim_listing_modal_mission_control",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ClaimPropertyPanel.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/property/claim/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/propertyClaimApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_CLAIM_LISTING_MODAL_TO_MISSION_CONTROL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Owner or Broker account"
    ],
    "postconditions": [
      "Transition from owner.claim_listing.modal to admin.mission_control"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_owner_to_owner_creation_pipeline_115",
    "source": "dashboard_owner",
    "target": "owner_creation_pipeline",
    "type": "ACTION",
    "label": "Owner Workspace & Property Management → Owner Listing Creation Hub",
    "trigger": "User Click / Action",
    "conditions": [
      "Owner Workspace & Property Management → Owner Listing Creation Hub",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner"
    ],
    "visibility": [
      "OWNER"
    ],
    "effects": [
      "Transition from owner.dashboard to owner.creation_pipeline"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Owner Workspace & Property Management to Owner Listing Creation Hub",
    "guideTarget": "owner_creation_pipeline",
    "telemetryEvent": "flow_transition_dashboard_owner_owner_creation_pipeline",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_OWNER_TO_OWNER_CREATION_PIPELINE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Owner"
    ],
    "postconditions": [
      "Transition from owner.dashboard to owner.creation_pipeline"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_owner_creation_pipeline_to_method_scratch_116",
    "source": "owner_creation_pipeline",
    "target": "method_scratch",
    "type": "ACTION",
    "label": "Owner Listing Creation Hub → Method 1 — Build from Scratch (Streamlined)",
    "trigger": "User Click / Action",
    "conditions": [
      "Owner Listing Creation Hub → Method 1 — Build from Scratch (Streamlined)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from owner.creation_pipeline to owner.create.scratch"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Owner Listing Creation Hub to Method 1 — Build from Scratch (Streamlined)",
    "guideTarget": "method_scratch",
    "telemetryEvent": "flow_transition_owner_creation_pipeline_method_scratch",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_OWNER_CREATION_PIPELINE_TO_METHOD_SCRATCH",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Owner or Broker account within listing tier limit"
    ],
    "postconditions": [
      "Transition from owner.creation_pipeline to owner.create.scratch"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_owner_creation_pipeline_to_method_advanced_117",
    "source": "owner_creation_pipeline",
    "target": "method_advanced",
    "type": "ACTION",
    "label": "Owner Listing Creation Hub → Method 2 — Advanced 10-Chapter Editor",
    "trigger": "User Click / Action",
    "conditions": [
      "Owner Listing Creation Hub → Method 2 — Advanced 10-Chapter Editor",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from owner.creation_pipeline to owner.create.advanced"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Owner Listing Creation Hub to Method 2 — Advanced 10-Chapter Editor",
    "guideTarget": "method_advanced",
    "telemetryEvent": "flow_transition_owner_creation_pipeline_method_advanced",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_OWNER_CREATION_PIPELINE_TO_METHOD_ADVANCED",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Owner or Broker account within listing tier limit"
    ],
    "postconditions": [
      "Transition from owner.creation_pipeline to owner.create.advanced"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_owner_creation_pipeline_to_method_csv_118",
    "source": "owner_creation_pipeline",
    "target": "method_csv",
    "type": "ACTION",
    "label": "Owner Listing Creation Hub → Method 3 — CSV Portfolio Bulk Import",
    "trigger": "User Click / Action",
    "conditions": [
      "Owner Listing Creation Hub → Method 3 — CSV Portfolio Bulk Import",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from owner.creation_pipeline to owner.create.csv"
    ],
    "apiRefs": [
      "/api/dashboard/bulk-insert"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Owner Listing Creation Hub to Method 3 — CSV Portfolio Bulk Import",
    "guideTarget": "method_csv",
    "telemetryEvent": "flow_transition_owner_creation_pipeline_method_csv",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_OWNER_CREATION_PIPELINE_TO_METHOD_CSV",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Owner or Broker account within listing tier limit"
    ],
    "postconditions": [
      "Transition from owner.creation_pipeline to owner.create.csv"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_owner_creation_pipeline_to_method_pdf_119",
    "source": "owner_creation_pipeline",
    "target": "method_pdf",
    "type": "ACTION",
    "label": "Owner Listing Creation Hub → Method 4 — PDF Pitch Deck Intake",
    "trigger": "User Click / Action",
    "conditions": [
      "Owner Listing Creation Hub → Method 4 — PDF Pitch Deck Intake",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from owner.creation_pipeline to owner.create.pdf"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Owner Listing Creation Hub to Method 4 — PDF Pitch Deck Intake",
    "guideTarget": "method_pdf",
    "telemetryEvent": "flow_transition_owner_creation_pipeline_method_pdf",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_OWNER_CREATION_PIPELINE_TO_METHOD_PDF",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Owner or Broker account within listing tier limit"
    ],
    "postconditions": [
      "Transition from owner.creation_pipeline to owner.create.pdf"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_method_scratch_to_api_publish_listing_120",
    "source": "method_scratch",
    "target": "api_publish_listing",
    "type": "SYSTEM",
    "label": "Method 1 — Build from Scratch (Streamlined) → System: Dual-CMS Publishing Bridge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Method 1 — Build from Scratch (Streamlined) → System: Dual-CMS Publishing Bridge",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from owner.create.scratch to owner.listing.publish"
    ],
    "apiRefs": [
      "src/app/api/dashboard/publish/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Method 1 — Build from Scratch (Streamlined) to System: Dual-CMS Publishing Bridge",
    "guideTarget": "api_publish_listing",
    "telemetryEvent": "flow_transition_method_scratch_api_publish_listing",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/LiveEditorWorkspace.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_METHOD_SCRATCH_TO_API_PUBLISH_LISTING",
    "predicate": null,
    "preconditions": [
      "Max 7 photos on Free tier"
    ],
    "postconditions": [
      "Transition from owner.create.scratch to owner.listing.publish"
    ],
    "quality": null
  },
  {
    "id": "e_method_advanced_to_api_publish_listing_121",
    "source": "method_advanced",
    "target": "api_publish_listing",
    "type": "SYSTEM",
    "label": "Method 2 — Advanced 10-Chapter Editor → System: Dual-CMS Publishing Bridge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Method 2 — Advanced 10-Chapter Editor → System: Dual-CMS Publishing Bridge",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from owner.create.advanced to owner.listing.publish"
    ],
    "apiRefs": [
      "src/app/api/dashboard/publish/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Method 2 — Advanced 10-Chapter Editor to System: Dual-CMS Publishing Bridge",
    "guideTarget": "api_publish_listing",
    "telemetryEvent": "flow_transition_method_advanced_api_publish_listing",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/PropertySectionEditor.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_METHOD_ADVANCED_TO_API_PUBLISH_LISTING",
    "predicate": null,
    "preconditions": [
      "Requires Solar+ for deep intel fields"
    ],
    "postconditions": [
      "Transition from owner.create.advanced to owner.listing.publish"
    ],
    "quality": null
  },
  {
    "id": "e_method_csv_to_api_publish_listing_122",
    "source": "method_csv",
    "target": "api_publish_listing",
    "type": "SYSTEM",
    "label": "Method 3 — CSV Portfolio Bulk Import → System: Dual-CMS Publishing Bridge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Method 3 — CSV Portfolio Bulk Import → System: Dual-CMS Publishing Bridge",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from owner.create.csv to owner.listing.publish"
    ],
    "apiRefs": [
      "src/app/api/dashboard/publish/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Method 3 — CSV Portfolio Bulk Import to System: Dual-CMS Publishing Bridge",
    "guideTarget": "api_publish_listing",
    "telemetryEvent": "flow_transition_method_csv_api_publish_listing",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BulkImporterMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_METHOD_CSV_TO_API_PUBLISH_LISTING",
    "predicate": null,
    "preconditions": [
      "Valid CSV structure matching field registry aliases"
    ],
    "postconditions": [
      "Transition from owner.create.csv to owner.listing.publish"
    ],
    "quality": null
  },
  {
    "id": "e_method_pdf_to_ai_listing_engine_123",
    "source": "method_pdf",
    "target": "ai_listing_engine",
    "type": "NAVIGATE",
    "label": "Method 4 — PDF Pitch Deck Intake → System: AI Listing Engine Coordinator",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Method 4 — PDF Pitch Deck Intake → System: AI Listing Engine Coordinator",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from owner.create.pdf to owner.ai.listing_engine"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Method 4 — PDF Pitch Deck Intake to System: AI Listing Engine Coordinator",
    "guideTarget": "ai_listing_engine",
    "telemetryEvent": "flow_transition_method_pdf_ai_listing_engine",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_METHOD_PDF_TO_AI_LISTING_ENGINE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "PDF file size <= 35MB"
    ],
    "postconditions": [
      "Transition from owner.create.pdf to owner.ai.listing_engine"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_ai_listing_engine_to_sys_gemini_ocr_extractor_124",
    "source": "ai_listing_engine",
    "target": "sys_gemini_ocr_extractor",
    "type": "SYSTEM",
    "label": "System: AI Listing Engine Coordinator → System: Gemini OCR & Fact Extractor (Phase-1 Ingest)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: AI Listing Engine Coordinator → System: Gemini OCR & Fact Extractor (Phase-1 Ingest)",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from owner.ai.listing_engine to owner.pdf.gemini_ocr"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: AI Listing Engine Coordinator to System: Gemini OCR & Fact Extractor (Phase-1 Ingest)",
    "guideTarget": "sys_gemini_ocr_extractor",
    "telemetryEvent": "flow_transition_ai_listing_engine_sys_gemini_ocr_extractor",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_AI_LISTING_ENGINE_TO_SYS_GEMINI_OCR_EXTRACTOR",
    "predicate": null,
    "preconditions": [
      "PDF upload or listing ingestion request"
    ],
    "postconditions": [
      "Transition from owner.ai.listing_engine to owner.pdf.gemini_ocr"
    ],
    "quality": null
  },
  {
    "id": "e_sys_gemini_ocr_extractor_to_sys_web_researcher_125",
    "source": "sys_gemini_ocr_extractor",
    "target": "sys_web_researcher",
    "type": "SYSTEM",
    "label": "System: Gemini OCR & Fact Extractor (Phase-1 Ingest) → System: Web Researcher Agent & Citation Verifier",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Gemini OCR & Fact Extractor (Phase-1 Ingest) → System: Web Researcher Agent & Citation Verifier",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from owner.pdf.gemini_ocr to owner.pdf.web_researcher"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Gemini OCR & Fact Extractor (Phase-1 Ingest) to System: Web Researcher Agent & Citation Verifier",
    "guideTarget": "sys_web_researcher",
    "telemetryEvent": "flow_transition_sys_gemini_ocr_extractor_sys_web_researcher",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_GEMINI_OCR_EXTRACTOR_TO_SYS_WEB_RESEARCHER",
    "predicate": null,
    "preconditions": [
      "PDF upload completed"
    ],
    "postconditions": [
      "Transition from owner.pdf.gemini_ocr to owner.pdf.web_researcher"
    ],
    "quality": null
  },
  {
    "id": "e_sys_web_researcher_to_sys_ai_council_126",
    "source": "sys_web_researcher",
    "target": "sys_ai_council",
    "type": "SYSTEM",
    "label": "System: Web Researcher Agent & Citation Verifier → System: The AI Council (4-Voice Expert Panel)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Web Researcher Agent & Citation Verifier → System: The AI Council (4-Voice Expert Panel)",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from owner.pdf.web_researcher to owner.ai.council"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Web Researcher Agent & Citation Verifier to System: The AI Council (4-Voice Expert Panel)",
    "guideTarget": "sys_ai_council",
    "telemetryEvent": "flow_transition_sys_web_researcher_sys_ai_council",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_WEB_RESEARCHER_TO_SYS_AI_COUNCIL",
    "predicate": null,
    "preconditions": [
      "Phase-1 extraction complete"
    ],
    "postconditions": [
      "Transition from owner.pdf.web_researcher to owner.ai.council"
    ],
    "quality": null
  },
  {
    "id": "e_sys_ai_council_to_sys_ai_arbiter_127",
    "source": "sys_ai_council",
    "target": "sys_ai_arbiter",
    "type": "SYSTEM",
    "label": "System: The AI Council (4-Voice Expert Panel) → System: The AI Arbiter & Loop Cap Judge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: The AI Council (4-Voice Expert Panel) → System: The AI Arbiter & Loop Cap Judge",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from owner.ai.council to owner.ai.arbiter"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: The AI Council (4-Voice Expert Panel) to System: The AI Arbiter & Loop Cap Judge",
    "guideTarget": "sys_ai_arbiter",
    "telemetryEvent": "flow_transition_sys_ai_council_sys_ai_arbiter",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_AI_COUNCIL_TO_SYS_AI_ARBITER",
    "predicate": null,
    "preconditions": [
      "PDF fact extraction and citations compiled"
    ],
    "postconditions": [
      "Transition from owner.ai.council to owner.ai.arbiter"
    ],
    "quality": null
  },
  {
    "id": "e_sys_ai_arbiter_to_exc_missing_pdf_metric_128",
    "source": "sys_ai_arbiter",
    "target": "exc_missing_pdf_metric",
    "type": "FAILURE",
    "label": "System: The AI Arbiter & Loop Cap Judge → Playbook 2.1 — Honest Blank Rule Exception",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: The AI Arbiter & Loop Cap Judge → Playbook 2.1 — Honest Blank Rule Exception",
      "status == \"ERROR\""
    ],
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from owner.ai.arbiter to owner.pdf.exc.missing_metric"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_owner_manual_override",
    "guideInstruction": "Navigate from System: The AI Arbiter & Loop Cap Judge to Playbook 2.1 — Honest Blank Rule Exception",
    "guideTarget": "exc_missing_pdf_metric",
    "telemetryEvent": "flow_transition_sys_ai_arbiter_exc_missing_pdf_metric",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "FAILURE_EXC_MISSING_PDF_METRIC",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "ERROR",
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "AI Council deliberation completed"
    ],
    "postconditions": [
      "Transition from owner.ai.arbiter to owner.pdf.exc.missing_metric"
    ],
    "failureReason": "System: The AI Arbiter & Loop Cap Judge → Playbook 2.1 — Honest Blank Rule Exception",
    "quality": "DOMAIN_DECISION",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_sys_ai_arbiter_to_exc_ai_deadlock_129",
    "source": "sys_ai_arbiter",
    "target": "exc_ai_deadlock",
    "type": "FAILURE",
    "label": "System: The AI Arbiter & Loop Cap Judge → Playbook 2.3 — AI Council Deadlock Exception",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: The AI Arbiter & Loop Cap Judge → Playbook 2.3 — AI Council Deadlock Exception",
      "status == \"ERROR\""
    ],
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from owner.ai.arbiter to owner.ai.exc.deadlock"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_manual_approval_queue",
    "guideInstruction": "Navigate from System: The AI Arbiter & Loop Cap Judge to Playbook 2.3 — AI Council Deadlock Exception",
    "guideTarget": "exc_ai_deadlock",
    "telemetryEvent": "flow_transition_sys_ai_arbiter_exc_ai_deadlock",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "FAILURE_EXC_AI_DEADLOCK",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "ERROR",
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "AI Council deliberation completed"
    ],
    "postconditions": [
      "Transition from owner.ai.arbiter to owner.ai.exc.deadlock"
    ],
    "failureReason": "System: The AI Arbiter & Loop Cap Judge → Playbook 2.3 — AI Council Deadlock Exception",
    "quality": "DOMAIN_DECISION",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_sys_ai_arbiter_to_api_publish_listing_130",
    "source": "sys_ai_arbiter",
    "target": "api_publish_listing",
    "type": "SYSTEM",
    "label": "System: The AI Arbiter & Loop Cap Judge → System: Dual-CMS Publishing Bridge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: The AI Arbiter & Loop Cap Judge → System: Dual-CMS Publishing Bridge",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from owner.ai.arbiter to owner.listing.publish"
    ],
    "apiRefs": [
      "src/app/api/dashboard/publish/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: The AI Arbiter & Loop Cap Judge to System: Dual-CMS Publishing Bridge",
    "guideTarget": "api_publish_listing",
    "telemetryEvent": "flow_transition_sys_ai_arbiter_api_publish_listing",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_AI_ARBITER_TO_API_PUBLISH_LISTING",
    "predicate": null,
    "preconditions": [
      "AI Council deliberation completed"
    ],
    "postconditions": [
      "Transition from owner.ai.arbiter to owner.listing.publish"
    ],
    "quality": null
  },
  {
    "id": "e_ai_listing_engine_to_exc_missing_pdf_metric_131",
    "source": "ai_listing_engine",
    "target": "exc_missing_pdf_metric",
    "type": "FAILURE",
    "label": "System: AI Listing Engine Coordinator → Playbook 2.1 — Honest Blank Rule Exception",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: AI Listing Engine Coordinator → Playbook 2.1 — Honest Blank Rule Exception",
      "status == \"ERROR\""
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from owner.ai.listing_engine to owner.pdf.exc.missing_metric"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_owner_manual_override",
    "guideInstruction": "Navigate from System: AI Listing Engine Coordinator to Playbook 2.1 — Honest Blank Rule Exception",
    "guideTarget": "exc_missing_pdf_metric",
    "telemetryEvent": "flow_transition_ai_listing_engine_exc_missing_pdf_metric",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "FAILURE_EXC_MISSING_PDF_METRIC",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "ERROR",
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "PDF upload or listing ingestion request"
    ],
    "postconditions": [
      "Transition from owner.ai.listing_engine to owner.pdf.exc.missing_metric"
    ],
    "failureReason": "System: AI Listing Engine Coordinator → Playbook 2.1 — Honest Blank Rule Exception",
    "quality": "DOMAIN_DECISION",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_ai_listing_engine_to_exc_ai_deadlock_132",
    "source": "ai_listing_engine",
    "target": "exc_ai_deadlock",
    "type": "FAILURE",
    "label": "System: AI Listing Engine Coordinator → Playbook 2.3 — AI Council Deadlock Exception",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: AI Listing Engine Coordinator → Playbook 2.3 — AI Council Deadlock Exception",
      "status == \"ERROR\""
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from owner.ai.listing_engine to owner.ai.exc.deadlock"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_manual_approval_queue",
    "guideInstruction": "Navigate from System: AI Listing Engine Coordinator to Playbook 2.3 — AI Council Deadlock Exception",
    "guideTarget": "exc_ai_deadlock",
    "telemetryEvent": "flow_transition_ai_listing_engine_exc_ai_deadlock",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "FAILURE_EXC_AI_DEADLOCK",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "ERROR",
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "PDF upload or listing ingestion request"
    ],
    "postconditions": [
      "Transition from owner.ai.listing_engine to owner.ai.exc.deadlock"
    ],
    "failureReason": "System: AI Listing Engine Coordinator → Playbook 2.3 — AI Council Deadlock Exception",
    "quality": "DOMAIN_DECISION",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_ai_listing_engine_to_api_publish_listing_133",
    "source": "ai_listing_engine",
    "target": "api_publish_listing",
    "type": "SYSTEM",
    "label": "System: AI Listing Engine Coordinator → System: Dual-CMS Publishing Bridge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: AI Listing Engine Coordinator → System: Dual-CMS Publishing Bridge",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from owner.ai.listing_engine to owner.listing.publish"
    ],
    "apiRefs": [
      "src/app/api/dashboard/publish/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: AI Listing Engine Coordinator to System: Dual-CMS Publishing Bridge",
    "guideTarget": "api_publish_listing",
    "telemetryEvent": "flow_transition_ai_listing_engine_api_publish_listing",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_AI_LISTING_ENGINE_TO_API_PUBLISH_LISTING",
    "predicate": null,
    "preconditions": [
      "PDF upload or listing ingestion request"
    ],
    "postconditions": [
      "Transition from owner.ai.listing_engine to owner.listing.publish"
    ],
    "quality": null
  },
  {
    "id": "e_exc_missing_pdf_metric_to_rec_owner_manual_override_134",
    "source": "exc_missing_pdf_metric",
    "target": "rec_owner_manual_override",
    "type": "RECOVERY",
    "label": "Playbook 2.1 — Honest Blank Rule Exception → Playbook 2.2 — Holder of Truth (Owner Override)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Playbook 2.1 — Honest Blank Rule Exception → Playbook 2.2 — Holder of Truth (Owner Override)",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from owner.pdf.exc.missing_metric to owner.pdf.rec.manual_override"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_owner_manual_override",
    "guideInstruction": "Navigate from Playbook 2.1 — Honest Blank Rule Exception to Playbook 2.2 — Holder of Truth (Owner Override)",
    "guideTarget": "rec_owner_manual_override",
    "telemetryEvent": "flow_transition_exc_missing_pdf_metric_rec_owner_manual_override",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_REC_OWNER_MANUAL_OVERRIDE",
    "predicate": null,
    "preconditions": [
      "Metric unverified in PDF source"
    ],
    "postconditions": [
      "Transition from owner.pdf.exc.missing_metric to owner.pdf.rec.manual_override"
    ],
    "quality": null
  },
  {
    "id": "e_rec_owner_manual_override_to_api_publish_listing_135",
    "source": "rec_owner_manual_override",
    "target": "api_publish_listing",
    "type": "RETRY",
    "label": "Playbook 2.2 — Holder of Truth (Owner Override) → System: Dual-CMS Publishing Bridge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Playbook 2.2 — Holder of Truth (Owner Override) → System: Dual-CMS Publishing Bridge",
      "action.completed == true"
    ],
    "roles": [
      "owner"
    ],
    "visibility": [
      "OWNER"
    ],
    "effects": [
      "Transition from owner.pdf.rec.manual_override to owner.listing.publish"
    ],
    "apiRefs": [
      "src/app/api/dashboard/publish/route.js"
    ],
    "reversible": true,
    "recoveryTarget": "api_publish_listing",
    "guideInstruction": "Navigate from Playbook 2.2 — Holder of Truth (Owner Override) to System: Dual-CMS Publishing Bridge",
    "guideTarget": "api_publish_listing",
    "telemetryEvent": "flow_transition_rec_owner_manual_override_api_publish_listing",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_API_PUBLISH_LISTING",
    "predicate": null,
    "preconditions": [
      "Authenticated property owner"
    ],
    "postconditions": [
      "Transition from owner.pdf.rec.manual_override to owner.listing.publish"
    ],
    "quality": null
  },
  {
    "id": "e_exc_ai_deadlock_to_rec_manual_approval_queue_136",
    "source": "exc_ai_deadlock",
    "target": "rec_manual_approval_queue",
    "type": "RECOVERY",
    "label": "Playbook 2.3 — AI Council Deadlock Exception → Playbook 2.3 — Mission Control Approval Queue",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Playbook 2.3 — AI Council Deadlock Exception → Playbook 2.3 — Mission Control Approval Queue",
      "action.completed == true"
    ],
    "roles": [
      "staff"
    ],
    "visibility": [
      "STAFF"
    ],
    "effects": [
      "Transition from owner.ai.exc.deadlock to owner.ai.rec.manual_queue"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_manual_approval_queue",
    "guideInstruction": "Navigate from Playbook 2.3 — AI Council Deadlock Exception to Playbook 2.3 — Mission Control Approval Queue",
    "guideTarget": "rec_manual_approval_queue",
    "telemetryEvent": "flow_transition_exc_ai_deadlock_rec_manual_approval_queue",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_REC_MANUAL_APPROVAL_QUEUE",
    "predicate": null,
    "preconditions": [
      "Contradictory data sources detected"
    ],
    "postconditions": [
      "Transition from owner.ai.exc.deadlock to owner.ai.rec.manual_queue"
    ],
    "quality": null
  },
  {
    "id": "e_rec_manual_approval_queue_to_api_publish_listing_137",
    "source": "rec_manual_approval_queue",
    "target": "api_publish_listing",
    "type": "RETRY",
    "label": "Playbook 2.3 — Mission Control Approval Queue → System: Dual-CMS Publishing Bridge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Playbook 2.3 — Mission Control Approval Queue → System: Dual-CMS Publishing Bridge",
      "action.completed == true"
    ],
    "roles": [
      "staff"
    ],
    "visibility": [
      "STAFF"
    ],
    "effects": [
      "Transition from owner.ai.rec.manual_queue to owner.listing.publish"
    ],
    "apiRefs": [
      "src/app/api/dashboard/publish/route.js"
    ],
    "reversible": true,
    "recoveryTarget": "api_publish_listing",
    "guideInstruction": "Navigate from Playbook 2.3 — Mission Control Approval Queue to System: Dual-CMS Publishing Bridge",
    "guideTarget": "api_publish_listing",
    "telemetryEvent": "flow_transition_rec_manual_approval_queue_api_publish_listing",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_API_PUBLISH_LISTING",
    "predicate": null,
    "preconditions": [
      "Authenticated staff credentials"
    ],
    "postconditions": [
      "Transition from owner.ai.rec.manual_queue to owner.listing.publish"
    ],
    "quality": null
  },
  {
    "id": "e_api_publish_listing_to_pep_138",
    "source": "api_publish_listing",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "System: Dual-CMS Publishing Bridge → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Dual-CMS Publishing Bridge → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from owner.listing.publish to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Dual-CMS Publishing Bridge to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_api_publish_listing_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/property/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_API_PUBLISH_LISTING_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Owner attestation or staff approval check passed"
    ],
    "postconditions": [
      "Transition from owner.listing.publish to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_broker_to_sys_double_optin_handshake_139",
    "source": "dashboard_broker",
    "target": "sys_double_optin_handshake",
    "type": "SYSTEM",
    "label": "Broker Workspace & Deal Pipeline → System: Two-Sided Representation Handshake",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Broker Workspace & Deal Pipeline → System: Two-Sided Representation Handshake",
      "action.completed == true"
    ],
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "effects": [
      "Transition from broker.dashboard to broker.representation.handshake"
    ],
    "apiRefs": [
      "/api/dashboard/invite",
      "/api/deals/pitch"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Broker Workspace & Deal Pipeline to System: Two-Sided Representation Handshake",
    "guideTarget": "sys_double_optin_handshake",
    "telemetryEvent": "flow_transition_dashboard_broker_sys_double_optin_handshake",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BrokerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_BROKER_TO_SYS_DOUBLE_OPTIN_HANDSHAKE",
    "predicate": null,
    "preconditions": [
      "Authenticated Licensed Broker"
    ],
    "postconditions": [
      "Transition from broker.dashboard to broker.representation.handshake"
    ],
    "quality": null
  },
  {
    "id": "e_dashboard_owner_to_sys_double_optin_handshake_140",
    "source": "dashboard_owner",
    "target": "sys_double_optin_handshake",
    "type": "SYSTEM",
    "label": "Owner Workspace & Property Management → System: Two-Sided Representation Handshake",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Owner Workspace & Property Management → System: Two-Sided Representation Handshake",
      "action.completed == true"
    ],
    "roles": [
      "owner"
    ],
    "visibility": [
      "OWNER"
    ],
    "effects": [
      "Transition from owner.dashboard to broker.representation.handshake"
    ],
    "apiRefs": [
      "/api/dashboard/invite",
      "/api/deals/pitch"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Owner Workspace & Property Management to System: Two-Sided Representation Handshake",
    "guideTarget": "sys_double_optin_handshake",
    "telemetryEvent": "flow_transition_dashboard_owner_sys_double_optin_handshake",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_OWNER_TO_SYS_DOUBLE_OPTIN_HANDSHAKE",
    "predicate": null,
    "preconditions": [
      "Authenticated Owner"
    ],
    "postconditions": [
      "Transition from owner.dashboard to broker.representation.handshake"
    ],
    "quality": null
  },
  {
    "id": "e_sys_double_optin_handshake_to_scenario_listing_cap_limit_141",
    "source": "sys_double_optin_handshake",
    "target": "scenario_listing_cap_limit",
    "type": "TERMINATE",
    "label": "System: Two-Sided Representation Handshake → Playbook 1.2 — Broker Listing Cap Downgrade Soft-Lock",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Two-Sided Representation Handshake → Playbook 1.2 — Broker Listing Cap Downgrade Soft-Lock",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from broker.representation.handshake to broker.cap.limit"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Two-Sided Representation Handshake to Playbook 1.2 — Broker Listing Cap Downgrade Soft-Lock",
    "guideTarget": "scenario_listing_cap_limit",
    "telemetryEvent": "flow_transition_sys_double_optin_handshake_scenario_listing_cap_limit",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/brokerRepresentation.js",
        "symbol": "confirmRepresentation",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/brokerRepresentation.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_DOUBLE_OPTIN_HANDSHAKE_TO_SCENARIO_LISTING_CAP_LIMIT",
    "predicate": null,
    "preconditions": [
      "Initiator pays 1 Connect; broker selected from verified directory"
    ],
    "postconditions": [
      "Transition from broker.representation.handshake to broker.cap.limit"
    ],
    "quality": null
  },
  {
    "id": "e_sys_double_optin_handshake_to_pep_142",
    "source": "sys_double_optin_handshake",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "System: Two-Sided Representation Handshake → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Two-Sided Representation Handshake → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from broker.representation.handshake to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Two-Sided Representation Handshake to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_sys_double_optin_handshake_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/brokerRepresentation.js",
        "symbol": "confirmRepresentation",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/brokerRepresentation.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_DOUBLE_OPTIN_HANDSHAKE_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Initiator pays 1 Connect; broker selected from verified directory"
    ],
    "postconditions": [
      "Transition from broker.representation.handshake to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_buyer_to_comp_return_brief_buyer_143",
    "source": "dashboard_buyer",
    "target": "comp_return_brief_buyer",
    "type": "NAVIGATE",
    "label": "Buyer Workspace (Management & Continuity) → Component: Buyer Return Brief Catchup",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Buyer Workspace (Management & Continuity) → Component: Buyer Return Brief Catchup",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker"
    ],
    "visibility": [
      "SEEKER"
    ],
    "effects": [
      "Transition from seeker.dashboard to seeker.return_brief"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Buyer Workspace (Management & Continuity) to Component: Buyer Return Brief Catchup",
    "guideTarget": "comp_return_brief_buyer",
    "telemetryEvent": "flow_transition_dashboard_buyer_comp_return_brief_buyer",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/dashboard/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BuyerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_BUYER_TO_COMP_RETURN_BRIEF_BUYER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Seeker"
    ],
    "postconditions": [
      "Transition from seeker.dashboard to seeker.return_brief"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_owner_to_comp_return_brief_owner_144",
    "source": "dashboard_owner",
    "target": "comp_return_brief_owner",
    "type": "NAVIGATE",
    "label": "Owner Workspace & Property Management → Component: Owner Leads & Freshness Brief",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Owner Workspace & Property Management → Component: Owner Leads & Freshness Brief",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner"
    ],
    "visibility": [
      "OWNER"
    ],
    "effects": [
      "Transition from owner.dashboard to owner.return_brief"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Owner Workspace & Property Management to Component: Owner Leads & Freshness Brief",
    "guideTarget": "comp_return_brief_owner",
    "telemetryEvent": "flow_transition_dashboard_owner_comp_return_brief_owner",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_OWNER_TO_COMP_RETURN_BRIEF_OWNER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Owner"
    ],
    "postconditions": [
      "Transition from owner.dashboard to owner.return_brief"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_broker_to_comp_return_brief_broker_145",
    "source": "dashboard_broker",
    "target": "comp_return_brief_broker",
    "type": "NAVIGATE",
    "label": "Broker Workspace & Deal Pipeline → Component: Broker Schedule & Pipeline Brief",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Broker Workspace & Deal Pipeline → Component: Broker Schedule & Pipeline Brief",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "effects": [
      "Transition from broker.dashboard to broker.return_brief"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Broker Workspace & Deal Pipeline to Component: Broker Schedule & Pipeline Brief",
    "guideTarget": "comp_return_brief_broker",
    "telemetryEvent": "flow_transition_dashboard_broker_comp_return_brief_broker",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BrokerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_BROKER_TO_COMP_RETURN_BRIEF_BROKER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Licensed Broker"
    ],
    "postconditions": [
      "Transition from broker.dashboard to broker.return_brief"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_provider_to_deal_room_146",
    "source": "dashboard_provider",
    "target": "deal_room",
    "type": "NAVIGATE",
    "label": "Provider Workspace & QuestIT Bounties → Private Deal Room & Scheduling Cockpit",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Provider Workspace & QuestIT Bounties → Private Deal Room & Scheduling Cockpit",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "provider"
    ],
    "visibility": [
      "PROVIDER"
    ],
    "effects": [
      "Transition from provider.dashboard to deal.room.chat"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Provider Workspace & QuestIT Bounties to Private Deal Room & Scheduling Cockpit",
    "guideTarget": "deal-room-negotiation-panel",
    "telemetryEvent": "flow_transition_dashboard_provider_deal_room",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/ProviderMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_PROVIDER_TO_DEAL_ROOM",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Provider profile"
    ],
    "postconditions": [
      "Transition from provider.dashboard to deal.room.chat"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_deal_room_to_gate_viewing_147",
    "source": "deal_room",
    "target": "gate_viewing",
    "type": "AUTH_GATE",
    "label": "Private Deal Room & Scheduling Cockpit → Decision Gate: Viewing Attendance Confirmation",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Private Deal Room & Scheduling Cockpit → Decision Gate: Viewing Attendance Confirmation",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.room.chat to deal.gate.viewing"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Private Deal Room & Scheduling Cockpit to Decision Gate: Viewing Attendance Confirmation",
    "guideTarget": "gate_viewing",
    "telemetryEvent": "flow_transition_deal_room_gate_viewing",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/ChatBox.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/messages/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "PERMISSION_VERIFICATION",
    "predicate": null,
    "preconditions": [
      "Authorized participant on private deal"
    ],
    "postconditions": [
      "Transition from deal.room.chat to deal.gate.viewing"
    ],
    "quality": null,
    "resumeIntent": "RESUME_AFTER_AUTH",
    "returnTarget": "inquiry_modal"
  },
  {
    "id": "e_gate_viewing_to_exc_viewing_noshow_148",
    "source": "gate_viewing",
    "target": "exc_viewing_noshow",
    "type": "FAILURE",
    "label": "Decision Gate: Viewing Attendance Confirmation → Exception: Viewing No-Show / Cancellation",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Decision Gate: Viewing Attendance Confirmation → Exception: Viewing No-Show / Cancellation",
      "status == \"ERROR\""
    ],
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.gate.viewing to deal.viewing.exc.noshow"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "reschedule_modal",
    "guideInstruction": "Navigate from Decision Gate: Viewing Attendance Confirmation to Exception: Viewing No-Show / Cancellation",
    "guideTarget": "exc_viewing_noshow",
    "telemetryEvent": "flow_transition_gate_viewing_exc_viewing_noshow",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "FAILURE_EXC_VIEWING_NOSHOW",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "ERROR",
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "Viewing scheduled time elapsed"
    ],
    "postconditions": [
      "Transition from deal.gate.viewing to deal.viewing.exc.noshow"
    ],
    "failureReason": "Decision Gate: Viewing Attendance Confirmation → Exception: Viewing No-Show / Cancellation",
    "quality": "DOMAIN_DECISION",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_exc_viewing_noshow_to_reschedule_modal_149",
    "source": "exc_viewing_noshow",
    "target": "reschedule_modal",
    "type": "ACTION",
    "label": "Exception: Viewing No-Show / Cancellation → Recovery: Viewing Reschedule Modal",
    "trigger": "User Click / Action",
    "conditions": [
      "Exception: Viewing No-Show / Cancellation → Recovery: Viewing Reschedule Modal",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.viewing.exc.noshow to deal.viewing.reschedule"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Exception: Viewing No-Show / Cancellation to Recovery: Viewing Reschedule Modal",
    "guideTarget": "reschedule_modal",
    "telemetryEvent": "flow_transition_exc_viewing_noshow_reschedule_modal",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_EXC_VIEWING_NOSHOW_TO_RESCHEDULE_MODAL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Appointment missed or canceled before arrival"
    ],
    "postconditions": [
      "Transition from deal.viewing.exc.noshow to deal.viewing.reschedule"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_reschedule_modal_to_deal_room_150",
    "source": "reschedule_modal",
    "target": "deal_room",
    "type": "NAVIGATE",
    "label": "Recovery: Viewing Reschedule Modal → Private Deal Room & Scheduling Cockpit",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Recovery: Viewing Reschedule Modal → Private Deal Room & Scheduling Cockpit",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.viewing.reschedule to deal.room.chat"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Recovery: Viewing Reschedule Modal to Private Deal Room & Scheduling Cockpit",
    "guideTarget": "deal-room-negotiation-panel",
    "telemetryEvent": "flow_transition_reschedule_modal_deal_room",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BookingModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/viewing-appointments/[id]/route.js",
        "symbol": "PATCH",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_RESCHEDULE_MODAL_TO_DEAL_ROOM",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Active deal room session"
    ],
    "postconditions": [
      "Transition from deal.viewing.reschedule to deal.room.chat"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_gate_viewing_to_sys_transaction_handshake_151",
    "source": "gate_viewing",
    "target": "sys_transaction_handshake",
    "type": "CONDITION_TRUE",
    "label": "Decision Gate: Viewing Attendance Confirmation → System: Two-Sided Transaction Handshake",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Decision Gate: Viewing Attendance Confirmation → System: Two-Sided Transaction Handshake",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.gate.viewing to deal.transaction.handshake"
    ],
    "apiRefs": [
      "/api/deals/handshake"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Decision Gate: Viewing Attendance Confirmation to System: Two-Sided Transaction Handshake",
    "guideTarget": "deal-handshake-two-sided-signature",
    "telemetryEvent": "flow_transition_gate_viewing_sys_transaction_handshake",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_GATE_VIEWING_TO_SYS_TRANSACTION_HANDSHAKE",
    "predicate": null,
    "preconditions": [
      "Viewing scheduled time elapsed"
    ],
    "postconditions": [
      "Transition from deal.gate.viewing to deal.transaction.handshake"
    ],
    "quality": null
  },
  {
    "id": "e_deal_room_to_sys_transaction_handshake_152",
    "source": "deal_room",
    "target": "sys_transaction_handshake",
    "type": "SYSTEM",
    "label": "Private Deal Room & Scheduling Cockpit → System: Two-Sided Transaction Handshake",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Private Deal Room & Scheduling Cockpit → System: Two-Sided Transaction Handshake",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.room.chat to deal.transaction.handshake"
    ],
    "apiRefs": [
      "/api/deals/handshake"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Private Deal Room & Scheduling Cockpit to System: Two-Sided Transaction Handshake",
    "guideTarget": "deal-handshake-two-sided-signature",
    "telemetryEvent": "flow_transition_deal_room_sys_transaction_handshake",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/ChatBox.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/messages/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DEAL_ROOM_TO_SYS_TRANSACTION_HANDSHAKE",
    "predicate": null,
    "preconditions": [
      "Authorized participant on private deal"
    ],
    "postconditions": [
      "Transition from deal.room.chat to deal.transaction.handshake"
    ],
    "quality": null
  },
  {
    "id": "e_deal_room_to_terminal_deal_closed_153",
    "source": "deal_room",
    "target": "terminal_deal_closed",
    "type": "TERMINATE",
    "label": "Private Deal Room & Scheduling Cockpit → Outcome: Deal Closed / Archived",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Private Deal Room & Scheduling Cockpit → Outcome: Deal Closed / Archived",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.room.chat to deal.terminal.closed"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Private Deal Room & Scheduling Cockpit to Outcome: Deal Closed / Archived",
    "guideTarget": "terminal_deal_closed",
    "telemetryEvent": "flow_transition_deal_room_terminal_deal_closed",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/ChatBox.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/messages/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DEAL_ROOM_TO_TERMINAL_DEAL_CLOSED",
    "predicate": null,
    "preconditions": [
      "Authorized participant on private deal"
    ],
    "postconditions": [
      "Transition from deal.room.chat to deal.terminal.closed"
    ],
    "quality": null
  },
  {
    "id": "e_sys_transaction_handshake_to_terminal_handshake_success_154",
    "source": "sys_transaction_handshake",
    "target": "terminal_handshake_success",
    "type": "SUCCESS",
    "label": "System: Two-Sided Transaction Handshake → Outcome: Verified Handshake & Rating Increment",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Two-Sided Transaction Handshake → Outcome: Verified Handshake & Rating Increment",
      "deal.handshakeSigned == true"
    ],
    "roles": [
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.transaction.handshake to deal.terminal.handshake_success"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Two-Sided Transaction Handshake to Outcome: Verified Handshake & Rating Increment",
    "guideTarget": "terminal_handshake_success",
    "telemetryEvent": "flow_transition_sys_transaction_handshake_terminal_handshake_success",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/deals/handshake/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/dealHandshakeApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "HANDSHAKE_CO_CONFIRMED",
    "predicate": {
      "field": "deal.handshakeSigned",
      "operator": "==",
      "value": true,
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Completed private viewing record in deal room"
    ],
    "postconditions": [
      "Transition from deal.transaction.handshake to deal.terminal.handshake_success"
    ],
    "stateTransition": {
      "fromState": "HANDSHAKE_PENDING",
      "toState": "CLOSED"
    },
    "temporal": {
      "timeout": "60s",
      "idempotencyKey": "handshake_sign_{dealId}_{partyId}"
    },
    "quality": "GENERIC_NAVIGATION",
    "stateMachineId": "deal.lifecycle"
  },
  {
    "id": "e_terminal_deal_closed_to_scenario_chat_purge_155",
    "source": "terminal_deal_closed",
    "target": "scenario_chat_purge",
    "type": "TERMINATE",
    "label": "Outcome: Deal Closed / Archived → Playbook 8.1 — 7-Day Read-Only Chat Retention & Purge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Outcome: Deal Closed / Archived → Playbook 8.1 — 7-Day Read-Only Chat Retention & Purge",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.terminal.closed to deal.chat.purge"
    ],
    "apiRefs": [
      "/api/cron/purge-messages"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Outcome: Deal Closed / Archived to Playbook 8.1 — 7-Day Read-Only Chat Retention & Purge",
    "guideTarget": "scenario_chat_purge",
    "telemetryEvent": "flow_transition_terminal_deal_closed_scenario_chat_purge",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/close/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_TERMINAL_DEAL_CLOSED_TO_SCENARIO_CHAT_PURGE",
    "predicate": null,
    "preconditions": [
      "Deal concluded"
    ],
    "postconditions": [
      "Transition from deal.terminal.closed to deal.chat.purge"
    ],
    "quality": null
  },
  {
    "id": "e_pep_to_scenario_churned_owner_escrow_156",
    "source": "pep",
    "target": "scenario_churned_owner_escrow",
    "type": "TERMINATE",
    "label": "Property Experience Page (PEP) → Playbook 1.3 / 5.4 — Churned Owner Escrow Trap",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Playbook 1.3 / 5.4 — Churned Owner Escrow Trap",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to owner.escrow.churned"
    ],
    "apiRefs": [
      "/api/deals/escrow-trap"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Playbook 1.3 / 5.4 — Churned Owner Escrow Trap",
    "guideTarget": "scenario_churned_owner_escrow",
    "telemetryEvent": "flow_transition_pep_scenario_churned_owner_escrow",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_SCENARIO_CHURNED_OWNER_ESCROW",
    "predicate": null,
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to owner.escrow.churned"
    ],
    "quality": null
  },
  {
    "id": "e_scenario_churned_owner_escrow_to_sys_connect_wallet_157",
    "source": "scenario_churned_owner_escrow",
    "target": "sys_connect_wallet",
    "type": "SYSTEM",
    "label": "Playbook 1.3 / 5.4 — Churned Owner Escrow Trap → System: Connects Wallet & Deduct RPC",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Playbook 1.3 / 5.4 — Churned Owner Escrow Trap → System: Connects Wallet & Deduct RPC",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner"
    ],
    "visibility": [
      "SEEKER",
      "OWNER"
    ],
    "effects": [
      "Transition from owner.escrow.churned to connects.wallet"
    ],
    "apiRefs": [
      "src/app/api/deals/spend-connect/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Playbook 1.3 / 5.4 — Churned Owner Escrow Trap to System: Connects Wallet & Deduct RPC",
    "guideTarget": "sys_connect_wallet",
    "telemetryEvent": "flow_transition_scenario_churned_owner_escrow_sys_connect_wallet",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SCENARIO_CHURNED_OWNER_ESCROW_TO_SYS_CONNECT_WALLET",
    "predicate": null,
    "preconditions": [
      "Owner subscription canceled; property has 3D Spatial Vault asset"
    ],
    "postconditions": [
      "Transition from owner.escrow.churned to connects.wallet"
    ],
    "quality": null
  },
  {
    "id": "e_mission_control_to_scenario_prc_expired_notice_158",
    "source": "mission_control",
    "target": "scenario_prc_expired_notice",
    "type": "TERMINATE",
    "label": "Mission Control (Staff Operations Hub) → Playbook 5.1 — Expired PRC License 30-Day Notice",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Mission Control (Staff Operations Hub) → Playbook 5.1 — Expired PRC License 30-Day Notice",
      "action.completed == true"
    ],
    "roles": [
      "staff",
      "enterprise"
    ],
    "visibility": [
      "STAFF",
      "ADMIN"
    ],
    "effects": [
      "Transition from admin.mission_control to broker.prc.renewal"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Mission Control (Staff Operations Hub) to Playbook 5.1 — Expired PRC License 30-Day Notice",
    "guideTarget": "scenario_prc_expired_notice",
    "telemetryEvent": "flow_transition_mission_control_scenario_prc_expired_notice",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/MissionControlMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/adminGuard.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_MISSION_CONTROL_TO_SCENARIO_PRC_EXPIRED_NOTICE",
    "predicate": null,
    "preconditions": [
      "Staff role authenticated via Supabase RLS"
    ],
    "postconditions": [
      "Transition from admin.mission_control to broker.prc.renewal"
    ],
    "quality": null
  },
  {
    "id": "e_mission_control_to_scenario_pii_erasure_159",
    "source": "mission_control",
    "target": "scenario_pii_erasure",
    "type": "TERMINATE",
    "label": "Mission Control (Staff Operations Hub) → System: PII-Detachment & Estate Retention (RA 10173)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Mission Control (Staff Operations Hub) → System: PII-Detachment & Estate Retention (RA 10173)",
      "action.completed == true"
    ],
    "roles": [
      "staff",
      "enterprise"
    ],
    "visibility": [
      "STAFF",
      "ADMIN"
    ],
    "effects": [
      "Transition from admin.mission_control to privacy.pii_erasure"
    ],
    "apiRefs": [
      "/api/user/dpo-erasure"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Mission Control (Staff Operations Hub) to System: PII-Detachment & Estate Retention (RA 10173)",
    "guideTarget": "scenario_pii_erasure",
    "telemetryEvent": "flow_transition_mission_control_scenario_pii_erasure",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/MissionControlMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/adminGuard.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_MISSION_CONTROL_TO_SCENARIO_PII_ERASURE",
    "predicate": null,
    "preconditions": [
      "Staff role authenticated via Supabase RLS"
    ],
    "postconditions": [
      "Transition from admin.mission_control to privacy.pii_erasure"
    ],
    "quality": null
  },
  {
    "id": "e_mission_control_to_rec_manual_approval_queue_160",
    "source": "mission_control",
    "target": "rec_manual_approval_queue",
    "type": "NAVIGATE",
    "label": "Mission Control (Staff Operations Hub) → Playbook 2.3 — Mission Control Approval Queue",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Mission Control (Staff Operations Hub) → Playbook 2.3 — Mission Control Approval Queue",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "staff",
      "enterprise"
    ],
    "visibility": [
      "STAFF",
      "ADMIN"
    ],
    "effects": [
      "Transition from admin.mission_control to owner.ai.rec.manual_queue"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Mission Control (Staff Operations Hub) to Playbook 2.3 — Mission Control Approval Queue",
    "guideTarget": "rec_manual_approval_queue",
    "telemetryEvent": "flow_transition_mission_control_rec_manual_approval_queue",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/MissionControlMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/adminGuard.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_MISSION_CONTROL_TO_REC_MANUAL_APPROVAL_QUEUE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Staff role authenticated via Supabase RLS"
    ],
    "postconditions": [
      "Transition from admin.mission_control to owner.ai.rec.manual_queue"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_scenario_broker_lead_collision_to_deal_room_161",
    "source": "scenario_broker_lead_collision",
    "target": "deal_room",
    "type": "NAVIGATE",
    "label": "Playbook 4.3 — Unit Operator vs Building Broker Lead Isolation → Private Deal Room & Scheduling Cockpit",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Playbook 4.3 — Unit Operator vs Building Broker Lead Isolation → Private Deal Room & Scheduling Cockpit",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from broker.leads.collision to deal.room.chat"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Playbook 4.3 — Unit Operator vs Building Broker Lead Isolation to Private Deal Room & Scheduling Cockpit",
    "guideTarget": "deal-room-negotiation-panel",
    "telemetryEvent": "flow_transition_scenario_broker_lead_collision_deal_room",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SCENARIO_BROKER_LEAD_COLLISION_TO_DEAL_ROOM",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Inquiry submitted on represented property with delegated units"
    ],
    "postconditions": [
      "Transition from broker.leads.collision to deal.room.chat"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_owner_to_scenario_offmarket_pitch_162",
    "source": "dashboard_owner",
    "target": "scenario_offmarket_pitch",
    "type": "TERMINATE",
    "label": "Owner Workspace & Property Management → Playbook 5.3 — Off-Market Pitch Toggle ('Quietly open to offers')",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Owner Workspace & Property Management → Playbook 5.3 — Off-Market Pitch Toggle ('Quietly open to offers')",
      "action.completed == true"
    ],
    "roles": [
      "owner"
    ],
    "visibility": [
      "OWNER"
    ],
    "effects": [
      "Transition from owner.dashboard to broker.pitch.offmarket"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Owner Workspace & Property Management to Playbook 5.3 — Off-Market Pitch Toggle ('Quietly open to offers')",
    "guideTarget": "scenario_offmarket_pitch",
    "telemetryEvent": "flow_transition_dashboard_owner_scenario_offmarket_pitch",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_OWNER_TO_SCENARIO_OFFMARKET_PITCH",
    "predicate": null,
    "preconditions": [
      "Authenticated Owner"
    ],
    "postconditions": [
      "Transition from owner.dashboard to broker.pitch.offmarket"
    ],
    "quality": null
  },
  {
    "id": "e_scenario_offmarket_pitch_to_pep_163",
    "source": "scenario_offmarket_pitch",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Playbook 5.3 — Off-Market Pitch Toggle ('Quietly open to offers') → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Playbook 5.3 — Off-Market Pitch Toggle ('Quietly open to offers') → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "seeker"
    ],
    "visibility": [
      "OWNER",
      "SEEKER"
    ],
    "effects": [
      "Transition from broker.pitch.offmarket to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Playbook 5.3 — Off-Market Pitch Toggle ('Quietly open to offers') to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_scenario_offmarket_pitch_pep",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SCENARIO_OFFMARKET_PITCH_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Property marked off-market/withdrawn"
    ],
    "postconditions": [
      "Transition from broker.pitch.offmarket to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dec_tier_gate_to_pep_ch6_fine_print_164",
    "source": "dec_tier_gate",
    "target": "pep_ch6_fine_print",
    "type": "CONDITION_TRUE",
    "label": "Decision Gate: Tier Entitlement Check → Chapter 06 — The Fine Print (Deep & Hidden Intel)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Decision Gate: Tier Entitlement Check → Chapter 06 — The Fine Print (Deep & Hidden Intel)",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from auth.gate.tier to property.pep.ch6_fine_print"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Decision Gate: Tier Entitlement Check to Chapter 06 — The Fine Print (Deep & Hidden Intel)",
    "guideTarget": "pep_ch6_fine_print",
    "telemetryEvent": "flow_transition_dec_tier_gate_pep_ch6_fine_print",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/entitlements.js",
        "symbol": "isFeatureUnlocked",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DEC_TIER_GATE_TO_PEP_CH6_FINE_PRINT",
    "predicate": null,
    "preconditions": [
      "Authenticated user context with subscription_tier"
    ],
    "postconditions": [
      "Transition from auth.gate.tier to property.pep.ch6_fine_print"
    ],
    "quality": null
  },
  {
    "id": "e_dec_tier_gate_to_core_165",
    "source": "dec_tier_gate",
    "target": "core",
    "type": "CONDITION_TRUE",
    "label": "Decision Gate: Tier Entitlement Check → Layer 06 — Core (Private Unit Level)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Decision Gate: Tier Entitlement Check → Layer 06 — Core (Private Unit Level)",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from auth.gate.tier to layer.core"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Decision Gate: Tier Entitlement Check to Layer 06 — Core (Private Unit Level)",
    "guideTarget": "core",
    "telemetryEvent": "flow_transition_dec_tier_gate_core",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/entitlements.js",
        "symbol": "isFeatureUnlocked",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DEC_TIER_GATE_TO_CORE",
    "predicate": null,
    "preconditions": [
      "Authenticated user context with subscription_tier"
    ],
    "postconditions": [
      "Transition from auth.gate.tier to layer.core"
    ],
    "quality": null
  },
  {
    "id": "e_dec_tier_gate_to_sys_connect_wallet_166",
    "source": "dec_tier_gate",
    "target": "sys_connect_wallet",
    "type": "CONDITION_TRUE",
    "label": "Decision Gate: Tier Entitlement Check → System: Connects Wallet & Deduct RPC",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Decision Gate: Tier Entitlement Check → System: Connects Wallet & Deduct RPC",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from auth.gate.tier to connects.wallet"
    ],
    "apiRefs": [
      "src/app/api/deals/spend-connect/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Decision Gate: Tier Entitlement Check to System: Connects Wallet & Deduct RPC",
    "guideTarget": "sys_connect_wallet",
    "telemetryEvent": "flow_transition_dec_tier_gate_sys_connect_wallet",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/entitlements.js",
        "symbol": "isFeatureUnlocked",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DEC_TIER_GATE_TO_SYS_CONNECT_WALLET",
    "predicate": null,
    "preconditions": [
      "Authenticated user context with subscription_tier"
    ],
    "postconditions": [
      "Transition from auth.gate.tier to connects.wallet"
    ],
    "quality": null
  },
  {
    "id": "e_scenario_pii_erasure_to_pep_167",
    "source": "scenario_pii_erasure",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "System: PII-Detachment & Estate Retention (RA 10173) → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: PII-Detachment & Estate Retention (RA 10173) → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "staff",
      "enterprise"
    ],
    "visibility": [
      "STAFF",
      "ENTERPRISE"
    ],
    "effects": [
      "Transition from privacy.pii_erasure to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: PII-Detachment & Estate Retention (RA 10173) to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_scenario_pii_erasure_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/user/delete-account/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/deleteAccountApi.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SCENARIO_PII_ERASURE_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Formal Data Privacy Act RA 10173 request verified by DPO"
    ],
    "postconditions": [
      "Transition from privacy.pii_erasure to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_discover_directory_to_compare_specs_matrix_168",
    "source": "discover_directory",
    "target": "compare_specs_matrix",
    "type": "NAVIGATE",
    "label": "Space Directory & Radius Radar → Side-by-Side Spatial Comparison Matrix",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Space Directory & Radius Radar → Side-by-Side Spatial Comparison Matrix",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from discovery.directory to seeker.compare.matrix"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Space Directory & Radius Radar to Side-by-Side Spatial Comparison Matrix",
    "guideTarget": "compare_specs_matrix",
    "telemetryEvent": "flow_transition_discover_directory_compare_specs_matrix",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/cms/route.js",
        "symbol": "GET",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DISCOVER_DIRECTORY_TO_COMPARE_SPECS_MATRIX",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from discovery.directory to seeker.compare.matrix"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_compare_specs_matrix_169",
    "source": "pep",
    "target": "compare_specs_matrix",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Side-by-Side Spatial Comparison Matrix",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Side-by-Side Spatial Comparison Matrix",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to seeker.compare.matrix"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Side-by-Side Spatial Comparison Matrix",
    "guideTarget": "compare_specs_matrix",
    "telemetryEvent": "flow_transition_pep_compare_specs_matrix",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_COMPARE_SPECS_MATRIX",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to seeker.compare.matrix"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_buyer_to_compare_specs_matrix_170",
    "source": "dashboard_buyer",
    "target": "compare_specs_matrix",
    "type": "NAVIGATE",
    "label": "Buyer Workspace (Management & Continuity) → Side-by-Side Spatial Comparison Matrix",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Buyer Workspace (Management & Continuity) → Side-by-Side Spatial Comparison Matrix",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "seeker"
    ],
    "visibility": [
      "SEEKER"
    ],
    "effects": [
      "Transition from seeker.dashboard to seeker.compare.matrix"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Buyer Workspace (Management & Continuity) to Side-by-Side Spatial Comparison Matrix",
    "guideTarget": "compare_specs_matrix",
    "telemetryEvent": "flow_transition_dashboard_buyer_compare_specs_matrix",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/dashboard/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BuyerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_BUYER_TO_COMPARE_SPECS_MATRIX",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Seeker"
    ],
    "postconditions": [
      "Transition from seeker.dashboard to seeker.compare.matrix"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_compare_specs_matrix_to_pep_171",
    "source": "compare_specs_matrix",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "Side-by-Side Spatial Comparison Matrix → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Side-by-Side Spatial Comparison Matrix → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from seeker.compare.matrix to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Side-by-Side Spatial Comparison Matrix to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_compare_specs_matrix_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ComparisonMatrix.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_COMPARE_SPECS_MATRIX_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "At least 2 properties selected from directory or saved ledger"
    ],
    "postconditions": [
      "Transition from seeker.compare.matrix to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_compare_specs_matrix_to_inquiry_modal_172",
    "source": "compare_specs_matrix",
    "target": "inquiry_modal",
    "type": "ACTION",
    "label": "Side-by-Side Spatial Comparison Matrix → Inquiry & Direct Lead Modal (1 Connect)",
    "trigger": "User Click / Action",
    "conditions": [
      "Side-by-Side Spatial Comparison Matrix → Inquiry & Direct Lead Modal (1 Connect)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from seeker.compare.matrix to deal.inquiry.modal"
    ],
    "apiRefs": [
      "/api/deals/initiate"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Side-by-Side Spatial Comparison Matrix to Inquiry & Direct Lead Modal (1 Connect)",
    "guideTarget": "send-inquiry-modal-btn",
    "telemetryEvent": "flow_transition_compare_specs_matrix_inquiry_modal",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ComparisonMatrix.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_COMPARE_SPECS_MATRIX_TO_INQUIRY_MODAL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "At least 2 properties selected from directory or saved ledger"
    ],
    "postconditions": [
      "Transition from seeker.compare.matrix to deal.inquiry.modal"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_to_broker_field_briefing_173",
    "source": "pep",
    "target": "broker_field_briefing",
    "type": "NAVIGATE",
    "label": "Property Experience Page (PEP) → Broker Tactical Field Briefing & Voice Copilot",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Property Experience Page (PEP) → Broker Tactical Field Briefing & Voice Copilot",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep to broker.field_briefing"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Property Experience Page (PEP) to Broker Tactical Field Briefing & Voice Copilot",
    "guideTarget": "broker_field_briefing",
    "telemetryEvent": "flow_transition_pep_broker_field_briefing",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/[id]/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/ResidentialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/CommercialFlow.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_TO_BROKER_FIELD_BRIEFING",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Publicly accessible; deep intel blurred without Solar+ tier"
    ],
    "postconditions": [
      "Transition from property.pep to broker.field_briefing"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_broker_to_broker_field_briefing_174",
    "source": "dashboard_broker",
    "target": "broker_field_briefing",
    "type": "NAVIGATE",
    "label": "Broker Workspace & Deal Pipeline → Broker Tactical Field Briefing & Voice Copilot",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Broker Workspace & Deal Pipeline → Broker Tactical Field Briefing & Voice Copilot",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "effects": [
      "Transition from broker.dashboard to broker.field_briefing"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Broker Workspace & Deal Pipeline to Broker Tactical Field Briefing & Voice Copilot",
    "guideTarget": "broker_field_briefing",
    "telemetryEvent": "flow_transition_dashboard_broker_broker_field_briefing",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BrokerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_BROKER_TO_BROKER_FIELD_BRIEFING",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Licensed Broker"
    ],
    "postconditions": [
      "Transition from broker.dashboard to broker.field_briefing"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_broker_field_briefing_to_deal_room_175",
    "source": "broker_field_briefing",
    "target": "deal_room",
    "type": "NAVIGATE",
    "label": "Broker Tactical Field Briefing & Voice Copilot → Private Deal Room & Scheduling Cockpit",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Broker Tactical Field Briefing & Voice Copilot → Private Deal Room & Scheduling Cockpit",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "effects": [
      "Transition from broker.field_briefing to deal.room.chat"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Broker Tactical Field Briefing & Voice Copilot to Private Deal Room & Scheduling Cockpit",
    "guideTarget": "deal-room-negotiation-panel",
    "telemetryEvent": "flow_transition_broker_field_briefing_deal_room",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BrokerFieldBriefing.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_BROKER_FIELD_BRIEFING_TO_DEAL_ROOM",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Licensed PRC Broker authentication required"
    ],
    "postconditions": [
      "Transition from broker.field_briefing to deal.room.chat"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_broker_field_briefing_to_pep_ch10_your_move_176",
    "source": "broker_field_briefing",
    "target": "pep_ch10_your_move",
    "type": "NAVIGATE",
    "label": "Broker Tactical Field Briefing & Voice Copilot → Chapter 10 — Your Move (Action Cockpit)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Broker Tactical Field Briefing & Voice Copilot → Chapter 10 — Your Move (Action Cockpit)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "effects": [
      "Transition from broker.field_briefing to property.pep.ch10_your_move"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Broker Tactical Field Briefing & Voice Copilot to Chapter 10 — Your Move (Action Cockpit)",
    "guideTarget": "property-your-move-actions",
    "telemetryEvent": "flow_transition_broker_field_briefing_pep_ch10_your_move",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BrokerFieldBriefing.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_BROKER_FIELD_BRIEFING_TO_PEP_CH10_YOUR_MOVE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Licensed PRC Broker authentication required"
    ],
    "postconditions": [
      "Transition from broker.field_briefing to property.pep.ch10_your_move"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_deal_room_to_sys_zero_log_ai_crm_177",
    "source": "deal_room",
    "target": "sys_zero_log_ai_crm",
    "type": "SYSTEM",
    "label": "Private Deal Room & Scheduling Cockpit → System: Zero-Log AI Broker CRM & 7-Day Purge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Private Deal Room & Scheduling Cockpit → System: Zero-Log AI Broker CRM & 7-Day Purge",
      "action.completed == true"
    ],
    "roles": [
      "seeker",
      "broker",
      "owner",
      "provider"
    ],
    "visibility": [
      "SEEKER",
      "BROKER",
      "OWNER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.room.chat to crm.zero_log_ai"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Private Deal Room & Scheduling Cockpit to System: Zero-Log AI Broker CRM & 7-Day Purge",
    "guideTarget": "sys_zero_log_ai_crm",
    "telemetryEvent": "flow_transition_deal_room_sys_zero_log_ai_crm",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/ChatBox.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/deals/[id]/messages/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DEAL_ROOM_TO_SYS_ZERO_LOG_AI_CRM",
    "predicate": null,
    "preconditions": [
      "Authorized participant on private deal"
    ],
    "postconditions": [
      "Transition from deal.room.chat to crm.zero_log_ai"
    ],
    "quality": null
  },
  {
    "id": "e_scenario_chat_purge_to_sys_zero_log_ai_crm_178",
    "source": "scenario_chat_purge",
    "target": "sys_zero_log_ai_crm",
    "type": "SYSTEM",
    "label": "Playbook 8.1 — 7-Day Read-Only Chat Retention & Purge → System: Zero-Log AI Broker CRM & 7-Day Purge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Playbook 8.1 — 7-Day Read-Only Chat Retention & Purge → System: Zero-Log AI Broker CRM & 7-Day Purge",
      "action.completed == true"
    ],
    "roles": [
      "staff",
      "seeker",
      "broker",
      "provider"
    ],
    "visibility": [
      "STAFF",
      "SEEKER",
      "BROKER",
      "PROVIDER"
    ],
    "effects": [
      "Transition from deal.chat.purge to crm.zero_log_ai"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Playbook 8.1 — 7-Day Read-Only Chat Retention & Purge to System: Zero-Log AI Broker CRM & 7-Day Purge",
    "guideTarget": "sys_zero_log_ai_crm",
    "telemetryEvent": "flow_transition_scenario_chat_purge_sys_zero_log_ai_crm",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SCENARIO_CHAT_PURGE_TO_SYS_ZERO_LOG_AI_CRM",
    "predicate": null,
    "preconditions": [
      "Deal status = 'closed' or 'completed' for >= 7 days"
    ],
    "postconditions": [
      "Transition from deal.chat.purge to crm.zero_log_ai"
    ],
    "quality": null
  },
  {
    "id": "e_sys_zero_log_ai_crm_to_dashboard_broker_179",
    "source": "sys_zero_log_ai_crm",
    "target": "dashboard_broker",
    "type": "NAVIGATE",
    "label": "System: Zero-Log AI Broker CRM & 7-Day Purge → Broker Workspace & Deal Pipeline",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Zero-Log AI Broker CRM & 7-Day Purge → Broker Workspace & Deal Pipeline",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "broker",
      "staff"
    ],
    "visibility": [
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from crm.zero_log_ai to broker.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Zero-Log AI Broker CRM & 7-Day Purge to Broker Workspace & Deal Pipeline",
    "guideTarget": "dashboard_broker",
    "telemetryEvent": "flow_transition_sys_zero_log_ai_crm_dashboard_broker",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/crmActivity.js",
        "symbol": "logActivity",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_ZERO_LOG_AI_CRM_TO_DASHBOARD_BROKER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Deal Room conversation or WebRTC audio session concluded"
    ],
    "postconditions": [
      "Transition from crm.zero_log_ai to broker.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_sys_zero_log_ai_crm_to_mission_control_180",
    "source": "sys_zero_log_ai_crm",
    "target": "mission_control",
    "type": "NAVIGATE",
    "label": "System: Zero-Log AI Broker CRM & 7-Day Purge → Mission Control (Staff Operations Hub)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Zero-Log AI Broker CRM & 7-Day Purge → Mission Control (Staff Operations Hub)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "broker",
      "staff"
    ],
    "visibility": [
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from crm.zero_log_ai to admin.mission_control"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Zero-Log AI Broker CRM & 7-Day Purge to Mission Control (Staff Operations Hub)",
    "guideTarget": "mission_control",
    "telemetryEvent": "flow_transition_sys_zero_log_ai_crm_mission_control",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/crmActivity.js",
        "symbol": "logActivity",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_ZERO_LOG_AI_CRM_TO_MISSION_CONTROL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Deal Room conversation or WebRTC audio session concluded"
    ],
    "postconditions": [
      "Transition from crm.zero_log_ai to admin.mission_control"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_owner_to_sys_monthly_scout_wrap_181",
    "source": "dashboard_owner",
    "target": "sys_monthly_scout_wrap",
    "type": "SYSTEM",
    "label": "Owner Workspace & Property Management → System: Monthly Scout Wrap Engine (Spotify-Style)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Owner Workspace & Property Management → System: Monthly Scout Wrap Engine (Spotify-Style)",
      "action.completed == true"
    ],
    "roles": [
      "owner"
    ],
    "visibility": [
      "OWNER"
    ],
    "effects": [
      "Transition from owner.dashboard to analytics.monthly_scout_wrap"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Owner Workspace & Property Management to System: Monthly Scout Wrap Engine (Spotify-Style)",
    "guideTarget": "sys_monthly_scout_wrap",
    "telemetryEvent": "flow_transition_dashboard_owner_sys_monthly_scout_wrap",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_OWNER_TO_SYS_MONTHLY_SCOUT_WRAP",
    "predicate": null,
    "preconditions": [
      "Authenticated Owner"
    ],
    "postconditions": [
      "Transition from owner.dashboard to analytics.monthly_scout_wrap"
    ],
    "quality": null
  },
  {
    "id": "e_dashboard_broker_to_sys_monthly_scout_wrap_182",
    "source": "dashboard_broker",
    "target": "sys_monthly_scout_wrap",
    "type": "SYSTEM",
    "label": "Broker Workspace & Deal Pipeline → System: Monthly Scout Wrap Engine (Spotify-Style)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Broker Workspace & Deal Pipeline → System: Monthly Scout Wrap Engine (Spotify-Style)",
      "action.completed == true"
    ],
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "effects": [
      "Transition from broker.dashboard to analytics.monthly_scout_wrap"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Broker Workspace & Deal Pipeline to System: Monthly Scout Wrap Engine (Spotify-Style)",
    "guideTarget": "sys_monthly_scout_wrap",
    "telemetryEvent": "flow_transition_dashboard_broker_sys_monthly_scout_wrap",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BrokerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_BROKER_TO_SYS_MONTHLY_SCOUT_WRAP",
    "predicate": null,
    "preconditions": [
      "Authenticated Licensed Broker"
    ],
    "postconditions": [
      "Transition from broker.dashboard to analytics.monthly_scout_wrap"
    ],
    "quality": null
  },
  {
    "id": "e_mission_control_to_sys_monthly_scout_wrap_183",
    "source": "mission_control",
    "target": "sys_monthly_scout_wrap",
    "type": "SYSTEM",
    "label": "Mission Control (Staff Operations Hub) → System: Monthly Scout Wrap Engine (Spotify-Style)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Mission Control (Staff Operations Hub) → System: Monthly Scout Wrap Engine (Spotify-Style)",
      "action.completed == true"
    ],
    "roles": [
      "staff",
      "enterprise"
    ],
    "visibility": [
      "STAFF",
      "ADMIN"
    ],
    "effects": [
      "Transition from admin.mission_control to analytics.monthly_scout_wrap"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Mission Control (Staff Operations Hub) to System: Monthly Scout Wrap Engine (Spotify-Style)",
    "guideTarget": "sys_monthly_scout_wrap",
    "telemetryEvent": "flow_transition_mission_control_sys_monthly_scout_wrap",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/MissionControlMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/adminGuard.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_MISSION_CONTROL_TO_SYS_MONTHLY_SCOUT_WRAP",
    "predicate": null,
    "preconditions": [
      "Staff role authenticated via Supabase RLS"
    ],
    "postconditions": [
      "Transition from admin.mission_control to analytics.monthly_scout_wrap"
    ],
    "quality": null
  },
  {
    "id": "e_sys_monthly_scout_wrap_to_dashboard_owner_184",
    "source": "sys_monthly_scout_wrap",
    "target": "dashboard_owner",
    "type": "NAVIGATE",
    "label": "System: Monthly Scout Wrap Engine (Spotify-Style) → Owner Workspace & Property Management",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Monthly Scout Wrap Engine (Spotify-Style) → Owner Workspace & Property Management",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from analytics.monthly_scout_wrap to owner.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Monthly Scout Wrap Engine (Spotify-Style) to Owner Workspace & Property Management",
    "guideTarget": "dashboard_owner",
    "telemetryEvent": "flow_transition_sys_monthly_scout_wrap_dashboard_owner",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/monthlyScoutWrap.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/wrap/monthly/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_MONTHLY_SCOUT_WRAP_TO_DASHBOARD_OWNER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "1st day of the calendar month (Asia/Manila time)"
    ],
    "postconditions": [
      "Transition from analytics.monthly_scout_wrap to owner.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_sys_monthly_scout_wrap_to_dashboard_broker_185",
    "source": "sys_monthly_scout_wrap",
    "target": "dashboard_broker",
    "type": "NAVIGATE",
    "label": "System: Monthly Scout Wrap Engine (Spotify-Style) → Broker Workspace & Deal Pipeline",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Monthly Scout Wrap Engine (Spotify-Style) → Broker Workspace & Deal Pipeline",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from analytics.monthly_scout_wrap to broker.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Monthly Scout Wrap Engine (Spotify-Style) to Broker Workspace & Deal Pipeline",
    "guideTarget": "dashboard_broker",
    "telemetryEvent": "flow_transition_sys_monthly_scout_wrap_dashboard_broker",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/monthlyScoutWrap.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/wrap/monthly/route.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_MONTHLY_SCOUT_WRAP_TO_DASHBOARD_BROKER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "1st day of the calendar month (Asia/Manila time)"
    ],
    "postconditions": [
      "Transition from analytics.monthly_scout_wrap to broker.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_mission_control_to_sys_freshness_staleness_engine_186",
    "source": "mission_control",
    "target": "sys_freshness_staleness_engine",
    "type": "SYSTEM",
    "label": "Mission Control (Staff Operations Hub) → System: 90-Day Freshness Loop & Staleness Radar",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Mission Control (Staff Operations Hub) → System: 90-Day Freshness Loop & Staleness Radar",
      "action.completed == true"
    ],
    "roles": [
      "staff",
      "enterprise"
    ],
    "visibility": [
      "STAFF",
      "ADMIN"
    ],
    "effects": [
      "Transition from admin.mission_control to freshness.staleness_engine"
    ],
    "apiRefs": [
      "src/app/api/cron/check-stale-listings/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Mission Control (Staff Operations Hub) to System: 90-Day Freshness Loop & Staleness Radar",
    "guideTarget": "sys_freshness_staleness_engine",
    "telemetryEvent": "flow_transition_mission_control_sys_freshness_staleness_engine",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/MissionControlMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/adminGuard.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_MISSION_CONTROL_TO_SYS_FRESHNESS_STALENESS_ENGINE",
    "predicate": null,
    "preconditions": [
      "Staff role authenticated via Supabase RLS"
    ],
    "postconditions": [
      "Transition from admin.mission_control to freshness.staleness_engine"
    ],
    "quality": null
  },
  {
    "id": "e_dashboard_owner_to_sys_freshness_staleness_engine_187",
    "source": "dashboard_owner",
    "target": "sys_freshness_staleness_engine",
    "type": "SYSTEM",
    "label": "Owner Workspace & Property Management → System: 90-Day Freshness Loop & Staleness Radar",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Owner Workspace & Property Management → System: 90-Day Freshness Loop & Staleness Radar",
      "action.completed == true"
    ],
    "roles": [
      "owner"
    ],
    "visibility": [
      "OWNER"
    ],
    "effects": [
      "Transition from owner.dashboard to freshness.staleness_engine"
    ],
    "apiRefs": [
      "src/app/api/cron/check-stale-listings/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Owner Workspace & Property Management to System: 90-Day Freshness Loop & Staleness Radar",
    "guideTarget": "sys_freshness_staleness_engine",
    "telemetryEvent": "flow_transition_dashboard_owner_sys_freshness_staleness_engine",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/OwnerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_OWNER_TO_SYS_FRESHNESS_STALENESS_ENGINE",
    "predicate": null,
    "preconditions": [
      "Authenticated Owner"
    ],
    "postconditions": [
      "Transition from owner.dashboard to freshness.staleness_engine"
    ],
    "quality": null
  },
  {
    "id": "e_dashboard_broker_to_sys_freshness_staleness_engine_188",
    "source": "dashboard_broker",
    "target": "sys_freshness_staleness_engine",
    "type": "SYSTEM",
    "label": "Broker Workspace & Deal Pipeline → System: 90-Day Freshness Loop & Staleness Radar",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Broker Workspace & Deal Pipeline → System: 90-Day Freshness Loop & Staleness Radar",
      "action.completed == true"
    ],
    "roles": [
      "broker"
    ],
    "visibility": [
      "BROKER"
    ],
    "effects": [
      "Transition from broker.dashboard to freshness.staleness_engine"
    ],
    "apiRefs": [
      "src/app/api/cron/check-stale-listings/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Broker Workspace & Deal Pipeline to System: 90-Day Freshness Loop & Staleness Radar",
    "guideTarget": "sys_freshness_staleness_engine",
    "telemetryEvent": "flow_transition_dashboard_broker_sys_freshness_staleness_engine",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/BrokerMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_BROKER_TO_SYS_FRESHNESS_STALENESS_ENGINE",
    "predicate": null,
    "preconditions": [
      "Authenticated Licensed Broker"
    ],
    "postconditions": [
      "Transition from broker.dashboard to freshness.staleness_engine"
    ],
    "quality": null
  },
  {
    "id": "e_sys_freshness_staleness_engine_to_exc_stale_listing_quarantine_189",
    "source": "sys_freshness_staleness_engine",
    "target": "exc_stale_listing_quarantine",
    "type": "FAILURE",
    "label": "System: 90-Day Freshness Loop & Staleness Radar → Exception: Stale Listing Soft-Quarantine",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: 90-Day Freshness Loop & Staleness Radar → Exception: Stale Listing Soft-Quarantine",
      "status == \"ERROR\""
    ],
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from freshness.staleness_engine to freshness.exc.stale_quarantine"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_confirm_freshness_click",
    "guideInstruction": "Navigate from System: 90-Day Freshness Loop & Staleness Radar to Exception: Stale Listing Soft-Quarantine",
    "guideTarget": "exc_stale_listing_quarantine",
    "telemetryEvent": "flow_transition_sys_freshness_staleness_engine_exc_stale_listing_quarantine",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/freshness.js",
        "symbol": "getListingFreshness",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/freshness.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "FAILURE_EXC_STALE_LISTING_QUARANTINE",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "ERROR",
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "Daily automated background verification cron"
    ],
    "postconditions": [
      "Transition from freshness.staleness_engine to freshness.exc.stale_quarantine"
    ],
    "failureReason": "System: 90-Day Freshness Loop & Staleness Radar → Exception: Stale Listing Soft-Quarantine",
    "quality": "DOMAIN_DECISION",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_sys_freshness_staleness_engine_to_rec_confirm_freshness_click_190",
    "source": "sys_freshness_staleness_engine",
    "target": "rec_confirm_freshness_click",
    "type": "NAVIGATE",
    "label": "System: 90-Day Freshness Loop & Staleness Radar → Action: One-Click Portfolio Freshness Re-Verification",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: 90-Day Freshness Loop & Staleness Radar → Action: One-Click Portfolio Freshness Re-Verification",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from freshness.staleness_engine to freshness.rec.confirm_freshness"
    ],
    "apiRefs": [
      "src/app/api/property/confirm-freshness/route.js"
    ],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: 90-Day Freshness Loop & Staleness Radar to Action: One-Click Portfolio Freshness Re-Verification",
    "guideTarget": "rec_confirm_freshness_click",
    "telemetryEvent": "flow_transition_sys_freshness_staleness_engine_rec_confirm_freshness_click",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/freshness.js",
        "symbol": "getListingFreshness",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/freshness.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_FRESHNESS_STALENESS_ENGINE_TO_REC_CONFIRM_FRESHNESS_CLICK",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Daily automated background verification cron"
    ],
    "postconditions": [
      "Transition from freshness.staleness_engine to freshness.rec.confirm_freshness"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_sys_freshness_staleness_engine_to_pep_191",
    "source": "sys_freshness_staleness_engine",
    "target": "pep",
    "type": "NAVIGATE",
    "label": "System: 90-Day Freshness Loop & Staleness Radar → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: 90-Day Freshness Loop & Staleness Radar → Property Experience Page (PEP)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "STAFF"
    ],
    "effects": [
      "Transition from freshness.staleness_engine to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: 90-Day Freshness Loop & Staleness Radar to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_sys_freshness_staleness_engine_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/freshness.js",
        "symbol": "getListingFreshness",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "TEST",
        "path": "src/lib/__tests__/freshness.test.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_FRESHNESS_STALENESS_ENGINE_TO_PEP",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Daily automated background verification cron"
    ],
    "postconditions": [
      "Transition from freshness.staleness_engine to property.pep"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_exc_stale_listing_quarantine_to_rec_confirm_freshness_click_192",
    "source": "exc_stale_listing_quarantine",
    "target": "rec_confirm_freshness_click",
    "type": "RECOVERY",
    "label": "Exception: Stale Listing Soft-Quarantine → Action: One-Click Portfolio Freshness Re-Verification",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Exception: Stale Listing Soft-Quarantine → Action: One-Click Portfolio Freshness Re-Verification",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from freshness.exc.stale_quarantine to freshness.rec.confirm_freshness"
    ],
    "apiRefs": [
      "src/app/api/property/confirm-freshness/route.js"
    ],
    "reversible": false,
    "recoveryTarget": "rec_confirm_freshness_click",
    "guideInstruction": "Navigate from Exception: Stale Listing Soft-Quarantine to Action: One-Click Portfolio Freshness Re-Verification",
    "guideTarget": "rec_confirm_freshness_click",
    "telemetryEvent": "flow_transition_exc_stale_listing_quarantine_rec_confirm_freshness_click",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/lib/freshness.js",
        "symbol": "STALENESS_TIERS",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_REC_CONFIRM_FRESHNESS_CLICK",
    "predicate": null,
    "preconditions": [
      "Property Last_Verified_Date > 60 days"
    ],
    "postconditions": [
      "Transition from freshness.exc.stale_quarantine to freshness.rec.confirm_freshness"
    ],
    "quality": null
  },
  {
    "id": "e_rec_confirm_freshness_click_to_pep_193",
    "source": "rec_confirm_freshness_click",
    "target": "pep",
    "type": "RETRY",
    "label": "Action: One-Click Portfolio Freshness Re-Verification → Property Experience Page (PEP)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: One-Click Portfolio Freshness Re-Verification → Property Experience Page (PEP)",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from freshness.rec.confirm_freshness to property.pep"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": "pep",
    "guideInstruction": "Navigate from Action: One-Click Portfolio Freshness Re-Verification to Property Experience Page (PEP)",
    "guideTarget": "property-detail-container",
    "telemetryEvent": "flow_transition_rec_confirm_freshness_click_pep",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/MonthlyFreshnessModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_PEP",
    "predicate": null,
    "preconditions": [
      "Authenticated property owner or authorized listing broker"
    ],
    "postconditions": [
      "Transition from freshness.rec.confirm_freshness to property.pep"
    ],
    "quality": null
  },
  {
    "id": "e_rec_confirm_freshness_click_to_dashboard_owner_194",
    "source": "rec_confirm_freshness_click",
    "target": "dashboard_owner",
    "type": "RETRY",
    "label": "Action: One-Click Portfolio Freshness Re-Verification → Owner Workspace & Property Management",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: One-Click Portfolio Freshness Re-Verification → Owner Workspace & Property Management",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from freshness.rec.confirm_freshness to owner.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": "dashboard_owner",
    "guideInstruction": "Navigate from Action: One-Click Portfolio Freshness Re-Verification to Owner Workspace & Property Management",
    "guideTarget": "dashboard_owner",
    "telemetryEvent": "flow_transition_rec_confirm_freshness_click_dashboard_owner",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/MonthlyFreshnessModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_DASHBOARD_OWNER",
    "predicate": null,
    "preconditions": [
      "Authenticated property owner or authorized listing broker"
    ],
    "postconditions": [
      "Transition from freshness.rec.confirm_freshness to owner.dashboard"
    ],
    "quality": null
  },
  {
    "id": "e_rec_confirm_freshness_click_to_dashboard_broker_195",
    "source": "rec_confirm_freshness_click",
    "target": "dashboard_broker",
    "type": "RETRY",
    "label": "Action: One-Click Portfolio Freshness Re-Verification → Broker Workspace & Deal Pipeline",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: One-Click Portfolio Freshness Re-Verification → Broker Workspace & Deal Pipeline",
      "action.completed == true"
    ],
    "roles": [
      "owner",
      "broker"
    ],
    "visibility": [
      "OWNER",
      "BROKER"
    ],
    "effects": [
      "Transition from freshness.rec.confirm_freshness to broker.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": "dashboard_broker",
    "guideInstruction": "Navigate from Action: One-Click Portfolio Freshness Re-Verification to Broker Workspace & Deal Pipeline",
    "guideTarget": "dashboard_broker",
    "telemetryEvent": "flow_transition_rec_confirm_freshness_click_dashboard_broker",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/MonthlyFreshnessModal.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_DASHBOARD_BROKER",
    "predicate": null,
    "preconditions": [
      "Authenticated property owner or authorized listing broker"
    ],
    "postconditions": [
      "Transition from freshness.rec.confirm_freshness to broker.dashboard"
    ],
    "quality": null
  },
  {
    "id": "e_pep_ch2_location_to_sys_noah_hazard_radar_196",
    "source": "pep_ch2_location",
    "target": "sys_noah_hazard_radar",
    "type": "SYSTEM",
    "label": "Chapter 02 — Location & Transit Logistics → System: UP NOAH & HazardHunter GIS Flood/Fault Radar",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Chapter 02 — Location & Transit Logistics → System: UP NOAH & HazardHunter GIS Flood/Fault Radar",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep.ch2_location to gis.noah_hazard_radar"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 02 — Location & Transit Logistics to System: UP NOAH & HazardHunter GIS Flood/Fault Radar",
    "guideTarget": "sys_noah_hazard_radar",
    "telemetryEvent": "flow_transition_pep_ch2_location_sys_noah_hazard_radar",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.LOCATION",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/InteractiveMap.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_CH2_LOCATION_TO_SYS_NOAH_HAZARD_RADAR",
    "predicate": null,
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from property.pep.ch2_location to gis.noah_hazard_radar"
    ],
    "quality": null
  },
  {
    "id": "e_discover_directory_to_sys_noah_hazard_radar_197",
    "source": "discover_directory",
    "target": "sys_noah_hazard_radar",
    "type": "SYSTEM",
    "label": "Space Directory & Radius Radar → System: UP NOAH & HazardHunter GIS Flood/Fault Radar",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Space Directory & Radius Radar → System: UP NOAH & HazardHunter GIS Flood/Fault Radar",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from discovery.directory to gis.noah_hazard_radar"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Space Directory & Radius Radar to System: UP NOAH & HazardHunter GIS Flood/Fault Radar",
    "guideTarget": "sys_noah_hazard_radar",
    "telemetryEvent": "flow_transition_discover_directory_sys_noah_hazard_radar",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/property/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "API",
        "path": "src/app/api/cms/route.js",
        "symbol": "GET",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DISCOVER_DIRECTORY_TO_SYS_NOAH_HAZARD_RADAR",
    "predicate": null,
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from discovery.directory to gis.noah_hazard_radar"
    ],
    "quality": null
  },
  {
    "id": "e_sys_noah_hazard_radar_to_pep_ch2_location_198",
    "source": "sys_noah_hazard_radar",
    "target": "pep_ch2_location",
    "type": "NAVIGATE",
    "label": "System: UP NOAH & HazardHunter GIS Flood/Fault Radar → Chapter 02 — Location & Transit Logistics",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: UP NOAH & HazardHunter GIS Flood/Fault Radar → Chapter 02 — Location & Transit Logistics",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from gis.noah_hazard_radar to property.pep.ch2_location"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: UP NOAH & HazardHunter GIS Flood/Fault Radar to Chapter 02 — Location & Transit Logistics",
    "guideTarget": "pep_ch2_location",
    "telemetryEvent": "flow_transition_sys_noah_hazard_radar_pep_ch2_location",
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/FloodHeatmapMap.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_NOAH_HAZARD_RADAR_TO_PEP_CH2_LOCATION",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Valid property latitude/longitude coordinates"
    ],
    "postconditions": [
      "Transition from gis.noah_hazard_radar to property.pep.ch2_location"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_dashboard_provider_to_provider_bounty_handshake_199",
    "source": "dashboard_provider",
    "target": "provider_bounty_handshake",
    "type": "NAVIGATE",
    "label": "Provider Workspace & QuestIT Bounties → Action: Spatial Creator Bounty Claim & Payout Handshake",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Provider Workspace & QuestIT Bounties → Action: Spatial Creator Bounty Claim & Payout Handshake",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "provider"
    ],
    "visibility": [
      "PROVIDER"
    ],
    "effects": [
      "Transition from provider.dashboard to provider.bounty.handshake"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Provider Workspace & QuestIT Bounties to Action: Spatial Creator Bounty Claim & Payout Handshake",
    "guideTarget": "provider_bounty_handshake",
    "telemetryEvent": "flow_transition_dashboard_provider_provider_bounty_handshake",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/dashboard/ProviderMode.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_DASHBOARD_PROVIDER_TO_PROVIDER_BOUNTY_HANDSHAKE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated Provider profile"
    ],
    "postconditions": [
      "Transition from provider.dashboard to provider.bounty.handshake"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_provider_bounty_handshake_to_photographers_roster_200",
    "source": "provider_bounty_handshake",
    "target": "photographers_roster",
    "type": "NAVIGATE",
    "label": "Action: Spatial Creator Bounty Claim & Payout Handshake → Architectural & Drone Media Directory",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Spatial Creator Bounty Claim & Payout Handshake → Architectural & Drone Media Directory",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "provider",
      "staff"
    ],
    "visibility": [
      "PROVIDER",
      "STAFF"
    ],
    "effects": [
      "Transition from provider.bounty.handshake to roster.photographers"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Action: Spatial Creator Bounty Claim & Payout Handshake to Architectural & Drone Media Directory",
    "guideTarget": "photographers_roster",
    "telemetryEvent": "flow_transition_provider_bounty_handshake_photographers_roster",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PROVIDER_BOUNTY_HANDSHAKE_TO_PHOTOGRAPHERS_ROSTER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Verified Provider account and active bounty escrow balance"
    ],
    "postconditions": [
      "Transition from provider.bounty.handshake to roster.photographers"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_provider_bounty_handshake_to_dashboard_provider_201",
    "source": "provider_bounty_handshake",
    "target": "dashboard_provider",
    "type": "NAVIGATE",
    "label": "Action: Spatial Creator Bounty Claim & Payout Handshake → Provider Workspace & QuestIT Bounties",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Spatial Creator Bounty Claim & Payout Handshake → Provider Workspace & QuestIT Bounties",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "provider",
      "staff"
    ],
    "visibility": [
      "PROVIDER",
      "STAFF"
    ],
    "effects": [
      "Transition from provider.bounty.handshake to provider.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Action: Spatial Creator Bounty Claim & Payout Handshake to Provider Workspace & QuestIT Bounties",
    "guideTarget": "dashboard_provider",
    "telemetryEvent": "flow_transition_provider_bounty_handshake_dashboard_provider",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PROVIDER_BOUNTY_HANDSHAKE_TO_DASHBOARD_PROVIDER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Verified Provider account and active bounty escrow balance"
    ],
    "postconditions": [
      "Transition from provider.bounty.handshake to provider.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_provider_bounty_handshake_to_mission_control_202",
    "source": "provider_bounty_handshake",
    "target": "mission_control",
    "type": "NAVIGATE",
    "label": "Action: Spatial Creator Bounty Claim & Payout Handshake → Mission Control (Staff Operations Hub)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Spatial Creator Bounty Claim & Payout Handshake → Mission Control (Staff Operations Hub)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "provider",
      "staff"
    ],
    "visibility": [
      "PROVIDER",
      "STAFF"
    ],
    "effects": [
      "Transition from provider.bounty.handshake to admin.mission_control"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Action: Spatial Creator Bounty Claim & Payout Handshake to Mission Control (Staff Operations Hub)",
    "guideTarget": "mission_control",
    "telemetryEvent": "flow_transition_provider_bounty_handshake_mission_control",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PROVIDER_BOUNTY_HANDSHAKE_TO_MISSION_CONTROL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Verified Provider account and active bounty escrow balance"
    ],
    "postconditions": [
      "Transition from provider.bounty.handshake to admin.mission_control"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_pep_ch8_universe_to_sys_faq_appeal_engine_203",
    "source": "pep_ch8_universe",
    "target": "sys_faq_appeal_engine",
    "type": "SYSTEM",
    "label": "Chapter 08 — Property Universe & Developer Credentials → System: Community FAQ Voting & Verification Engine",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Chapter 08 — Property Universe & Developer Credentials → System: Community FAQ Voting & Verification Engine",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.pep.ch8_universe to faq.appeal_engine"
    ],
    "apiRefs": [
      "src/app/api/property/faq-vote/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Chapter 08 — Property Universe & Developer Credentials to System: Community FAQ Voting & Verification Engine",
    "guideTarget": "sys_faq_appeal_engine",
    "telemetryEvent": "flow_transition_pep_ch8_universe_sys_faq_appeal_engine",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "COMPONENT",
        "path": "src/components/property/chapterConfig.js",
        "symbol": "CHAPTER_IDS.UNIVERSE",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/PropertyFAQSection.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_PEP_CH8_UNIVERSE_TO_SYS_FAQ_APPEAL_ENGINE",
    "predicate": null,
    "preconditions": [
      "Publicly accessible"
    ],
    "postconditions": [
      "Transition from property.pep.ch8_universe to faq.appeal_engine"
    ],
    "quality": null
  },
  {
    "id": "e_action_ask_faq_to_sys_faq_appeal_engine_204",
    "source": "action_ask_faq",
    "target": "sys_faq_appeal_engine",
    "type": "SYSTEM",
    "label": "Action: Ask Public Question (Community FAQ) → System: Community FAQ Voting & Verification Engine",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Ask Public Question (Community FAQ) → System: Community FAQ Voting & Verification Engine",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from property.faq.ask to faq.appeal_engine"
    ],
    "apiRefs": [
      "src/app/api/property/faq-vote/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Action: Ask Public Question (Community FAQ) to System: Community FAQ Voting & Verification Engine",
    "guideTarget": "sys_faq_appeal_engine",
    "telemetryEvent": "flow_transition_action_ask_faq_sys_faq_appeal_engine",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "API",
        "path": "src/app/api/faqs/route.js",
        "symbol": "POST",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "COMPONENT",
        "path": "src/components/property/PropertyFAQSection.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_ACTION_ASK_FAQ_TO_SYS_FAQ_APPEAL_ENGINE",
    "predicate": null,
    "preconditions": [
      "Non-empty question text"
    ],
    "postconditions": [
      "Transition from property.faq.ask to faq.appeal_engine"
    ],
    "quality": null
  },
  {
    "id": "e_sys_faq_appeal_engine_to_pep_ch8_universe_205",
    "source": "sys_faq_appeal_engine",
    "target": "pep_ch8_universe",
    "type": "NAVIGATE",
    "label": "System: Community FAQ Voting & Verification Engine → Chapter 08 — Property Universe & Developer Credentials",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Community FAQ Voting & Verification Engine → Chapter 08 — Property Universe & Developer Credentials",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from faq.appeal_engine to property.pep.ch8_universe"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Community FAQ Voting & Verification Engine to Chapter 08 — Property Universe & Developer Credentials",
    "guideTarget": "pep_ch8_universe",
    "telemetryEvent": "flow_transition_sys_faq_appeal_engine_pep_ch8_universe",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_FAQ_APPEAL_ENGINE_TO_PEP_CH8_UNIVERSE",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Authenticated user session (Seeker, Owner, or Broker)"
    ],
    "postconditions": [
      "Transition from faq.appeal_engine to property.pep.ch8_universe"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_login_to_auth_enterprise_sso_206",
    "source": "login",
    "target": "auth_enterprise_sso",
    "type": "NAVIGATE",
    "label": "Supabase Identity & Auth Portal → Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Supabase Identity & Auth Portal → Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from auth.login to auth.enterprise_sso"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Supabase Identity & Auth Portal to Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway",
    "guideTarget": "auth_enterprise_sso",
    "telemetryEvent": "flow_transition_login_auth_enterprise_sso",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/login/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/authClient.js",
        "symbol": "signInWithPassword",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_LOGIN_TO_AUTH_ENTERPRISE_SSO",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Valid email or OAuth provider account"
    ],
    "postconditions": [
      "Transition from auth.login to auth.enterprise_sso"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_auth_enterprise_sso_to_exc_sso_domain_mismatch_207",
    "source": "auth_enterprise_sso",
    "target": "exc_sso_domain_mismatch",
    "type": "FAILURE",
    "label": "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Exception: Enterprise SSO Domain Mismatch",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Exception: Enterprise SSO Domain Mismatch",
      "status == \"ERROR\""
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE",
      "STAFF"
    ],
    "effects": [
      "Transition from auth.enterprise_sso to auth.sso.exc.domain_mismatch"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_sso_idp_reauth",
    "guideInstruction": "Navigate from Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway to Exception: Enterprise SSO Domain Mismatch",
    "guideTarget": "exc_sso_domain_mismatch",
    "telemetryEvent": "flow_transition_auth_enterprise_sso_exc_sso_domain_mismatch",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/enterprise/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "FAILURE_EXC_SSO_DOMAIN_MISMATCH",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "ERROR",
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "Configured enterprise corporate domain (e.g. @ayaland.com.ph)"
    ],
    "postconditions": [
      "Transition from auth.enterprise_sso to auth.sso.exc.domain_mismatch"
    ],
    "failureReason": "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Exception: Enterprise SSO Domain Mismatch",
    "quality": "DOMAIN_DECISION",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_auth_enterprise_sso_to_rec_sso_idp_reauth_208",
    "source": "auth_enterprise_sso",
    "target": "rec_sso_idp_reauth",
    "type": "NAVIGATE",
    "label": "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Action: Corporate IdP Portal Re-Authentication",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Action: Corporate IdP Portal Re-Authentication",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE",
      "STAFF"
    ],
    "effects": [
      "Transition from auth.enterprise_sso to auth.sso.rec.idp_reauth"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway to Action: Corporate IdP Portal Re-Authentication",
    "guideTarget": "rec_sso_idp_reauth",
    "telemetryEvent": "flow_transition_auth_enterprise_sso_rec_sso_idp_reauth",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/enterprise/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_AUTH_ENTERPRISE_SSO_TO_REC_SSO_IDP_REAUTH",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Configured enterprise corporate domain (e.g. @ayaland.com.ph)"
    ],
    "postconditions": [
      "Transition from auth.enterprise_sso to auth.sso.rec.idp_reauth"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_auth_enterprise_sso_to_dashboard_owner_209",
    "source": "auth_enterprise_sso",
    "target": "dashboard_owner",
    "type": "NAVIGATE",
    "label": "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Owner Workspace & Property Management",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Owner Workspace & Property Management",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE",
      "STAFF"
    ],
    "effects": [
      "Transition from auth.enterprise_sso to owner.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway to Owner Workspace & Property Management",
    "guideTarget": "dashboard_owner",
    "telemetryEvent": "flow_transition_auth_enterprise_sso_dashboard_owner",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/enterprise/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_AUTH_ENTERPRISE_SSO_TO_DASHBOARD_OWNER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Configured enterprise corporate domain (e.g. @ayaland.com.ph)"
    ],
    "postconditions": [
      "Transition from auth.enterprise_sso to owner.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_auth_enterprise_sso_to_dashboard_broker_210",
    "source": "auth_enterprise_sso",
    "target": "dashboard_broker",
    "type": "NAVIGATE",
    "label": "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Broker Workspace & Deal Pipeline",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Broker Workspace & Deal Pipeline",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE",
      "STAFF"
    ],
    "effects": [
      "Transition from auth.enterprise_sso to broker.dashboard"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway to Broker Workspace & Deal Pipeline",
    "guideTarget": "dashboard_broker",
    "telemetryEvent": "flow_transition_auth_enterprise_sso_dashboard_broker",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/enterprise/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_AUTH_ENTERPRISE_SSO_TO_DASHBOARD_BROKER",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Configured enterprise corporate domain (e.g. @ayaland.com.ph)"
    ],
    "postconditions": [
      "Transition from auth.enterprise_sso to broker.dashboard"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_auth_enterprise_sso_to_mission_control_211",
    "source": "auth_enterprise_sso",
    "target": "mission_control",
    "type": "NAVIGATE",
    "label": "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Mission Control (Staff Operations Hub)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway → Mission Control (Staff Operations Hub)",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "owner",
      "broker",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "OWNER",
      "BROKER",
      "ENTERPRISE",
      "STAFF"
    ],
    "effects": [
      "Transition from auth.enterprise_sso to admin.mission_control"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway to Mission Control (Staff Operations Hub)",
    "guideTarget": "mission_control",
    "telemetryEvent": "flow_transition_auth_enterprise_sso_mission_control",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/enterprise/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_AUTH_ENTERPRISE_SSO_TO_MISSION_CONTROL",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Configured enterprise corporate domain (e.g. @ayaland.com.ph)"
    ],
    "postconditions": [
      "Transition from auth.enterprise_sso to admin.mission_control"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_exc_sso_domain_mismatch_to_rec_sso_idp_reauth_212",
    "source": "exc_sso_domain_mismatch",
    "target": "rec_sso_idp_reauth",
    "type": "RECOVERY",
    "label": "Exception: Enterprise SSO Domain Mismatch → Action: Corporate IdP Portal Re-Authentication",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Exception: Enterprise SSO Domain Mismatch → Action: Corporate IdP Portal Re-Authentication",
      "action.completed == true"
    ],
    "roles": [
      "enterprise",
      "staff"
    ],
    "visibility": [
      "ENTERPRISE",
      "STAFF"
    ],
    "effects": [
      "Transition from auth.sso.exc.domain_mismatch to auth.sso.rec.idp_reauth"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_sso_idp_reauth",
    "guideInstruction": "Navigate from Exception: Enterprise SSO Domain Mismatch to Action: Corporate IdP Portal Re-Authentication",
    "guideTarget": "rec_sso_idp_reauth",
    "telemetryEvent": "flow_transition_exc_sso_domain_mismatch_rec_sso_idp_reauth",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_REC_SSO_IDP_REAUTH",
    "predicate": null,
    "preconditions": [
      "SAML assertion domain != configured enterprise tenant domain"
    ],
    "postconditions": [
      "Transition from auth.sso.exc.domain_mismatch to auth.sso.rec.idp_reauth"
    ],
    "quality": null
  },
  {
    "id": "e_rec_sso_idp_reauth_to_auth_enterprise_sso_213",
    "source": "rec_sso_idp_reauth",
    "target": "auth_enterprise_sso",
    "type": "RETRY",
    "label": "Action: Corporate IdP Portal Re-Authentication → Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Corporate IdP Portal Re-Authentication → Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway",
      "action.completed == true"
    ],
    "roles": [
      "enterprise",
      "staff"
    ],
    "visibility": [
      "ENTERPRISE",
      "STAFF"
    ],
    "effects": [
      "Transition from auth.sso.rec.idp_reauth to auth.enterprise_sso"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": "auth_enterprise_sso",
    "guideInstruction": "Navigate from Action: Corporate IdP Portal Re-Authentication to Action: Enterprise SAML 2.0 / Okta / Azure AD Gateway",
    "guideTarget": "auth_enterprise_sso",
    "telemetryEvent": "flow_transition_rec_sso_idp_reauth_auth_enterprise_sso",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_AUTH_ENTERPRISE_SSO",
    "predicate": null,
    "preconditions": [
      "Valid enterprise organization tenant identifier"
    ],
    "postconditions": [
      "Transition from auth.sso.rec.idp_reauth to auth.enterprise_sso"
    ],
    "quality": null
  },
  {
    "id": "e_sys_edge_ip_masking_to_sys_ephemeral_secret_engine_214",
    "source": "sys_edge_ip_masking",
    "target": "sys_ephemeral_secret_engine",
    "type": "SYSTEM",
    "label": "System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge) → System: Scoped Ephemeral Secret & Token Engine",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge) → System: Scoped Ephemeral Secret & Token Engine",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.edge.ip_masking to sentinel.ephemeral_secret_engine"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Vercel Edge IP Masking (RA 10173 Zero-Knowledge) to System: Scoped Ephemeral Secret & Token Engine",
    "guideTarget": "sys_ephemeral_secret_engine",
    "telemetryEvent": "flow_transition_sys_edge_ip_masking_sys_ephemeral_secret_engine",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/middleware.js",
        "symbol": "middleware",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_EDGE_IP_MASKING_TO_SYS_EPHEMERAL_SECRET_ENGINE",
    "predicate": null,
    "preconditions": [
      "Every incoming HTTP request through Vercel Edge Middleware"
    ],
    "postconditions": [
      "Transition from sentinel.edge.ip_masking to sentinel.ephemeral_secret_engine"
    ],
    "quality": null
  },
  {
    "id": "e_login_to_sys_ephemeral_secret_engine_215",
    "source": "login",
    "target": "sys_ephemeral_secret_engine",
    "type": "SYSTEM",
    "label": "Supabase Identity & Auth Portal → System: Scoped Ephemeral Secret & Token Engine",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Supabase Identity & Auth Portal → System: Scoped Ephemeral Secret & Token Engine",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "enterprise",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from auth.login to sentinel.ephemeral_secret_engine"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from Supabase Identity & Auth Portal to System: Scoped Ephemeral Secret & Token Engine",
    "guideTarget": "sys_ephemeral_secret_engine",
    "telemetryEvent": "flow_transition_login_sys_ephemeral_secret_engine",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "ROUTE",
        "path": "src/app/login/page.js",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      },
      {
        "kind": "CODE",
        "path": "src/lib/authClient.js",
        "symbol": "signInWithPassword",
        "provenance": "EXTRACTED",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_LOGIN_TO_SYS_EPHEMERAL_SECRET_ENGINE",
    "predicate": null,
    "preconditions": [
      "Valid email or OAuth provider account"
    ],
    "postconditions": [
      "Transition from auth.login to sentinel.ephemeral_secret_engine"
    ],
    "quality": null
  },
  {
    "id": "e_sys_ephemeral_secret_engine_to_exc_ephemeral_token_expired_216",
    "source": "sys_ephemeral_secret_engine",
    "target": "exc_ephemeral_token_expired",
    "type": "FAILURE",
    "label": "System: Scoped Ephemeral Secret & Token Engine → Exception: Ephemeral Token Expired (401)",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Scoped Ephemeral Secret & Token Engine → Exception: Ephemeral Token Expired (401)",
      "status == \"ERROR\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.ephemeral_secret_engine to sentinel.exc.token_expired"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_silent_token_refresh",
    "guideInstruction": "Navigate from System: Scoped Ephemeral Secret & Token Engine to Exception: Ephemeral Token Expired (401)",
    "guideTarget": "exc_ephemeral_token_expired",
    "telemetryEvent": "flow_transition_sys_ephemeral_secret_engine_exc_ephemeral_token_expired",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "FAILURE_EXC_EPHEMERAL_TOKEN_EXPIRED",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "ERROR",
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "Valid user session requesting privileged service operations"
    ],
    "postconditions": [
      "Transition from sentinel.ephemeral_secret_engine to sentinel.exc.token_expired"
    ],
    "failureReason": "System: Scoped Ephemeral Secret & Token Engine → Exception: Ephemeral Token Expired (401)",
    "quality": "DOMAIN_DECISION",
    "errorClass": "BUSINESS_RULE_VIOLATION"
  },
  {
    "id": "e_sys_ephemeral_secret_engine_to_rec_silent_token_refresh_217",
    "source": "sys_ephemeral_secret_engine",
    "target": "rec_silent_token_refresh",
    "type": "NAVIGATE",
    "label": "System: Scoped Ephemeral Secret & Token Engine → Action: Silent Background Refresh Token Rotation",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Scoped Ephemeral Secret & Token Engine → Action: Silent Background Refresh Token Rotation",
      "navigation.action == \"navigated\""
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.ephemeral_secret_engine to sentinel.rec.silent_refresh"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Scoped Ephemeral Secret & Token Engine to Action: Silent Background Refresh Token Rotation",
    "guideTarget": "rec_silent_token_refresh",
    "telemetryEvent": "flow_transition_sys_ephemeral_secret_engine_rec_silent_token_refresh",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_EPHEMERAL_SECRET_ENGINE_TO_REC_SILENT_TOKEN_REFRESH",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Valid user session requesting privileged service operations"
    ],
    "postconditions": [
      "Transition from sentinel.ephemeral_secret_engine to sentinel.rec.silent_refresh"
    ],
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_sys_ephemeral_secret_engine_to_api_publish_listing_218",
    "source": "sys_ephemeral_secret_engine",
    "target": "api_publish_listing",
    "type": "SYSTEM",
    "label": "System: Scoped Ephemeral Secret & Token Engine → System: Dual-CMS Publishing Bridge",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Scoped Ephemeral Secret & Token Engine → System: Dual-CMS Publishing Bridge",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.ephemeral_secret_engine to owner.listing.publish"
    ],
    "apiRefs": [
      "src/app/api/dashboard/publish/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Scoped Ephemeral Secret & Token Engine to System: Dual-CMS Publishing Bridge",
    "guideTarget": "api_publish_listing",
    "telemetryEvent": "flow_transition_sys_ephemeral_secret_engine_api_publish_listing",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_EPHEMERAL_SECRET_ENGINE_TO_API_PUBLISH_LISTING",
    "predicate": null,
    "preconditions": [
      "Valid user session requesting privileged service operations"
    ],
    "postconditions": [
      "Transition from sentinel.ephemeral_secret_engine to owner.listing.publish"
    ],
    "quality": null
  },
  {
    "id": "e_sys_ephemeral_secret_engine_to_sys_connect_wallet_219",
    "source": "sys_ephemeral_secret_engine",
    "target": "sys_connect_wallet",
    "type": "SYSTEM",
    "label": "System: Scoped Ephemeral Secret & Token Engine → System: Connects Wallet & Deduct RPC",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "System: Scoped Ephemeral Secret & Token Engine → System: Connects Wallet & Deduct RPC",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.ephemeral_secret_engine to connects.wallet"
    ],
    "apiRefs": [
      "src/app/api/deals/spend-connect/route.js"
    ],
    "reversible": false,
    "recoveryTarget": null,
    "guideInstruction": "Navigate from System: Scoped Ephemeral Secret & Token Engine to System: Connects Wallet & Deduct RPC",
    "guideTarget": "sys_connect_wallet",
    "telemetryEvent": "flow_transition_sys_ephemeral_secret_engine_sys_connect_wallet",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "BRANCH_SYS_EPHEMERAL_SECRET_ENGINE_TO_SYS_CONNECT_WALLET",
    "predicate": null,
    "preconditions": [
      "Valid user session requesting privileged service operations"
    ],
    "postconditions": [
      "Transition from sentinel.ephemeral_secret_engine to connects.wallet"
    ],
    "quality": null
  },
  {
    "id": "e_exc_ephemeral_token_expired_to_rec_silent_token_refresh_220",
    "source": "exc_ephemeral_token_expired",
    "target": "rec_silent_token_refresh",
    "type": "RECOVERY",
    "label": "Exception: Ephemeral Token Expired (401) → Action: Silent Background Refresh Token Rotation",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Exception: Ephemeral Token Expired (401) → Action: Silent Background Refresh Token Rotation",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.exc.token_expired to sentinel.rec.silent_refresh"
    ],
    "apiRefs": [],
    "reversible": false,
    "recoveryTarget": "rec_silent_token_refresh",
    "guideInstruction": "Navigate from Exception: Ephemeral Token Expired (401) to Action: Silent Background Refresh Token Rotation",
    "guideTarget": "rec_silent_token_refresh",
    "telemetryEvent": "flow_transition_exc_ephemeral_token_expired_rec_silent_token_refresh",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_REC_SILENT_TOKEN_REFRESH",
    "predicate": null,
    "preconditions": [
      "API call received with expired ephemeral JWT token"
    ],
    "postconditions": [
      "Transition from sentinel.exc.token_expired to sentinel.rec.silent_refresh"
    ],
    "quality": null
  },
  {
    "id": "e_rec_silent_token_refresh_to_sys_ephemeral_secret_engine_221",
    "source": "rec_silent_token_refresh",
    "target": "sys_ephemeral_secret_engine",
    "type": "RETRY",
    "label": "Action: Silent Background Refresh Token Rotation → System: Scoped Ephemeral Secret & Token Engine",
    "trigger": "System Flow / State Transition",
    "conditions": [
      "Action: Silent Background Refresh Token Rotation → System: Scoped Ephemeral Secret & Token Engine",
      "action.completed == true"
    ],
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker",
      "provider",
      "staff"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "effects": [
      "Transition from sentinel.rec.silent_refresh to sentinel.ephemeral_secret_engine"
    ],
    "apiRefs": [],
    "reversible": true,
    "recoveryTarget": "sys_ephemeral_secret_engine",
    "guideInstruction": "Navigate from Action: Silent Background Refresh Token Rotation to System: Scoped Ephemeral Secret & Token Engine",
    "guideTarget": "sys_ephemeral_secret_engine",
    "telemetryEvent": "flow_transition_rec_silent_token_refresh_sys_ephemeral_secret_engine",
    "implementationStatus": "PARTIAL",
    "evidence": [
      {
        "kind": "SCOUTIT_BRAIN",
        "path": "_SCOUTIT_BRAIN/00_MASTER_SYNC.md",
        "provenance": "INFERRED",
        "confidence": 0.8,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "branchKey": "RECOVERY_SYS_EPHEMERAL_SECRET_ENGINE",
    "predicate": null,
    "preconditions": [
      "Valid unrevoked refresh token in secure HTTP-only cookie"
    ],
    "postconditions": [
      "Transition from sentinel.rec.silent_refresh to sentinel.ephemeral_secret_engine"
    ],
    "quality": null
  },
  {
    "id": "edge_pep_ch10_to_gate_auth",
    "source": "pep_ch10_your_move",
    "target": "gate_auth",
    "type": "ACTION",
    "label": "Initiate Protected Action → Verify Session",
    "branchKey": "BRANCH_PEP_CH10_YOUR_MOVE_TO_GATE_AUTH",
    "roles": [
      "visitor",
      "seeker"
    ],
    "visibility": [
      "PUBLIC",
      "AUTHENTICATED"
    ],
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "navigated",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [],
    "postconditions": [],
    "guideTarget": "gate_auth-action",
    "implementationStatus": "VERIFIED",
    "conditions": [
      "Initiate Protected Action → Verify Session",
      "navigation.action == \"navigated\""
    ],
    "recoveryTarget": null,
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "edge_gate_auth_to_login",
    "source": "gate_auth",
    "target": "login",
    "type": "AUTH_GATE",
    "label": "Unauthenticated → Redirect to Login with return_to",
    "branchKey": "UNAUTHENTICATED",
    "predicate": {
      "field": "auth.isAuthenticated",
      "operator": "==",
      "value": false,
      "quality": "DOMAIN_DECISION"
    },
    "failureReason": "User session is unauthenticated; redirecting to login with return_to parameter",
    "roles": [
      "visitor",
      "seeker"
    ],
    "visibility": [
      "PUBLIC"
    ],
    "preconditions": [],
    "postconditions": [],
    "guideTarget": "auth-login-submit-btn",
    "implementationStatus": "VERIFIED",
    "conditions": [
      "Unauthenticated → Redirect to Login with return_to",
      "auth.isAuthenticated == false"
    ],
    "resumeIntent": "RESUME_AFTER_AUTH",
    "returnTarget": "inquiry_modal",
    "originNode": "pep_ch10_your_move",
    "continuationTarget": "inquiry_modal",
    "recoveryTarget": null,
    "quality": "DOMAIN_DECISION"
  },
  {
    "id": "edge_gate_auth_to_inquiry_modal",
    "source": "gate_auth",
    "target": "inquiry_modal",
    "type": "SUCCESS",
    "label": "Authorized Session → Open Inquiry Form",
    "branchKey": "AUTHORIZED_INQUIRY",
    "predicate": {
      "field": "auth.isAuthenticated",
      "operator": "==",
      "value": true,
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "auth.isAuthenticated == true",
      "auth.token.valid == true"
    ],
    "roles": [
      "seeker"
    ],
    "visibility": [
      "AUTHENTICATED"
    ],
    "postconditions": [],
    "guideTarget": "send-inquiry-modal-btn",
    "implementationStatus": "VERIFIED",
    "conditions": [
      "Authorized Session → Open Inquiry Form",
      "auth.isAuthenticated == true"
    ],
    "continuationTarget": "inquiry_modal",
    "recoveryTarget": null,
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "edge_gate_auth_to_booking_modal",
    "source": "gate_auth",
    "target": "booking_modal",
    "type": "SUCCESS",
    "label": "Authorized Session → Open Viewing Calendar",
    "branchKey": "AUTHORIZED_BOOKING",
    "predicate": {
      "field": "auth.isAuthenticated",
      "operator": "==",
      "value": true,
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "auth.isAuthenticated == true",
      "auth.token.valid == true"
    ],
    "roles": [
      "seeker"
    ],
    "visibility": [
      "AUTHENTICATED"
    ],
    "postconditions": [],
    "guideTarget": "schedule-viewing-time-slots",
    "implementationStatus": "VERIFIED",
    "conditions": [
      "Authorized Session → Open Viewing Calendar",
      "auth.isAuthenticated == true"
    ],
    "continuationTarget": "booking_modal",
    "recoveryTarget": null,
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "edge_login_to_inquiry_modal",
    "source": "login",
    "target": "inquiry_modal",
    "type": "SUCCESS",
    "label": "Auth Success → Return to Intended Inquiry",
    "branchKey": "BRANCH_LOGIN_TO_INQUIRY_MODAL",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "SUCCESS",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [],
    "roles": [
      "seeker"
    ],
    "visibility": [
      "AUTHENTICATED"
    ],
    "postconditions": [],
    "guideTarget": "send-inquiry-modal-btn",
    "implementationStatus": "VERIFIED",
    "conditions": [
      "Auth Success → Return to Intended Inquiry",
      "status == \"SUCCESS\""
    ],
    "recoveryTarget": null,
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "edge_login_to_booking_modal",
    "source": "login",
    "target": "booking_modal",
    "type": "SUCCESS",
    "label": "Auth Success → Return to Intended Booking",
    "branchKey": "BRANCH_LOGIN_TO_BOOKING_MODAL",
    "predicate": {
      "field": "status",
      "operator": "==",
      "value": "SUCCESS",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [],
    "roles": [
      "seeker"
    ],
    "visibility": [
      "AUTHENTICATED"
    ],
    "postconditions": [],
    "guideTarget": "schedule-viewing-time-slots",
    "implementationStatus": "VERIFIED",
    "conditions": [
      "Auth Success → Return to Intended Booking",
      "status == \"SUCCESS\""
    ],
    "recoveryTarget": null,
    "quality": "GENERIC_NAVIGATION"
  },
  {
    "id": "e_comp_return_brief_owner_to_deal_room",
    "source": "comp_return_brief_owner",
    "target": "deal_room",
    "type": "ACTION",
    "label": "Open Lead in Deal Room",
    "action": "open_deal_room",
    "branchKey": "OPEN_DEAL_ROOM",
    "predicate": {
      "field": "lead.hasActiveInquiry",
      "operator": "==",
      "value": true,
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "lead.hasActiveInquiry == true"
    ],
    "postconditions": [
      "workflow.currentWorkspace = \"DEAL_ROOM\""
    ],
    "conditions": [
      "Open Lead in Deal Room",
      "lead.hasActiveInquiry == true"
    ],
    "stateTransition": {
      "fromState": "SUBMITTED",
      "toState": "OPEN"
    },
    "evidence": [
      {
        "kind": "COMPONENT",
        "provenance": "src/components/dashboard/panels/OwnerWorkspace.js",
        "path": "src/components/dashboard/panels/OwnerWorkspace.js",
        "symbol": "OwnerWorkspace",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "quality": "GENERIC_NAVIGATION",
    "stateMachineId": "deal.lifecycle"
  },
  {
    "id": "e_dashboard_broker_to_brokers_roster",
    "source": "dashboard_broker",
    "target": "brokers_roster",
    "type": "NAVIGATE",
    "label": "View Verified Broker Directory",
    "action": "navigate_roster",
    "branchKey": "VIEW_DIRECTORY",
    "predicate": {
      "field": "broker.isVerified",
      "operator": "==",
      "value": true,
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "broker.isVerified == true"
    ],
    "postconditions": [
      "workflow.currentView = \"ROSTER_DIRECTORY\""
    ],
    "conditions": [
      "View Verified Broker Directory",
      "broker.isVerified == true"
    ],
    "evidence": [
      {
        "kind": "COMPONENT",
        "provenance": "src/components/dashboard/BrokerMode.js",
        "path": "src/components/dashboard/BrokerMode.js",
        "symbol": "BrokerMode",
        "confidence": 1,
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43"
      }
    ],
    "quality": "DOMAIN_DECISION"
  },
  {
    "id": "e_gate_auth_to_login_booking",
    "source": "gate_auth",
    "target": "login",
    "type": "AUTH_GATE",
    "label": "Unauthenticated Booking → Sign In",
    "branchKey": "UNAUTHENTICATED_BOOKING",
    "predicate": {
      "field": "auth.isAuthenticated",
      "operator": "==",
      "value": false,
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "auth.isAuthenticated == false",
      "intent == \"SCHEDULE_VIEWING\""
    ],
    "postconditions": [
      "workflow.returnTarget = \"booking_modal\""
    ],
    "conditions": [
      "Unauthenticated Booking → Sign In",
      "auth.isAuthenticated == false"
    ],
    "resumeIntent": "RESUME_BOOKING",
    "returnTarget": "booking_modal",
    "originNode": "pep_ch10_your_move",
    "continuationTarget": "booking_modal",
    "quality": "DOMAIN_DECISION"
  },
  {
    "id": "e_gate_auth_to_login_offer",
    "source": "gate_auth",
    "target": "login",
    "type": "AUTH_GATE",
    "label": "Unauthenticated Offer → Sign In",
    "branchKey": "UNAUTHENTICATED_OFFER",
    "predicate": {
      "field": "auth.isAuthenticated",
      "operator": "==",
      "value": false,
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "auth.isAuthenticated == false",
      "intent == \"SUBMIT_OFFER\""
    ],
    "postconditions": [
      "workflow.returnTarget = \"offer_modal\""
    ],
    "conditions": [
      "Unauthenticated Offer → Sign In",
      "auth.isAuthenticated == false"
    ],
    "resumeIntent": "RESUME_OFFER",
    "returnTarget": "offer_modal",
    "originNode": "deal_room",
    "continuationTarget": "offer_modal",
    "quality": "DOMAIN_DECISION"
  },
  {
    "id": "e_deal_room_to_offer_modal_direct",
    "source": "deal_room",
    "target": "offer_modal",
    "type": "ACTION",
    "label": "Propose Deal Terms & Counter-Offer",
    "trigger": "click_propose_terms",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "PUBLIC",
      "AUTHENTICATED",
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "quality": "GENERIC_NAVIGATION",
    "predicate": {
      "field": "navigation.action",
      "operator": "==",
      "value": "open_offer_modal",
      "quality": "GENERIC_NAVIGATION"
    },
    "preconditions": [
      "Deal Room session is active"
    ],
    "postconditions": [
      "Offer proposal modal opened"
    ],
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/components/dashboard/crm/DealRoom.js",
        "symbol": "DealRoom",
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43",
        "confidence": 0.95,
        "provenance": "DealRoom negotiation panel action"
      }
    ]
  },
  {
    "id": "e_offer_modal_to_deal_room_submit",
    "source": "offer_modal",
    "target": "deal_room",
    "type": "SUBMIT",
    "label": "Submit Proposal to Deal Room",
    "trigger": "submit_proposal",
    "roles": [
      "visitor",
      "seeker",
      "owner",
      "broker"
    ],
    "visibility": [
      "PUBLIC",
      "AUTHENTICATED",
      "SEEKER",
      "OWNER",
      "BROKER"
    ],
    "mutationApi": "/api/deals",
    "idempotent": true,
    "quality": "DOMAIN_DECISION",
    "stateMachineId": "offer.lifecycle",
    "stateTransition": {
      "fromState": "PENDING",
      "toState": "ACCEPTED"
    },
    "predicate": {
      "field": "deal.status",
      "operator": "in",
      "value": [
        "pending",
        "accepted",
        "countered"
      ],
      "quality": "DOMAIN_DECISION"
    },
    "preconditions": [
      "Valid proposal terms provided"
    ],
    "postconditions": [
      "Proposal recorded in Deal Room audit stream"
    ],
    "implementationStatus": "VERIFIED",
    "evidence": [
      {
        "kind": "CODE",
        "path": "src/components/dashboard/crm/DealRoom.js",
        "symbol": "DealRoom",
        "commitSha": "cda10372d983a2cf9bb5f3a04274364fcb1a5d43",
        "confidence": 0.95,
        "provenance": "Proposal submission and update in DealRoom"
      }
    ]
  }
];
