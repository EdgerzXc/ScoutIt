import {
  hasBrokerDossierAuthority,
  loadBrokerDossierDraft,
  markBrokerDossierPublished,
  saveBrokerDossierDraft,
} from "@/lib/serverBrokerDossierDraft";

const brokerId = "e7f3634b-65d7-4adc-90ea-0544b61d988d";
const draft = {
  portraitUrl: "https://images.example.test/advisor.jpg",
  biography: "Evidence-led advisory.",
  firm: "",
  markets: [],
  categories: [],
  languages: [],
  serviceAreas: [],
  workingStyle: "",
  availability: "not_set",
  introMediaUrl: "",
};

describe("A-023 phase 3 - private broker dossier authority", () => {
  it("links editor authority only through the exact BrokerID", () => {
    const brokers = [{ id: brokerId, name: "Marco" }, { id: "recLegacy", name: "Legacy" }];
    expect(hasBrokerDossierAuthority(brokerId, brokers)).toBe(true);
    expect(hasBrokerDossierAuthority("recLegacy", brokers)).toBe(false);
    expect(hasBrokerDossierAuthority("another-user", brokers)).toBe(false);
  });

  it("returns an honest empty private draft when no row exists", async () => {
    const client = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      }),
    };
    const result = await loadBrokerDossierDraft(brokerId, client);
    expect(result.ok).toBe(true);
    expect(result.record).toMatchObject({
      brokerId,
      revision: 0,
      publishState: "draft",
      draft: { ...draft, portraitUrl: "", biography: "" },
    });
  });

  it("fails closed when the prepared schema is unavailable", async () => {
    const client = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: "missing table" } }) }) }),
      }),
    };
    await expect(loadBrokerDossierDraft(brokerId, client)).resolves.toMatchObject({ ok: false });
    await expect(loadBrokerDossierDraft(brokerId, null)).resolves.toMatchObject({ ok: false });
  });

  it("saves through the owner-bound revision RPC", async () => {
    const calls = [];
    const client = { rpc: async (name, args) => { calls.push({ name, args }); return { data: { broker_id: brokerId, revision: 2 }, error: null }; } };
    const result = await saveBrokerDossierDraft({ brokerId, actorId: brokerId, expectedRevision: 1, draft, client });
    expect(result.ok).toBe(true);
    expect(calls[0]).toEqual({
      name: "save_broker_dossier_draft",
      args: { p_broker_id: brokerId, p_actor_id: brokerId, p_expected_revision: 1, p_draft: draft },
    });
  });

  it("marks publish only through the matching revision RPC", async () => {
    const calls = [];
    const client = { rpc: async (name, args) => { calls.push({ name, args }); return { data: { broker_id: brokerId, revision: 2 }, error: null }; } };
    const result = await markBrokerDossierPublished({ brokerId, actorId: brokerId, expectedRevision: 2, airtableRecordId: "recBroker", client });
    expect(result.ok).toBe(true);
    expect(calls[0].name).toBe("mark_broker_dossier_published");
    expect(calls[0].args.p_airtable_record_id).toBe("recBroker");
  });
});
