// ─────────────────────────────────────────────────────────────────────────
// INFO TIPS (A-160) — explanations on demand, not essays up front.
//
// The rule: a surface shows the action first and hides the explanation behind
// a "?" mark. Each tip is one title + one short body, keyed by a stable id so
// a test can assert the copy contract instead of grepping components.
// Bodies stay under ~280 characters — a tooltip is a whisper, not a chapter.
// ─────────────────────────────────────────────────────────────────────────

export const INFO_TIPS = Object.freeze({
  layerNumber: Object.freeze({
    title: "What is this layer?",
    body: "ScoutIt is organized in three layers: 01 Orbit shows top market signals, 02 Stratosphere tracks live neighborhood updates, and 03 Metropolis lists verified spaces.",
  }),
  evidenceProtocol: Object.freeze({
    title: "Evidence protocol",
    body: "Every credential states its source. Space availability comes straight from owners rather than estimates. Activity updates require fresh, named observations. If evidence is missing, we leave it blank.",
  }),
  privateSaves: Object.freeze({
    title: "Private saves",
    body: "Saved spaces and profiles are for your eyes only. Nobody else sees what you save, and saves are never shared, counted, or used for public rankings.",
  }),
  credentialSort: Object.freeze({
    title: "Credential evidence",
    body: "Sorts profiles with confirmed proof first, such as verified licences, named sources, and granted badges. Unproven claims never rank above confirmed ones.",
  }),
  dataPhilosophy: Object.freeze({
    title: "How ScoutIt handles data",
    body: "Every space gets a clear briefing built from verified facts and named sources. We never invent details to fill gaps, and paid sponsors cannot buy higher ranks.",
  }),
  platformTruth: Object.freeze({
    title: "How ScoutIt works",
    body: "Public listings and private user accounts stay completely separate. Owners publish their own listings directly. If our team drafts a listing from an owner document, we verify every detail before it goes live.",
  }),
  verifyingSpaces: Object.freeze({
    title: "Why verified first",
    body: "Spaces appear here only after their details are confirmed. Adding your space now puts it directly in front of active buyers and brokers.",
  }),
  metropolisMission: Object.freeze({
    title: "What Metropolis is",
    body: "Metropolis is our property directory. Browse homes, offices, and commercial venues building by building. Select any space to see its full briefing with verified dimensions, photos, and history.",
  }),
  crustMission: Object.freeze({
    title: "What Crust is",
    body: "Crust is the directory of professionals behind property decisions. Broker and appraiser licences are checked before they display, so you know who you are working with.",
  }),
  stratosphereMission: Object.freeze({
    title: "What Stratosphere is",
    body: "Stratosphere tracks market news, infrastructure progress, and neighborhood changes across Metro Manila. Switch to the radar map to explore updates district by district.",
  }),
  stratosphereWorkspace: Object.freeze({
    title: "About Stratosphere",
    body: "Articles give you in-depth market briefings, while community signals share quick updates from people in the field. Switch to the radar map to view both by location.",
  }),
  signalSources: Object.freeze({
    title: "Signal sources",
    body: "Community signals come directly from verified members sharing on-the-ground updates. ScoutIt Intel links to our research briefings and district data.",
  }),
  spatialRadar: Object.freeze({
    title: "Spatial radar",
    body: "Click the map or drag the pin to choose an area. Use the radius slider to see properties and updates within that distance.",
  }),
  priceBands: Object.freeze({
    title: "Price bands",
    body: "Properties are grouped into price tiers to help you browse easily. Exact prices, dues, and payment terms are listed on each property page.",
  }),
  neighborhoodIntel: Object.freeze({
    title: "Neighborhood intel",
    body: "Recent news, infrastructure progress, and zoning updates for the areas visible on your screen.",
  }),
  faqTiers: Object.freeze({
    title: "Who answers questions",
    body: "Gold answers come directly from confirmed property owners. Silver answers come from licensed brokers or appraisers. Bronze answers come from verified residents.",
  }),
  claimProperty: Object.freeze({
    title: "Claiming a listing",
    body: "If you own or represent this property, you can claim it to manage photos, specs, and inquiries. We check title documents privately before granting control.",
  }),
  proximityRadar: Object.freeze({
    title: "Search by distance",
    body: "Click the map or drag the pin to pick your center point. Adjust the slider to see properties within your preferred driving or walking range.",
  }),
  areaWatch: Object.freeze({
    title: "Area watch",
    body: "Follow a district to see new property listings and neighborhood updates at the top of your dashboard.",
  }),
  fieldBriefing: Object.freeze({
    title: "Field briefing",
    body: "A one-page walkthrough summary with property specs, estimated closing fees, and inspection notes. Unverified details are left blank.",
  }),
  listingStrength: Object.freeze({
    title: "Listing completeness",
    body: "Shows how much detail your listing has, such as floor plans, title checks, and utility info. More complete listings get seen by more buyers.",
  }),
  vaultMilestones: Object.freeze({
    title: "Badges and achievements",
    body: "You earn badges as you verify listings, publish accurate data, and complete transactions. Earned badges appear on your public profile.",
  }),
  bulkIngest: Object.freeze({
    title: "Bulk upload options",
    body: "Add multiple properties at once using Excel or CSV spreadsheets, or attach virtual tours and floor plans directly.",
  }),
});

export function getInfoTip(id) {
  return INFO_TIPS[id] || null;
}
