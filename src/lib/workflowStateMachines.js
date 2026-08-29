export const WORKFLOW_STATE_MACHINES = Object.freeze({
  inquiry: Object.freeze({
    id: "inquiry.lifecycle",
    source: "src/app/api/deals/[id]/route.js",
    transitions: Object.freeze({
      pending: Object.freeze(["accepted", "declined", "withdrawn", "reported"]),
      connected: Object.freeze(["accepted", "declined", "reported"]),
      accepted: Object.freeze(["closed", "reported"]),
    }),
  }),
  viewing: Object.freeze({
    id: "viewing.lifecycle",
    source: "src/app/api/viewing-appointments/[id]/route.js",
    transitions: Object.freeze({
      // A reschedule returns a confirmed viewing to `pending`: the host agreed
      // to a specific time, so a new time needs a new confirmation. That edge
      // is enforced by the reschedule branch of the PATCH route, which runs the
      // availability gate rather than this table.
      pending: Object.freeze(["confirmed", "cancelled"]),
      confirmed: Object.freeze(["completed", "cancelled", "pending"]),
    }),
  }),
});

export const PLANNED_WORKFLOW_STATE_MACHINES = Object.freeze({
  offer: Object.freeze({
    id: "offer.lifecycle",
    status: "NOT_STARTED",
    transitions: Object.freeze({
      draft: Object.freeze(["submitted"]),
      submitted: Object.freeze(["accepted", "countered", "rejected", "expired", "withdrawn"]),
    }),
  }),
  negotiation: Object.freeze({
    id: "deal.negotiation",
    status: "NOT_STARTED",
    transitions: Object.freeze({
      open: Object.freeze(["negotiating"]),
      negotiating: Object.freeze(["agreed"]),
      agreed: Object.freeze(["handshake_pending"]),
    }),
  }),
});

export function canTransitionWorkflow(machineName, fromState, toState) {
  const machine = WORKFLOW_STATE_MACHINES[machineName];
  if (!machine) return false;
  const from = String(fromState || "").trim().toLowerCase();
  const to = String(toState || "").trim().toLowerCase();
  return machine.transitions[from]?.includes(to) === true;
}

export function flattenWorkflowTransitions(machines = WORKFLOW_STATE_MACHINES) {
  return Object.entries(machines).flatMap(([lifecycle, machine]) =>
    Object.entries(machine.transitions).flatMap(([from, targets]) =>
      targets.map((to) => ({
        lifecycle: lifecycle.toUpperCase(),
        stateMachineId: machine.id,
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        source: machine.source || null,
        status: machine.status || "IMPLEMENTED",
      })),
    ),
  );
}