import { pushBrokerNarrativeToAirtable } from "@/lib/brokerDossierPublish";

const brokerId = "e7f3634b-65d7-4adc-90ea-0544b61d988d";
const draft = {
  portraitUrl: "https://images.example.test/advisor.jpg",
  biography: "Evidence-led commercial advisory.",
};

function response(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe("A-023 phase 3 - broker Airtable publish bridge", () => {
  it("finds the immutable BrokerID and patches only confirmed narrative fields", async () => {
    const calls = [];
    const fetchImpl = async (url, options = {}) => {
      calls.push({ url, options });
      if (!options.method) return response({ records: [{ id: "recBroker123", fields: { BrokerID: brokerId } }] });
      return response({ id: "recBroker123", fields: { Bio: draft.biography, Image: draft.portraitUrl } });
    };

    const result = await pushBrokerNarrativeToAirtable({
      apiKey: "key",
      baseId: "base",
      brokerId,
      draft,
      fetchImpl,
    });

    expect(result).toEqual({ recordId: "recBroker123" });
    expect(calls).toHaveLength(2);
    expect(decodeURIComponent(calls[0].url)).toContain(`{BrokerID}='${brokerId}'`);
    expect(calls[1].options.method).toBe("PATCH");
    expect(JSON.parse(calls[1].options.body)).toEqual({
      fields: { Bio: draft.biography, Image: draft.portraitUrl },
      typecast: false,
    });
  });

  it("fails closed when BrokerID is missing or ambiguous", async () => {
    await expect(pushBrokerNarrativeToAirtable({
      apiKey: "key", baseId: "base", brokerId, draft,
      fetchImpl: async () => response({ records: [] }),
    })).rejects.toThrow(/not found/i);

    await expect(pushBrokerNarrativeToAirtable({
      apiKey: "key", baseId: "base", brokerId, draft,
      fetchImpl: async () => response({ records: [{ id: "one" }, { id: "two" }] }),
    })).rejects.toThrow(/ambiguous/i);
  });

  it("never writes when the draft contains an unpublishable populated field", async () => {
    const fetchImpl = vi.fn();
    await expect(pushBrokerNarrativeToAirtable({
      apiKey: "key",
      baseId: "base",
      brokerId,
      draft: { ...draft, firm: "Not yet mapped" },
      fetchImpl,
    })).rejects.toThrow(/not yet publishable/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
