// Category world registry for the hero orbital rail.
//
// Deviations from the rail spec, all deliberate:
// - Routes reuse the directory's existing `?type=` sector filter
//   (`/property?type=STR`), per spec §13 "use whatever ScoutIt's
//   existing route structure is".
// - The third category keeps its directory key `STR` (not "Short
//   Stay") so rail labels match the directory's sector checkboxes.
// - No subcategory lists: the CMS has no grounded per-category
//   taxonomy, and the rail never invents data.

export const CATEGORY_WORLDS = [
  { id: "residential", key: "Residential", label: "Residential", type: "Residential", slug: "residential", line: "Homes that hold you" },
  { id: "commercial", key: "Commercial", label: "Commercial", type: "Commercial", slug: "commercial", line: "Towers that mean business" },
  { id: "str", key: "STR", label: "STR", type: "STR", slug: "str", line: "Lodges for the weekend escape" },
  { id: "hospitality", key: "Hospitality", label: "Hospitality", type: "Hospitality", slug: "hospitality", line: "Resorts, decoded" },
  { id: "restaurants", key: "Restaurants", label: "Restaurants", type: "Restaurants", slug: "restaurants", line: "Rooms with flavour" },
  { id: "venues", key: "Venues", label: "Venues", type: "Venues", slug: "venues", line: "Stages for big nights" },
];

export const COUNT = CATEGORY_WORLDS.length;

export const worldAt = (i) => CATEGORY_WORLDS[((i % COUNT) + COUNT) % COUNT];

// Circular slot membership for a committed index: previous, active,
// next, and the preloaded world after next. Infinite loop, no ends.
export const slotIds = (committed) => ({
  prev: worldAt(committed - 1).id,
  active: worldAt(committed).id,
  next: worldAt(committed + 1).id,
  after: worldAt(committed + 2).id,
});

export const worldById = (id) => CATEGORY_WORLDS.find((w) => w.id === id);

export const modelUrl = (slug) => `/planets/planet-${slug}.glb`;
export const fallbackUrl = (slug) => `/planets/planet-${slug}.png`;
export const routeFor = (type) => `/property?type=${encodeURIComponent(type)}`;
