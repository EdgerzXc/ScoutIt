// ─────────────────────────────────────────────────────────────────────────
// LOCATION HUBS — the canonical list
// SEO-03 · WORK ORDER W1 / W7
//
// Lives in lib/, not in the route handler, because THREE things now need it:
// `/api/hubs`, the `/hubs/[slug]` page, and `src/app/sitemap.js`. It was
// previously exported from the route file, which meant importing a server
// route handler into a page just to read three objects.
//
// ⚠️ ADDING A HUB HERE ADDS A SITEMAP ENTRY AND A PUBLIC PAGE. `generateStaticParams`
// and the sitemap both read this array, so a new entry ships a real, crawlable
// URL — verify the page renders for it before merging. The W1 incident was
// exactly this in reverse: three sitemap URLs with no page behind them.
// ─────────────────────────────────────────────────────────────────────────

export const LOCATION_HUBS = [
  {
    slug: "bgc-taguig",
    name: "Bonifacio Global City (BGC)",
    city: "Taguig",
    region: "BGC",
    lat: 14.5494,
    lng: 121.048,
    tagline: "Metro Manila's premier master-planned commercial and residential grid.",
    featuredCategories: ["Commercial Office", "High-Rise Condo", "Retail Space"],
  },
  {
    slug: "makati-cbd",
    name: "Makati Central Business District",
    city: "Makati",
    region: "Makati",
    lat: 14.5547,
    lng: 121.0244,
    tagline: "The financial heart of the Philippines with corporate headquarters and luxury residences.",
    featuredCategories: ["Corporate HQ", "Luxury Condo", "Commercial Suite"],
  },
  {
    slug: "quezon-city-hub",
    name: "Quezon City Commercial Hub",
    city: "Quezon City",
    region: "Quezon City",
    lat: 14.6488,
    lng: 121.0509,
    tagline: "The largest city in Metro Manila with tech hubs, media networks, and residential estates.",
    featuredCategories: ["Tech Office", "Residential Compound", "Commercial Lot"],
  },
];

export const LOCATION_HUB_SLUGS = LOCATION_HUBS.map((h) => h.slug);

/** The hub for a slug, or null. Never invents one — an unknown slug 404s. */
export function getLocationHub(slug) {
  if (!slug) return null;
  return LOCATION_HUBS.find((h) => h.slug === slug) || null;
}
