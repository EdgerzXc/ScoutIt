// Shared logic for the Unit Master Page + the unit editor. Pure functions so
// both the public page and the dashboard editor compute capacity/teasers the
// same way.

// Rough co-working density: ~5 sqm per seat including circulation + shared
// space. It's an ESTIMATE shown as "~fits N" — the owner can always override
// with an explicit capacity_seats per unit or per scenario.
export const DEFAULT_SQM_PER_SEAT = 5;

export const UNIT_TYPES = [
  { value: "private_office", label: "Private Office" },
  { value: "dedicated_desks", label: "Dedicated Desks" },
  { value: "suite", label: "Suite" },
  { value: "whole_floor", label: "Whole Floor" },
  { value: "retail", label: "Retail / Storefront" },
  { value: "other", label: "Other" },
];

export function unitTypeLabel(value) {
  return UNIT_TYPES.find((t) => t.value === value)?.label || "";
}

function toSqm(v) {
  const n = Number(String(v ?? "").replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Auto-estimate seat capacity from an area. Returns null when area is unknown.
export function estimateCapacity(sqm, ratio = DEFAULT_SQM_PER_SEAT) {
  const n = toSqm(sqm);
  if (!n) return null;
  return Math.max(1, Math.round(n / ratio));
}

// Effective capacity for a unit: explicit override wins, else the estimate.
// Returns { value, estimated } so the UI can label estimates as "~N".
export function unitCapacity(unit) {
  const manual = unit?.details?.capacity_seats;
  const manualNum = manual != null && String(manual).trim() !== "" ? Number(manual) : null;
  if (Number.isFinite(manualNum) && manualNum > 0) {
    return { value: manualNum, estimated: false };
  }
  const est = estimateCapacity(unit?.size ?? unit?.size_sqm);
  return est != null ? { value: est, estimated: true } : null;
}

// Effective capacity for one subdivision scenario cut.
export function scenarioCapacity(scenario) {
  const manual = scenario?.capacity_each;
  const manualNum = manual != null && String(manual).trim() !== "" ? Number(manual) : null;
  if (Number.isFinite(manualNum) && manualNum > 0) {
    return { value: manualNum, estimated: false };
  }
  const est = estimateCapacity(scenario?.sqm_each);
  return est != null ? { value: est, estimated: true } : null;
}

// Whether a unit is more than a bare inventory row — i.e. worth a clickable
// Unit Master Page + the gold Chapter-07 teaser. True when it's delegated to an
// operator, carries subdivision scenarios, has a floor plan, or has authored
// co-working detail (type / differentiator).
export function hasInteractiveUnitPage(unit) {
  if (!unit) return false;
  const d = unit.details || {};
  const scenarios = unit.subdivision_scenarios || unit.subdivisionScenarios || [];
  return Boolean(
    unit.operator_id ||
      unit.operator_display_name ||
      (Array.isArray(scenarios) && scenarios.length > 0) ||
      d.floor_plan_2d_url ||
      d.floor_plan_3d_data ||
      d.differentiator ||
      d.unit_type
  );
}

// Whether a unit has 3D/spatial media (drives the "EXPLORE 3D SPACE ✦" label
// vs the plainer "VIEW SUITE →").
export function hasSpatial3D(unit) {
  const d = unit?.details || {};
  const scenarios = unit?.subdivision_scenarios || unit?.subdivisionScenarios || [];
  return Boolean(
    d.floor_plan_3d_data ||
      (Array.isArray(scenarios) && scenarios.some((s) => s?.floor_plan_3d_data))
  );
}

// What's actually waiting on this unit's Master Page — short chips shown as
// the FIRST thing on the unit card so buyers know why to tap through.
// Chapter 07 (both flows) renders these; keep labels short (mobile chips).
export function unitMasterPageOverview(unit) {
  if (!unit) return [];
  const d = unit.details || {};
  const scenarios = unit.subdivision_scenarios || unit.subdivisionScenarios || [];
  const items = [];

  if (hasSpatial3D(unit)) items.push("3D walkthrough");
  if (d.floor_plan_2d_url) items.push("Floor plan");
  if (Array.isArray(scenarios) && scenarios.length > 0) {
    items.push(`${scenarios.length} space ${scenarios.length === 1 ? "scenario" : "scenarios"}`);
  }
  const cap = unitCapacity(unit);
  if (cap) items.push(`Fits ${cap.estimated ? "~" : ""}${cap.value}`);
  const typeLabel = unitTypeLabel(d.unit_type);
  if (typeLabel) items.push(typeLabel);
  if (unit.operator_display_name) items.push(`Run by ${unit.operator_display_name}`);
  else if (unit.operator_id) items.push("Operator on board");
  if (d.differentiator) items.push("Owner's notes");

  return items;
}

// Display formatting for owner-entered unit prices, which arrive as raw
// strings/numbers ("150000000") and used to render unformatted. Numbers get
// peso-grouped; anything already formatted ("₱85k/mo") passes through.
export function formatUnitPrice(price) {
  if (price == null || String(price).trim() === "") return "";
  const raw = String(price).trim();
  const n = Number(raw.replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0 || /[^\d.,\s]/.test(raw)) return raw;
  return `₱${n.toLocaleString("en-PH")}`;
}
