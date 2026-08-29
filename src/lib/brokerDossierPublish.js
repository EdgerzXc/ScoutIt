import { buildBrokerNarrativeFields, getUnpublishableDraftFields } from "@/lib/brokerDossierDraft";
import { resolveBrokerAuthorityId } from "@/lib/brokerDossier";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

const BASE_URL = "https://api.airtable.com/v0";
const TABLE = "BROKERS_CMS";

export async function pushBrokerNarrativeToAirtable({
  apiKey,
  baseId,
  brokerId,
  draft,
  fetchImpl = fetchWithRetry,
}) {
  if (!apiKey || !baseId) throw new Error("Broker dossier publish is missing Airtable credentials");
  const authorityId = resolveBrokerAuthorityId(brokerId);
  if (!authorityId) throw new Error("Broker dossier publish requires an Auth UUID BrokerID");

  const blocked = getUnpublishableDraftFields(draft);
  if (blocked.length) {
    throw new Error(`Broker dossier fields are not yet publishable: ${blocked.join(", ")}`);
  }
  const fields = buildBrokerNarrativeFields(draft);
  const formula = `{BrokerID}='${authorityId}'`;
  const lookupUrl = `${BASE_URL}/${baseId}/${TABLE}?maxRecords=2&filterByFormula=${encodeURIComponent(formula)}`;
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  const lookup = await fetchImpl(lookupUrl, { headers });
  if (!lookup.ok) {
    throw new Error(`Broker dossier lookup failed: ${lookup.status} ${await lookup.text().catch(() => "")}`);
  }
  const records = (await lookup.json()).records || [];
  if (records.length === 0) throw new Error("Broker dossier Airtable record not found");
  if (records.length !== 1) throw new Error("Broker dossier Airtable identity is ambiguous");

  const recordId = records[0].id;
  const update = await fetchImpl(`${BASE_URL}/${baseId}/${TABLE}/${recordId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields, typecast: false }),
  });
  if (!update.ok) {
    throw new Error(`Broker dossier publish failed: ${update.status} ${await update.text().catch(() => "")}`);
  }
  const result = await update.json();
  if (result?.id !== recordId) throw new Error("Broker dossier publish returned no matching record id");
  return { recordId };
}
