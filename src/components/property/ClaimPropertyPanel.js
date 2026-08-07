"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import { sanitizeError } from "@/lib/sanitizeError";
import { LISTER_RELATIONSHIPS, OWNER_SOVEREIGNTY_DISCLAIMER } from "@/lib/listerRelationship";

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
  submitted: "Submitted — waiting for review",
  technical_review: "Under technical review",
  needs_information: "More information needed from you",
  human_review: "Under review by our team",
  disputed: "Disputed — under review",
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
        <div className="cp-eyebrow">Owner Sovereignty</div>

        {/* Already claimed by this user — show status, offer no second claim. */}
        {myClaim ? (
          <>
            <h3 className="cp-title" id="cp-title">Your claim is on file</h3>
            <p className="cp-body">
              {STATUS_COPY[myClaim.status] || "Under review"}. We&apos;ll contact you at
              your account email if we need documents.
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
            <h3 className="cp-title" id="cp-title">Is this your property?</h3>
            <p className="cp-body">
              Whoever listed this has not been verified as the title holder. If the
              property is yours, you can claim the file and take control of it.
            </p>

            {!state.signedIn ? (
              <>
                <p className="cp-note">
                  You&apos;ll need to sign in first — a claim has to be attached to a real
                  account.
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
                    I confirm this is true. I understand a false claim against someone
                    else&apos;s listing can be reported to the PRC and may end my account.
                  </span>
                </label>

                {touched && !ready && !error && (
                  <div className="cp-hint">
                    {!relationship
                      ? "Choose your relationship to this property."
                      : "Tick the confirmation to submit."}
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
                    {busy ? "Submitting…" : "Submit claim"}
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
                  owner. Documents stay private and are never shown on the listing.
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
        background: linear-gradient(90deg, #131313 0%, #181818 50%, #131313 100%);
        background-size: 200% 100%;
        animation: cpShimmer 1.4s ease-in-out infinite;
      }
      @keyframes cpShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .cp-card {
        background: var(--surface2, #131313);
        border: 0.5px solid var(--border, #262626);
        border-left: 2px solid var(--accent, #6E531A);
        border-radius: 4px;
        padding: 20px 17px;
      }
      .cp-eyebrow {
        font-family: ${MONO};
        font-size: 9px;
        color: #E8AE3C;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        margin-bottom: 9px;
      }
      .cp-title {
        font-family: Georgia, serif;
        font-weight: 400;
        font-size: 18px;
        line-height: 1.3;
        color: var(--text-primary, #f0ede8);
        margin: 0 0 9px;
      }
      .cp-body {
        font-family: Georgia, serif;
        font-size: 13.5px;
        line-height: 1.7;
        color: var(--text-secondary, #c8c8c8);
        margin: 0 0 16px;
        max-width: 56ch;
      }
      .cp-note {
        font-family: Georgia, serif;
        font-size: 12px;
        line-height: 1.65;
        color: var(--text-muted, #6a6a6a);
        margin: 14px 0 0;
        max-width: 56ch;
      }
      .cp-meta {
        font-family: ${MONO};
        font-size: 9px;
        color: var(--text-muted, #5a5a5a);
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .cp-form { margin-top: 4px; }
      .cp-fieldset { border: none; padding: 0; margin: 0 0 4px; }
      .cp-legend {
        font-family: ${MONO};
        font-size: 9px;
        color: var(--text-muted, #8a8a8a);
        letter-spacing: 0.16em;
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
        background: var(--surface, #171717);
        border: 0.5px solid var(--border, #262626);
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 160ms ease-out, background-color 160ms ease-out, transform 120ms ease-out;
      }
      .cp-opt:active { transform: scale(0.98); }
      .cp-opt:hover { border-color: #3a3a3a; }
      .cp-opt:focus-within { outline: 2px solid #6E531A; outline-offset: 2px; }
      .cp-opt--on { background: rgba(232, 174, 60, 0.06); border-color: #6E531A; }
      .cp-radio {
        flex: 0 0 auto;
        width: 18px;
        height: 18px;
        margin-top: 2px;
        accent-color: #E8AE3C;
        cursor: pointer;
      }
      .cp-opt__main { min-width: 0; flex: 1; }
      .cp-opt__label {
        display: block;
        font-family: Georgia, serif;
        font-size: 14.5px;
        line-height: 1.35;
        color: var(--text-primary, #f0ede8);
        margin-bottom: 4px;
      }
      .cp-opt__detail {
        display: block;
        font-family: Georgia, serif;
        font-size: 12.5px;
        line-height: 1.6;
        color: #8a8a8a;
      }

      .cp-disclaimer {
        background: rgba(232, 174, 60, 0.05);
        border-left: 2px solid #6E531A;
        padding: 11px 12px;
        margin: 14px 0 10px;
        font-family: Georgia, serif;
        font-size: 12.5px;
        line-height: 1.65;
        color: #c8c8c8;
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
        accent-color: #E8AE3C;
        cursor: pointer;
      }
      .cp-agree__text {
        font-family: Georgia, serif;
        font-size: 12.5px;
        line-height: 1.6;
        color: #c8c8c8;
      }

      .cp-hint {
        font-family: ${MONO};
        font-size: 9.5px;
        color: #8a8a8a;
        letter-spacing: 0.06em;
        line-height: 1.7;
        margin-top: 8px;
      }
      .cp-error {
        font-family: ${MONO};
        font-size: 10px;
        color: #e8644a;
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
        font-size: 10px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        text-decoration: none;
        cursor: pointer;
        transition: transform 140ms ease-out, opacity 140ms ease-out;
      }
      .cp-btn:active { transform: scale(0.97); }
      .cp-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .cp-btn:disabled:active { transform: none; }
      .cp-btn:focus-visible { outline: 2px solid #E8AE3C; outline-offset: 2px; }
      /* The single gold element in this panel — 95/5 rule. */
      .cp-btn--gold { background: #F7C64E; border: none; color: #0d0d0d; font-weight: bold; }
      .cp-btn--ghost { background: transparent; border: 0.5px solid #262626; color: #c8c8c8; }

      @media (min-width: 700px) {
        .cp-card { padding: 24px 26px; }
        .cp-title { font-size: 20px; }
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
