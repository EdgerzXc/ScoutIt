**The ScoutIt Unit Master Page: Comprehensive Architecture Insight**

The **Unit Master Page** (`/property/[slug]/unit/[unit-id]`) represents the evolution of ScoutIt from a standard property directory into a true **Space OS**. Instead of treating commercial suites or co-working spaces as flat rows on a spreadsheet, this architecture elevates each unit into its own fully interactive micro-listing.

By combining our recent strategic breakthroughs, here is the complete, comprehensive blueprint of what we are building to monopolize enterprise and commercial portfolios:

### 1. The 6-Chapter Executive Framework

Unlike the parent building's 10-chapter deep dive, the Unit Master Page is a high-velocity, 6-chapter single-scroll experience designed for rapid evaluation and conversion by enterprise tenants and co-working seekers:

1. **The Space:** Focuses on the physical realities of the unit (`size_sqm`, `floor`, `unit_type`, `capacity_seats`, `fit_out_status`). Crucially, this chapter houses the **"This space flexes" interactive toggle** (detailed in the Scenario Engine below).
2. **The Differentiator:** A narrative hook highlighting the unique selling propositions of this specific cut (e.g., "Corner suite with uninterrupted views").
3. **The Unit Vault (Cluster+ Gated):** A premium layer housing the AI-generated 3D interactive floor plan or bespoke spatial media. Free users see a blurred teaser.
4. **Terms & Operations:** The lease mechanics and operational rules (`operating_hours`, `lease_inclusions`, `min_term`, `deposit`, `house_rules`).
5. **The Building:** A frictionless macro-intel section. Instead of making the operator type out building data again, this chapter **automatically inherits the parent building’s macro-intelligence** (such as NOAH flood risks, transit anchors, and building grade).
6. **Your Move (The Handshake):** The transaction climax. This triggers the ephemeral chat routed directly to the delegated unit operator, not the parent building owner.

### 2. The "Subdivision Scenarios" Engine (The Data Masterstroke)

To solve the combinatorial explosion of listing a 2,000 sqm floor that can be cut in dozens of ways, the unit does not rely on creating dozens of phantom database rows.

Instead, the owner curates a finite, real set of flexible options stored in a **`subdivision_scenarios` (JSONB) array**.

- **The Buyer Experience:** In _Chapter 1: The Space_, the buyer uses an interactive toggle to switch between scenarios (e.g., "Whole Floor", "Halves", "Quarters", "Desk Clusters").
- **Dynamic Reality:** Clicking a scenario dynamically updates the size, the estimated capacity, and the 3D floor plan rendered in the Unit Vault to match that specific cut. It turns flexibility into a highly premium, interactive showcase rather than a guessing game.
- **The Fallback:** If none of the curated scenarios fit, the buyer can use a "Request Custom Cut" CTA, spending a Connect to negotiate directly with the operator.

### 3. Strict RA 9646 Compliance (The Rate Rule)

Because ScoutIt adheres strictly to the Philippine Real Estate Service Act (RA 9646), the platform acts as an intelligence layer and never a transactional broker.

- **The Guardrail:** While the buyer toggles through the Subdivision Scenarios in Chapter 1 to see different sizes and capacities, **the price/rate for those cuts is strictly hidden from Chapter 1**.
- **The Execution:** The specific rate (e.g., ₱X/mo) dynamically updates and renders **only in Chapter 6: Your Move**, alongside the mandatory "Owner-Verified" badge. This perfectly preserves the "Intelligence First. Transactions Never." legal shield.

### 4. The Connects Economy & The Unit Vault

The Unit Vault houses the 3D Interactive Blueprint. We have cleanly separated the software features from human labor to align with the Connects economy:

- **The "Do It Yourself" Path (0 Connects):** If the owner uploads a flat 2D PDF, the platform's AI automatically generates the 3D WebGL blueprint. Because AI generation is a software feature, it costs **0 Connects** and is simply absorbed as a perk of their **Cluster+** premium subscription.
- **The "Commission a Pro" Path (2 Connects):** If the owner needs a high-fidelity LiDAR scan (like Matterport or Luma AI), they click "Commission a Space Provider." Because this crosses a human boundary and requests labor from the ecosystem, it deducts exactly **2 Connects** to post the bounty to the professional network.

### 5. The Two-Level Dashboard Architecture

To allow operators to manage this massive amount of data without overwhelming the UI, the Owner/Operator Dashboard utilizes a two-level design:

- **Level 1 (The Bulk Grid):** The existing `InventoryGridManager.js` remains a lightweight, rapid-fire spreadsheet grid used for bulk actions (duplicating units, toggling availability, or permanently "materializing" a scenario into a real, separate child unit row).
- **Level 2 (The Drill-in Editor):** Clicking a specific unit opens a deep, dedicated Unit Master Page editor (mirroring the main property `LiveEditorWorkspace`). Here, the operator fills in the rich narrative fields, configures the lease terms, uploads the 2D floor plans, and curates their `subdivision_scenarios`.
- **Capacity Guardrails:** The editor will auto-estimate capacity (e.g., ~5 sqm per desk) to save time, but **the owner must manually override or confirm it**. ScoutIt enforces an "Honest blank" rule: the system will never auto-publish an AI-guessed capacity to the public page. If the owner doesn't confirm it, it remains blank.

By combining these components, the Unit Master Page gives enterprise developers and co-working operators an unprecedented, multi-million-dollar architectural showcase for every cut of their building, while keeping ScoutIt's database lean, legally compliant, and highly profitable.