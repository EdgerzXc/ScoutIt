# ScoutIt User Flows & Psychological Journey

This document outlines how users move through the ScoutIt platform. AI agents must read this to understand how components link together and how UI state is managed.

---

## FLOW A: The Buyer / Public User Journey

1. **The Entry (Homepage)**
   - User lands on `/page.js`.
   - Experience: Cinematic, dark mode, high-end "Space Intelligence" branding.
   
2. **The Discovery (Directory)**
   - User clicks to `/property`.
   - The directory grid loads data from Airtable via `/api/cms/route.js`.
   - **The Radar Interaction:** User clicks the Mapbox "Proximity Radar" (`InteractiveRadiusMap`). They adjust a slider. The map dynamically calculates distance using a Javascript Haversine formula against Mapbox geocodes and filters the grid live.

3. **The Deep Dive (Property Detail)**
   - User clicks a specific property: `/property/[slug]`.
   - Experience: Heavy data-visualization. They see the `InteractiveMap.js` (Leaflet) showing local amenities and routing to the nearest transit hub.

4. **The Conversion (Shortlisting)**
   - User clicks a "Shortlist" or "Save" button (`ReactionButtons.js`).
   - If not logged in, they are prompted to Auth.
   - If logged in, the interaction is saved to **Supabase** (`user_reactions` table).

5. **The CRM (Buyer Dashboard)**
   - User navigates to `/dashboard`.
   - `DashboardContext.js` detects their role as "buyer".
   - The `BuyerMode.js` component renders, displaying their saved Airtable properties by cross-referencing their Supabase `user_reactions`.

---

## FLOW B: The Owner / Developer Journey

1. **The Login**
   - User authenticates via Supabase Auth.
   - Their profile role is designated as "owner".

2. **The Owner Portal**
   - User navigates to `/dashboard`.
   - `DashboardContext.js` detects their role as "owner" and renders `OwnerMode.js`.

3. **The Submission Wizard (`GuidedWizard.js`)**
   - The owner clicks "List a Property".
   - They enter a multi-phase Guided Wizard:
     - **Phase 1:** Basic Details.
     - **Phase 2:** Location. They use a visual Mapbox interface to drag a pin, generating exact Latitude/Longitude coordinates so they don't have to type them manually.
     - **Phase 3+:** Uploads and specs.
   
4. **The Submission**
   - The owner submits the wizard.
   - The data is pushed directly to the **Supabase** table `property_submissions` with status "pending".
   - (Note: It is NOT pushed to Airtable. Admins review Supabase submissions and manually port approved properties to Airtable).
