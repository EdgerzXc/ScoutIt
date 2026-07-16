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

// The structured "Market Intelligence Briefing" text used by every Share
// button (native share sheet + ShareModal). 100% factual.
export function buildShareText(property, url) {
  const f = extractFacts(property);
  const specs = factSpecs(f);
  const locTag = f.location
    ? "#" + String(f.location).split(",")[0].replace(/[^a-zA-Z0-9]/g, "")
    : "";
  const catTag = "#" + String(f.category).replace(/[^a-zA-Z0-9]/g, "");

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
    "Verified specs and the complete operational briefing are on ScoutIt, the Philippines' spatial commerce platform.",
    "",
    `Access the full dossier:`,
    url,
    "",
    `#ScoutIt ${catTag} ${locTag} #RealEstatePH`.replace(/\s+/g, " ").trim()
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
