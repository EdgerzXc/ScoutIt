// ═══════════════════════════════════════════════════════════════
// PROPERTY STRUCTURED DATA — Schema.org / AEO / GEO  (NEW_IDEAS.md §1)
//
// This is the layer that lets Google, Perplexity, SearchGPT and Gemini
// answer questions ABOUT a ScoutIt listing rather than merely link to it.
// Nobody in the Philippine market emits typed property schema, so this is
// the cheapest differentiator on the board.
//
// SHAPE: one @graph containing up to four connected nodes —
//   RealEstateListing  the listing itself (the page)
//   Accommodation/Place subtype  what is actually being offered
//     (SingleFamilyResidence, Apartment, CommercialProperty, Restaurant,
//      EventVenue, Hotel — chosen from the space category)
//   FAQPage            built from ANSWERED questions only
//   BreadcrumbList     discover → category → this listing
//
// COMPLIANCE — read before adding fields:
//   • No monetary values. Money renders only in the "Your Move" section
//     (real-estate-law rule, same as directory cards and share copy).
//     Emitting `offers.price` here would contradict the page and is the
//     kind of mismatch that earns a structured-data manual action.
//   • Honest Blank Rule. Every field is conditional. A missing spec is
//     omitted, never guessed and never zero-filled. Google penalises
//     structured data that doesn't match visible page content.
//   • FAQPage with no answered questions is INVALID and is itself a
//     manual-action risk. buildFaqPageNode returns null instead.
// ═══════════════════════════════════════════════════════════════

import { siteUrl } from "./siteUrl";
import { extractFacts } from "./shareBriefing";

// Space category → the schema.org type that best describes the asset.
// Order matters: the first substring hit wins, so "restaurant" is checked
// before the broader "commercial".
const CATEGORY_TYPE_RULES = [
  [["restaurant", "culinary"], "Restaurant"],
  [["venue", "event"], "EventVenue"],
  [["hospitality", "hotel", "resort"], "Hotel"],
  [["str", "short term", "short-term"], "LodgingBusiness"],
  [["office", "commercial", "retail", "industrial", "warehouse"], "CommercialProperty"],
  [["condo", "apartment", "unit"], "Apartment"],
  [["house", "villa", "townhouse", "residential"], "SingleFamilyResidence"],
];

/**
 * Chooses the schema.org type for the asset being offered.
 * @param {string} spaceCategory
 * @returns {string}
 */
export function schemaTypeForCategory(spaceCategory) {
  const c = String(spaceCategory || "").toLowerCase();
  for (const [needles, type] of CATEGORY_TYPE_RULES) {
    if (needles.some((n) => c.includes(n))) return type;
  }
  return "Residence";
}

// Drops keys whose value is empty, so no node ever carries a blank field.
function compact(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function toNumber(v) {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * The asset node — what is actually being offered.
 * @param {object} match property record
 * @param {string} canonicalUrl
 * @returns {object}
 */
function buildAssetNode(match, canonicalUrl) {
  const facts = extractFacts(match);
  const type = schemaTypeForCategory(facts.category);

  const node = {
    "@type": type,
    "@id": `${canonicalUrl}#asset`,
    name: facts.title,
  };

  if (facts.location || facts.city) {
    node.address = compact({
      "@type": "PostalAddress",
      addressLocality: facts.city || undefined,
      streetAddress: facts.location || undefined,
      addressRegion: "Metro Manila",
      addressCountry: "PH",
    });
  }

  // Coordinates come off the Airtable record as [lat, lng] after the
  // CMS proxy geocodes a string location.
  const coords = Array.isArray(match.coordinates) ? match.coordinates : null;
  if (coords && coords.length === 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
    node.geo = { "@type": "GeoCoordinates", latitude: coords[0], longitude: coords[1] };
  }

  const sqm = toNumber(facts.sqm);
  if (sqm) {
    node.floorSize = { "@type": "QuantitativeValue", value: sqm, unitCode: "MTK" };
  }

  // Residential-only properties. schema.org only defines these on
  // Accommodation subtypes, so don't emit them on a Restaurant node.
  if (type === "SingleFamilyResidence" || type === "Apartment" || type === "Residence") {
    const beds = toNumber(facts.beds);
    const baths = toNumber(facts.baths);
    if (beds) node.numberOfBedrooms = beds;
    if (baths) node.numberOfBathroomsTotal = baths;
  }

  // Capacity maps to maximumAttendeeCapacity on venues and event spaces.
  if (type === "EventVenue" || type === "Restaurant") {
    const seated = toNumber(facts.seatingCapacity);
    const standing = toNumber(facts.standingCapacity);
    const capacity = seated || standing;
    if (capacity) node.maximumAttendeeCapacity = capacity;
  }

  if (type === "Hotel" || type === "LodgingBusiness") {
    const rooms = toNumber(facts.accommodations);
    if (rooms) node.numberOfRooms = rooms;
  }

  return compact(node);
}

/**
 * The listing node — the page itself.
 * @returns {object}
 */
function buildListingNode(match, canonicalUrl, assetId) {
  const facts = extractFacts(match);
  const photos = Array.isArray(match.photos)
    ? match.photos.filter(Boolean).slice(0, 6)
    : [match.photo || match.image].filter(Boolean);

  return compact({
    "@type": "RealEstateListing",
    "@id": `${canonicalUrl}#listing`,
    name: facts.title,
    url: canonicalUrl,
    description: match.seo_description || undefined,
    image: photos.length ? photos : undefined,
    // NOTE: deliberately no `offers` node. See the compliance block above.
    mainEntity: assetId ? { "@id": assetId } : undefined,
    datePosted: match.created_at || match.createdTime || undefined,
    provider: {
      "@type": "Organization",
      name: "ScoutIt",
      url: siteUrl("/"),
    },
  });
}

/**
 * FAQPage node built from answered questions.
 *
 * Returns null when there are no answered questions — an empty FAQPage is
 * invalid structured data and a manual-action risk, so emitting nothing is
 * strictly better than emitting a shell.
 *
 * @param {Array<{question: string, answers: Array<{text: string, tier: string}>}>} faqs
 * @param {string} canonicalUrl
 * @returns {object|null}
 */
export function buildFaqPageNode(faqs, canonicalUrl) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  const TIER_RANK = { gold: 0, silver: 1, bronze: 2 };

  const entities = faqs
    .map((faq) => {
      const answers = Array.isArray(faq.answers) ? faq.answers : [];
      if (answers.length === 0) return null;

      // Highest authority wins — an owner's answer outranks a resident's.
      const best = [...answers].sort(
        (a, b) => (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9),
      )[0];

      const question = String(faq.question || "").trim();
      const answer = String(best?.text || "").trim();
      if (!question || !answer) return null;

      return {
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      };
    })
    .filter(Boolean);

  if (entities.length === 0) return null;

  return {
    "@type": "FAQPage",
    "@id": `${canonicalUrl}#faq`,
    mainEntity: entities,
  };
}

/**
 * Breadcrumb trail. Cheap, and it changes how the result renders in SERPs.
 */
function buildBreadcrumbNode(match, canonicalUrl) {
  const facts = extractFacts(match);
  const items = [
    { "@type": "ListItem", position: 1, name: "Discover", item: siteUrl("/discover") },
  ];

  if (facts.category) {
    items.push({ "@type": "ListItem", position: 2, name: facts.category });
  }
  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: facts.title,
    item: canonicalUrl,
  });

  return { "@type": "BreadcrumbList", "@id": `${canonicalUrl}#breadcrumb`, itemListElement: items };
}

/**
 * Builds the complete @graph for a property page.
 *
 * @param {object} match - the property record (Airtable shape)
 * @param {string} slugOrId - route param, used only if the record has no slug
 * @param {Array} faqs - answered FAQ threads, may be empty
 * @returns {string} JSON string ready for a ld+json script tag
 */
export function buildPropertyJsonLd(match, slugOrId, faqs = []) {
  const canonicalUrl = siteUrl(`/property/${match.slug || slugOrId}`);

  const asset = buildAssetNode(match, canonicalUrl);
  const listing = buildListingNode(match, canonicalUrl, asset["@id"]);
  const faqPage = buildFaqPageNode(faqs, canonicalUrl);
  const breadcrumb = buildBreadcrumbNode(match, canonicalUrl);

  const graph = [listing, asset, breadcrumb];
  if (faqPage) graph.push(faqPage);

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

/**
 * Merges a hand-written seo_json_ld override with the generated FAQPage.
 *
 * An operator who hand-writes schema for a flagship listing shouldn't lose
 * the FAQ rich-result eligibility that the owner earned by answering
 * questions. If the override is unparseable we return it untouched rather
 * than dropping their work.
 *
 * @param {string} overrideJson - raw seo_json_ld from the CMS
 * @param {Array} faqs
 * @param {string} canonicalUrl
 * @returns {string}
 */
export function mergeFaqIntoOverride(overrideJson, faqs, canonicalUrl) {
  const faqPage = buildFaqPageNode(faqs, canonicalUrl);
  if (!faqPage) return overrideJson;

  try {
    const parsed = JSON.parse(overrideJson);

    if (Array.isArray(parsed["@graph"])) {
      // Don't double up if the operator already wrote their own FAQPage.
      if (parsed["@graph"].some((n) => n?.["@type"] === "FAQPage")) return overrideJson;
      parsed["@graph"].push(faqPage);
      return JSON.stringify(parsed);
    }

    if (Array.isArray(parsed)) {
      if (parsed.some((n) => n?.["@type"] === "FAQPage")) return overrideJson;
      return JSON.stringify([...parsed, faqPage]);
    }

    if (parsed && typeof parsed === "object") {
      if (parsed["@type"] === "FAQPage") return overrideJson;
      const context = parsed["@context"] || "https://schema.org";
      const bare = { ...parsed };
      delete bare["@context"];
      return JSON.stringify({ "@context": context, "@graph": [bare, faqPage] });
    }

    return overrideJson;
  } catch {
    // Malformed override — leave it exactly as the operator wrote it.
    return overrideJson;
  }
}

export default buildPropertyJsonLd;
