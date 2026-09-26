import { daysToOpening, effectiveLifecycle, LIFECYCLE } from "./pipelineLifecycle";

export const BUILDING_STAGES = [
  { key: "all-buildings", label: "All Buildings", hint: "All monitored building developments" },
  { key: "planned", label: "Planned", hint: "Proposed or approved; site preparation" },
  { key: "building", label: "Under Construction", hint: "Active structural construction" },
  { key: "opening", label: "Opening Soon", hint: "Opening today or within 30 days" },
  { key: "finished", label: "Completed", hint: "Marked complete or turned over" },
];

export const TREND_STAGES = [
  { key: "all-trends", label: "All Trends", hint: "All market, zoning, and spatial signals" },
  { key: "demand", label: "Market Demand", hint: "Tenant absorption and residential surges" },
  { key: "zoning", label: "Policy & Zoning", hint: "LEED mandates, ordinances, and masterplans" },
  { key: "infrastructure", label: "Infrastructure", hint: "Transit corridors, microgrids, and logistics" },
  { key: "capital", label: "Capital & Yields", hint: "Land acquisitions, ARR, and investment flows" },
];

// Preserved for backwards compatibility with existing consumers
export const JOURNEY_STAGES = [
  { key: "all", label: "All updates", hint: "Demand, articles and building updates" },
  ...BUILDING_STAGES.filter((s) => s.key !== "all-buildings"),
];

export const ALL_JOURNEY_STAGES = [
  { key: "all", label: "All Updates", hint: "Complete intelligence feed across all tracks" },
  ...BUILDING_STAGES,
  ...TREND_STAGES,
];

/**
 * Checks if a signal or article is a building project vs a trend.
 */
export function isBuildingArticle(signal, now = new Date()) {
  if (!signal) return false;
  if (signal.lifecycle || signal.openingDate) return true;
  if (signal.intelType === "PIPELINE WATCH" || signal.intelType === "BUILDING") return true;
  return stageForSignal(signal, now) !== null;
}

/**
 * Determines trend subcategory for market trend articles.
 */
export function trendCategoryForArticle(signal) {
  if (!signal) return "demand";
  const text = `${signal.title || ""} ${signal.excerpt || ""} ${signal.snippet || ""} ${signal.event || ""} ${signal.category || ""}`.toLowerCase();

  if (
    signal.event?.toLowerCase() === "zoning" ||
    text.includes("zoning") ||
    text.includes("ordinance") ||
    text.includes("leed") ||
    text.includes("policy") ||
    text.includes("peza")
  ) {
    return "zoning";
  }

  if (
    signal.event?.toLowerCase() === "infrastructure" ||
    signal.event?.toLowerCase() === "transit" ||
    text.includes("transit") ||
    text.includes("rail") ||
    text.includes("highway") ||
    text.includes("microgrid") ||
    text.includes("corridor") ||
    text.includes("connectivity")
  ) {
    return "infrastructure";
  }

  if (
    text.includes("yield") ||
    text.includes("land rush") ||
    text.includes("acquisition") ||
    text.includes("arr") ||
    text.includes("capital") ||
    text.includes("investment") ||
    text.includes("pricing")
  ) {
    return "capital";
  }

  return "demand";
}

/**
 * Returns the track and subcategory metadata for display badges and filtering.
 */
export function getArticleClassification(signal, now = new Date()) {
  const isBuilding = isBuildingArticle(signal, now);
  if (isBuilding) {
    const stage = stageForSignal(signal, now) || "planned";
    const meta = BUILDING_STAGES.find((s) => s.key === stage);
    return {
      domain: "building",
      domainLabel: "Building",
      substage: stage,
      substageLabel: meta?.label || "Project Update",
      badgeClass: "badge-building",
    };
  }

  const trendCat = trendCategoryForArticle(signal);
  const meta = TREND_STAGES.find((s) => s.key === trendCat);
  return {
    domain: "trend",
    domainLabel: "Market Trend",
    substage: trendCat,
    substageLabel: meta?.label || "Market Trend",
    badgeClass: `badge-trend-${trendCat}`,
  };
}

export function stageForSignal(signal, now = new Date()) {
  const lifecycle = effectiveLifecycle(signal, now);
  if (lifecycle === LIFECYCLE.COMPLETED) return "finished";
  const days = daysToOpening(signal, now);
  if (days !== null && days >= 0 && days <= 30 && lifecycle) return "opening";
  if (lifecycle === LIFECYCLE.OPENING_TODAY) return "opening";
  if (lifecycle === LIFECYCLE.CONSTRUCTION) return "building";
  if (lifecycle === LIFECYCLE.PLANNED) return "planned";
  return null;
}

export function matchesJourneyStage(signal, stage, now = new Date()) {
  if (!stage || stage === "all") return true;

  if (stage === "buildings" || stage === "all-buildings") {
    return isBuildingArticle(signal, now);
  }

  if (stage === "trends" || stage === "all-trends") {
    return !isBuildingArticle(signal, now);
  }

  // Building stage matching
  if (BUILDING_STAGES.some((s) => s.key === stage)) {
    return stageForSignal(signal, now) === stage;
  }

  // Trend subcategory matching
  if (TREND_STAGES.some((s) => s.key === stage)) {
    if (isBuildingArticle(signal, now)) return false;
    return trendCategoryForArticle(signal) === stage;
  }

  return false;
}

export function validJourneyStage(value) {
  if (!value) return "all";
  if (value === "buildings" || value === "trends") return value;
  return ALL_JOURNEY_STAGES.some((stage) => stage.key === value) ? value : "all";
}
