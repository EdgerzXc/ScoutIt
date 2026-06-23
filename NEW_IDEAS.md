# ScoutIt — New Feature Ideas

## 1. Hidden Resident Intel (Members Only)
Community voice from actual residents — what's the building management really like, is it noisy, does the landlord fix things, real neighborhood experience. This should live inside ScoutIt as gated/premium content for registered members, not public-facing. Separate from the broker/researcher/photographer supply side — this is the demand side speaking.

**Placement:** Intel section, hidden behind member login. Could surface as a "Resident Report" on each property or area page.
**Constraint/Status:** On hold. Too early for phase 1. Implementing this now risks creating conflict with owners/landlords whose buy-in we need right now. Keep in backlog for later maturity phases.

---

## 2. Post-Move Layer (ScoutIt Feature)
Once a user signs and moves in, ScoutIt's job doesn't end — that's when stress starts. This layer covers:
- Movers / moving services in the area
- Utility setup (electricity, water, internet providers available in that building/area)
- Local services nearby (laundry, groceries, clinics, etc.)
- Move-in checklist

**Placement:** Could be a new Layer or a dashboard feature unlocked after a user marks a property as "moved in." Connects naturally to the existing service ecosystem (Crust layer).

---

## 3. Financial Affordability Layer (Needs Legal Review First)
Show users the real monthly cost of a property — not just rent but HOA, estimated utilities, commute cost, area cost of living. Requires review against RESA and financial advisory regulations before building. Need to consult on compliance before touching this.

**Status:** On hold — check Philippine real estate law and financial advisory regulations first.

---

## Notes
- Cannot touch transaction/negotiation layer — RESA compliance (Real Estate Service Act of the Philippines)
- Financial computation possible only with proper legal clearance and disclaimers

---

## 4. The AI Assimilation "Blueprint Rule" (Cost-Saving Architecture)
When handling bulk CSV/Excel uploads via the Global Portfolio Importer, we cannot send thousands of rows to the AI directly (e.g. Gemini/OpenAI) as this will immediately burn through API token limits and budget.
**The Proposed Solution:**
- Use PapaParse to extract the raw JSON locally in the browser.
- Slice off only the **Headers (Row 0)** and the **First 3 Rows of Data**.
- Send *only* those 4 rows to the LLM (Council AI) to establish a "Mapping Blueprint" (e.g. `{"Sz (sqm)": "floor_sqm"}`).
- Disconnect from the AI and use local, free Javascript to loop through the remaining thousands of rows using that blueprint.
This ensures an upload of 10,000 properties costs the same exact amount of tokens as an upload of 3 properties.

---

## 5. Gamified Badge Ecosystem (Supabase Implementation)
ScoutIt uses a "Pokémon-style" gamified badge system to drive obsessive completionist loops and FOMO. Badges grant massive discounts and unlock secret capabilities.

**The Gamification Mechanics:**
- **Visual Rarity:** Badges are styled with different visual tiers (e.g., Common Glass, Epic Glowing Persona Colors, Legendary Holographic Gold).
- **The Pokedex (Locked Silhouettes):** In the Vault of Honors (`/badges`), active badges the user doesn't own render as dark, blurred silhouettes with padlock icons and hidden requirements to tease the user.
- **The Graveyard:** Sold-out/limited cohort badges permanently turn to stone (grayscale with noise overlay) and display a red "YOU MISSED THIS" tag to drive extreme FOMO for the next drop.

**Supabase Implementation Checklist (Handoff):**
- [ ] Add a `badges` JSONB array to the Supabase `users` table.
- [ ] Update `BadgeEngine.js` to fetch `claimed` amounts directly from a Supabase real-time count.
- [ ] Create an API endpoint (`/api/badges/claim`) that securely mints a badge to a user in Supabase (checking `max_slots` to ensure cohorts don't over-mint).
- [ ] Ensure Stripe Checkout reads the user's Supabase badges on the backend to apply discounts, so users cannot fake badges locally.

---

## 6. Multi-LLM Parsing Pipeline (Gemini → Claude)
- **Concept:** Use a chained multi-AI approach for complex data extraction.
- **Workflow:** 
  1. Use **Gemini** for the initial fast, cheap extraction or visual OCR parsing of raw inputs (like PDFs, images, or massive CSV samples).
  2. Take Gemini's structured output and pass it into a programmatic parsing step.
  3. Send the refined payload to **Claude** (Anthropic) for high-reasoning tasks, such as generating the final compelling property description, synthesizing the "vibe" of the neighborhood, or making nuanced real estate assessments.
- **Benefit:** Combines Gemini's speed/cost with Claude's superior linguistic and reasoning capabilities.

---

## 7. QuestIT Standalone Protocol (Bounty API Infrastructure)
- **Concept:** QuestIT is decoupled from ScoutIt and acts as a standalone "Bounty-as-a-Service" API for the gig economy.
- **Workflow:** Any business (not just ScoutIt) can hit the `api.questit.network/bounties/create` endpoint to summon local freelancers (photographers, inspectors, movers).
- **Guilds on QuestIT:** Instead of a single company account, companies (like Re/Max or Lalamove) register as "Guilds" on QuestIT. Individual humans join these Guilds. When a bounty is posted, it routes to the appropriate Guild, and an accountable human claims it.
- **ScoutIt Integration:** ScoutIt simply acts as the first client of the QuestIT API. Users log into ScoutIt using their QuestIT identity.
