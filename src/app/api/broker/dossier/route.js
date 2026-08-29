import { NextResponse } from "next/server";
import { getCmsBundle, invalidateCmsBundle } from "@/lib/cmsCache";
import { isGlobalReadOnly } from "@/lib/featureFlags";
import { resolveUserId } from "@/lib/serverAuth";
import { validateBrokerDossierDraft, getUnpublishableDraftFields } from "@/lib/brokerDossierDraft";
import { publicBrokerIdentity, resolveBrokerAuthorityId } from "@/lib/brokerDossier";
import { buildScoutItRecord } from "@/lib/brokerMetrics";
import { loadBrokerMetricSnapshot } from "@/lib/serverBrokerMetrics";
import { buildBrokerCredential } from "@/lib/brokerCredential";
import { loadBrokerCredentialRecord } from "@/lib/serverBrokerCredential";
import { pushBrokerNarrativeToAirtable } from "@/lib/brokerDossierPublish";
import {
  hasBrokerDossierAuthority,
  loadBrokerDossierDraft,
  markBrokerDossierPublished,
  saveBrokerDossierDraft,
} from "@/lib/serverBrokerDossierDraft";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };
const json = (body, status = 200) => NextResponse.json(body, { status, headers: PRIVATE_HEADERS });

async function authorize(request) {
  const userId = await resolveUserId(request);
  if (!userId) return { response: json({ error: "Unauthorized" }, 401) };
  const bundle = await getCmsBundle();
  if (/^empty_fallback/.test(bundle.source || "")) {
    return { response: json({ error: "Broker identity authority is unavailable" }, 503) };
  }
  if (!hasBrokerDossierAuthority(userId, bundle.brokers)) {
    return { response: json({ error: "No broker dossier is linked to this account" }, 403) };
  }
  // Resolve the broker the same way the authority gate does. A raw `===` here
  // let an uppercase Airtable BrokerID pass ownership and then match nothing,
  // leaving an authorized broker with no identity and a dead preview pane.
  const authorityId = resolveBrokerAuthorityId(userId);
  const broker = bundle.brokers.find(
    (candidate) => resolveBrokerAuthorityId(candidate?.id) === authorityId,
  );
  // The preview must render the same ScoutIt Record the public dossier does,
  // otherwise "exact preview" is only true for the parts that happen to match.
  const identity = publicBrokerIdentity(broker);
  const record = buildScoutItRecord({ lookup: await loadBrokerMetricSnapshot(authorityId) });
  // The credential badge is part of the public composition, so the preview
  // must resolve it the same way the dossier does or the two disagree.
  const credential = buildBrokerCredential({
    identity: identity || {},
    record: await loadBrokerCredentialRecord(authorityId),
  });
  return { userId, identity, record, credential };
}

function validRevision(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.response) return auth.response;
  // Identity travels with every response: the exact preview must render even
  // when the private draft store cannot be reached and nothing can be saved.
  const result = await loadBrokerDossierDraft(auth.userId);
  if (!result.ok) {
    return json(
      { error: "Broker drafts are unavailable", reason: result.reason, identity: auth.identity, scoutItRecord: auth.record, credential: auth.credential },
      503,
    );
  }
  return json({ record: result.record, identity: auth.identity, scoutItRecord: auth.record, credential: auth.credential });
}

export async function PATCH(request) {
  try {
    if (await isGlobalReadOnly()) return json({ error: "System writes are temporarily frozen" }, 423);
    const auth = await authorize(request);
    if (auth.response) return auth.response;
    const body = await request.json();
    if (!validRevision(body.expectedRevision)) return json({ error: "Invalid expected revision" }, 400);
    const validated = validateBrokerDossierDraft(body.draft);
    if (!validated.ok) return json({ error: "Invalid broker dossier draft", fields: validated.errors }, 422);

    const result = await saveBrokerDossierDraft({
      brokerId: auth.userId,
      actorId: auth.userId,
      expectedRevision: body.expectedRevision,
      draft: validated.draft,
    });
    if (!result.ok) {
      const status = result.reason === "stale_revision" ? 409 : 503;
      return json({ error: result.reason === "stale_revision" ? "Draft changed in another session" : "Draft save failed" }, status);
    }
    return json({ record: result.record, identity: auth.identity, scoutItRecord: auth.record, credential: auth.credential });
  } catch (error) {
    console.error("[broker dossier] Draft save failed:", error?.message || error);
    return json({ error: "Draft save failed" }, 500);
  }
}

export async function POST(request) {
  try {
    if (await isGlobalReadOnly()) return json({ error: "System writes are temporarily frozen" }, 423);
    const auth = await authorize(request);
    if (auth.response) return auth.response;
    const body = await request.json();
    if (!validRevision(body.expectedRevision)) return json({ error: "Invalid expected revision" }, 400);

    const loaded = await loadBrokerDossierDraft(auth.userId);
    if (!loaded.ok) return json({ error: "Broker drafts are unavailable" }, 503);
    if (loaded.record.revision !== body.expectedRevision) return json({ error: "Draft changed in another session" }, 409);
    const blocked = getUnpublishableDraftFields(loaded.record.draft);
    if (blocked.length) {
      return json({ error: "Some draft fields do not yet have confirmed public CMS targets", fields: blocked }, 409);
    }
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      return json({ error: "Broker publication is unavailable" }, 503);
    }

    const published = await pushBrokerNarrativeToAirtable({
      apiKey: process.env.AIRTABLE_API_KEY,
      baseId: process.env.AIRTABLE_BASE_ID,
      brokerId: auth.userId,
      draft: loaded.record.draft,
    });
    await invalidateCmsBundle();
    const marked = await markBrokerDossierPublished({
      brokerId: auth.userId,
      actorId: auth.userId,
      expectedRevision: loaded.record.revision,
      airtableRecordId: published.recordId,
    });
    if (!marked.ok) {
      console.error("[broker dossier] Airtable updated but publish marker failed", marked.reason);
      return json({ error: "Public content updated, but confirmation is pending. Retry safely." }, 503);
    }
    return json({ record: marked.record, identity: auth.identity, scoutItRecord: auth.record, credential: auth.credential });
  } catch (error) {
    console.error("[broker dossier] Publish failed:", error?.message || error);
    return json({ error: "Broker dossier publish failed" }, 500);
  }
}
