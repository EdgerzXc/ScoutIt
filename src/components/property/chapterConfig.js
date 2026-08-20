// ═══════════════════════════════════════════════════
// CHAPTER REGISTRY — Per-category configuration
// Reordering = move an item in the array.
// Tier flag = 'needed' (free) | 'extra' (paid).
// defaultCollapsed = operator-deep chapters hidden by default for onlookers.
// ═══════════════════════════════════════════════════

// Chapter IDs — match the tab IDs used in the nav + panel rendering
export const CHAPTER_IDS = {
  SPACE:       'space',
  LOCATION:    'location',
  LIFE:        'life',
  WHERETO:     'whereto',
  BUILDPLANS:  'buildplans',
  MARKET:      'hiddenintel', // tab ID frozen; the label has changed twice
  UNITS:       'units',
  UNIVERSE:    'universe',
  SERVICES:    'services',
  YOURMOVE:    'yourmove',
};

// ── Base chapter definitions (defaults) ──────────────────────────────────────
// Each chapter: id, navLabel, chapterNumber, chapterLabel, defaultCollapsed
// These are the RESIDENTIAL defaults. Category configs override what they need.

export const BASE_CHAPTERS = [
  {
    id:              'space',
    navLabel:        'The Space',
    chapterNumber:   '01',
    chapterLabel:    'The Space',
    subtitle:        'Floor plate, layout & physical specifications',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'location',
    navLabel:        'Location',
    chapterNumber:   '02',
    chapterLabel:    'Location',
    subtitle:        'Micro-location, district & transit access',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'life',
    navLabel:        'Life Here',
    chapterNumber:   '03',
    chapterLabel:    'Life Here',
    subtitle:        'Daily environment & neighborhood feel',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'whereto',
    navLabel:        'Where To?',
    chapterNumber:   '04',
    chapterLabel:    'Where To?',
    subtitle:        'Travel times & nearby destinations',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'buildplans',
    navLabel:        'Build Plans',
    chapterNumber:   '05',
    chapterLabel:    'Build Plans',
    subtitle:        'Floor plans, blueprints & architectural records',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'hiddenintel',
    // Renamed 2026-08-20: Hidden Intel → The Fine Print → The Market.
    //
    // "The Fine Print" was a misnomer twice over. It means legal caveats and
    // terms, and this chapter has never held either — it renders cap rate,
    // transaction history, appreciation projection, price history, competitive
    // density and market position. The old subtitle promised something else
    // again ("Title classification, zoning & risk assessments"), none of which
    // this chapter has ever rendered. Three names, none of them the content.
    //
    // The tab ID stays `hiddenintel` deliberately: it is in every deep link,
    // in VALID_CHAPTERS on both flows, and in the panel CSS. Renaming the
    // label is free; renaming the id breaks saved URLs.
    navLabel:        'The Market',
    chapterNumber:   '06',
    chapterLabel:    'The Market',
    subtitle:        'What is being written about this space, and the numbers underneath',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'units',
    navLabel:        'Units',
    chapterNumber:   '07',
    chapterLabel:    'Units',
    subtitle:        'Available inventory, pricing & layouts',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'universe',
    navLabel:        'Universe',
    chapterNumber:   '08',
    chapterLabel:    'Property Universe',
    subtitle:        'Building history & wider property context',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'services',
    navLabel:        'Services',
    chapterNumber:   '09',
    chapterLabel:    'Services',
    subtitle:        'On-site amenities & verified providers',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'yourmove',
    navLabel:        'Your Move',
    chapterNumber:   '10',
    chapterLabel:    'Your Move',
    subtitle:        'Save, evaluate, or connect when you are ready',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
];

// ── Helper: deep-merge category overrides onto base chapters ─────────────────
function buildConfig(overrides) {
  // overrides is an object keyed by chapter id
  // Returns the final ordered chapter array for a category
  const order = overrides._order || BASE_CHAPTERS.map(c => c.id);
  return order.map((id, idx) => {
    const base  = BASE_CHAPTERS.find(c => c.id === id);
    const over  = (overrides[id] || {});
    return {
      ...base,
      ...over,
      // Renumber chapters according to rendered order
      chapterNumber: String(idx + 1).padStart(2, '0'),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY CONFIGS
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. RESIDENTIAL (default order, no changes) ────────────────────────────
export const RESIDENTIAL_CONFIG = buildConfig({});

// ── 2. COMMERCIAL ─────────────────────────────────────────────────────────
export const COMMERCIAL_CONFIG = buildConfig({
  space: {
    navLabel:      'Floor Plate',
    chapterLabel:  'The Floor Plate',
    subtitle:      'Floor plate, column grid & usable volume',
  },
  location: {
    navLabel:      'Access',
    chapterLabel:  'Access & Logistics',
    subtitle:      'Transit hubs, arterial roads & freight access',
  },
  life: {
    navLabel:      'The Workday',
    chapterLabel:  'The Workday',
    subtitle:      'Amenities, dining & tenant ecosystem',
  },
  whereto: {
    navLabel:      'The Block',
    chapterLabel:  'The Block',
    subtitle:      'District radius & surrounding commercial hubs',
  },
  buildplans: {
    navLabel:      'Fit-Out',
    chapterLabel:  'Fit-Out Potential',
    subtitle:      'Mechanical specs, MEP & fit-out potential',
  },
  units: {
    navLabel:      'Available Spaces',
    chapterLabel:  'Available Spaces',
    subtitle:      'Available floors, wings & contiguous spaces',
  },
});

// ── 3. STR (Short-Term Rental) ─────────────────────────────────────────────
// Experience-led: ch03 moves to position 1, ch01 to position 2
export const STR_CONFIG = buildConfig({
  _order: ['life', 'space', 'location', 'whereto', 'buildplans', 'hiddenintel', 'units', 'universe', 'services', 'yourmove'],
  life: {
    navLabel:      'The Experience',
    chapterLabel:  'The Experience',
    subtitle:      'Guest ambience & surrounding lifestyle attractions',
  },
  space: {
    navLabel:      'The Stay',
    chapterLabel:  'The Stay',
    subtitle:      'Living suites, sleeping capacity & interior layout',
  },
  location: {
    navLabel:      'Getting There',
    chapterLabel:  'Getting There',
    subtitle:      'Airport routes, parking & arrival logistics',
  },
  whereto: {
    navLabel:      'The Radius',
    chapterLabel:  'The Radius',
    subtitle:      'Dining, landmarks & recreational points of interest',
  },
  buildplans: {
    navLabel:      'Operating',
    chapterLabel:  'Operating Context',
    subtitle:      'Host storage, utility infrastructure & lock-off spaces',
  },
  units: {
    navLabel:      'Rooms & Facilities',
    chapterLabel:  'Rooms & Facilities',
    subtitle:      'Available keys, suites & shared guest amenities',
  },
});

// ── 4. HOSPITALITY (Resorts / Lodges) ─────────────────────────────────────
// Experience-led: ch03 leads
export const HOSPITALITY_CONFIG = buildConfig({
  _order: ['life', 'space', 'location', 'whereto', 'buildplans', 'hiddenintel', 'units', 'universe', 'services', 'yourmove'],
  life: {
    navLabel:      'Guest Experience',
    chapterLabel:  'The Guest Experience',
    subtitle:      'Resort atmosphere, wellness & guest activities',
  },
  space: {
    navLabel:      'The Grounds',
    chapterLabel:  'The Grounds',
    subtitle:      'Master layout, landscape architecture & villas',
  },
  location: {
    navLabel:      'The Transfer',
    chapterLabel:  'The Transfer',
    subtitle:      'Private transfer routes, helipad & access corridors',
  },
  whereto: {
    navLabel:      'The Radius',
    chapterLabel:  'The Radius',
    subtitle:      'Coastal attractions, golf clubs & excursion hubs',
  },
  buildplans: {
    navLabel:      'The Shell',
    chapterLabel:  'The Operational Shell',
    subtitle:      'Back-of-house facilities, laundry & power redundancy',
  },
  units: {
    navLabel:      'Rooms & Facilities',
    chapterLabel:  'Rooms & Facilities',
    subtitle:      'Villa inventory, suites & recreational facilities',
  },
});

// ── 5. RESTAURANTS ────────────────────────────────────────────────────────
// Experience-led: ch03 (The Vibe) leads — strongest onlooker hook
// Engine Room (ch05) collapsed by default with "For operators" toggle
export const RESTAURANT_CONFIG = buildConfig({
  _order: ['life', 'space', 'location', 'whereto', 'buildplans', 'hiddenintel', 'units', 'universe', 'services', 'yourmove'],
  life: {
    navLabel:      'The Vibe',
    chapterLabel:  'The Vibe',
    subtitle:      'Dining room atmosphere & acoustic character',
  },
  space: {
    navLabel:      'Kitchen & Dining',
    chapterLabel:  'The Kitchen & Dining Room',
    subtitle:      'Seating capacity, kitchen line & bar stations',
    variant:       'replace',  // new stat block: covers + kitchen grade
  },
  location: {
    navLabel:      'How Guests Arrive',
    chapterLabel:  'How Guests Arrive',
    subtitle:      'Valet drop-off, footfall corridors & parking access',
  },
  whereto: {
    navLabel:      'Around the Table',
    chapterLabel:  'Around the Table',
    subtitle:      'Adjacent nightlife, hotels & complementary dining',
  },
  buildplans: {
    navLabel:      'Engine Room',
    chapterLabel:  'The Engine Room',
    subtitle:      'Exhaust ventilation, grease traps & gas supply',
    variant:       'replace',   // ventilation, exhaust, electrical
    defaultCollapsed: true,
    operatorToggle:   true,
  },
  units: {
    navLabel:      'Areas',
    chapterLabel:  'Areas',
    subtitle:      'Main dining, mezzanine, private dining & patio zones',
  },
});

// ── 6. VENUES / EVENT SPACES ──────────────────────────────────────────────
// Experience-led: ch03 (Event Atmosphere) leads
// Back of House (ch05) collapsed by default
export const VENUE_CONFIG = buildConfig({
  _order: ['life', 'space', 'location', 'whereto', 'buildplans', 'hiddenintel', 'units', 'universe', 'services', 'yourmove'],
  life: {
    navLabel:      'Atmosphere',
    chapterLabel:  'Event Atmosphere',
    subtitle:      'Production lighting, acoustics & spatial volume',
  },
  space: {
    navLabel:      'Capacity',
    chapterLabel:  'Production Capacity',
    subtitle:      'Standing, banquet & theater capacities',
    variant:       'replace',  // standing/seated capacity + setup grade
  },
  location: {
    navLabel:      'Guest Logistics',
    chapterLabel:  'Guest Logistics',
    subtitle:      'VIP arrivals, bus staging & guest transit links',
  },
  whereto: {
    navLabel:      'Guest Radius',
    chapterLabel:  'Guest Radius',
    subtitle:      'Partner hotels, restaurants & airport corridors',
  },
  buildplans: {
    navLabel:      'Back of House',
    chapterLabel:  'Back of House',
    subtitle:      'Green rooms, loading docks & production power grids',
    defaultCollapsed: true,
    operatorToggle:   true,
  },
  units: {
    navLabel:      'Zones',
    chapterLabel:  'Zones',
    subtitle:      'Grand ballroom, breakout studios & outdoor terraces',
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY → CONFIG MAP
// Add new categories here — one line, no logic changes anywhere else.
// ═══════════════════════════════════════════════════════════════════════════
export const CATEGORY_CONFIG_MAP = {
  'residential':  RESIDENTIAL_CONFIG,
  'commercial':   COMMERCIAL_CONFIG,
  'str':          STR_CONFIG,
  'hospitality':  HOSPITALITY_CONFIG,
  'restaurants':  RESTAURANT_CONFIG,
  'culinary':     RESTAURANT_CONFIG,
  'venues':       VENUE_CONFIG,
  'events':       VENUE_CONFIG,
  'default':      RESIDENTIAL_CONFIG,
};

// ── Resolver: takes a property object, returns the right config ───────────
export function getChapterConfig(property) {
  const raw = (
    (property?.spaceCategory || property?.property_type || '')
  ).toLowerCase();

  for (const [key, config] of Object.entries(CATEGORY_CONFIG_MAP)) {
    if (key !== 'default' && raw.includes(key)) {
      return config;
    }
  }
  return CATEGORY_CONFIG_MAP['default'];
}
