read this before we implement give me your feedback 

An architectural and technical deep dive into ScoutIt reveals several structural
inconsistencies, performance bottlenecks, and localized UX nuances.

1. The Routing & Link Schema (Inconsistent Mapping)

Analyzing the page navigation reveals several conflicting target routes for
identical actions. If left uncorrected, this will lead to split link authority
(SEO fragmentation) and user path confusion.

  - The Inconsistency:
      - "Discover Spaces" links to /property in the hero, /discover in the
        footer menu, and /layer/metropolis in the layer catalog.
      - "The Board" links to /layer/orbit in the hero and layers catalog, but
        maps to /wishlist under "Your Board" in the footer.
  - The Fix: Select a single canonical URL structure for each layer and stick to
    it. If /layer/metropolis is the thematic route, configure permanent
    redirects (301) for /discover and /property to point directly to
    /layer/metropolis. This prevents search engine crawlers from indexing
    duplicate pages with different URL parameters.

2. Micro-Frontend State & The "Lite-Mode" Script

Your inline script for detecting reduced motion and localStorage state is highly
optimized for preventing Flash of Unstyled Content (FOUC):

(function(){try{var v=localStorage.getItem('scoutit_lite_mode');var on=(v===null)?window.matchMedia('(prefers-reduced-motion: reduce)').matches:(v==='1');if(on)document.documentElement.classList.add('lite-mode');}catch(e){}})();

  - The Hidden "Cranny": Because this script executes synchronously inside the
    <head> before React/Next.js hydrates, you must ensure your React components
    sync flawlessly with it. If a user toggles "Lite Mode" in their dashboard,
    your React state must write to localStorage and physically add/remove the
    class from document.documentElement.
  - If your React state merely controls a local context variable (const [lite,
    setLite] = useState(false)) without mutating the DOM, the UI might fall out
    of sync upon route transitions when Next.js dynamically updates layouts.

3. CSS Performance & The Noise Grain Overlay (.grain)

The site features a stylized film grain overlay (.grain) with
aria-hidden="true". While visually appealing, this is a notorious resource hog.

  - The Bottleneck: Looping CSS animations on a fullscreen overlay force the
    browser's rendering engine to re-rasterize and repaint the entire visible
    screen on every single frame. On mid-range mobile devices common in the
    Philippines (e.g., older Android chipsets), this causes thermal throttling,
    frame drops, and rapid battery drain.
  - The Fix: Make sure your .lite-mode class completely disables the grain
    animation:
    .lite-mode .grain {
      display: none !important;
      animation: none !important;
    }
    Furthermore, optimize the animation performance on standard mode by using
    will-change: transform and limiting the keyframes to basic step transitions
    rather than continuous linear offsets.

4. Data Architecture: Polymorphic Searching

In Layer 03 // Metropolis, you are consolidating four fundamentally distinct
types of space: homes, offices, venues, and restaurant tables.

  - The Structural Challenge: Traditional property search forms use static
    inputs. However, each of your target spaces requires completely different
    database structures and query parameters:
      - Homes: Bedrooms, bathrooms, furnishing status (unfurnished, semi, fully
        fitted), and parking slots.
      - Offices: PEZA (Philippine Economic Zone Authority) status, hand-over
        condition (warm shell, bare shell, fully fitted), and floor plate size.
      - Venues: Seating capacity, AV technical loadout, and catering rules
        (corkage fee policies).
      - Tables: Cuisine type, table size, and real-time slot booking times.
  - The Design Fix: Build a polymorphic filter interface [4.1.5]. When a user
    toggles the space category, the form inputs should dynamically swap out
    their schema and state variables to present only the attributes relevant to
    that specific space type.

5. Local Real Estate Standards (RA 9646) & "Colorum" Prevention

Your footer correctly cites RA 9646 (Real Estate Service Act of the
Philippines). Under Philippine law, anyone facilitating real estate marketing or
listings must be a licensed professional.

  - The Legal Nook: If ScoutIt operates as an open listing directory where
    anyone can upload a space, you run the risk of hosting illegal, unlicensed
    ("colorum") practitioners, which can carry legal liabilities under the
    Professional Regulatory Board of Real Estate Service (PRBRES).
  - The Feature Fix: Under Layer 04 // The Crust (Verified Advisors), build a
    dedicated credential verification workflow:
      - Collect the practitioner’s PRC License Number, License Expiry Date, and
        DHSUD Registration Number (mandatory for selling developer projects).
      - Mark profiles with a "PRC Verified" state badge only after these
        credentials have been checked against the public PRC registry. This
        creates an immediate moat of trust that sets ScoutIt apart from generic
        listing platforms.

6. PH Localization and Formatting Nuances

  - Metric System: Ensure all spatial measurements default to Square Meters
    (sqm). While US real estate platforms default to square feet (sqft), local
    buyers, brokers, and developers in the Philippines strictly transacted in
    square meters.
  - Currency Representation: Use the official Philippine Peso symbol (₱) instead
    of generic text like "PHP". For pricing readability in directories,
    implement abbreviation parsers:
      - Rentals: ₱35k/mo or ₱1,200/sqm/mo (typical for BPO offices).
      - Sales: ₱8.5M or ₱120M (highly readable on card layouts).

7. Email and Communication Gateway

  - The Bug: Your contact link points to hello@scout-it.vercel.app.
  - The Fix: Using the system-default Vercel subdomain for communications is
    problematic. Sending confirmation or onboarding emails from a
    @scout-it.vercel.app sender address will fail strict SPF, DKIM, and DMARC
    mail server rules, instantly sending system emails to your users' spam
    folders. Secure a custom domain name and map your transactional mail
    provider (e.g., Resend, Postmark) before opening up user registration.
