"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import { sanitizeError } from "@/lib/sanitizeError";
import { LISTER_RELATIONSHIPS, OWNER_SOVEREIGNTY_DISCLAIMER } from "@/lib/listerRelationship";
import InfoTip from "@/components/ui/InfoTip";
import {
  Scale,
  Cloud,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  FileText,
  UploadCloud,
  X,
  Lock,
  ShieldCheck,
  Check,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// CLAIM THIS PROPERTY — §37 · WORK ORDER W8
//
// The Owner Sovereignty promise, made reachable. `/api/property/claim`, the
// `property_claims` table and its RLS have existed since 2026-08-05 with ZERO
// callers (§51). This is the caller.
//
// ── WHAT "CLAIMABLE" MEANS, AND WHY NULL COUNTS ─────────────────────
// `isClaimable()` says yes unless the listing is owner-declared or the owner
// is already verified. NULL — "nobody was ever asked" — is CLAIMABLE, and
// that is not an oversight: all 13 listings in the database today are NULL
// (verified 2026-08-06), because they predate the §50 publish gate. Those are
// precisely the ones most likely to need claiming. Assuming ownership from
// silence is the failure this whole feature exists to prevent.
//
// The server decides. This component never computes claimability from a
// property object it was handed — a public payload can be stale or stripped,
// and a CTA that appears on the wrong listing is an accusation.
//
// ── THE COPY IS DELIBERATELY UNEXCITING ─────────────────────────────
// This is a legal assertion against someone else's listing. Nothing here
// persuades, and there is no "it only takes a minute". The cost of a casual
// claim is a real person defending their listing, so the wording states what
// happens and stops.
//
// Mobile first: the panel is a full-width block; the form expands in place
// rather than opening a modal, so the reader keeps the property in view.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "var(--font-mono)";

const STATUS_COPY = {
  draft: "Saved, not yet submitted",
  submitted: "Submitted: waiting for review",
  technical_review: "Under technical review",
  needs_information: "More information needed from you",
  human_review: "Under review by our team",
  disputed: "Disputed: under review",
};

export default function ClaimPropertyPanel({ propertyId, propertyTitle }) {
  const [state, setState] = useState(null); // server truth
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [relationship, setRelationship] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  // Document enclosure states (Facial consistency match)
  const [authorityDoc, setAuthorityDoc] = useState(null);
  const [idDoc, setIdDoc] = useState(null);
  const [uploadingAuthority, setUploadingAuthority] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = async (file, isAuthority) => {
    if (!file) return;
    if (isAuthority) setUploadingAuthority(true);
    else setUploadingId(true);
    setUploadError(null);
    try {
      const { data: { session } } = await getSession();
      if (!session?.access_token) {
        setUploadError("Your session expired. Sign in again to upload documents.");
        return;
      }
      const documentType = isAuthority
        ? (relationship === "authorized_broker" ? "authority_to_sell" : (relationship === "property_manager" ? "management_agreement" : "title_deed"))
        : (relationship === "authorized_broker" ? "prc_license" : "gov_id");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("propertyId", propertyId);

      const res = await fetch("/api/property/claim/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setUploadError(json.error || "Could not upload document.");
        return;
      }

      if (isAuthority) {
        setAuthorityDoc(json);
      } else {
        setIdDoc(json);
      }
    } catch {
      setUploadError("Upload failed. Please ensure file is a valid PDF or image under 15MB.");
    } finally {
      if (isAuthority) setUploadingAuthority(false);
      else setUploadingId(false);
    }
  };

  const load = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    try {
      const { data: { session } } = await getSession();
      const res = await fetch(
        `/api/property/claim?propertyId=${encodeURIComponent(propertyId)}`,
        session?.access_token
          ? { headers: { Authorization: `Bearer ${session.access_token}` } }
          : undefined
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setLoadFailed(true);
        return;
      }
      setState(json);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const ready = Boolean(relationship) && agreed === true;

  const submit = async () => {
    setTouched(true);
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data: { session } } = await getSession();
      if (!session?.access_token) {
        setError("Your session expired. Sign in again to submit this claim.");
        return;
      }
      const documents = [authorityDoc, idDoc].filter(Boolean);
      const res = await fetch("/api/property/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          propertyId,
          claimedRelationship: relationship,
          agreed: true,
          documents,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error || "That claim could not be submitted.");
        return;
      }
      setDone(true);
      setOpen(false);
      await load();
    } catch (e) {
      setError(sanitizeError(e, "That claim could not be submitted."));
    } finally {
      setBusy(false);
    }
  };

  if (!propertyId) return null;

  // LOADING — a skeleton the size of the real block, not a spinner.
  if (loading) {
    return (
      <section className="cp-root" aria-busy="true">
        <ClaimStyles />
        <div className="cp-skeleton" />
      </section>
    );
  }

  // ERROR — the panel failed to load. Say so; never silently vanish, because
  // an absent claim CTA is indistinguishable from "this listing isn't
  // claimable", which is a claim of its own.
  if (loadFailed) {
    return (
      <section className="cp-root">
        <ClaimStyles />
        <div className="cp-card">
          <p className="cp-body">
            Couldn&apos;t check the ownership status of this listing just now.
          </p>
          <button type="button" className="cp-btn cp-btn--ghost" onClick={load}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  // Not claimable, and it's not the viewer's own listing → render nothing.
  // The owner is verified or has declared themselves; there is no action here
  // and an explanation would only advertise the mechanism.
  if (!state?.claimable && !state?.isOwnListing) return null;

  // The viewer already owns it.
  if (state?.isOwnListing) return null;

  const myClaim = state?.myClaim;

  return (
    <section className="cp-root" aria-labelledby="cp-title">
      <ClaimStyles />
      <div className="cp-card">
        <div className="cp-header-row">
          <div className="cp-eyebrow">Owner Sovereignty // Legal Succession</div>
          {state?.signedIn && (
            <div className="cp-badge-user">
              {state.userTier ? state.userTier.toUpperCase() : "STARRY"} · {state.isOwner ? "OWNER MODE" : "SEEKER ACCOUNT"}
            </div>
          )}
        </div>

        {/* Already claimed by this user — show status, offer no second claim. */}
        {myClaim ? (
          <>
            <h3 className="cp-title" id="cp-title">Your claim is on file</h3>
            <p className="cp-body">
              {STATUS_COPY[myClaim.status] || "Under review"}. We&apos;ll contact you at
              your account email if we need title documents.
            </p>
            <div className="cp-meta">
              Claim {myClaim.id.slice(0, 8)} · filed{" "}
              {new Date(myClaim.created_at).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </>
        ) : done ? (
          <>
            <h3 className="cp-title" id="cp-title">Claim submitted</h3>
            <p className="cp-body">
              It&apos;s with our team for verification. Nothing about this listing changes
              until the claim is resolved.
            </p>
          </>
        ) : (
          <>
            <h3 className="cp-title" id="cp-title">
              Is this your property? <InfoTip tipId="claimProperty" label="About claiming property" />
            </h3>
            <p className="cp-body">
              This listing is not yet claimed by a verified owner. If you hold legal title or
              written management authority, claim it here to assume custody of its intelligence,
              photos, and buyer inquiries.
            </p>

            {!state.signedIn ? (
              <>
                <p className="cp-note">
                  Please sign in first so your claim can be connected to your account.
                </p>
                <a className="cp-btn cp-btn--gold" href="/login">
                  Sign in to claim
                </a>
              </>
            ) : !open ? (
              <button
                type="button"
                className="cp-btn cp-btn--gold"
                onClick={() => setOpen(true)}
              >
                Claim this property
              </button>
            ) : (
              <div className="cp-form">
                {/* Notice: Seeker account converting to owner */}
                {!state.isOwner && (
                  <div className="cp-notice cp-notice--info">
                    <span className="cp-notice__tag">
                      <AlertCircle size={13} className="text-gold-accent" />
                      ACCOUNT WORKSPACE NOTICE
                    </span>
                    <p className="cp-notice__text">
                      You are currently signed in with a Seeker account. Submitting an ownership claim
                      asserts legal title custody and will activate Owner Mode on your profile once
                      our team verifies your title documents.
                    </p>
                  </div>
                )}

                {/* Notice: Quota limit & Free Off-Market Cloud Storage */}
                {state.atListingCap && (
                  <div className="cp-notice cp-notice--quota">
                    <span className="cp-notice__tag">
                      <Cloud size={13} className="text-gold-accent" />
                      ACTIVE LISTING QUOTA NOTICE <InfoTip tipId="listingCapCloudStorage" label="About listing quota" />
                    </span>
                    <p className="cp-notice__text">
                      Your {state.userTier ? state.userTier.toUpperCase() : "STARRY"} plan currently has{" "}
                      {state.activeLiveCount || 1} active live listing (quota: {state.listingCap || 1}).
                      Claiming is free with no paywall. Upon verification, this property will be deposited
                      into your Free Off-Market Cloud Storage, where you can curate its details privately
                      or swap it to Live Market anytime.
                    </p>
                  </div>
                )}

                {/* Notice: Originating broker succession */}
                <div className="cp-notice cp-notice--legal">
                  <span className="cp-notice__tag">
                    <Scale size={13} className="text-gold-accent" />
                    ORIGINATING BROKER SUCCESSION <InfoTip tipId="propertyClaimingSuccession" label="About broker succession" />
                  </span>
                  <p className="cp-notice__text">
                    Under Republic Act No. 9646 (RESA) and Republic Act No. 8792 (E-Commerce Act),
                    claiming this property establishes primary legal ownership sovereignty. If this
                    space was provisionally listed by an unrepresented broker, you may choose to retain
                    or revoke their representation once verified.
                  </p>
                </div>

                <fieldset className="cp-fieldset">
                  <legend className="cp-legend">Your relationship to it</legend>
                  {LISTER_RELATIONSHIPS.map((option) => (
                    <label
                      key={option.value}
                      className={`cp-opt${relationship === option.value ? " cp-opt--on" : ""}`}
                    >
                      <input
                        type="radio"
                        className="cp-radio"
                        name="claim-relationship"
                        value={option.value}
                        checked={relationship === option.value}
                        onChange={() => setRelationship(option.value)}
                        disabled={busy}
                      />
                      <span className="cp-opt__main">
                        <span className="cp-opt__label">{option.label}</span>
                        <span className="cp-opt__detail">{option.detail}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                {/* Document Verification Enclosure */}
                <div className="cp-docs-enclosure">
                  <div className="cp-docs-header">
                    <span className="cp-docs-title">
                      <Lock size={13} className="text-gold-accent" />
                      ENCRYPTED TITLE &amp; AUTHORITY ENCLOSURE
                    </span>
                    <span className="cp-docs-badge">FACIAL MATCH VERIFICATION</span>
                  </div>
                  <p className="cp-docs-intro">
                    Documents remain strictly confidential and encrypted under RA 10173 (Data Privacy Act).
                    They are accessed solely by Trust &amp; Safety to verify your legal authority and are never displayed publicly.
                    <span className="cp-docs-watermark-tip"> You may watermark your files: &ldquo;FOR SCOUTIT VERIFICATION ONLY&rdquo;.</span>
                  </p>

                  <div className="cp-docs-grid">
                    {/* Slot A: Proof of Authority */}
                    <div className="cp-doc-slot">
                      <span className="cp-doc-slot__label">
                        {relationship === "authorized_broker"
                          ? "1. Authority to Sell / Lease (ATS/ATL)"
                          : relationship === "property_manager"
                          ? "1. Property Management Contract / LOA"
                          : "1. Land Title (TCT/CCT), Tax Dec, or CTS"}
                      </span>
                      {authorityDoc ? (
                        <div className="cp-doc-attached">
                          <FileText size={16} className="text-gold-accent shrink-0" />
                          <div className="cp-doc-attached__info">
                            <span className="cp-doc-attached__name">{authorityDoc.originalFilename}</span>
                            <span className="cp-doc-attached__meta">
                              {authorityDoc.fileSizeBytes ? `${(authorityDoc.fileSizeBytes / 1024).toFixed(0)} KB · ` : ""}
                              READY
                            </span>
                          </div>
                          <button
                            type="button"
                            className="cp-doc-remove"
                            onClick={() => setAuthorityDoc(null)}
                            title="Remove file"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className={`cp-dropzone${uploadingAuthority ? " cp-dropzone--uploading" : ""}`}>
                          <input
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            className="cp-file-input"
                            disabled={busy || uploadingAuthority}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, true);
                              e.target.value = "";
                            }}
                          />
                          <UploadCloud size={18} className="cp-dropzone__icon" />
                          <span className="cp-dropzone__text">
                            {uploadingAuthority ? "Encrypting & uploading…" : "Attach document or snap photo"}
                          </span>
                          <span className="cp-dropzone__sub">PDF, JPG, PNG up to 15MB</span>
                        </label>
                      )}
                    </div>

                    {/* Slot B: Claimant Identity */}
                    <div className="cp-doc-slot">
                      <span className="cp-doc-slot__label">
                        {relationship === "authorized_broker"
                          ? "2. PRC Real Estate Broker License ID"
                          : "2. Valid Government-Issued Photo ID"}
                      </span>
                      {idDoc ? (
                        <div className="cp-doc-attached">
                          <Check size={16} className="text-gold-accent shrink-0" />
                          <div className="cp-doc-attached__info">
                            <span className="cp-doc-attached__name">{idDoc.originalFilename}</span>
                            <span className="cp-doc-attached__meta">
                              {idDoc.fileSizeBytes ? `${(idDoc.fileSizeBytes / 1024).toFixed(0)} KB · ` : ""}
                              MATCH READY
                            </span>
                          </div>
                          <button
                            type="button"
                            className="cp-doc-remove"
                            onClick={() => setIdDoc(null)}
                            title="Remove file"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className={`cp-dropzone${uploadingId ? " cp-dropzone--uploading" : ""}`}>
                          <input
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            className="cp-file-input"
                            disabled={busy || uploadingId}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, false);
                              e.target.value = "";
                            }}
                          />
                          <UploadCloud size={18} className="cp-dropzone__icon" />
                          <span className="cp-dropzone__text">
                            {uploadingId ? "Encrypting & uploading…" : "Attach ID or snap photo"}
                          </span>
                          <span className="cp-dropzone__sub">Passport, UMID, Driver&apos;s, PhilID</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {uploadError && (
                    <div className="cp-docs-error" role="alert">
                      {uploadError}
                    </div>
                  )}
                </div>

                <div className="cp-disclaimer">{OWNER_SOVEREIGNTY_DISCLAIMER}</div>

                <label className="cp-agree">
                  <input
                    type="checkbox"
                    className="cp-agree__box"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked === true)}
                    disabled={busy}
                  />
                  <span className="cp-agree__text">
                    I declare under penalty of perjury and applicable Philippine laws (RA 8792 E-Commerce Act,
                    RA 9646 RESA Law, and Arts. 171, 183 &amp; 315 of the Revised Penal Code) that I am the lawful
                    Torrens title owner or duly authorized representative of this property. I warrant that all attached
                    documents are authentic, and I accept the 72-hour review terms and legal indemnity under
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-[#E8AE3C] hover:text-[#F7C64E] ml-1">Terms of Service Section 08</a>.
                  </span>
                </label>

                {touched && !ready && !error && (
                  <div className="cp-hint">
                    {!relationship
                      ? "Choose your relationship to this property."
                      : "Tick the legal confirmation to submit."}
                  </div>
                )}
                {error && (
                  <div className="cp-error" role="alert">
                    {error}
                  </div>
                )}

                <div className="cp-actions">
                  <button
                    type="button"
                    className="cp-btn cp-btn--gold"
                    onClick={submit}
                    disabled={busy || !ready}
                  >
                    {busy ? "Submitting…" : "Submit legal claim"}
                  </button>
                  <button
                    type="button"
                    className="cp-btn cp-btn--ghost"
                    onClick={() => { setOpen(false); setError(null); }}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>

                <p className="cp-note">
                  We may ask for your TCT, CCT or OCT, or your written authority from the
                  owner. Documents stay private and are never shown on the public listing.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ClaimStyles() {
  return (
    <style jsx global>{`
      /* ── MOBILE FIRST (390px) ────────────────────────────────────── */
      .cp-root { margin: 28px 0; }
      .cp-skeleton {
        height: 148px;
        border-radius: 5px;
        background: linear-gradient(90deg, var(--surface) 0%, var(--surface2) 50%, var(--surface) 100%);
        background-size: 200% 100%;
        animation: cpShimmer 1.4s ease-in-out infinite;
      }
      @keyframes cpShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .cp-card {
        background: var(--surface2);
        border: 0.5px solid var(--border);
        border-left: 2px solid var(--accent-muted);
        border-radius: 4px;
        padding: 20px 17px;
      }
      .cp-header-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 9px;
      }
      .cp-eyebrow {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--accent);
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .cp-badge-user {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--text-muted);
        letter-spacing: 0.08em;
        padding: 3px 8px;
        border-radius: 3px;
        background: var(--surface);
        border: 1px solid var(--border);
        text-transform: uppercase;
      }
      .cp-notice {
        padding: 12px 14px;
        border-radius: 4px;
        margin-bottom: 12px;
      }
      .cp-notice--info {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border);
        border-left: 3px solid var(--border-mid, #444);
      }
      .cp-notice--quota {
        background: rgba(var(--accent-rgb), 0.05);
        border: 1px solid var(--accent-border);
        border-left: 3px solid var(--accent);
      }
      .cp-notice--legal {
        background: rgba(var(--accent-rgb), 0.04);
        border: 1px solid var(--border);
        border-left: 3px solid var(--accent-bright);
      }
      .cp-notice__tag {
        font-family: ${MONO};
        font-size: 12px;
        font-weight: 700;
        color: var(--accent);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 5px;
      }
      .cp-notice__text {
        font-family: var(--font-display);
        font-size: 12.5px;
        line-height: 1.6;
        color: var(--text-secondary);
        margin: 0;
      }
      .cp-title {
        font-family: var(--font-display);
        font-weight: 400;
        font-size: 18px;
        line-height: 1.3;
        color: var(--text-primary);
        margin: 0 0 9px;
      }
      .cp-body {
        font-family: var(--font-display);
        font-size: 13.5px;
        line-height: 1.7;
        color: var(--text-secondary);
        margin: 0 0 16px;
        max-width: 56ch;
      }
      .cp-note {
        font-family: var(--font-display);
        font-size: 12px;
        line-height: 1.65;
        color: var(--text-secondary);
        margin: 14px 0 0;
        max-width: 56ch;
      }
      .cp-meta {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--text-muted);
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .cp-form { margin-top: 4px; }
      .cp-fieldset { border: none; padding: 0; margin: 0 0 4px; }
      .cp-legend {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--text-muted);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        padding: 0;
        margin-bottom: 10px;
      }
      .cp-opt {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        min-height: 48px;
        padding: 13px 12px;
        margin-bottom: 8px;
        background: var(--surface);
        border: 0.5px solid var(--border);
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 160ms ease-out, background-color 160ms ease-out, transform 120ms ease-out;
      }
      .cp-opt:active { transform: scale(0.98); }
      .cp-opt:hover { border-color: var(--border-hover, var(--border-solid)); }
      .cp-opt:focus-within { outline: 2px solid var(--accent-muted); outline-offset: 2px; }
      .cp-opt--on { background: rgba(var(--accent-rgb), 0.06); border-color: var(--accent-muted); }
      .cp-radio {
        flex: 0 0 auto;
        width: 18px;
        height: 18px;
        margin-top: 2px;
        accent-color: var(--accent);
        cursor: pointer;
      }
      .cp-opt__main { min-width: 0; flex: 1; }
      .cp-opt__label {
        display: block;
        font-family: var(--font-display);
        font-size: 14.5px;
        line-height: 1.35;
        color: var(--text-primary);
        margin-bottom: 4px;
      }
      .cp-opt__detail {
        display: block;
        font-family: var(--font-display);
        font-size: 12.5px;
        line-height: 1.6;
        color: var(--text-muted);
      }

      .cp-disclaimer {
        background: rgba(var(--accent-rgb), 0.05);
        border-left: 2px solid var(--accent-muted);
        padding: 11px 12px;
        margin: 14px 0 10px;
        font-family: var(--font-display);
        font-size: 12.5px;
        line-height: 1.65;
        color: var(--text-secondary);
      }
      .cp-agree {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        min-height: 44px;
        padding: 10px 2px;
        cursor: pointer;
      }
      .cp-agree__box {
        flex: 0 0 auto;
        width: 20px;
        height: 20px;
        margin-top: 1px;
        accent-color: var(--accent);
        cursor: pointer;
      }
      .cp-agree__text {
        font-family: var(--font-display);
        font-size: 12.5px;
        line-height: 1.6;
        color: var(--text-secondary);
      }

      .cp-hint {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--text-muted);
        letter-spacing: 0.06em;
        line-height: 1.7;
        margin-top: 8px;
      }
      .cp-error {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--red);
        letter-spacing: 0.05em;
        line-height: 1.7;
        margin-top: 10px;
      }

      .cp-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 16px;
      }
      .cp-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 46px;
        width: 100%;
        padding: 0 18px;
        border-radius: 3px;
        font-family: ${MONO};
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        text-decoration: none;
        cursor: pointer;
        transition: transform 140ms ease-out, opacity 140ms ease-out;
      }
      .cp-btn:active { transform: scale(0.97); }
      .cp-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .cp-btn:disabled:active { transform: none; }
      .cp-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      /* The single gold element in this panel — 95/5 rule. */
      .cp-btn--gold { background: var(--accent-bright); border: none; color: var(--on-accent); font-weight: bold; }
      .cp-btn--ghost { background: transparent; border: 0.5px solid var(--border); color: var(--text-secondary); }

      /* ── DOCUMENT ENCLOSURE & DROPZONE ── */
      .cp-docs-enclosure {
        margin: 16px 0;
        padding: 14px 15px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border);
        border-radius: 4px;
      }
      .cp-docs-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }
      .cp-docs-title {
        font-family: ${MONO};
        font-size: 12px;
        font-weight: 700;
        color: var(--accent);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .cp-docs-badge {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--text-muted);
        letter-spacing: 0.08em;
        padding: 2px 6px;
        border-radius: 2px;
        background: var(--surface);
        border: 1px solid var(--border);
        text-transform: uppercase;
      }
      .cp-docs-intro {
        font-family: var(--font-display);
        font-size: 12px;
        line-height: 1.6;
        color: var(--text-secondary);
        margin: 0 0 14px;
      }
      .cp-docs-watermark-tip {
        color: var(--text-muted);
        font-style: italic;
      }
      .cp-docs-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .cp-doc-slot {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cp-doc-slot__label {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--text-secondary);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .cp-dropzone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 16px 12px;
        min-height: 84px;
        background: var(--surface);
        border: 1px dashed var(--border-mid, #444);
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 160ms ease-out, background-color 160ms ease-out;
        position: relative;
      }
      .cp-dropzone:hover {
        border-color: var(--accent-muted);
        background: rgba(var(--accent-rgb), 0.03);
      }
      .cp-dropzone--uploading {
        opacity: 0.6;
        pointer-events: none;
      }
      .cp-file-input {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
      .cp-dropzone__icon {
        color: var(--accent);
        margin-bottom: 6px;
      }
      .cp-dropzone__text {
        font-family: var(--font-display);
        font-size: 12.5px;
        color: var(--text-primary);
        text-align: center;
      }
      .cp-dropzone__sub {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 3px;
        letter-spacing: 0.04em;
      }
      .cp-doc-attached {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        min-height: 48px;
        background: rgba(var(--accent-rgb), 0.06);
        border: 1px solid var(--accent-muted);
        border-radius: 4px;
      }
      .cp-doc-attached__info {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .cp-doc-attached__name {
        font-family: var(--font-display);
        font-size: 12.5px;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cp-doc-attached__meta {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--accent);
        letter-spacing: 0.06em;
      }
      .cp-doc-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        border-radius: 3px;
        transition: color 140ms ease-out, background 140ms ease-out;
      }
      .cp-doc-remove:hover {
        color: var(--red, #f87171);
        background: rgba(255, 255, 255, 0.05);
      }
      .cp-docs-error {
        font-family: ${MONO};
        font-size: 12px;
        color: var(--red, #f87171);
        letter-spacing: 0.04em;
        margin-top: 8px;
      }

      @media (min-width: 700px) {
        .cp-card { padding: 24px 26px; }
        .cp-title { font-size: 20px; }
        .cp-docs-grid { grid-template-columns: 1fr 1fr; }
        .cp-actions { flex-direction: row-reverse; justify-content: flex-end; }
        .cp-btn { width: auto; min-width: 180px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .cp-skeleton { animation: none; }
        .cp-opt, .cp-btn { transition: none; }
        .cp-btn:active { transform: none; }
      }
    `}</style>
  );
}
