import {
  REPRESENTATION_STATES,
  buildLeadRouting,
  getActiveRoster,
  isActiveRosterBroker,
  representationStatusUpdate,
} from "../brokerRepresentation";

const active = (overrides = {}) => ({
  id: "rep-1",
  broker_id: "broker-1",
  status: REPRESENTATION_STATES.ACTIVE,
  visible_to_public: true,
  contactable: true,
  account_eligible: true,
  inventory_eligible: true,
  priority: 0,
  accepted_at: "2026-08-02T00:00:00.000Z",
  created_at: "2026-08-01T00:00:00.000Z",
  ...overrides,
});

describe("broker representation routing", () => {
  it("counts only accepted, visible, contactable, eligible brokers", () => {
    expect(isActiveRosterBroker(active())).toBe(true);
    expect(isActiveRosterBroker(active({ status: "suspended" }))).toBe(false);
    expect(isActiveRosterBroker(active({ visible_to_public: false }))).toBe(false);
    expect(isActiveRosterBroker(active({ inventory_eligible: false }))).toBe(false);
    expect(isActiveRosterBroker(active({ unavailable_at: "2026-08-02T00:00:00.000Z" }))).toBe(false);
  });

  it("produces a stable ordered roster and recipient set", () => {
    const reps = [
      active({ id: "rep-b", broker_id: "broker-b", priority: 1, created_at: "2026-08-01T00:00:02.000Z" }),
      active({ id: "rep-a", broker_id: "broker-a", priority: 1, created_at: "2026-08-01T00:00:01.000Z" }),
      active({ id: "rep-hidden", broker_id: "broker-hidden", visible_to_public: false }),
    ];
    expect(getActiveRoster(reps).map((rep) => rep.broker_id)).toEqual(["broker-a", "broker-b"]);
    expect(buildLeadRouting({ propertyOwnerId: "owner-1", representations: reps })).toMatchObject({
      routedToRoster: true,
      recipients: [
        { recipientId: "broker-a", recipientType: "broker" },
        { recipientId: "broker-b", recipientType: "broker" },
      ],
    });
  });

  it("uses the owner only when the qualifying roster is empty", () => {
    expect(buildLeadRouting({ propertyOwnerId: "owner-1", representations: [active({ status: "ended" })] })).toMatchObject({
      routedToRoster: false,
      recipients: [{ recipientId: "owner-1", recipientType: "owner" }],
    });
    expect(buildLeadRouting({ propertyOwnerId: "owner-1", representations: [active()], preferredBrokerId: "missing" })).toMatchObject({
      ok: false,
      reason: "broker_not_contactable",
      recipients: [],
    });
  });

  it("records explicit representation state transitions", () => {
    expect(representationStatusUpdate({ status: REPRESENTATION_STATES.ACTIVE, now: "2026-08-02T00:00:00.000Z" })).toMatchObject({
      status: "active",
      accepted_at: "2026-08-02T00:00:00.000Z",
      locked_at: null,
      suspended_at: null,
    });
    expect(representationStatusUpdate({ status: REPRESENTATION_STATES.SUSPENDED, now: "2026-08-02T00:00:00.000Z" })).toMatchObject({
      status: "suspended",
      suspended_at: "2026-08-02T00:00:00.000Z",
    });
  });
});
