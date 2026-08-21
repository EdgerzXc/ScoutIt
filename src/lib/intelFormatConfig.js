// ═══════════════════════════════════════════════════════════════════════════
// INTEL FORMAT REGISTRY — Per-intelType configuration
// Mirrors chapterConfig.js structure for intelligence formats.
// Declares how each intel format opens, renders, degrades, and returns.
// ═══════════════════════════════════════════════════════════════════════════

export const INTEL_FORMATS = {
  DOSSIER: "dossier",
  SCROLLYTELLING: "scrollytelling",
  SIMULATION: "simulation",
  DEVELOPING: "developing",
  FEED: "feed",
  READER: "reader",
};

export const BASE_INTEL_FORMATS = [
  {
    id: "COMMERCIAL SIGNAL",
    format: INTEL_FORMATS.DOSSIER,
    status: "built",
    door: "Ch 06 Fine Print · Ch 08 Universe",
    doorChapterId: "hiddenintel",
    job: "An ordinance dropped. Does it hit my building?",
    why: "Numbered chapters with a progress rail, ending in the affected-space ledger.",
    returnsTo: "yourmove",
    config: {
      rail: true,
      map: true,
      affectedSpaces: true,
      returnsTo: "yourmove",
    },
    precedent: "app/layer/stratosphere/page.js — chapter01...chapter08",
  },
  {
    id: "AREA GUIDE",
    format: INTEL_FORMATS.SCROLLYTELLING,
    status: "built",
    door: "Ch 04 The Block",
    doorChapterId: "whereto",
    job: "Explain this district to me — I only know the unit.",
    why: "The map pins itself and pans as the copy scrolls past.",
    returnsTo: "yourmove",
    config: {
      rail: false,
      map: "pinned",
      returnsTo: "yourmove",
    },
    precedent: "components/scrollytelling/ · MapLibre GL",
  },
  {
    id: "MARKET INTEL",
    format: INTEL_FORMATS.SIMULATION,
    status: "built",
    door: "Ch 10 Your Move · Ch 05 Build Plans",
    doorChapterId: "yourmove",
    job: "What happens to my yield if rates move 100bps?",
    why: "The value is the what-if, not prose. Inputs the reader moves; outputs recompute.",
    returnsTo: "yourmove",
    config: {
      inputs: "declared in blocks[]",
      returnsTo: "yourmove",
    },
    precedent: "lib/affordability.js · lib/resaTax.js",
  },
  {
    id: "DEVELOPING",
    format: INTEL_FORMATS.DEVELOPING,
    status: "built",
    door: "Ch 08 Property Universe",
    doorChapterId: "universe",
    job: "Is the station actually being built, or is it still a rendering?",
    why: "Fixed timeline, newest update on top, each entry dated and sourced.",
    returnsTo: "yourmove",
    config: {
      rail: true,
      updates: "reverse-chron",
      returnsTo: "yourmove",
    },
    precedent: "Stratosphere chapter05 timeline",
  },
  {
    id: "INSIGHT",
    format: INTEL_FORMATS.FEED,
    status: "built",
    door: "Radar only — never from a property",
    doorChapterId: null,
    job: "Short opinionated takes. Volume and serendipity.",
    why: "The one category where endless scroll is honest. Not part of the decision loop.",
    returnsTo: null,
    config: {
      affectedSpaces: false,
      returnsTo: false,
    },
    precedent: "components/intel/OSINTFlashTicker.js",
  },
  {
    id: "BRIEFING",
    format: INTEL_FORMATS.READER,
    status: "built",
    door: "Any chapter, as the short answer",
    doorChapterId: "space",
    job: "Dated, factual, two-minute read.",
    why: "The universal fallback. Every other format degrades to this one.",
    returnsTo: "yourmove",
    config: {
      affectedSpaces: true,
      returnsTo: "yourmove",
    },
    precedent: "components/intel/ArticleBlocks.js",
  },
];

/**
 * Resolves the configuration for a given intel type, with universal fallback to BRIEFING (Reader).
 * @param {string} intelType 
 * @returns {Object} Format configuration definition
 */
export function getIntelFormatConfig(intelType) {
  if (!intelType) return BASE_INTEL_FORMATS.find(f => f.id === "BRIEFING");
  const norm = intelType.toUpperCase().trim();
  const matched = BASE_INTEL_FORMATS.find(f => f.id === norm);
  return matched || BASE_INTEL_FORMATS.find(f => f.id === "BRIEFING");
}
