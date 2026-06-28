# ScoutIt Website Architecture & Data Flow

## 1. The Dual-CMS Golden Rule
ScoutIt operates on a powerful dual-CMS architecture, heavily separating the fast, public-facing reading layer from the heavy, secure private writing layer.

### A. SUPABASE = Private User Data, Drafts, & File Storage
* **Role:** The secure intake engine.
* **Usage:** All authentication, user dashboards, property draft building, and high-res photo hosting.
* **Storage:** Supabase Storage (`property_photos` bucket) holds the massive, multi-megabyte `.jpg` and `.png` files. We rely on Supabase because cloud storage is significantly cheaper and more robust than Airtable for massive file repositories.

### B. AIRTABLE = Public Read-Only Content & Directory
* **Role:** The lightning-fast public directory engine.
* **Usage:** All live properties, articles, and broker profiles.
* **Integration:** When a property is verified and published by an admin, the **text data** (title, price, location) and the **URLs** of the Supabase photos are pushed to Airtable. Airtable stays lightweight because it only holds the URLs, not the actual file blobs.

---

## 2. Monetization & Content Limits (Freemium Model)
To organically drive upgrades to the `PRO` tier, ScoutIt strictly limits photo uploads based on the subscription tier, pushing heavy users to upgrade to unlock their full media kits.

### Free Tier Restrictions:
* **Main Property Photos:** Strictly capped at **7 photos maximum**.
* **External Media Folder:** Locked 🔒. Free users cannot link out to external data rooms (Google Drive) to bypass the photo limits.
* **Unit Photos (Deep Intelligence):** Strictly **1 photo per unit**. The broker must make a hard choice between showing a floor plan or an interior photo.

### ScoutIt PRO Tier:
* **Main Property Photos:** Up to **15-20 photos**.
* **External Media Folder:** Unlocked 🔓. Brokers can paste a Google Drive folder link to their "Data Room" or full media kit, which renders as a premium `[ UPGRADE TO VIEW MEDIA GALLERY ]` button for free viewers, or `[ ACCESS FULL MEDIA GALLERY ]` for the PRO listing.
* **Unit Photos (Deep Intelligence):** Up to **5 photos per unit**, easily accommodating floor plans + multiple interior angles per unit.

---

## 3. The "No URL" Policy for Primary Photos
For the main property photos, ScoutIt **strictly prohibits pasting external URLs** (e.g., Google Drive links, Dropbox).
* **Why?** Services like Google Drive aggressively block third-party websites from embedding images (to prevent hotlinking and bandwidth theft). Paste links inevitably break, destroying the luxury aesthetic of the directory.
* **The Solution:** We force 100% direct file uploads for the main slots via drag-and-drop. The files securely upload directly to Supabase, guaranteeing the listing never suffers from a broken image link.
