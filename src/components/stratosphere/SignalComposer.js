"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, ArrowLeft, ArrowRight, CheckCircle2, MapPin, User, Send } from "lucide-react";
import { getSession } from "@/lib/authClient";
import PrivacyNotice from "@/components/ui/PrivacyNotice";
import { useModalDialog } from "@/components/ui/useModalDialog";
import { SIGNAL_TYPE_LABELS } from "@/lib/communitySignalsAdapter";
import { POSTABLE_SIGNAL_TYPES } from "@/lib/communityPosting";
import "./signal-composer.css";

const STEPS = ["Type", "Details", "Place & Identity", "Review"];

const TYPE_HINTS = {
  LOOKING_FOR: "Demand for a space",
  REPRESENTING_CLIENT: "Demand sourced for a client",
  UPCOMING_SUPPLY: "Space becoming available",
  BUSINESS_EXPANSION: "Next branch, store, or site",
  OPPORTUNITY: "Partnership, tenancy, operator",
  MARKET_OBSERVATION: "Foot traffic, activity, change",
  COMMERCIAL_PROMOTION: "Labeled promotion, never boosted",
};

const EMPTY = {
  signalType: "",
  title: "",
  body: "",
  transactionType: "",
  spaceType: "",
  budgetMin: "",
  budgetMax: "",
  sizeMinSqm: "",
  sizeMaxSqm: "",
  timing: "",
  mustHave: "",
  city: "",
  district: "",
  identityMode: "anonymous",
};

export default function SignalComposer({ isOpen = false, onClose = () => {}, onPublished = () => {} }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [identity, setIdentity] = useState(null);
  const [errors, setErrors] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(null);
  const dialogRef = useRef(null);
  useModalDialog(dialogRef, { active: isOpen, onClose });

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setErrors([]);
    setPublishing(false);
    setPublished(null);
    let alive = true;
    (async () => {
      try {
        const { data: { session } } = await getSession().catch(() => ({ data: {} }));
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch("/api/community/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (alive && json.ok) setIdentity(json);
      } catch {}
    })();
    return () => { alive = false; };
  }, [isOpen]);

  const set = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors([]);
  }, []);

  if (!isOpen) return null;

  const canNext =
    step === 0 ? Boolean(form.signalType)
    : step === 1 ? form.title.trim().length > 0 && form.body.trim().length > 0
    : step === 2 ? (form.city.trim().length > 0 || form.district.trim().length > 0)
    : true;

  const publish = async () => {
    setPublishing(true);
    setErrors([]);
    try {
      const { data: { session } } = await getSession().catch(() => ({ data: {} }));
      const token = session?.access_token;
      if (!token) {
        setErrors([{ code: "NO_SESSION", message: "Sign in to post. Your draft stays right here." }]);
        setPublishing(false);
        return;
      }
      const payload = {
        signalType: form.signalType,
        title: form.title.trim(),
        body: form.body.trim(),
        transactionType: form.transactionType.trim(),
        spaceType: form.spaceType.trim(),
        budgetMin: form.budgetMin === "" ? null : Number(form.budgetMin),
        budgetMax: form.budgetMax === "" ? null : Number(form.budgetMax),
        sizeMinSqm: form.sizeMinSqm === "" ? null : Number(form.sizeMinSqm),
        sizeMaxSqm: form.sizeMaxSqm === "" ? null : Number(form.sizeMaxSqm),
        timing: form.timing.trim(),
        mustHave: form.mustHave,
        city: form.city.trim(),
        district: form.district.trim(),
        identityMode: form.identityMode,
      };
      const res = await fetch("/api/community/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        if (json.redirectToMetropolis) {
          setErrors([
            { code: "LISTING_SHAPED", message: "This reads as a property ad — post it through Create Space in Metropolis instead, where it gets a verified page." },
          ]);
        } else if (json.errors?.length) {
          setErrors(json.errors);
        } else {
          setErrors([{ code: "PUBLISH_FAILED", message: json.error || "Could not publish. Nothing was saved." }]);
        }
        setPublishing(false);
        return;
      }
      setPublished({ id: json.id, scoutId: json.scoutId });
      setPublishing(false);
    } catch {
      setErrors([{ code: "PUBLISH_FAILED", message: "Could not publish. Nothing was saved." }]);
      setPublishing(false);
    }
  };

  const identityPreview =
    form.identityMode === "anonymous"
      ? identity?.scoutId || "SCOUT-••••"
      : identity?.displayName || identity?.scoutId || "Your profile";

  return (
    <div className="scp-overlay" onClick={onClose}>
      <div ref={dialogRef} className="scp-panel" role="dialog" aria-modal="true" aria-label="Post a community signal" onClick={(e) => e.stopPropagation()}>
        <div className="scp-header">
          <div className="scp-title-wrap">
            <Send size={14} className="scp-send-icon" aria-hidden="true" />
            <h3 className="scp-title">POST A SIGNAL</h3>
          </div>
          <button type="button" className="scp-close-btn" onClick={onClose} aria-label="Close composer">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <ol className="scp-steps" aria-label="Posting progress">
          {STEPS.map((label, i) => (
            <li key={label} className={`scp-step${i === step ? " is-current" : ""}${i < step ? " is-done" : ""}`} aria-current={i === step ? "step" : undefined}>
              <span className="scp-step-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="scp-step-label">{label}</span>
            </li>
          ))}
        </ol>

        {published ? (
          <div className="scp-success">
            <CheckCircle2 size={34} className="scp-success-icon" aria-hidden="true" />
            <h4 className="scp-success-title">Signal live</h4>
            <p className="scp-success-desc">
              Posted as <strong>{published.scoutId}</strong>. It now sits in the radar dossier and the map lens — members answer with Relevant or Connect.
            </p>
            <div className="scp-actions">
              <button
                type="button"
                className="scp-primary-btn"
                onClick={() => { onPublished({ id: published.id }); onClose(); }}
              >
                SEE IT IN THE RADAR
              </button>
            </div>
          </div>
        ) : (
          <>
            {step === 0 && (
              <div className="scp-type-grid" role="radiogroup" aria-label="Signal type">
                {POSTABLE_SIGNAL_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={form.signalType === t}
                    className={`scp-type-card${form.signalType === t ? " is-active" : ""}`}
                    onClick={() => set("signalType", t)}
                  >
                    <span className="scp-type-name">{SIGNAL_TYPE_LABELS[t].toUpperCase()}</span>
                    <span className="scp-type-hint">{TYPE_HINTS[t]}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="scp-fields">
                <label className="scp-field" htmlFor="scp-title">
                  <span className="scp-label">HEADLINE</span>
                  <input id="scp-title" className="scp-input" value={form.title} maxLength={140}
                    placeholder="1,200 sqm cold-chain hub near C5" onChange={(e) => set("title", e.target.value)} />
                </label>
                <label className="scp-field" htmlFor="scp-body">
                  <span className="scp-label">WHAT DO YOU NEED, SEE, OR OFFER?</span>
                  <textarea id="scp-body" className="scp-textarea" rows={4} maxLength={2000}
                    placeholder="Size, must-haves, timing. No emails, phone numbers, or chat handles — Connect handles introductions."
                    value={form.body} onChange={(e) => set("body", e.target.value)} />
                </label>
                <div className="scp-row">
                  <label className="scp-field" htmlFor="scp-budget-min"><span className="scp-label">BUDGET MIN (₱)</span>
                    <input id="scp-budget-min" className="scp-input" inputMode="numeric" value={form.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} /></label>
                  <label className="scp-field" htmlFor="scp-budget-max"><span className="scp-label">BUDGET MAX (₱)</span>
                    <input id="scp-budget-max" className="scp-input" inputMode="numeric" value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} /></label>
                </div>
                <div className="scp-row">
                  <label className="scp-field" htmlFor="scp-size-min"><span className="scp-label">SIZE MIN (SQM)</span>
                    <input id="scp-size-min" className="scp-input" inputMode="numeric" value={form.sizeMinSqm} onChange={(e) => set("sizeMinSqm", e.target.value)} /></label>
                  <label className="scp-field" htmlFor="scp-size-max"><span className="scp-label">SIZE MAX (SQM)</span>
                    <input id="scp-size-max" className="scp-input" inputMode="numeric" value={form.sizeMaxSqm} onChange={(e) => set("sizeMaxSqm", e.target.value)} /></label>
                </div>
                <div className="scp-row">
                  <label className="scp-field" htmlFor="scp-space"><span className="scp-label">SPACE TYPE</span>
                    <input id="scp-space" className="scp-input" value={form.spaceType} placeholder="Office, warehouse, retail…" onChange={(e) => set("spaceType", e.target.value)} /></label>
                  <label className="scp-field" htmlFor="scp-timing"><span className="scp-label">TIMING</span>
                    <input id="scp-timing" className="scp-input" value={form.timing} placeholder="Q1 2027" onChange={(e) => set("timing", e.target.value)} /></label>
                </div>
                <label className="scp-field" htmlFor="scp-musts"><span className="scp-label">MUST-HAVES (COMMA-SEPARATED)</span>
                  <input id="scp-musts" className="scp-input" value={form.mustHave} placeholder="8m ceiling, 3-phase power, truck ingress" onChange={(e) => set("mustHave", e.target.value)} /></label>
              </div>
            )}

            {step === 2 && (
              <div className="scp-fields">
                <div className="scp-row">
                  <label className="scp-field" htmlFor="scp-city"><span className="scp-label">CITY</span>
                    <input id="scp-city" className="scp-input" value={form.city} placeholder="Taguig" onChange={(e) => set("city", e.target.value)} /></label>
                  <label className="scp-field" htmlFor="scp-district"><span className="scp-label">DISTRICT</span>
                    <input id="scp-district" className="scp-input" value={form.district} placeholder="BGC" onChange={(e) => set("district", e.target.value)} /></label>
                </div>
                <p className="scp-place-note"><MapPin size={12} aria-hidden="true" /> City or district is enough — exact pins are never forced.</p>
                <div className="scp-identity" role="radiogroup" aria-label="Posting identity">
                  <button type="button" role="radio" aria-checked={form.identityMode === "anonymous"}
                    className={`scp-id-card${form.identityMode === "anonymous" ? " is-active" : ""}`}
                    onClick={() => set("identityMode", "anonymous")}>
                    <span className="scp-id-name">ANONYMOUS</span>
                    <span className="scp-id-preview">{identity?.scoutId || "SCOUT-••••"}</span>
                    <span className="scp-id-hint">Only your Scout ID shows. Reports still resolve to your account.</span>
                  </button>
                  <button type="button" role="radio" aria-checked={form.identityMode === "public"}
                    className={`scp-id-card${form.identityMode === "public" ? " is-active" : ""}`}
                    onClick={() => set("identityMode", "public")}>
                    <span className="scp-id-name">PUBLIC PROFILE</span>
                    <span className="scp-id-preview">{identity?.displayName || identity?.scoutId || "Your profile"}</span>
                    <span className="scp-id-hint">Your name shows beside the post.</span>
                  </button>
                </div>
                <p className="scp-place-note"><User size={12} aria-hidden="true" /> Posting as <strong>{identityPreview}</strong></p>
              </div>
            )}

            {step === 3 && (
              <div className="scp-review">
                <dl className="scp-dl">
                  <div className="scp-dl-row"><dt>TYPE</dt><dd>{SIGNAL_TYPE_LABELS[form.signalType]}</dd></div>
                  <div className="scp-dl-row"><dt>HEADLINE</dt><dd>{form.title.trim() || "—"}</dd></div>
                  <div className="scp-dl-row"><dt>PLACE</dt><dd>{[form.district.trim(), form.city.trim()].filter(Boolean).join(", ") || "—"}</dd></div>
                  <div className="scp-dl-row"><dt>SIGNED</dt><dd>{form.identityMode === "anonymous" ? identityPreview : `${identityPreview} (public)`}</dd></div>
                </dl>
                <p className="scp-review-note">Live for 30 days unless refreshed. No comments — members answer with Relevant or a permissioned Connect.</p>
              </div>
            )}

            {errors.length > 0 && (
              <div className="scp-error-banner" role="alert">
                {errors.map((e) => <p key={e.code}>{e.message}</p>)}
              </div>
            )}

            <div className="scp-actions">
              {step > 0 ? (
                <button type="button" className="scp-ghost-btn" onClick={() => setStep(step - 1)} disabled={publishing}>
                  <ArrowLeft size={12} aria-hidden="true" /><span>BACK</span>
                </button>
              ) : <span />}
              {step < 3 ? (
                <button type="button" className="scp-primary-btn" onClick={() => canNext && setStep(step + 1)} disabled={!canNext}>
                  <span>CONTINUE</span><ArrowRight size={12} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className={`scp-primary-btn${publishing ? " is-sending" : ""}`} onClick={publish} disabled={publishing}>
                  <Send size={12} aria-hidden="true" />
                  <span>{publishing ? "POSTING…" : "POST SIGNAL"}</span>
                </button>
              )}
            </div>
            <PrivacyNotice />
          </>
        )}
      </div>
    </div>
  );
}
