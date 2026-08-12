---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: parked
tags: [future, phases, experience-registry, space-graph, spatial-commerce]
updated: 2026-08-08
related: ["[[00_START_HERE]]", "[[01_NOW]]", "[[02_YOURS]]"]
---

# 03 · LATER — future development, by phase

> **Nothing here is a requirement.** From the 08 Aug session record:
> *"The future ideas can wait. They are not requirements. They are evidence that
> ScoutIt has a very large ceiling."*
>
> **Nothing in this file starts until [[01_NOW]] Gate B is finished** and real
> people have been through the product — because the last clause of the operating
> sequence is **"build what proves useful,"** and useful is a thing users tell
> you, not a thing you decide in advance.

---

## The filter

Before anything here gets promoted into 01_NOW, it must strengthen one of four
layers. If it strengthens none, it is feature creep or a separate business.

```
SPACE GRAPH        what exists, what contains what, what connects to what
INTELLIGENCE       what is known about it, and how well it is known
EXPERIENCE         how a person comes to understand it
CONNECTION         what they can do about it
```

## Why the filter is those four things

ScoutIt did not jump from real estate into unrelated categories. **Each
expansion was forced by a limitation in the previous layer**, which is why the
future ideas below hang together instead of reading as scope creep:

```
Ultimate real-estate SEO
  ↓ needed better pages than competitors
Property experience pages
  ↓ a property cannot be understood without its building, neighbourhood,
    commute, lifestyle, businesses and people
Space Intelligence
  ↓ those same primitives apply to restaurants, venues, offices, hotels,
    STRs, homes
Spatial commerce
  ↓ once people explore spaces they want to visit, rent, buy, book, ask,
    hire, connect
Space OS
  ↓ once owners, brokers and enterprises participate you need identity,
    permissions, verification, operations, inventory, workflows
Intelligence experiences
  ↓ the information can become interactive research and storytelling
Spatial social / commercial graph
```

**And the primitive underneath all of it is `Space`** — carrying identity,
location, geometry, ownership, occupants, businesses, objects, services, media,
history, intelligence, relationships, transactions, experiences and reputation.

A condo is a Space. An office is a Space. A restaurant, a wedding venue, a hotel
room, a bedroom. A building is a Space containing Spaces; a development contains
buildings; a neighbourhood connects many.

ScoutIt is trying to answer, for any of them: *what is here · what is it like ·
who is connected to it · what happened here · what can I do here · can I trust
the information · can I interact with it.*

> **That is the actual filter.** If a future idea does not make one of those
> seven questions easier to answer, it is feature creep or a separate business —
> however good it is.

---

# ⚠️ STANDING RULES — things already right, that must not be lost

Everything else in this file is *"what to build."* This section is **"what not to
break."** It exists because the 08 Aug audit found four things ScoutIt already
does well — and a strength nobody wrote down is a strength that gets refactored
away by someone who did not know it was deliberate.

### SR1 · One engine, many spatial languages — never fork the page
The property experience already changes its **chapter language by category**,
not just its labels:

| category | chapters |
|---|---|
| Residential | The Space · Life Here · Build Plans · Units |
| Commercial | Floor Plate · Access · The Workday · Fit-Out · Floors |
| Restaurant | The Vibe · Kitchen & Dining · Around the Table · Engine Room |
| Venue | Atmosphere · Capacity · Guest Logistics · Back of House · Space Segments |
| Hospitality / STR | operational framing |

Underneath it, the **Deep Intel schema itself is category-aware** — commercial
gets CAMS, escalation, floor loads, NOI, vacancy; STR gets ADR, occupancy,
seasonality, turnover; restaurants get kitchen-to-dining ratio, grease trap,
extraction, foot traffic, liquor status; venues get rigging, sound isolation,
curfew, truck access; hospitality gets RevPAR, GOPPAR, FF&E, MICE, PMS.

> **The rule: `Space Category → Relevant Intelligence Model`, driven by
> configuration and adapters. Never by a separate giant page implementation per
> vertical.**

The moment someone forks `CommercialFlow` into `RestaurantFlow` to "just get
this one shipped", ScoutIt has five codebases and the next category costs as
much as the first. This is the same rule as the Experience Registry (Phase 1),
applied to property chapters — and it is already being followed. Keep it.

### SR2 · Compute relationships, do not store them
`overpassIntel.js` computes the nearest transit node with a real haversine
distance against live Overpass data, rather than reading a hardcoded
`nearest_mrt = 8 minutes` field.

That is the right instinct and it should spread: **given this exact coordinate
and the transit graph, what is presently the most relevant node?** A stored
number is wrong the day a station opens; a computed one is never stale.

- **Future:** make it **departure-time-sensitive.** "8 minutes to the MRT" means
  something different at 07:30 than at 22:00, and Manila is a city where that
  gap is the whole decision. This is the single highest-value upgrade to the
  commute layer, and it feeds the Decision-category article
  (§2.3 #4) directly.

### SR3 · The obvious facts stay obvious
Pool, gym, 24/7 security, CCTV, backup power, elevator, covered parking,
concierge. The record already knows them; the experience currently ranks them
below far more experimental intelligence.

> **Intelligence should augment the basics, not bury them.** A first-time seeker
> is not looking for HOA reserve health before they know whether there is
> parking. Sophistication that costs a user the obvious answer is not
> sophistication.

### SR4 · Child spaces generalise beyond "units"
The parent→child model already works for far more than condominium inventory:

```
Building     → units, floors, amenities, common areas, parking
Hotel        → rooms, suites, facilities
Restaurant   → dining zones, private rooms, tables, patio, kitchen
Venue        → halls, segments, backstage, VIP areas
Office tower → floors, suites
Mall         → retail spaces
```

Public labels stay category-natural (Units · Available Spaces · Rooms &
Facilities · Areas · Zones). **The generic model is the asset — do not narrow it
back to "units" when a new category arrives.**

---

# PHASE 1 · The Experience Framework
**Trigger:** starting the third interactive article, or the first time an
article's creative code touches the shared renderer.

> ⚠️ **I placed this in LATER; the session record places it in NOW.** Its
> decisions table lists *"Experience Framework v1"* under **NOW**, alongside
> stabilisation. I disagree on sequencing only — §45 also says the framework
> *"prevents future creativity from damaging the core"*, and there is nothing to
> damage until interactive articles exist. Building a registry before the first
> article is designing an abstraction with no instances.
>
> **Your call.** If you want it in NOW, move it — but do 01_NOW Gate A first
> either way; that is ~2 hours and it is actively costing you index quality.
>
> **The one part worth adopting immediately, at zero cost:** when the first real
> briefings get written (01_NOW B-series / N6), build their interactive bits as
> **config, not bespoke code.** The discipline is free. The infrastructure is not.

### 1.1 · The rule
> **Articles must not own their creative code.** An article declares which
> experience it wants; a registry owns the implementation.

```
Creative Experience + Logic + Dataset = Article Experience
```
One Situation Simulator serves BGC, then Makati, then Ortigas, Cebu, Cubao —
by changing the dataset, not the frontend.

### 1.2 · Registry structure
```
/intelligence
  /components    ArticleRenderer · EvidencePanel · PropertyResults · Sources
  /experiences
    /stable      commute · comparison · scrollytelling · map · timeline
    /experimental
  /articles      config only
```
An article is configuration — `{ type: "experience", experience: "commute-simulator" }`
— never an implementation.

### 1.3 · Experimental vs stable
A new idea starts as a one-off (`experimental/bgc-nightlife-orbit`). If nobody
cares it disappears harmlessly. If it lands, the general parts are extracted and
promoted (`urban-activity-orbit`). **Experiment first, generalise after value is
proven** — the same discipline as the operating sequence.

### 1.4 · Experience contracts — the part that matters soonest
Fixed inputs (`articleId`, `location`, `entities`, `dataset`, `sources`, `theme`,
`config`). Required states (loading, main, fallback, error, mobile,
accessibility). And a hard list of what an experience may **never** touch:
routing, auth, database schema, global styles, the core renderer, other
experiences.

> **This is a containment boundary for AI-generated technical debt.** An agent
> can be told: *"modify only this experience folder."* Worth knowing now — the
> `<style>` freeze in §65 happened because a shared header could reach two
> commercial pages with nothing stopping it.

### 1.5 · Error isolation
Every experience gets its own error boundary. A failed WebGL scene degrades to
*"Interactive experience unavailable — read the analysis instead →"* while the
article, sources, property recommendations and SEO survive.

---

# PHASE 2 · Intelligence as a product layer
**Trigger:** after 3–5 plain editorial briefings prove people read them
([[01_NOW]] Gate B), and after non-branded queries have a baseline (A6).
**Depends on:** Phase 1.

- **2.1 Interactive articles.** Editorial + RAG + OSINT + ScoutIt data + maps +
  comparisons + scrollytelling + timelines + cost calculators + commute analysis
  + scenario tools + Ask-ScoutIt Q&A + evidence drawers.
  *"Is BGC Still Worth Renting In 2026?"* — adjust budget, enter your work
  location, compare with Makati, inspect matching spaces, reveal the evidence
  behind a claim, ask the article a question.
- **2.2 The quality bar.** *Ten excellent interactive pieces beat a thousand
  generic SEO articles.* **ScoutIt must not become an AI article factory** —
  that is the failure mode this whole phase exists to avoid. Every piece needs
  original analysis, ScoutIt data, useful interaction and sourced evidence, or
  it is just content.

---

## 2.3 · THE ARTICLE SEED BANK

Every article idea generated in the 08 Aug session, with what each one actually
needs. **These are seeds, not a schedule.** The point of writing them down is
that the first three or four should be chosen from evidence — what people asked
about during human testing (01_NOW B10) — not from this list.

> ⚠️ **The first briefings should be plain editorial, no interactivity** (see
> 01_NOW N6). Prove the writing is worth reading before building a machine to
> render it. These become interactive in Phase 2 proper.

### The eight intelligence categories, with their seed questions

| # | category | seed question | needs | experience |
|---|---|---|---|---|
| 1 | **Place** | *"Where should a night-shift employee live in Metro Manila?"* | transit at night, safety signals, 24h services, rent by district | map + scenario |
| 2 | **Building** | *"What actually makes a Grade A office building Grade A?"* | commercial Deep Intel — floor plate, loads, MEP, lifts, CAMS | explainer + comparison |
| 3 | **Neighbourhood** | *"What changes when you move from Cubao to BGC?"* | rent, commute, F&B density, lifestyle, cost of living | comparison + scrollytelling |
| 4 | **Decision** | *"₱35,000 condo near work vs a cheaper home with a long commute."* | rent, commute time, transport cost, hours lost | **cost sandbox + commute simulator** |
| 5 | **Owner** | *"Why is your unit receiving inquiries but not converting?"* | ScoutIt's own funnel data, dossier completeness | dashboard-linked analysis |
| 6 | **Space Design** | *"How much usable space is lost because of this floor-plan shape?"* | floor plans, room dimensions, circulation | floor-plan explorer |
| 7 | **Market** | *"What is changing around this district?"* | development pipeline, permits, transactions | timeline + map |
| 8 | **Explainer** | *"PEZA buildings explained without corporate jargon."* | zoning, incentives, eligibility | plain editorial |

### The two worked examples from the session

**A · *"Is BGC Still Worth Renting In 2026?"*** — the flagship pattern.
The reader can: change their budget · enter their work location · compare BGC
with Makati · choose car vs commute · browse matching ScoutIt spaces · open the
evidence behind any claim · ask the article a question.
> This is the shape: **Editorial + Research + Interactive Tool + Property
> Discovery** in one page. It is also the article most likely to rank for a real
> non-branded query.

**B · *"A Saturday Night in Poblacion: Six Ways to Spend ₱3,000."*** — the
commercial pattern. The route and recommendations change with the mode the
reader picks: **date night · friends · quiet evening · food crawl · live music.**
Restaurants and venues appear naturally inside the experience.
> ⚠️ This one is also the **first test of the editorial/commercial boundary**
> (Phase 6.1). Businesses may pay to participate; payment must never buy the
> recommendation. Decide the rule before writing it, not after.

**C · The AI research brief** — *"Explain whether Cubao is becoming a viable
alternative to Makati for young professionals."* Used in the session to show how
RAG/OSINT could **choose** experiences: geographic → map, historical change →
timeline, competing districts → comparison, commute-dependent → simulator,
narrative transformation → scrollytelling, matching inventory → property
explorer. See Phase 7.2.

### The experience vocabulary these draw from

Every article is assembled from blocks, never bespoke code (Phase 1):

```
Hero · Editorial · Image · Quote · Sources · Property cards
Interactive Map · Scrollytelling · 3D Experience · Scenario Simulator
Comparison · Timeline · Commute Explorer · Affordability Calculator · Ask ScoutIt
```

Other formats named in the session, unbuilt: situational-awareness simulations ·
map stories · neighbourhood experiences · before/after · floor-plan explorers ·
market visualisations.

### The dataset list — the same experience, moved

The reason for the `Experience + Logic + Dataset` split is that one build serves
many places. Named in the session:

**BGC · Makati CBD · Ortigas · Cebu IT Park · Cubao · Poblacion · Boracay**

> A BGC situation simulator becomes a Makati one by changing the dataset and
> configuration. **That is the whole argument for Phase 1** — the second article
> in a format should cost a fraction of the first.

### How to choose the first ones

1. **Write 3–5 plain briefings first** (01_NOW). No interactivity.
2. **Pick the interactive one from evidence** — whichever question real users
   actually asked during B10, or whichever plain briefing got read.
3. **Build it as config** even if the registry does not exist yet.
4. Only after two articles want the *same* block does that block get extracted
   into the stable registry.

---

# PHASE 3 · Space graph maturity
**Trigger:** a listing needs a **third level** (business inside a unit inside a
building), or a space needs to be **two things at once** (a venue that is also a
restaurant), or **relationships between spaces start carrying value** —
adjacency, foot traffic, catchment. That last one is the real signal: it is the
point where the graph *is* the product rather than the storage.

- **3.1 Universe becomes the relational graph.** Today it repeats architect,
  developer, verdict, history. It should hold what a space is **connected to**:
  the development, sibling spaces, nearby places, relevant Intel, authorised
  brokers, photographers, permits, transaction events, comparable towers. Every
  other chapter explains a space **vertically**; Universe explains it
  **laterally.**
- **3.2 Mother-property aggregation.** *"47 child spaces mapped · 31
  owner-managed · 12 operator-managed · 4 available · 82% spatial documentation
  complete."* Turns a property page from *a page containing units* into a live
  view of everything happening inside a building — the clearest step toward
  "operating system for physical spaces."
- **3.3 Scoped permissions over the tree.**
  > **Actor X may perform Actions Y on Space Z, and optionally its descendants.**

  Coworking operator manages floors 8–11 · restaurant tenant manages the ground
  floor · broker represents one unit · photographer uploads media but cannot
  touch pricing · property manager updates availability only. **No ownership
  transfer; inheritance for free.** Same model Enterprise Mission Control needs.
- **3.4 `Space` / `Space Node` as the internal primitive**, with public labels
  staying natural: Units (residential) · Available Spaces (commercial) · Rooms &
  Facilities (hotel) · Areas (venue) · Zones (restaurant). *The frontend should
  never make a user speak database.*
- **3.5 Which children deserve a master page** — and how child information rolls
  **upward** into the parent's intelligence. This is the genuinely unusual
  question the session record ended on.

---

# PHASE 4 · Provenance and the trust layer
**Trigger:** when RAG/OSINT starts producing facts at volume — **not after.**
Provenance cannot be retrofitted; you cannot recover where a fact came from
after the fact.

> ⚠️ The **field shape** should land early even if the badges stay simple.
> Deferring the schema is the expensive half.

- **4.1 Per-field provenance.** `Mock` · `Imported` · `Unverified` ·
  `Owner Reported` · `Verified (ScoutIt)` · `Measured` · `Public Source` ·
  `OSINT Derived` · `ScoutIt Analysis` · `Estimated`, plus `source`,
  `verified_by`, `checked_at`, `confidence`, `methodology`.

  > ⚠️ **`Mock` and `Imported` are in this list on purpose, and they are the two
  > that matter *today*.** [[01_NOW]] B5 is labelling mock records this week and
  > the CSV importer produces the other. If B5 invents its own badge vocabulary,
  > Phase 4 inherits a second one and every existing record needs migrating.
  > **Same enum, from the first badge.**

  These are not the same claim, and they must not render identically:
  | | |
  |---|---|
  | Owner reported | *"Quiet at night"* |
  | ScoutIt measured | *45 dB average, 8–10 PM* |
  | OSINT-derived | *reported neighbourhood incidents* |
  | ScoutIt analysis | *"suitable for families seeking lower ambient noise"* |

  Same for a price: `₱45,000/mo · Owner verified · Aug 6 2026` vs `· Public
  source, checked 3 days ago` vs `· Unverified lead`.
- **4.2 Fine Print is allowed to disagree with the listing.**
  ⚠ *Association dues rising faster than district median* · ⚠ *Western exposure
  produces significant afternoon heat load* · ✓ *Building reserve fund appears
  healthy on latest available record.*

  > **If every Fine Print says the property is amazing, users learn it is still
  > marketing.** A platform that publishes negative findings about its own
  > listings is visibly not selling placement — which is the strongest possible
  > answer to the ranking question.
- **4.3 Natural vs Enhanced imagery** as a rule, not a feature. Matters
  enormously once owners upload AI-enhanced photography.

---

# PHASE 5 · Property-experience depth
**Trigger:** after real users tell you which chapters they actually read.
Low risk, low urgency — polish on an already-good structure.

- **5.1 Vault as the honest paywall.** Understanding a property stays free; the
  spatial evidence (Matterport, 360, Luma, floor plans, blueprints, scans, heat
  maps) is premium. Far healthier than hiding ordinary listing facts — and it
  drives a flywheel: *missing asset → hire a ScoutIt professional → asset created
  → Vault richer → property more valuable.*
- **5.2 Category-aware service routing.** `Pre-Design Concept → Event Planners`
  on a residential condo is a mismatch. Residential → interior designer,
  architect, inspector, photographer, broker. Venue → planner, AV, catering.
  Restaurant → F&B designer, kitchen consultant. Commercial → fit-out, workplace
  design, research.
- **5.3 Chapter naming.** *"Build Plans"* reads as land development; for a condo
  the real question is *"What can I change?"* — renovation limits, balcony
  enclosure, movable walls, building rules.
- **5.4 Location vs Where To?** — split the jobs hard. **Location** = how the
  space sits in the city (access, traffic, transit, flood, zoning, commute).
  **Where To?** = what you can actually do around it (eat, shop, work, exercise,
  healthcare, errands). Otherwise they are two versions of "the map."
- **5.5 Progressive disclosure.** Eleven chapters is cognitively heavy. Less
  visible at once, not less depth.
- **5.6 Surface the obvious facts.** Pool, gym, security, CCTV, backup power,
  elevator, parking, concierge sit below far more experimental intelligence.
  **Intelligence should augment the basics, not bury them.**
- **5.7 Cost sandbox as a reusable primitive** with category adapters.
  Residential: price, down payment, financing, dues, tax, insurance, parking,
  utilities. Commercial: rent + CAMS + AC + parking + fit-out + escalation.
  Restaurant: rent + dues + utilities + labour + fit-out. Reframes *"can I afford
  ₱68M"* into **"what is my ownership envelope."**

---

# PHASE 6 · Commerce and social expansion
**Trigger:** after the North Star (200 real listings) and after subscriptions
prove out. This is the revenue ceiling, not the revenue floor.

- **6.1 Business participation.** Restaurants, venues, hospitality paying for
  verified profiles, rich media, menu/inventory sync, offers, events, virtual
  tours, booking integration.
  > ⚠️ **Payment must never purchase ScoutIt's independent opinion or
  > intelligence ranking.** Commercial participation and editorial intelligence
  > need a visible separation — the same rule as Your Move's two layers.
- **6.2 Personal Spaces — ScoutIt for homes nobody is selling.**
  *"Von's Room · 12 sqm · Quezon City · work + gaming setup"*, shared as
  `scoutit.space/space/my-room` rather than posted as photos.

  A visitor can: tour it virtually · toggle day/night · toggle before/after ·
  inspect furniture and design choices · read why a decision was made · see what
  equipment or products are used · explore the building and neighbourhood · ask
  a question about any object.

  ScoutIt Intelligence can generate what a photo cannot: **space efficiency ·
  circulation analysis · furniture-placement insight · layout read · design
  decisions · room history · the transformation story.**

  > This is the moment ScoutIt stops needing a transaction to be interesting.
  > A 12 sqm bedroom is a Space with the same primitives as a tower — and it is
  > the cheapest possible way to test whether the Space model actually
  > generalises.

- **6.3 Connects as a permission unit, not a message credit.**
  Touring a space produces questions a listing site has no answer for: *where did
  you buy this · who built this cabinet · who designed this kitchen · who did
  your renovation · what paint is that · how much did it cost · can I hire your
  photographer · is your contractor available.*

  **"Ask about this"** attaches to an object, room, renovation, service, business
  or whole space, and ScoutIt attaches the context automatically:

  ```
  Regarding:  Custom Oak TV Cabinet
  Space:      Living Room
  Question:   Who made this and roughly how much did it cost?
  ```

  A Connect then buys an **action**, not a message: contact owner · ask about an
  object · request an introduction · request a quotation · ask a business ·
  request detail · unlock a private tour · contact a professional.

- **6.4 Referral and showcase value — why anyone would document a space.**
  *"Your space this month: 427 tours · 83 object interactions · 21 questions ·
  8 supplier inquiries · 3 people contacted your interior designer."* Eventually
  even *"your dining table generated X referrals."*

  Objects carry tags out to the rest of the graph:
  ```
  Sofa            → IKEA
  Table           → Custom woodworker
  Interior design → Studio X
  Renovation      → Contractor Y
  Photography     → Photographer Z
  Building        → ScoutIt building page
  Neighbourhood   → ScoutIt Intelligence
  ```
  Anything untagged simply offers **"Ask owner about this → 1 Connect."**

  > The incentive is the point: a normal user now has a reason to document their
  > space *well*, and every documented space adds objects, services and
  > relationships to the graph. **The showcase is the data-collection mechanism
  > wearing a nicer name.**

```
Flex → Discovery → Questions → Connections → Commerce
```

---

# PHASE 7 · Composition
**Trigger:** a stable Experience Library with enough entries to be worth
composing. Depends entirely on Phase 1 and Phase 2.

- **7.1 Experience Composer** inside Mission Control — editors assemble stories
  from tested blocks rather than editing page code.
- **7.2 AI-assisted composition.** RAG/OSINT suggests which approved experiences
  fit a brief: geographic → map, historical → timeline, competing districts →
  comparison, commute-dependent → simulator.

  > The boundary to protect: **AI composing ScoutIt from approved capabilities,
  > not AI generating arbitrary frontend code.** It should not gain permission to
  > rewrite the frontend every time a new article idea appears.

---

# PHASE 8 · Origin Story Scrollytelling Manifesto & Founding Team Showcase
**Trigger:** Post-launch brand expansion after 200 real approved listings.
**Status:** DESIGNED & PARKED (Explicitly non-blocking for pre-launch or immediate launch).

- **Cinematic 3D Scrollytelling**: 600vh Three.js continuous WebGL track flying a scroll-scrubbed camera from Big Bang $\rightarrow$ The Broken Market $\rightarrow$ ScoutIt Spatial Commerce $\rightarrow$ 6-Layer Descent $\rightarrow$ Black Hole Ignition.
- **Founding Team Showcase**: Interactive waypoint highlighting founding builders, spatial engineers, data architects, and regulatory advisors with gold avatar cards, bio overlays, and role declarations.
- **Specs**: `[[ORIGIN_STORY_SCROLLYTELLING]]`, `[[SCOUTIT_SCROLLYTELLING_PROMPT]]`, `[[scrollytelling-mission-text]]`.

---

# The principle this whole file is downstream of

> **Do not make every new creative idea part of ScoutIt's core.
> Make ScoutIt's core capable of hosting new creative ideas.**

Every successful experiment then becomes a permanent capability instead of
another source of technical debt. Every new Space adds intelligence; every child
Space adds relationships; every verified interaction strengthens the graph; every
Intelligence article becomes another entrance into it.

**But the immediate goal stays simple:** finish ScoutIt, smooth what exists, fix
the QA and live-data boundaries, and start putting real humans through it.
