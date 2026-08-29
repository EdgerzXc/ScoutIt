"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSession } from "@/lib/authClient";
import BrokerDossierIdentity from "@/components/brokers/BrokerDossierIdentity";
import styles from "./BrokerDossierEditor.module.css";

const EMPTY_DRAFT = {
  portraitUrl: "", biography: "", firm: "", markets: [], categories: [],
  languages: [], serviceAreas: [], workingStyle: "", availability: "not_set",
  introMediaUrl: "",
};

const listValue = (value) => (value || []).join(", ");
const parseList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default function BrokerDossierEditor() {
  const [identity, setIdentity] = useState(null);
  const [scoutItRecord, setScoutItRecord] = useState(null);
  const [credential, setCredential] = useState(null);
  const [record, setRecord] = useState(null);
  const [draft, setDraftState] = useState(EMPTY_DRAFT);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [message, setMessage] = useState("Loading private draft…");
  const tokenRef = useRef(null);
  const draftRef = useRef(EMPTY_DRAFT);

  const setDraft = useCallback((next) => {
    draftRef.current = next;
    setDraftState(next);
    setDirty(true);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await getSession();
      const token = session?.access_token;
      if (!token) {
        if (alive) setMessage("Sign in with the broker account linked to this dossier.");
        return;
      }
      tokenRef.current = token;
      const response = await fetch("/api/broker/dossier", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const body = await response.json();
      if (!alive) return;
      if (body.identity) setIdentity(body.identity);
      if (body.record !== undefined || body.scoutItRecord) setScoutItRecord(body.scoutItRecord ?? null);
      if (body.credential !== undefined) setCredential(body.credential ?? null);
      if (!response.ok) {
        setStorageUnavailable(body.reason === "schema_unavailable");
        setMessage(body.reason === "schema_unavailable"
          ? "Private draft storage awaits the owner-approved W-003 migration. Nothing can be saved or published yet."
          : body.error || "The broker editor is unavailable.");
        return;
      }
      const loadedDraft = body.record?.draft || EMPTY_DRAFT;
      draftRef.current = loadedDraft;
      setDraftState(loadedDraft);
      setRecord(body.record);
      setDirty(false);
      setMessage(body.record?.revision ? "Draft loaded." : "Private draft ready.");
    })().catch(() => alive && setMessage("The broker editor could not load."));
    return () => { alive = false; };
  }, []);

  const saveDraft = useCallback(async () => {
    if (!tokenRef.current || !record || saving || storageUnavailable) return null;
    const payloadDraft = draftRef.current;
    setSaving(true);
    setMessage("Saving private draft…");
    try {
      const response = await fetch("/api/broker/dossier", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ expectedRevision: record.revision, draft: payloadDraft }),
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(response.status === 409 ? "This draft changed elsewhere. Reload before continuing." : body.error || "Draft save failed.");
        return null;
      }
      setRecord(body.record);
      const stillDirty = JSON.stringify(draftRef.current) !== JSON.stringify(payloadDraft);
      setDirty(stillDirty);
      setMessage(stillDirty ? "Saved; newer edits are waiting." : "All changes saved privately.");
      return body.record;
    } finally {
      setSaving(false);
    }
  }, [record, saving, storageUnavailable]);

  useEffect(() => {
    if (!dirty || !record || saving || storageUnavailable) return undefined;
    const timer = setTimeout(() => saveDraft(), 900);
    return () => clearTimeout(timer);
  }, [dirty, record, saveDraft, saving, storageUnavailable]);

  useEffect(() => {
    const protectDirtyState = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectDirtyState);
    return () => window.removeEventListener("beforeunload", protectDirtyState);
  }, [dirty]);

  const publish = async () => {
    if (!tokenRef.current || !record || dirty || saving || publishing) return;
    setPublishing(true);
    setMessage("Publishing confirmed narrative fields…");
    try {
      const response = await fetch("/api/broker/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ expectedRevision: record.revision }),
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.fields?.length
          ? `Publish blocked until CMS targets exist for: ${body.fields.join(", ")}. Your private draft is safe.`
          : body.error || "Publish failed.");
        return;
      }
      setRecord(body.record);
      setMessage("Published. The public dossier cache was refreshed.");
    } finally {
      setPublishing(false);
    }
  };

  const previewIdentity = useMemo(() => identity ? {
    ...identity,
    image: draft.portraitUrl || identity.image,
    bio: draft.biography || identity.bio,
  } : null, [draft.biography, draft.portraitUrl, identity]);

  const field = (key, value) => setDraft({ ...draftRef.current, [key]: value });
  const disabled = !record || storageUnavailable;

  return (
    <main className={styles.workspace}>
      <section className={styles.editor} aria-labelledby="broker-editor-title">
        <span className={styles.eyebrow}>Broker dossier · private draft</span>
        <h2 id="broker-editor-title">Shape the facts. ScoutIt keeps the composition.</h2>
        <p className={styles.intro}>Narrative fields are broker-declared. Credentials, properties, recommendations, metrics, badges, typography, and layout remain read-only.</p>
        <p className={styles.status} aria-live="polite">{message}</p>

        <p className={styles.groupLabel}>Publishes to your public dossier</p>
        <label>Portrait URL<input disabled={disabled} value={draft.portraitUrl} onChange={(event) => field("portraitUrl", event.target.value)} placeholder="https://…" /></label>
        <label>Biography<textarea disabled={disabled} maxLength={1200} value={draft.biography} onChange={(event) => field("biography", event.target.value)} /></label>
        <p className={styles.groupLabel}>
          Saved privately &middot; no public home yet
          <span className={styles.groupNote}>
            ScoutIt&rsquo;s public CMS has no field for these, so they are stored against your
            draft and are not published. Publishing is blocked while any of them is filled in.
          </span>
        </p>
        <label>Firm<input disabled={disabled} maxLength={120} value={draft.firm} onChange={(event) => field("firm", event.target.value)} /></label>
        <label>Markets<input disabled={disabled} value={listValue(draft.markets)} onChange={(event) => field("markets", parseList(event.target.value))} placeholder="Metro Manila, Cebu" /></label>
        <label>Categories<input disabled={disabled} value={listValue(draft.categories)} onChange={(event) => field("categories", parseList(event.target.value))} placeholder="Office, Retail" /></label>
        <label>Languages<input disabled={disabled} value={listValue(draft.languages)} onChange={(event) => field("languages", parseList(event.target.value))} /></label>
        <label>Service areas<input disabled={disabled} value={listValue(draft.serviceAreas)} onChange={(event) => field("serviceAreas", parseList(event.target.value))} /></label>
        <label>Working style<textarea disabled={disabled} maxLength={600} value={draft.workingStyle} onChange={(event) => field("workingStyle", event.target.value)} /></label>
        <label>Availability<select disabled={disabled} value={draft.availability} onChange={(event) => field("availability", event.target.value)}><option value="not_set">Not stated</option><option value="available">Available</option><option value="limited">Limited availability</option><option value="unavailable">Unavailable</option></select></label>
        <label>Intro media URL<input disabled={disabled} value={draft.introMediaUrl} onChange={(event) => field("introMediaUrl", event.target.value)} placeholder="https://…" /></label>

        <div className={styles.actions}>
          <button type="button" onClick={saveDraft} disabled={disabled || !dirty || saving}>{saving ? "Saving…" : "Save now"}</button>
          <button type="button" className={styles.publish} onClick={publish} disabled={disabled || dirty || saving || publishing}>{publishing ? "Publishing…" : "Publish saved draft"}</button>
        </div>
        <p className={styles.boundary}>Only the portrait and biography have a confirmed public field today. The fields below them autosave privately and fail closed at publish until the CMS schema is extended.</p>
      </section>

      <section className={styles.preview} aria-label="Exact public dossier preview">
        <span className={styles.eyebrow}>Exact public composition</span>
        {previewIdentity ? <BrokerDossierIdentity identity={previewIdentity} record={scoutItRecord} credential={credential} /> : <p className={styles.previewEmpty}>Public identity preview is unavailable.</p>}
      </section>
    </main>
  );
}
