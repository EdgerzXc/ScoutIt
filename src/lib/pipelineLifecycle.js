// ═══════════════════════════════════════════════════════════════
// Pipeline lifecycle — Planned / Under Construction / Opening Today.
//
// Layer 02 signals already carry free-text `status` badges ("PERMIT
// FILED"). Lifecycle is the small closed vocabulary for supply still in
// the pipeline. Two rules keep it honest:
//
// 1. OPENING TODAY is computed from `openingDate`, never stored. A stored
//    "opening today" string rots within 24 hours.
// 2. Unknown shapes resolve to null, never to a default status. A signal
//    without lifecycle data is simply not a pipeline signal.
// ═══════════════════════════════════════════════════════════════

export const LIFECYCLE = {
  PLANNED: "PLANNED",
  CONSTRUCTION: "UNDER CONSTRUCTION",
  OPENING_TODAY: "OPENING TODAY",
};

// Local calendar day as YYYY-MM-DD. Local, not UTC: "opening today" is
// a Philippines-day concept and a UTC date flips at 8am Manila time.
export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeLifecycle(value) {
  const v = String(value || "").trim().toLowerCase().replace(/[_\s]+/g, " ");
  if (v === "planned") return LIFECYCLE.PLANNED;
  if (v === "construction" || v === "under construction") return LIFECYCLE.CONSTRUCTION;
  return null;
}

// Airtable date columns arrive as "YYYY-MM-DD"; datetime columns (and any
// future CMS shape) arrive as full ISO timestamps. Both mean the same day
// here, so normalize to the date prefix first. Time-of-day is deliberately
// discarded — "opening today" is a calendar-day concept, and comparing
// instants would flip the answer at midnight UTC (8am in Manila).
function openingDay(value) {
  if (typeof value !== "string") return null;
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// Canonical lifecycle vocabulary for staff input (OSINT form, AI JSON).
// Anything else resolves to "" — an unrecognized stage must never reach
// storage as a value the product then displays as fact.
export function normalizeLifecycleInput(value) {
  const v = String(value || "").trim().toLowerCase().replace(/[_\s]+/g, " ");
  if (v === "" || v === "none") return "";
  if (v === "planned") return "planned";
  if (v === "construction" || v === "under construction") return "construction";
  return "";
}

// Canonical opening-date for staff input. Accepts bare dates and ISO
// datetimes, returns YYYY-MM-DD or "" — never a near-miss string that a
// later reader mistakes for a real date. Impossible calendar dates are
// rejected here (JS rolls "2026-02-30" into March instead of failing),
// the same round-trip daysToOpening applies downstream.
export function normalizeOpeningDate(value) {
  const day = openingDay(value);
  if (!day) return "";
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(y, m - 1, d);
  if (
    Number.isNaN(t.getTime()) ||
    t.getFullYear() !== y ||
    t.getMonth() !== m - 1 ||
    t.getDate() !== d
  ) {
    return "";
  }
  return day;
}

// The displayed lifecycle for a signal, or null when it has none.
// An opening date of today wins over a stored lifecycle value.
export function effectiveLifecycle(signal, now = new Date()) {
  if (!signal || typeof signal !== "object") return null;
  const od = openingDay(signal.openingDate);
  if (od && od === todayISO(now)) {
    return LIFECYCLE.OPENING_TODAY;
  }
  return normalizeLifecycle(signal.lifecycle);
}

export function isPipelineSignal(signal, now = new Date()) {
  return effectiveLifecycle(signal, now) !== null;
}

// Filter helper for the Descent list. "all" (and anything unrecognized)
// means unfiltered — a bad filter value must never hide the feed.
export function filterByLifecycle(signals, lifecycle) {
  if (!Array.isArray(signals)) return [];
  if (lifecycle !== LIFECYCLE.PLANNED && lifecycle !== LIFECYCLE.CONSTRUCTION && lifecycle !== LIFECYCLE.OPENING_TODAY) {
    return signals;
  }
  const now = new Date();
  return signals.filter((s) => effectiveLifecycle(s, now) === lifecycle);
}

// ── Defining logic: what separates one pipeline property from another ──
// A badge alone does not define anything — a planned boutique café and a
// planned 60-storey tower would wear the same pill. Four derived readings
// (all computed, none stored as opinion) do the separating:
//
// 1. ATTENTION ORDER — what demands action now, not alphabetical.
// 2. TIMING — days to opening from a real date, or an honest "TBC".
// 3. OVERDUE — a past opening date with no completion on record. Rot is
//    the default state of every pipeline tracker; this names it instead.
// 4. EVIDENCE DEPTH — sourced (named source + date on record) vs thin.
//    Thin shells still list; they just cannot outrank sourced ones.

// Whole days from today (local) to openingDate. Null when there is no
// usable date. Negative means the date passed (see isOverdue).
export function daysToOpening(signal, now = new Date()) {
  const day = openingDay(signal?.openingDate);
  if (!day) return null;
  const [y, m, d] = day.split("-").map(Number);
  // JS Dates roll over ("2026-02-30" becomes March) instead of failing, so
  // validate the parts and round-trip them — a garbage date must read as
  // no date, never as a countdown to a wrong day.
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const target = new Date(y, m - 1, d);
  if (
    Number.isNaN(target.getTime()) ||
    target.getFullYear() !== y ||
    target.getMonth() !== m - 1 ||
    target.getDate() !== d
  ) {
    return null;
  }
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - startOfToday) / 86400000);
}

// A past opening date with the lifecycle still stuck pre-completion.
// Not a verdict on the building — a flag that the record needs a check.
export function isOverdue(signal, now = new Date()) {
  const days = daysToOpening(signal, now);
  if (days === null || days >= 0) return false;
  const lc = effectiveLifecycle(signal, now);
  return lc === LIFECYCLE.PLANNED || lc === LIFECYCLE.CONSTRUCTION;
}

// Sourced = a named source AND a date on record. Thin shells are still
// listed (coverage), but they sort below sourced ones within a stage.
export function evidenceDepth(signal) {
  const hasSource = Boolean(String(signal?.sourceName || "").trim());
  const hasDate = Boolean(String(signal?.date || signal?.openingDate || "").trim());
  return hasSource && hasDate ? "sourced" : "thin";
}

// Human timing line for a row. "TBC" is the honest answer when no date
// exists — never "soon", never a countdown to nothing. A passed date
// says the RECORD needs a check, never that the building failed.
export function timingLine(signal, now = new Date()) {
  const days = daysToOpening(signal, now);
  if (effectiveLifecycle(signal, now) === LIFECYCLE.OPENING_TODAY || days === 0) {
    return "Opens today";
  }
  if (days !== null && days > 0) {
    return days === 1 ? "Opens tomorrow" : `Opens in ${days} days`;
  }
  if (days !== null && days < 0) {
    return "Date passed · awaiting update";
  }
  return "Timeline TBC";
}

function stageRank(signal, now) {
  const lc = effectiveLifecycle(signal, now);
  if (lc === LIFECYCLE.OPENING_TODAY) return 0;
  if (lc === LIFECYCLE.CONSTRUCTION) return 1;
  if (lc === LIFECYCLE.PLANNED) return 2;
  return 3; // non-pipeline: after the pipeline block, original order kept
}

// Attention order for a pipeline-filtered view: opening now, then nearest
// dated opening, then undated, then planned; sourced above thin; stable
// otherwise (no reshuffling on ties — the feed must not jitter).
export function sortByAttention(signals, now = new Date()) {
  if (!Array.isArray(signals)) return [];
  return signals
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const ra = stageRank(a.s, now);
      const rb = stageRank(b.s, now);
      if (ra !== rb) return ra - rb;
      if (ra < 3) {
        const da = daysToOpening(a.s, now);
        const db = daysToOpening(b.s, now);
        const ka = da === null ? Number.MAX_SAFE_INTEGER : da;
        const kb = db === null ? Number.MAX_SAFE_INTEGER : db;
        if (ka !== kb) return ka - kb;
        const ea = evidenceDepth(a.s) === "sourced" ? 0 : 1;
        const eb = evidenceDepth(b.s) === "sourced" ? 0 : 1;
        if (ea !== eb) return ea - eb;
      }
      return a.i - b.i;
    })
    .map(({ s }) => s);
}

// Project live intel rows (Airtable/Supabase shape) onto the Descent
// signal shape. Only lifecycle-bearing rows cross over — ordinary intel
// keeps flowing to /intel and the homepage exactly as today. No status
// is invented: the lifecycle pill carries the stage, and rows without
// coordinates simply never beacon (the bridge skips them). Live rows
// override mock rows on slug collision — the record beats the sample.
export function liveIntelToSignals(intelList, now = new Date()) {
  if (!Array.isArray(intelList)) return [];
  const out = [];
  for (const item of intelList) {
    if (!item || typeof item !== "object") continue;
    const lifecycle = normalizeLifecycleInput(item.lifecycle);
    const openingDate = normalizeOpeningDate(item.openingDate || item.opening_date);
    const probe = { lifecycle, openingDate };
    if (effectiveLifecycle(probe, now) === null) continue;
    if (!item.slug || !item.title) continue;
    out.push({
      slug: item.slug,
      title: item.title,
      category: item.category || "",
      event: "Development",
      status: "",
      lifecycle,
      openingDate,
      intelType: item.intelType || "PIPELINE WATCH",
      date: item.date || "",
      city: item.city || "",
      region: item.region || "",
      excerpt: item.excerpt || "",
      image: item.image || "",
      sourceName: item.sourceName || "",
      sourceUrl: item.sourceUrl || "",
      isSample: false,
    });
  }
  return out;
}

// Merge live pipeline rows over mock signals. Same slug in both means
// the same story twice — the live record wins, the sample steps aside.
// Order: mocks keep their positions (existing feed untouched), live rows
// that override stay in place, brand-new live rows append at the end.
export function mergeLivePipeline(mockSignals, liveSignals) {
  const base = Array.isArray(mockSignals) ? [...mockSignals] : [];
  const live = Array.isArray(liveSignals) ? liveSignals : [];
  if (live.length === 0) return base;
  const liveBySlug = new Map(live.map((s) => [s.slug, s]));
  const merged = base.map((s) => liveBySlug.get(s.slug) || s);
  const baseSlugs = new Set(base.map((s) => s.slug));
  for (const s of live) {
    if (!baseSlugs.has(s.slug)) merged.push(s);
  }
  return merged;
}

// One-line pulse: the whole pipeline set at a glance. Only stages with a
// nonzero count appear, so an empty pipeline says nothing at all.
export function pipelinePulse(signals, now = new Date()) {
  const list = Array.isArray(signals) ? signals : [];
  let opening = 0;
  let rising = 0;
  let planned = 0;
  let overdue = 0;
  let counted = 0;
  let sampled = 0;
  for (const s of list) {
    const lc = effectiveLifecycle(s, now);
    if (lc === LIFECYCLE.OPENING_TODAY) opening += 1;
    else if (lc === LIFECYCLE.CONSTRUCTION) rising += 1;
    else if (lc === LIFECYCLE.PLANNED) planned += 1;
    else continue;
    counted += 1;
    if (s && s.isSample) sampled += 1;
    if (isOverdue(s, now)) overdue += 1;
  }
  // Sample provenance for the whole strip: a pulse over mock rows that
  // reads as verified market fact is the exact defect class the
  // isSample stamping exists to prevent.
  const sample = counted > 0 && sampled === counted ? "sample" : sampled > 0 ? "mixed" : null;
  return { opening, rising, planned, overdue, total: opening + rising + planned, sample };
}
