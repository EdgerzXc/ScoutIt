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
  FINDEPRINT:  'hiddenintel', // kept same tab ID to avoid CSS changes; label changes
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
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'location',
    navLabel:        'Location',
    chapterNumber:   '02',
    chapterLabel:    'Location',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'life',
    navLabel:        'Life Here',
    chapterNumber:   '03',
    chapterLabel:    'Life Here',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'whereto',
    navLabel:        'Where To?',
    chapterNumber:   '04',
    chapterLabel:    'Where To?',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'buildplans',
    navLabel:        'Build Plans',
    chapterNumber:   '05',
    chapterLabel:    'Build Plans',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'hiddenintel',
    navLabel:        'The Fine Print',  // renamed from Hidden Intel
    chapterNumber:   '06',
    chapterLabel:    'The Fine Print',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'units',
    navLabel:        'Units',
    chapterNumber:   '07',
    chapterLabel:    'Units & Spaces',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'universe',
    navLabel:        'Universe',
    chapterNumber:   '08',
    chapterLabel:    'Property Universe',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'services',
    navLabel:        'Services',
    chapterNumber:   '09',
    chapterLabel:    'Services',
    defaultCollapsed: false,
    operatorToggle:  false,
  },
  {
    id:              'yourmove',
    navLabel:        'Your Move',
    chapterNumber:   '10',
    chapterLabel:    'Your Move',
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
  },
  location: {
    navLabel:      'Access',
    chapterLabel:  'Access & Logistics',
  },
  life: {
    navLabel:      'The Workday',
    chapterLabel:  'The Workday',
  },
  whereto: {
    navLabel:      'The Block',
    chapterLabel:  'The Block',
  },
  buildplans: {
    navLabel:      'Fit-Out',
    chapterLabel:  'Fit-Out Potential',
  },
  units: {
    navLabel:      'Floors',
    chapterLabel:  'Floors & Suites',
  },
});

// ── 3. STR (Short-Term Rental) ─────────────────────────────────────────────
// Experience-led: ch03 moves to position 1, ch01 to position 2
export const STR_CONFIG = buildConfig({
  _order: ['life', 'space', 'location', 'whereto', 'buildplans', 'hiddenintel', 'units', 'universe', 'services', 'yourmove'],
  life: {
    navLabel:      'The Experience',
    chapterLabel:  'The Experience',
  },
  space: {
    navLabel:      'The Stay',
    chapterLabel:  'The Stay',
  },
  location: {
    navLabel:      'Getting There',
    chapterLabel:  'Getting There',
  },
  whereto: {
    navLabel:      'The Radius',
    chapterLabel:  'The Radius',
  },
  buildplans: {
    navLabel:      'Operating',
    chapterLabel:  'Operating Context',
  },
  units: {
    navLabel:      'Rooms',
    chapterLabel:  'Rooms & Beds',
  },
});

// ── 4. HOSPITALITY (Resorts / Lodges) ─────────────────────────────────────
// Experience-led: ch03 leads
export const HOSPITALITY_CONFIG = buildConfig({
  _order: ['life', 'space', 'location', 'whereto', 'buildplans', 'hiddenintel', 'units', 'universe', 'services', 'yourmove'],
  life: {
    navLabel:      'Guest Experience',
    chapterLabel:  'The Guest Experience',
  },
  space: {
    navLabel:      'The Grounds',
    chapterLabel:  'The Grounds',
  },
  location: {
    navLabel:      'The Transfer',
    chapterLabel:  'The Transfer',
  },
  whereto: {
    navLabel:      'The Radius',
    chapterLabel:  'The Radius',
  },
  buildplans: {
    navLabel:      'The Shell',
    chapterLabel:  'The Operational Shell',
  },
  units: {
    navLabel:      'Room Types',
    chapterLabel:  'Room Types',
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
  },
  space: {
    navLabel:      'Kitchen & Dining',
    chapterLabel:  'The Kitchen & Dining Room',
    variant:       'replace',  // new stat block: covers + kitchen grade
  },
  location: {
    navLabel:      'How Guests Arrive',
    chapterLabel:  'How Guests Arrive',
  },
  whereto: {
    navLabel:      'Around the Table',
    chapterLabel:  'Around the Table',
  },
  buildplans: {
    navLabel:      'Engine Room',
    chapterLabel:  'The Engine Room',
    variant:       'replace',   // ventilation, exhaust, electrical
    defaultCollapsed: true,
    operatorToggle:   true,
  },
  units: {
    navLabel:      'The Rooms',
    chapterLabel:  'The Rooms',
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
  },
  space: {
    navLabel:      'Capacity',
    chapterLabel:  'Production Capacity',
    variant:       'replace',  // standing/seated capacity + setup grade
  },
  location: {
    navLabel:      'Guest Logistics',
    chapterLabel:  'Guest Logistics',
  },
  whereto: {
    navLabel:      'Guest Radius',
    chapterLabel:  'Guest Radius',
  },
  buildplans: {
    navLabel:      'Back of House',
    chapterLabel:  'Back of House',
    defaultCollapsed: true,
    operatorToggle:   true,
  },
  units: {
    navLabel:      'Space Segments',
    chapterLabel:  'Space Segmentation',
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
