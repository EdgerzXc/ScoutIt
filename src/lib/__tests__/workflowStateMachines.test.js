import {
  PLANNED_WORKFLOW_STATE_MACHINES,
  WORKFLOW_STATE_MACHINES,
  canTransitionWorkflow,
  flattenWorkflowTransitions,
} from "../workflowStateMachines";

describe("workflow state-machine contracts", () => {
  it("allows only the persisted inquiry transitions", () => {
    expect(canTransitionWorkflow("inquiry", "pending", "accepted")).toBe(true);
    expect(canTransitionWorkflow("inquiry", "pending", "withdrawn")).toBe(true);
    expect(canTransitionWorkflow("inquiry", "accepted", "closed")).toBe(true);
    expect(canTransitionWorkflow("inquiry", "closed", "accepted")).toBe(false);
    expect(canTransitionWorkflow("inquiry", "accepted", "withdrawn")).toBe(false);
  });

  it("prevents viewing states from skipping required milestones", () => {
    expect(canTransitionWorkflow("viewing", "pending", "confirmed")).toBe(true);
    expect(canTransitionWorkflow("viewing", "pending", "completed")).toBe(false);
    expect(canTransitionWorkflow("viewing", "confirmed", "completed")).toBe(true);
    expect(canTransitionWorkflow("viewing", "completed", "confirmed")).toBe(false);
  });

  it("keeps planned offer and negotiation states outside the runtime registry", () => {
    const implemented = flattenWorkflowTransitions(WORKFLOW_STATE_MACHINES);
    const planned = flattenWorkflowTransitions(PLANNED_WORKFLOW_STATE_MACHINES);

    expect(implemented.some((item) => item.stateMachineId === "offer.lifecycle")).toBe(false);
    expect(planned.some((item) => item.stateMachineId === "offer.lifecycle")).toBe(true);
    expect(planned.every((item) => item.status === "NOT_STARTED")).toBe(true);
  });
});