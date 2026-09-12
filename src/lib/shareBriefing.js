// ═══════════════════════════════════════════════════════════════
// Share Briefing — the ONE source of factual promotional copy.
//
// Every share/promote surface (property page Share button, owner card
// Share, the AI Promote fallback, and the /api/ai/promote fact sheet)
// builds its text here so the copy is always grounded in the listing's
// real data — never invented claims.
//
// COMPLIANCE: no monetary values ever appear in share copy. Money renders
// only in the property page's "Your Move" section (real-estate-law rule,
// same as directory cards).
// ═══════════════════════════════════════════════════════════════

// Parse `details` whether it arrives as an object or a JSON string.
function parseDetails(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// First non-empty value from a list of candidates.
function pick(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

// Extract a whitelisted, factual spec sheet from any property/unit shape
// the app passes around (Airtable card, Supabase row, detail object `d`).
export function extractFacts(p = {}) {
  const details = parseDetails(p.details);
  const catObj = p.cat || details.cat || {};

  const facts = {
    title: pick(p.title, details.title, "Premium Space"),
    category: pick(p.spaceCategory, p.category, p.property_type, details.spaceCategory, "Space"),
    location: pick(p.location, details.location, p.city, details.city),
    city: pick(p.city, details.city),
    sqm: pick(
      p.sqm, p.floor_sqm, p.Floor_Area_Sqm, p.CM_Total_GLA,
      details.Floor_Area_Sqm, details.CM_Total_GLA, details.RST_Floor_Area_Sqm,
      details.VEN_Floor_Area_Sqm, details.HOSP_GFA, details.floor_sqm
    ),
    beds: pick(p.beds, p.bedrooms, details.beds, details.RES_Bedrooms),
    baths: pick(p.baths, p.bathrooms, details.baths, details.RES_Bathrooms),
    seatingCapacity: pick(p.seating_capacity, details.seating_capacity),
    standingCapacity: pick(p.standing_capacity, details.standing_capacity),
    hostingCapacity: pick(p.hosting_capacity, details.hosting_capacity),
    accommodations: pick(p.accommodations, details.accommodations),
    buildingGrade: pick(
      catObj?.commercial?.buildingGrade, p.building_grade,
      details.Building_Grade, details.building_grade
    ),
    aestheticTag: pick(p.aestheticTag, details.aestheticTag),
    slug: pick(p.slug, p.id),
  };
  return facts;
}

// Category-aware factual spec fragments (mirrors the directory card logic:
// offices lead with grade, restaurants with seating, venues with capacity).
export function factSpecs(facts) {
  const cat = String(facts.category || "").toLowerCase();
  const out = [];
  const sqm = facts.sqm ? `${facts.sqm} sqm` : null;

  if (cat.includes("commercial") || cat.includes("office") || cat.includes("retail")) {
    if (facts.buildingGrade) out.push(`${facts.buildingGrade} building`);
    if (sqm) out.push(sqm);
  } else if (cat.includes("restaurant") || cat.includes("culinary")) {
    if (facts.seatingCapacity) out.push(`${facts.seatingCapacity} seats`);
    if (sqm) out.push(sqm);
  } else if (cat.includes("venue") || cat.includes("event")) {
    if (facts.seatingCapacity) out.push(`${facts.seatingCapacity} seated`);
    else if (facts.standingCapacity) out.push(`${facts.standingCapacity} pax`);
    if (sqm) out.push(sqm);
  } else if (cat.includes("hospitality")) {
    if (facts.hostingCapacity) out.push(`${facts.hostingCapacity} keys`);
    if (facts.accommodations) out.push(String(facts.accommodations));
    if (sqm) out.push(sqm);
  } else if (cat.includes("str")) {
    if (facts.beds) out.push(`${facts.beds} BR`);
    if (facts.accommodations) out.push(String(facts.accommodations));
    if (sqm) out.push(sqm);
  } else {
    if (facts.beds) out.push(`${facts.beds} BR`);
    if (facts.baths) out.push(`${facts.baths} bath`);
    if (sqm) out.push(sqm);
  }
  return out;
}

// How much measured substance does this listing actually carry?
//
// "MARKET INTELLIGENCE BRIEFING" is a promise. One E-Com Center (measured
// 2026-08-13) produced a briefing with exactly two bullets — Category and
// Location — because the listing has no recorded floor area, so factSpecs()
// returned nothing. A briefing header over near-nothing reads as a data
// platform with no data, which is worse for the brand than a shorter note.
//
// So the shape is chosen from the facts on hand. We do NOT pad, estimate, or
// infer a single specification to reach the richer shape (never render a number
// you cannot source) — a thin listing gets an honest short form, and the fix is
// owner data entry, not copywriting.
//
// Exported so this decision is directly testable rather than buried in string
// assembly.
export function briefingShape(facts) {
  return factSpecs(facts).length >= 1 ? "briefing" : "compact";
}

function hashTags(f) {
  const locTag = f.location
    ? "#" + String(f.location).split(",")[0].replace(/[^a-zA-Z0-9]/g, "")
    : "";
  const catTag = "#" + String(f.category).replace(/[^a-zA-Z0-9]/g, "");
  return `#ScoutIt ${catTag} ${locTag} #RealEstatePH`.replace(/\s+/g, " ").trim();
}

// ── X / Twitter length budget ──────────────────────────────────────────
// X replaces every URL with a t.co wrapper, so a link always costs 23
// characters no matter how long it really is. Measuring raw `.length`
// over-counts our UTM-tagged URLs by ~80 and would shorten copy that
// already fits.
export const X_LIMIT = 280;
const X_URL_WEIGHT = 23;

export function xLength(text, url) {
  const raw = String(text || "");
  if (!url || !raw.includes(url)) return raw.length;
  return raw.length - String(url).length + X_URL_WEIGHT;
}

// The structured "Market Intelligence Briefing" text used by every Share
// button (native share sheet + ShareModal). 100% factual.
function buildBriefingText(property, url) {
  const f = extractFacts(property);
  const specs = factSpecs(f);

  // ── Compact shape: no measured specs on record ──
  // States only what is true (title, category, where) and points at the
  // record, without promising a dossier of specifications behind the link.
  if (briefingShape(f) === "compact") {
    const compact = [`${f.title} — ${f.category}`];
    if (f.location) compact.push(f.location);
    compact.push(
      "",
      "Now on record at ScoutIt — property and space intelligence for the Philippines.",
      "",
      "View the listing:",
      url,
      "",
      hashTags(f)
    );
    return compact.join("\n");
  }

  // ── Briefing shape: at least one measured specification ──
  const lines = [
    "■ MARKET INTELLIGENCE BRIEFING",
    f.title,
    "",
    `▸ Category: ${f.category}`,
  ];
  if (f.location) lines.push(`▸ Location: ${f.location}`);
  specs.forEach((s) => lines.push(`▸ ${s.charAt(0).toUpperCase() + s.slice(1)}`));
  lines.push(
    "",
    "Structured specs and the complete operational briefing are on ScoutIt, the Philippine space intelligence platform.",
    "",
    `Access the full dossier:`,

    url,
    "",
    hashTags(f)
  );
  return lines.join("\n");
}

// Deterministic three-format promo pack. This is the always-works fallback
// behind /api/ai/promote (used when the AI key is missing or the AI fails)
// and it only states facts the listing actually carries.
export function buildPromoPack(property, link) {
  const f = extractFacts(property);
  const specs = factSpecs(f);
  const specLine = specs.join(" · ");
  const where = f.location || "the Philippines";
  const safeLink = link || "";

  const fastPitch = [
    `${f.title} — ${f.category}${specLine ? ` · ${specLine}` : ""}.`,
    f.location ? `${f.location}.` : null,
    `Full briefing on ScoutIt: ${safeLink}`,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 280);

  const executiveSummary = [
    `${f.title} is now documented on ScoutIt.`,
    ``,
    `Verified signals on record:`,
    `— Category: ${f.category}`,
    f.location ? `— Location: ${f.location}` : null,
    ...specs.map((s) => `— ${s.charAt(0).toUpperCase() + s.slice(1)}`),
    ``,
    `The complete operational briefing — specifications, positioning, and inquiry access — is maintained on ScoutIt.`,
    ``,
    `Review the dossier: ${safeLink}`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const editorialHook = [
    `Every space has a signal. ${f.title} sits in ${where}` +
      (specLine ? ` — ${specLine}` : "") +
      `, and its full record is now live on ScoutIt.`,
    ``,
    `No noise, no invented claims — just the documented specifications` +
      (f.aestheticTag ? ` and its ${String(f.aestheticTag).toLowerCase()} character` : "") +
      `, ready for anyone scouting their next move.`,
    ``,
    `Read the full briefing: ${safeLink}`,
  ].join("\n");

  return { fastPitch, executiveSummary, editorialHook };
}

// Progressively shorter shapes, tried in order until one fits the limit.
// Each one still states only facts the listing carries.
function buildTightText(property, url, shapes) {
  const f = extractFacts(property);
  const specs = factSpecs(f);
  const locTag = f.location
    ? "#" + String(f.location).split(",")[0].replace(/[^a-zA-Z0-9]/g, "")
    : "";

  const head = `${f.title} — ${f.category}`;
  const specLine = specs.join(" · ");

  const candidates = [
    // keep location and specs
    [head, f.location, specLine, "", url, "", `#ScoutIt ${locTag} #RealEstatePH`],
    // drop specs
    [head, f.location, "", url, "", `#ScoutIt ${locTag} #RealEstatePH`],
    // drop location line, keep the tag
    [head, "", url, "", `#ScoutIt #RealEstatePH`],
    // last resort: title and link only
    [head, "", url],
  ];

  for (const lines of candidates) {
    const text = lines
      .filter((l) => l !== undefined && l !== null && l !== false)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (shapes(text) <= X_LIMIT) return text;
  }
  return [head, url].join("\n");
}

/**
 * Share copy for a channel.
 *
 * `limit: "x"` measures with X's t.co rule and falls back through shorter
 * shapes until the post actually fits. Every other channel keeps the full
 * briefing unchanged — measured against the live catalogue, all five listings
 * overflowed X by 40-186 characters, so X was the only channel that needed it.
 */
export function buildShareText(property, url, { limit } = {}) {
  const full = buildBriefingText(property, url);
  if (limit !== "x") return full;
  if (xLength(full, url) <= X_LIMIT) return full;
  return buildTightText(property, url, (t) => xLength(t, url));
}
