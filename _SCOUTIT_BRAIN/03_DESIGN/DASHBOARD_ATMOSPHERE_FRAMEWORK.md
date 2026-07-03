# Dashboard Atmosphere Framework

**Status: APPROVED DIRECTION, NOT YET BUILT.** This is a structural + atmospheric spec for
ScoutIt's dashboards, authored by the owner (source: `2 Core Ideas.docx`, "ScoutIT Master
Dashboard Architecture Prompt", provided 2026-07-03) and captured here verbatim-in-spirit so it
survives as the ground truth for whenever dashboard design work starts. Nothing in this file has
been implemented — see §6 for the gap against the current codebase.

## 0. Why this exists

The property pages (public, brand-register surface) got a full `/impeccable` design pass this
session — see `SESSION_HANDOFF_2026-07-03.md` Part 6/7. The dashboard (owner/broker/buyer/
provider/operator tools) did not, and the owner's own assessment is that it "looks plain." This
doc is the framework that should govern that work — not a generic "make it prettier" pass, but a
structural rebuild around role identity and an AI-insight layer, per `PRODUCT.md` design
principle #4 ("dashboard is product register, not brand register — treat it as its own
surface").

## 1. Core Principle

Every dashboard must feel like a **role-specific operating environment**, not a generic admin
panel. Optimize for: intelligence presence, emotional identity, role clarity, decision
acceleration, premium luxury UX. Never a dashboard that's just a collection of cards, forms, or
listings — every dashboard must communicate *"this system understands my role and actively helps
me make better decisions."*

## 2. Mandatory Structural Framework

Every dashboard follows this layer order:

```
IDENTITY → STATUS → SCOUT INSIGHT → WORKSPACE → ROLE ATMOSPHERE
```

### Layer 1 — Identity Header
Immediately establishes role context. Must answer: *Who am I? Which mode am I in? What is my
objective?* Creates immediate psychological orientation.

| Role | Objective framing |
|---|---|
| Buyer | Discover high-fit opportunities |
| Owner | Maximize asset performance |
| Broker | Close high-confidence deals |
| Service Provider | Increase bookings and reputation |

### Layer 2 — Primary State Panel
The main KPI anchor — visually dominant, shows current role-specific health/state. **Rule: users
must understand their current status in under 3 seconds.**

| Role | Example KPIs |
|---|---|
| Buyer | Match Quality · Saved Opportunities · Active Alerts |
| Owner | Listing Health · Inquiry Rate · Market Rank |
| Broker | Pipeline Health · Hot Leads · Connect Efficiency |
| Service Provider | Booking Rate · Visibility Score · Conversion Rate |

### Layer 3 — Scout Intelligence Core (highest priority, ScoutIt's signature component)
Every dashboard MUST contain a dedicated module called **"Scout Insight"** — AI-driven
recommendations, predictions, or actionable insights, not passive data display.

Examples: *"3 new properties match your preference 92% better"* (Buyer) · *"Adding interior
photos may improve inquiry rate by 31%"* (Owner) · *"Paragon Tower has 87% close probability"*
(Broker) · *"Drone certification improves premium conversion by 24%"* (Service Provider).

**Rule: without Scout Insight, ScoutIt becomes a premium CMS instead of an intelligence
platform. This is the primary product differentiator** — treat it as non-negotiable, not a
nice-to-have widget.

### Layer 4 — Role Workspace
Role-specific operational tools — where users actually perform tasks. Prioritizes action
execution, not intelligence presentation (that's Layer 3's job).

| Role | Workspace tasks |
|---|---|
| Buyer | search · compare · shortlist |
| Owner | edit listing · manage inquiries · upload inventory |
| Broker | deal files · negotiations · lead pipeline |
| Service Provider | portfolio · profile · bookings · service offerings |

### Layer 5 — Ambient Role Atmosphere
Emotional differentiation between roles using atmosphere, **not new colors.** Same base system —
95% black, 5% gold, white typography — always. Differentiate via ambient visual systems only.

| Role | Emotion | Visual atmosphere |
|---|---|---|
| Buyer | discovery, aspiration, opportunity | soft gold glow, cinematic gradients, editorial fog |
| Owner | trust, control, stability | structural grid lines, blueprint overlays, clean geometry |
| Broker | urgency, pursuit, opportunity | signal pulses, active nodes, directional light streaks |
| Service Provider | artistry, reputation, craftsmanship | lens bloom, reflective glass, subtle light diffusion |

## 3. Global Brand Signature (mandatory, cross-role)

Two recurring visual motifs form ScoutIt's dashboard visual DNA:
- **Spatial Contour Lines** — represent land, spatial mapping, intelligence.
- **Signal Nodes** — represent connections, ecosystem activity, network intelligence.

## 4. Hard Constraints

**Do:** maintain luxury premium aesthetic · prioritize clarity and hierarchy · make intelligence
visible · preserve trust and readability · make each role feel distinct.

**Don't:** build generic SaaS dashboards · overuse decorative visuals · sacrifice usability for
atmosphere · use excessive bright accents · make all roles feel visually identical.

## 5. Final Objective

Every dashboard should feel like *a premium operating system for spatial intelligence.* Users
should feel guided, informed, empowered, strategically advantaged — not merely logged into a
dashboard.

## 6. Gap against the current codebase (as of 2026-07-03)

Role separation already exists structurally — this is a real head start, not a from-scratch
build:

- `src/components/dashboard/BuyerMode.js`, `OwnerMode.js`, `BrokerMode.js`, `ProviderMode.js`
  (+ `providers/PhotographerHUD.js`, `ResearcherHUD.js`, `DesignerHUD.js`), `OperatorMode.js`,
  `MissionControlMode.js` — one component per role, switched via `src/app/dashboard/page.js`'s
  `renderActiveMode()`.

What's **missing** against this framework, per role, as of this doc:

1. **No "Scout Insight" module anywhere.** No role's dashboard currently surfaces an AI-driven
   recommendation/prediction panel. This is the single biggest gap — per §2 Layer 3, ScoutIt
   reads as a premium CMS today, not yet an intelligence platform, specifically on the dashboard
   side (the public property pages already carry real intelligence signals — flood risk, market
   data, verification — so this gap is dashboard-specific, not platform-wide).
2. **No formalized Identity → Status → Insight → Workspace → Atmosphere layer order** in any
   mode component — each was built feature-first (Unit Delegation, Connects, notifications) and
   the resulting layout reflects build order, not this structure.
3. **No ambient role-atmosphere differentiation.** All modes currently share the same base
   dashboard chrome (`DashboardLayout.js`) with no per-role visual treatment — no blueprint
   overlays for Owner, no signal pulses for Broker, no lens bloom for Service Provider, no
   contour-line/signal-node motifs anywhere.
4. **`BrokerMode.js` has a proto-pipeline already** — `activeDealId`, a Deal File workspace, and
   `dealNotes` scratchpad notes — but `dealNotes` is local React state, **not persisted to
   Supabase.** This is the natural seam where Layer 4 (Workspace) meets the CRM initiative — see
   `08_OPERATIONS_AND_BACKLOG/CRM_INITIATIVE.md`.

## 7. Open questions before implementation starts

1. **Where does this framework live for `/impeccable` purposes?** `DESIGN.md` (repo root) is the
   locked brand-register system for the public site and is not yet updated with this
   dashboard-specific direction — deliberately, since `PRODUCT.md` principle #4 already treats
   the dashboard as a separate "product register" surface. Recommend either a dedicated
   `DASHBOARD_DESIGN.md` sidecar for impeccable, or a clearly-scoped new section in `DESIGN.md`
   — owner call, not decided here.
2. **Which role ships first?** Given `BrokerMode.js` already has the most CRM-adjacent
   infrastructure (deal files, notes) and the owner is prioritizing the CRM initiative
   alongside this, Broker is the natural first candidate for both a Scout Insight module and full
   Ambient Atmosphere treatment — not yet confirmed with the owner.
3. **Scout Insight's actual intelligence source.** The framework specifies *what* Scout Insight
   should say (match %, inquiry-rate lift, close probability, conversion lift) but not *how* those
   numbers get computed. Real analytics instrumentation is already a known prerequisite/blocker
   from a separate initiative (`PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md`, "self-serve
   analytics on hold pending real instrumentation") — Scout Insight likely inherits that same
   blocker for any metric requiring real usage data, though rule-based insights (e.g. "add
   interior photos" from a simple completeness check) don't need to wait.
