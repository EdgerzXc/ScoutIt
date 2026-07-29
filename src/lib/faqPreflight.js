// ─────────────────────────────────────────────────────────────────────────
// OWNER FAQ PRE-FLIGHT CHECKLIST
//
// Solves the empty-wall problem honestly. A listing that goes public with a
// blank Q&A section reads as dead -- but ScoutIt must never pre-write the
// ANSWERS. An answer on a listing is a representation of fact about that
// property; generating one would break the Honest Data Doctrine and undermine
// the neutral-technology-provider position under RA 9646 (RESA).
//
// So we seed the QUESTIONS and let the owner answer them. Those become real
// gold-tier answers authored by the actual owner, and the listing launches
// with substance instead of a blank wall.
//
// Each question is one a buyer genuinely asks and an owner can answer from
// memory in under a minute -- no measuring, no documents. Anything requiring
// a site visit belongs to the silver-tier advisor layer instead.
//
// Category keys mirror deepIntelCategoryFor() in src/lib/airtable.js.
// ─────────────────────────────────────────────────────────────────────────

const RESIDENTIAL = [
  { key: "res_noise",     question: "How noisy is the unit on a weekday evening?", hint: "Traffic, bars, construction, aircon plant — be specific about the source." },
  { key: "res_signal",    question: "Which mobile networks actually work inside the unit?", hint: "Globe, Smart, DITO — and whether signal drops in the bedroom or lift lobby." },
  { key: "res_water",     question: "Is water supply 24/7, and is it included in the dues?", hint: "Name the utility and flag any scheduled interruptions." },
  { key: "res_dues",      question: "What do the monthly association dues actually cover?", hint: "Security, common-area power, water, gym, pool, garbage." },
  { key: "res_parking",   question: "Is parking included, and is the slot titled or rented?", hint: "Slot number, level, and whether it transfers with the unit." },
  { key: "res_pets",      question: "What is the building's pet policy?", hint: "Weight limits, breed restrictions, lift rules." },
  { key: "res_internet",  question: "Which fibre providers are already wired into the unit?", hint: "PLDT, Converge, Globe — and whether a line is live now." },
  { key: "res_flood",     question: "Has the building or its access road ever flooded?", hint: "Honesty here builds more trust than silence. Say 'no' if it's no." },
  { key: "res_renovate",  question: "What renovations are allowed, and what needs approval?", hint: "Wet-area changes, flooring, structural walls, working hours." },
  { key: "res_move",      question: "What are the move-in rules and fees?", hint: "Deposit, allowed hours, service lift booking." },
];

const COMMERCIAL = [
  { key: "com_aircon",    question: "What is the aircon system, and who pays to run it?", hint: "VRF, split, centralised chilled water — and after-hours charges." },
  { key: "com_ceiling",   question: "What is the finished ceiling height?", hint: "Slab-to-slab and slab-to-ceiling both matter to fit-out planners." },
  { key: "com_power",     question: "What power capacity is provisioned for the space?", hint: "kVA allocation, and whether it can be increased." },
  { key: "com_backup",    question: "Is there generator backup, and what does it cover?", hint: "Full floor, common areas only, or lifts and life-safety only." },
  { key: "com_hours",     question: "What are building access hours, and is 24/7 possible?", hint: "Critical for BPO and shift operations." },
  { key: "com_fitout",    question: "What is the fit-out period and are there fit-out charges?", hint: "Rent-free fit-out months, permit fees, contractor accreditation." },
  { key: "com_dues",      question: "What are the CUSA dues and what do they cover?", hint: "Per sqm per month, and what's billed separately." },
  { key: "com_parking",   question: "How many parking slots come with the space?", hint: "Ratio per 100 sqm, monthly rate for extras." },
  { key: "com_internet",  question: "Which telcos have fibre into the building?", hint: "Redundant providers are a deciding factor for BPO tenants." },
  { key: "com_lease",     question: "What lease term and escalation are you looking for?", hint: "Years, annual escalation %, security deposit, advance rent." },
  { key: "com_peza",      question: "Is the building PEZA-accredited?", hint: "Decisive for export-oriented and BPO locators." },
];

const STR = [
  { key: "str_permit",    question: "Does the building allow short-term rental, and is it in writing?", hint: "Many Metro Manila condos ban it outright. Be direct." },
  { key: "str_checkin",   question: "How does guest check-in work with building security?", hint: "Lobby registration, guest passes, key handover." },
  { key: "str_capacity",  question: "What is the realistic maximum guest capacity?", hint: "Beds and sofa beds, plus any house-rule limit." },
  { key: "str_utilities", question: "Are utilities and internet included for guests?", hint: "Speed of the line matters for remote-work guests." },
  { key: "str_cleaning",  question: "Who handles turnover cleaning and at what cost?", hint: "In-house staff, agency, or owner-arranged." },
  { key: "str_amenity",   question: "Which building amenities can guests actually use?", hint: "Pool and gym are often residents-only." },
  { key: "str_noise",     question: "What are the quiet hours and party rules?", hint: "The single most common cause of guest complaints." },
  { key: "str_history",   question: "What occupancy has this unit actually achieved?", hint: "Only answer if you have real figures — leave blank rather than estimate." },
];

const HOSPITALITY = [
  { key: "hos_rooms",     question: "How many keys are there, and what is the room mix?", hint: "Singles, doubles, suites." },
  { key: "hos_licence",   question: "What operating permits and DOT accreditation are current?", hint: "Include expiry dates if you know them." },
  { key: "hos_staff",     question: "Does the sale or lease include existing staff?", hint: "Headcount and whether contracts transfer." },
  { key: "hos_occupancy", question: "What is the trailing 12-month occupancy rate?", hint: "Only answer if you have real figures — leave blank rather than estimate." },
  { key: "hos_fnb",       question: "Is there an F&B outlet, and is it operating?", hint: "Seats, kitchen condition, separate permits." },
  { key: "hos_capex",     question: "What capex does the property need in the next 24 months?", hint: "Roofing, lifts, aircon, soft refurbishment." },
  { key: "hos_power",     question: "Is there generator backup covering guest floors?", hint: "Non-negotiable for most hotel buyers." },
  { key: "hos_access",    question: "How far is the nearest airport or major transport hub?", hint: "Travel time at normal traffic, not distance." },
];

const RESTAURANTS = [
  { key: "rst_grease",    question: "Is there an existing grease trap and exhaust stack?", hint: "The single most expensive thing to retrofit." },
  { key: "rst_power",     question: "What power capacity is available for kitchen equipment?", hint: "kVA, and whether three-phase is available." },
  { key: "rst_gas",       question: "Is LPG or piped gas permitted, and where is the tank sited?", hint: "Many malls restrict this heavily." },
  { key: "rst_seats",     question: "What is the permitted seating capacity?", hint: "Indoor and any al-fresco allowance." },
  { key: "rst_hours",     question: "What operating hours does the landlord allow?", hint: "Late-night trading is often restricted." },
  { key: "rst_permits",   question: "Which permits transfer with the space?", hint: "Sanitary, fire safety, business permit, liquor licence." },
  { key: "rst_equipment", question: "Is existing kitchen equipment included?", hint: "List the major items and their condition." },
  { key: "rst_foot",      question: "What is the realistic foot traffic at this location?", hint: "Describe what you've observed — don't quote a number you can't source." },
];

const VENUES = [
  { key: "ven_capacity",  question: "What is the seated and standing capacity?", hint: "Banquet, theatre, and cocktail layouts differ a lot." },
  { key: "ven_power",     question: "What power is available for staging, sound and lighting?", hint: "kVA, three-phase, and generator access points." },
  { key: "ven_catering",  question: "Is outside catering allowed, or is there an accredited list?", hint: "The most common deal-breaker for event planners." },
  { key: "ven_noise",     question: "What is the sound curfew?", hint: "Time and decibel limits, and whether amplified music is allowed." },
  { key: "ven_parking",   question: "How many vehicles can the venue park at once?", hint: "Including valet or overflow arrangements." },
  { key: "ven_hours",     question: "What are the ingress and egress windows?", hint: "Setup and teardown hours included in the rate." },
  { key: "ven_aircon",    question: "Is the main hall air-conditioned, and is it included?", hint: "Or billed by the hour on top of the venue rate." },
  { key: "ven_rate",      question: "What does the base rate include?", hint: "Hours, tables, chairs, basic lighting, staff." },
];

const SETS = {
  residential: RESIDENTIAL,
  commercial:  COMMERCIAL,
  str:         STR,
  hospitality: HOSPITALITY,
  restaurants: RESTAURANTS,
  venues:      VENUES,
};

// Answering this many is what counts as "complete" for listing strength.
// Deliberately below the full set -- some questions won't apply to every
// space, and forcing a padded answer is worse than an honest blank.
export const PREFLIGHT_TARGET = 5;

/**
 * Maps a space category string to a question-set key. Mirrors
 * deepIntelCategoryFor() in src/lib/airtable.js so the two never diverge.
 *
 * @param {string} spaceCategory
 * @returns {string} a key of SETS
 */
export function preflightCategoryFor(spaceCategory) {
  const c = (spaceCategory || "").toLowerCase();
  if (c.includes("commercial")) return "commercial";
  if (c.includes("str") || c.includes("short")) return "str";
  if (c.includes("hospitality")) return "hospitality";
  if (c.includes("restaurant") || c.includes("culinary")) return "restaurants";
  if (c.includes("venue") || c.includes("event")) return "venues";
  return "residential";
}

/**
 * The standard buyer questions for a given space category.
 *
 * @param {string} spaceCategory
 * @returns {Array<{ key: string, question: string, hint: string }>}
 */
export function getPreflightQuestions(spaceCategory) {
  return SETS[preflightCategoryFor(spaceCategory)] || RESIDENTIAL;
}

/**
 * Validates a preflight key against the set for a category. Guards the API
 * against a client posting an arbitrary key.
 *
 * @param {string} spaceCategory
 * @param {string} key
 * @returns {{ key: string, question: string, hint: string }|null}
 */
export function findPreflightQuestion(spaceCategory, key) {
  return getPreflightQuestions(spaceCategory).find((q) => q.key === key) || null;
}

/**
 * Progress summary for the checklist UI and listing-strength scoring.
 *
 * @param {string} spaceCategory
 * @param {number} answeredCount
 * @returns {{ answered: number, target: number, total: number, complete: boolean, percent: number }}
 */
export function preflightProgress(spaceCategory, answeredCount = 0) {
  const total = getPreflightQuestions(spaceCategory).length;
  const answered = Math.min(answeredCount, total);
  return {
    answered,
    target: PREFLIGHT_TARGET,
    total,
    complete: answered >= PREFLIGHT_TARGET,
    percent: Math.round((answered / PREFLIGHT_TARGET) * 100),
  };
}

export default getPreflightQuestions;
