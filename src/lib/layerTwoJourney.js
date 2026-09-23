import { daysToOpening, effectiveLifecycle, LIFECYCLE } from "./pipelineLifecycle";

export const JOURNEY_STAGES = [
  { key: "all", label: "All updates", hint: "Demand, articles and building updates" },
  { key: "planned", label: "Planned", hint: "Proposed or approved; work has not begun" },
  { key: "building", label: "Building", hint: "Construction is under way" },
  { key: "opening", label: "Opening", hint: "Opening today or within 30 days" },
  { key: "finished", label: "Finished", hint: "Marked complete by a source" },
];

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
  if (stage === "all") return true;
  return stageForSignal(signal, now) === stage;
}

export function validJourneyStage(value) {
  return JOURNEY_STAGES.some((stage) => stage.key === value) ? value : "all";
}
