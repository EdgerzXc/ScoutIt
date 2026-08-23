const DAY_MS = 24 * 60 * 60 * 1000;

export const PROFESSIONAL_CATEGORIES = Object.freeze({
  broker: {
    key: "broker",
    source: "airtable",
    eyebrow: "Layer 03.1 // Property advisory",
    title: "Verified Advisors",
    description: "Public advisor profiles with named credentials and specialties. Missing evidence stays absent.",
    emptyTitle: "No public advisors yet",
    emptyCopy: "Approved advisor profiles will appear here when their public evidence is ready.",
    actionLabel: "View advisor",
  },
  photographer: {
    key: "photographer",
    source: "supabase",
    eyebrow: "Layer 03.2 // Space photography",
    title: "Space Photographers",
    description: "Public portfolios for professionals who document architecture, interiors, and places.",
    emptyTitle: "The founding lens roster is being assembled",
    emptyCopy: "Public photographer profiles will appear here when their owners make them available.",
    actionLabel: "View profile",
  },
  researcher: {
    key: "researcher",
    source: "supabase",
    eyebrow: "Layer 03.3 // Spatial research",
    title: "Space Researchers",
    description: "Public profiles for researchers who turn place, market, and site evidence into useful decisions.",
    emptyTitle: "The founding research roster is being assembled",
    emptyCopy: "Public researcher profiles will appear here when their owners make them available.",
    actionLabel: "View profile",
  },
  event_planner: {
    key: "event_planner",
    source: "supabase",
    eyebrow: "Layer 03.4 // Event design",
    title: "Event Professionals",
    description: "Public profiles for professionals who plan how people gather, move, and experience a space.",
    emptyTitle: "The founding event roster is being assembled",
    emptyCopy: "Public event-professional profiles will appear here when their owners make them available.",
    actionLabel: "View profile",
  },
});

export const PUBLIC_BADGE_LABELS = Object.freeze({
  pioneer: "The Pioneer",
  master_scout: "Master Scout",
  guildmaster: "The Guildmaster",
  spatial_analyst: "Spatial Analyst",
  dealmaker: "Dealmaker",
});

const compact = (values) => values.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim());
const list = (value) => Array.isArray(value) ? compact(value) : compact([value]);

export function activitySignal({ label, observedAt, source, maxAgeDays = 30 }, now = new Date()) {
  if (!label || !source || !observedAt) return null;
  const observed = new Date(observedAt);
  if (Number.isNaN(observed.getTime())) return null;
  const ageDays = Math.floor((now.getTime() - observed.getTime()) / DAY_MS);
  if (ageDays < 0 || ageDays > maxAgeDays) return null;
  return { label, observedAt: observed.toISOString(), source, maxAgeDays };
}

export function normalizeAirtableBroker(broker) {
  const id = String(broker?.id || "").trim();
  const name = String(broker?.name || "").trim();
  if (!id || !name) return null;
  const credentials = broker.licenseVerified
    ? [{ label: "PRC verified", detail: broker.license || "Credential checked by ScoutIt", source: "Airtable · License_Verified" }]
    : [];
  return {
    key: `airtable:broker:${id}`,
    source: "airtable",
    category: "broker",
    name,
    canonicalPath: `/brokers/${encodeURIComponent(id)}`,
    headline: String(broker.title || "").trim(),
    summary: String(broker.bio || "").trim(),
    location: String(broker.location || "").trim(),
    image: String(broker.image || "").trim(),
    specialties: compact([broker.specialty, ...list(broker.niche)]),
    credentials,
    badges: [],
    accomplishments: [],
    experience: [],
    availability: null,
    activity: null,
    isExample: broker.isExample === true,
    isPilot: false,
  };
}

export function normalizeSupabaseProfessional(profile, category) {
  const config = PROFESSIONAL_CATEGORIES[category];
  const id = String(profile?.id || "").trim();
  const name = String(profile?.display_name || "").trim();
  if (!config || config.source !== "supabase" || !id || !name) return null;
  const credentials = category === "broker" && profile.prc_verified === true
    ? [{ label: "PRC verified", detail: profile.prc_license || "Credential checked by ScoutIt", source: "Supabase · prc_verified" }]
    : [];
  return {
    key: `supabase:${category}:${id}`,
    source: "supabase",
    category,
    name,
    canonicalPath: `/profile/${encodeURIComponent(id)}`,
    headline: String(profile.headline || "").trim(),
    summary: String(profile.bio || "").trim(),
    location: String(profile.location || "").trim(),
    image: String(profile.avatar_url || "").trim(),
    specialties: list(profile.service),
    credentials,
    badges: (Array.isArray(profile.badges) ? profile.badges : [])
      .map((badge) => typeof badge === "string" ? { id: badge } : badge)
      .filter((badge) => badge?.id && PUBLIC_BADGE_LABELS[badge.id])
      .map((badge) => ({ ...badge, label: PUBLIC_BADGE_LABELS[badge.id], source: "ScoutIt badge grant" })),
    accomplishments: [],
    experience: [],
    availability: typeof profile.provider_availability === "boolean"
      ? { available: profile.provider_availability, source: "Owner-declared availability" }
      : null,
    activity: null,
    isExample: profile.is_example_account === true,
    isPilot: profile.is_pilot_participant === true,
  };
}

export function directoryFacets(records) {
  return {
    specialties: [...new Set(records.flatMap((record) => record.specialties || []))].sort(),
    locations: [...new Set(records.map((record) => record.location).filter(Boolean))].sort(),
  };
}

export function filterAndSortProfessionals(records, { query = "", specialty = "", location = "", sort = "name" } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  const filtered = records.filter((record) => {
    const haystack = [record.name, record.headline, record.summary, record.location, ...(record.specialties || [])].join(" ").toLocaleLowerCase();
    return (!needle || haystack.includes(needle))
      && (!specialty || record.specialties?.includes(specialty))
      && (!location || record.location === location);
  });
  return [...filtered].sort((a, b) => {
    if (sort === "credential") {
      const evidenceDelta = (b.credentials?.length || 0) - (a.credentials?.length || 0);
      if (evidenceDelta) return evidenceDelta;
    }
    if (sort === "availability") {
      const availableDelta = Number(b.availability?.available === true) - Number(a.availability?.available === true);
      if (availableDelta) return availableDelta;
    }
    return a.name.localeCompare(b.name);
  });
}
