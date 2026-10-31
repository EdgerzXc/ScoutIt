"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  User,
  Send,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Info,
} from "lucide-react";
import { getSession } from "@/lib/authClient";
import PrivacyNotice from "@/components/ui/PrivacyNotice";
import { useModalDialog } from "@/components/ui/useModalDialog";
import { SIGNAL_TYPE_LABELS, SIGNAL_TYPES } from "@/lib/communitySignalsAdapter";
import {
  POSTABLE_SIGNAL_TYPES,
  TRANSACTION_REQUIRED_SIGNAL_TYPES,
  TRANSACTION_TYPES,
  SIGNAL_EXPIRY_DAYS,
} from "@/lib/communityPosting";
import "./signal-composer.css";

const STEPS = ["Category", "Details", "Location", "Review"];

// Simple regex checks to catch contact info before submission
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+?63[\s-]?9\d{2}[\s-]?\d{3}[\s-]?\d{4}|\b09\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|\(0\d{1,2}\)[\s-]?\d{3,4}[\s-]?\d{4})/;
const HANDLE_RE = /(?:telegram|viber|whatsapp|facebook|instagram|tiktok|wechat)\b\s*[:@]?\s*[\w.]{2,}|@[\w.]{3,}/i;
const PRICE_RE = /₱|php\s?[\d,]+|\d[\d,]*\s?\/?\s?(sqm|per sqm|mo\b)/i;
const TRANSACTION_RE = /\b(for sale|for lease|for rent|selling|leasing|renting out)\b/i;

// Organized into 3 clear categories using everyday words
const SIGNAL_GROUPS = [
  {
    role: "demand",
    label: "LOOKING FOR SPACE (DEMAND)",
    types: [
      {
        type: SIGNAL_TYPES.LOOKING_FOR,
        badge: "DIRECT CLIENT",
        title: "Looking For Space",
        hint: "You or your company need a space to rent or buy",
      },
      {
        type: SIGNAL_TYPES.REPRESENTING_CLIENT,
        badge: "BROKER CLIENT",
        title: "Representing a Client",
        hint: "You are an agent or broker looking for space for a client",
      },
      {
        type: SIGNAL_TYPES.BUSINESS_EXPANSION,
        badge: "EXPANSION",
        title: "Business Expansion",
        hint: "Your business is opening a new branch, store, or office",
      },
    ],
  },
  {
    role: "supply",
    label: "SPACES AVAILABLE (SUPPLY)",
    types: [
      {
        type: SIGNAL_TYPES.UPCOMING_SUPPLY,
        badge: "UPCOMING SPACE",
        title: "Upcoming Space",
        hint: "A space that will be vacant or ready for move-in soon",
      },
      {
        type: SIGNAL_TYPES.OPPORTUNITY,
        badge: "OPPORTUNITY",
        title: "Space Opportunity",
        hint: "Take over an existing lease, partner up, or buy out a spot",
      },
    ],
  },
  {
    role: "intel",
    label: "MARKET UPDATES & BUILDING PROMOTIONS",
    types: [
      {
        type: SIGNAL_TYPES.MARKET_OBSERVATION,
        badge: "MARKET UPDATE",
        title: "Market Update",
        hint: "Share what you notice in the area (foot traffic, new openings, rent changes)",
      },
      {
        type: SIGNAL_TYPES.COMMERCIAL_PROMOTION,
        badge: "BUILDING PROMO",
        title: "Commercial Promotion",
        hint: "Promote an available space in a specific building you represent",
      },
    ],
  },
];

const SPACE_TYPE_CHIPS = [
  "Office",
  "BPO / Call Center",
  "Retail / Restaurant",
  "Warehouse / Storage",
  "Industrial",
  "Commercial Land",
  "Showroom",
  "Cloud Kitchen",
];

const TIMING_CHIPS = ["Immediate", "1–3 Months", "Q1 2027", "Q2 2027", "H2 2027", "2028+"];

const MUST_HAVE_TAGS = [
  "High Ceiling (6m+)",
  "PEZA Registered",
  "3-Phase Power",
  "Truck / Loading Bay",
  "Fitted / Furnished",
  "Warm Shell",
  "Backup Generator",
  "Fast Fiber Internet",
];

const TOP_DISTRICTS = [
  { district: "BGC", city: "Taguig", label: "BGC (Taguig)" },
  { district: "Makati CBD", city: "Makati", label: "Makati CBD" },
  { district: "Ortigas Center", city: "Pasig", label: "Ortigas Center" },
  { district: "Bay Area", city: "Pasay", label: "Bay Area (Pasay)" },
  { district: "Alabang", city: "Muntinlupa", label: "Alabang" },
  { district: "Triangle Park / Diliman", city: "Quezon City", label: "Quezon City" },
  { district: "Clark Freeport", city: "Angeles", label: "Clark Freeport" },
  { district: "Cebu IT Park", city: "Cebu City", label: "Cebu IT Park" },
];

const TRANSACTION_LABELS = { lease: "RENT / LEASE", buy: "BUY", str: "SHORT STAY" };
const TRANSACTION_HINTS = { lease: "Long-term rental", buy: "Purchase property", str: "Short-term rental" };
const TRANSACTION_OPTIONS = TRANSACTION_TYPES.map((value) => ({
  value,
  label: TRANSACTION_LABELS[value] || value.toUpperCase(),
  hint: TRANSACTION_HINTS[value] || "",
}));

export const COVERAGE_RADIUS_OPTIONS = Object.freeze([
  { value: "0.5", label: "Spot (~500m)", hint: "Building or immediate block" },
  { value: "1.5", label: "Corridor (~1.5 km)", hint: "e.g. Station 1 to 2, or central core" },
  { value: "3.5", label: "Strip (~3.5 km)", hint: "e.g. Boracay Station 1 to 3, or whole BGC" },
  { value: "5.0", label: "District (~5 km)", hint: "Broad island / district catchment" },
]);

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
  buildingName: "",
  city: "",
  district: "",
  coverageRadius: "1.5",
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

  const needsTransaction = TRANSACTION_REQUIRED_SIGNAL_TYPES.has(form.signalType);
  const transactionLabel =
    TRANSACTION_OPTIONS.find((o) => o.value === form.transactionType)?.label || "-";

  // Check for personal contact details in real-time
  const safetyAudit = useMemo(() => {
    const combined = `${form.title || ""}\n${form.body || ""}`;
    const hasEmail = EMAIL_RE.test(combined);
    const hasPhone = PHONE_RE.test(combined);
    const hasHandle = HANDLE_RE.test(combined);
    const hasPii = hasEmail || hasPhone || hasHandle;
    const isListing = PRICE_RE.test(combined) && TRANSACTION_RE.test(combined);
    return { hasPii, isListing, hasEmail, hasPhone, hasHandle };
  }, [form.title, form.body]);

  // Ensure minimums are not higher than maximums
  const rangeErrors = useMemo(() => {
    const bMin = form.budgetMin === "" ? null : Number(form.budgetMin);
    const bMax = form.budgetMax === "" ? null : Number(form.budgetMax);
    const sMin = form.sizeMinSqm === "" ? null : Number(form.sizeMinSqm);
    const sMax = form.sizeMaxSqm === "" ? null : Number(form.sizeMaxSqm);
    const errs = [];
    if (bMin !== null && bMax !== null && Number.isFinite(bMin) && Number.isFinite(bMax) && bMin > bMax) {
      errs.push("Minimum budget cannot be higher than maximum budget.");
    }
    if (sMin !== null && sMax !== null && Number.isFinite(sMin) && Number.isFinite(sMax) && sMin > sMax) {
      errs.push("Minimum size cannot be higher than maximum size.");
    }
    return errs;
  }, [form.budgetMin, form.budgetMax, form.sizeMinSqm, form.sizeMaxSqm]);

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(form.signalType);
    if (step === 1) {
      return (
        form.title.trim().length > 0 &&
        form.body.trim().length > 0 &&
        !safetyAudit.hasPii &&
        rangeErrors.length === 0 &&
        (!needsTransaction || Boolean(form.transactionType))
      );
    }
    if (step === 2) {
      if (form.signalType === SIGNAL_TYPES.COMMERCIAL_PROMOTION) {
        return form.buildingName.trim().length > 0 || form.district.trim().length > 0;
      }
      return form.city.trim().length > 0 || form.district.trim().length > 0;
    }
    return true;
  }, [step, form, safetyAudit.hasPii, rangeErrors.length, needsTransaction]);

  // Toggle must-have features on or off
  const toggleMustHave = useCallback((tag) => {
    setForm((prev) => {
      const list = prev.mustHave
        ? prev.mustHave.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const lower = tag.toLowerCase();
      const idx = list.findIndex((item) => item.toLowerCase() === lower);
      let next;
      if (idx >= 0) {
        next = list.filter((_, i) => i !== idx);
      } else {
        next = [...list, tag];
      }
      return { ...prev, mustHave: next.join(", ") };
    });
    setErrors([]);
  }, []);

  const isTagActive = useCallback((tag) => {
    if (!form.mustHave) return false;
    const list = form.mustHave.split(",").map((s) => s.trim().toLowerCase());
    return list.includes(tag.toLowerCase());
  }, [form.mustHave]);

  const toggleSpaceType = useCallback((chip) => {
    setForm((prev) => ({
      ...prev,
      spaceType: prev.spaceType === chip ? "" : chip,
    }));
    setErrors([]);
  }, []);

  const toggleTiming = useCallback((chip) => {
    setForm((prev) => ({
      ...prev,
      timing: prev.timing === chip ? "" : chip,
    }));
    setErrors([]);
  }, []);

  const selectDistrict = useCallback((item) => {
    setForm((prev) => {
      if (prev.district === item.district && prev.city === item.city) {
        return { ...prev, district: "", city: "" };
      }
      return { ...prev, district: item.district, city: item.city };
    });
    setErrors([]);
  }, []);

  // Format size and budget numbers so they look natural
  const sizeFormatted = useMemo(() => {
    if (form.sizeMinSqm && form.sizeMaxSqm) {
      return `${Number(form.sizeMinSqm).toLocaleString()}–${Number(form.sizeMaxSqm).toLocaleString()}`;
    }
    if (form.sizeMinSqm) return `At least ${Number(form.sizeMinSqm).toLocaleString()}`;
    if (form.sizeMaxSqm) return `Up to ${Number(form.sizeMaxSqm).toLocaleString()}`;
    return null;
  }, [form.sizeMinSqm, form.sizeMaxSqm]);

  const budgetFormatted = useMemo(() => {
    if (form.budgetMin && form.budgetMax) {
      return `${Number(form.budgetMin).toLocaleString()}–${Number(form.budgetMax).toLocaleString()}`;
    }
    if (form.budgetMin) return `At least ${Number(form.budgetMin).toLocaleString()}`;
    if (form.budgetMax) return `Up to ${Number(form.budgetMax).toLocaleString()}`;
    return null;
  }, [form.budgetMin, form.budgetMax]);

  const locationString = useMemo(() => {
    const base = [form.buildingName.trim(), form.district.trim(), form.city.trim()].filter(Boolean).join(", ");
    if (!base) return "";
    const rad = COVERAGE_RADIUS_OPTIONS.find((o) => o.value === form.coverageRadius);
    return rad ? `${base} · ${rad.label}` : base;
  }, [form.buildingName, form.district, form.city, form.coverageRadius]);

  const activeGroup = useMemo(() => {
    return SIGNAL_GROUPS.find((g) => g.types.some((t) => t.type === form.signalType)) || SIGNAL_GROUPS[0];
  }, [form.signalType]);

  const publish = async () => {
    setPublishing(true);
    setErrors([]);
    try {
      const { data: { session } } = await getSession().catch(() => ({ data: {} }));
      const token = session?.access_token;
      if (!token) {
        setErrors([{ code: "NO_SESSION", message: "Please sign in to post. Your draft is still saved here." }]);
        setPublishing(false);
        return;
      }
      const userMustHave = form.mustHave
        ? form.mustHave.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      if (form.coverageRadius && !userMustHave.some((m) => m.startsWith("radius:"))) {
        userMustHave.push(`radius:${form.coverageRadius}km`);
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
        mustHave: userMustHave,
        coverageRadius: Number(form.coverageRadius) || 1.5,
        buildingName: form.buildingName.trim(),
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
            { code: "LISTING_SHAPED", message: "This looks like a property ad. Please post it through Create Space in Metropolis instead, where it gets its own property page." },
          ]);
        } else if (json.errors?.length) {
          setErrors(json.errors);
        } else {
          setErrors([{ code: "PUBLISH_FAILED", message: json.error || "Could not save your post. Please check your fields and try again." }]);
        }
        setPublishing(false);
        return;
      }
      setPublished({ id: json.id, scoutId: json.scoutId });
      setPublishing(false);
    } catch {
      setErrors([{ code: "PUBLISH_FAILED", message: "Could not save your post. Please try again." }]);
      setPublishing(false);
    }
  };

  const identityPreview =
    form.identityMode === "anonymous"
      ? identity?.scoutId || "SCOUT-••••"
      : identity?.displayName || identity?.scoutId || "Your profile";

  if (!isOpen) return null;

  return (
    <div className="scp-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="scp-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Post a community signal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="scp-header">
          <div className="scp-title-wrap">
            <Send size={14} className="scp-send-icon" aria-hidden="true" />
            <h3 className="scp-title">POST A SIGNAL</h3>
            <span className="scp-header-badge">NEW POST</span>
          </div>
          <button type="button" className="scp-close-btn" onClick={onClose} aria-label="Close composer">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <ol className="scp-steps" aria-label="Posting progress">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`scp-step${i === step ? " is-current" : ""}${i < step ? " is-done" : ""}`}
              aria-current={i === step ? "step" : undefined}
            >
              <span className="scp-step-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="scp-step-label">{label}</span>
            </li>
          ))}
        </ol>

        {published ? (
          <div className="scp-success">
            <CheckCircle2 size={36} className="scp-success-icon" aria-hidden="true" />
            <h4 className="scp-success-title">Your Post is Live!</h4>
            <p className="scp-success-desc">
              Posted under <strong>{published.scoutId}</strong>. It is now visible to everyone browsing this area. When someone has a match, they will message you through Connect.
            </p>
            <div className="scp-actions">
              <button
                type="button"
                className="scp-primary-btn"
                onClick={() => { onPublished({ id: published.id }); onClose(); }}
              >
                <span>VIEW ON RADAR</span>
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 0: PICK CATEGORY */}
            {step === 0 && (
              <div className="scp-step-content" role="region" aria-label="Signal category selection">
                <div className="scp-section-intro">
                  <h4 className="scp-section-heading">WHAT ARE YOU POSTING?</h4>
                  <p className="scp-section-desc">
                    Choose what best matches what you need or want to share so the right people see it.
                  </p>
                </div>

                <div className="scp-groups-container">
                  {SIGNAL_GROUPS.map((group) => (
                    <div key={group.role} className={`scp-group-block scp-group-${group.role}`}>
                      <div className="scp-group-header">
                        <span className="scp-group-label">{group.label}</span>
                      </div>
                      <div className="scp-type-grid" role="radiogroup" aria-label={group.label}>
                        {group.types.map((item) => {
                          const isActive = form.signalType === item.type;
                          return (
                            <button
                              key={item.type}
                              type="button"
                              role="radio"
                              aria-checked={isActive}
                              className={`scp-type-card scp-card-${group.role}${isActive ? " is-active" : ""}`}
                              onClick={() => set("signalType", item.type)}
                            >
                              <div className="scp-type-top">
                                <span className={`scp-role-badge scp-badge-${group.role}`}>
                                  {item.badge}
                                </span>
                                {isActive && <CheckCircle2 size={13} className="scp-active-check" aria-hidden="true" />}
                              </div>
                              <span className="scp-type-name">{item.title}</span>
                              <span className="scp-type-hint">{item.hint}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1: DETAILS */}
            {step === 1 && (
              <div className="scp-fields" role="region" aria-label="Signal details and parameters">
                <div className="scp-field">
                  <div className="scp-label-row">
                    <label className="scp-label" htmlFor="scp-title">HEADLINE</label>
                    <span className="scp-char-count">{form.title.length}/140</span>
                  </div>
                  <input
                    id="scp-title"
                    className="scp-input"
                    value={form.title}
                    maxLength={140}
                    placeholder="e.g. 500 sqm office space in BGC or 1,200 sqm warehouse near C5"
                    onChange={(e) => set("title", e.target.value)}
                  />
                </div>

                <div className="scp-field">
                  <div className="scp-label-row">
                    <label className="scp-label" htmlFor="scp-body">DETAILS & REQUIREMENTS</label>
                    <span className="scp-char-count">{form.body.length}/2000</span>
                  </div>
                  <textarea
                    id="scp-body"
                    className="scp-textarea"
                    rows={4}
                    maxLength={2000}
                    placeholder="Describe what you need or what you have (target size, ceiling height, parking, move-in date). Please do not put personal phone numbers, emails, or chat handles here — members will message you securely through Connect."
                    value={form.body}
                    onChange={(e) => set("body", e.target.value)}
                  />
                </div>

                {/* REAL-TIME PRIVACY WARNING */}
                {safetyAudit.hasPii && (
                  <div className="scp-guard-warning" role="alert">
                    <AlertTriangle size={15} className="scp-guard-icon" aria-hidden="true" />
                    <div className="scp-guard-text">
                      <strong>Contact Info Detected:</strong> We found a phone number, email address, or chat handle in your text. To keep your information safe and avoid spam, please remove it. Interested people will connect with you directly through the website.
                    </div>
                  </div>
                )}

                {/* LISTING ADVISORY */}
                {safetyAudit.isListing && (
                  <div className="scp-advisory" role="status">
                    <Info size={15} className="scp-advisory-icon" aria-hidden="true" />
                    <div className="scp-advisory-text">
                      <strong>Tip:</strong> If you are posting a full property brochure with fixed prices, you can create an official property page under Create Space in Metropolis.
                    </div>
                  </div>
                )}

                {/* TRANSACTION TYPE */}
                {needsTransaction && (
                  <div className="scp-field">
                    <span className="scp-label">RENT OR BUY? *</span>
                    <div className="scp-txn-grid" role="radiogroup" aria-label="Transaction type">
                      {TRANSACTION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={form.transactionType === opt.value}
                          className={`scp-txn-chip${form.transactionType === opt.value ? " is-active" : ""}`}
                          onClick={() => set("transactionType", opt.value)}
                        >
                          <span className="scp-txn-name">{opt.label}</span>
                          <span className="scp-txn-hint">{opt.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SPACE TYPE */}
                <div className="scp-field">
                  <div className="scp-label-row">
                    <label className="scp-label" htmlFor="scp-space">SPACE TYPE</label>
                    <span className="scp-field-hint">Tap a type or type your own</span>
                  </div>
                  <div className="scp-chips-wrap" role="group" aria-label="Space type quick options">
                    {SPACE_TYPE_CHIPS.map((chip) => {
                      const isSel = form.spaceType === chip;
                      return (
                        <button
                          key={chip}
                          type="button"
                          className={`scp-chip${isSel ? " is-active" : ""}`}
                          onClick={() => toggleSpaceType(chip)}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    id="scp-space"
                    className="scp-input scp-input-mt"
                    value={form.spaceType}
                    placeholder="Other space type (e.g. Data Center, Commissary)"
                    onChange={(e) => set("spaceType", e.target.value)}
                  />
                </div>

                {/* NUMERIC RANGES */}
                <div className="scp-row">
                  <div className="scp-field">
                    <label className="scp-label" htmlFor="scp-size-min">SIZE MIN (SQM)</label>
                    <input
                      id="scp-size-min"
                      className="scp-input"
                      inputMode="numeric"
                      placeholder="e.g. 500"
                      value={form.sizeMinSqm}
                      onChange={(e) => set("sizeMinSqm", e.target.value)}
                    />
                  </div>
                  <div className="scp-field">
                    <label className="scp-label" htmlFor="scp-size-max">SIZE MAX (SQM)</label>
                    <input
                      id="scp-size-max"
                      className="scp-input"
                      inputMode="numeric"
                      placeholder="e.g. 1500"
                      value={form.sizeMaxSqm}
                      onChange={(e) => set("sizeMaxSqm", e.target.value)}
                    />
                  </div>
                </div>

                <div className="scp-row">
                  <div className="scp-field">
                    <label className="scp-label" htmlFor="scp-budget-min">BUDGET MIN (₱)</label>
                    <input
                      id="scp-budget-min"
                      className="scp-input"
                      inputMode="numeric"
                      placeholder="e.g. 100000"
                      value={form.budgetMin}
                      onChange={(e) => set("budgetMin", e.target.value)}
                    />
                  </div>
                  <div className="scp-field">
                    <label className="scp-label" htmlFor="scp-budget-max">BUDGET MAX (₱)</label>
                    <input
                      id="scp-budget-max"
                      className="scp-input"
                      inputMode="numeric"
                      placeholder="e.g. 350000"
                      value={form.budgetMax}
                      onChange={(e) => set("budgetMax", e.target.value)}
                    />
                  </div>
                </div>

                {rangeErrors.length > 0 && (
                  <div className="scp-error-banner" role="alert">
                    {rangeErrors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                )}

                {/* TIMING SELECTION */}
                <div className="scp-field">
                  <div className="scp-label-row">
                    <label className="scp-label" htmlFor="scp-timing">WHEN DO YOU NEED IT?</label>
                    <span className="scp-field-hint">Choose a timeframe or type below</span>
                  </div>
                  <div className="scp-chips-wrap" role="group" aria-label="Timing quick options">
                    {TIMING_CHIPS.map((chip) => {
                      const isSel = form.timing === chip;
                      return (
                        <button
                          key={chip}
                          type="button"
                          className={`scp-chip${isSel ? " is-active" : ""}`}
                          onClick={() => toggleTiming(chip)}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    id="scp-timing"
                    className="scp-input scp-input-mt"
                    value={form.timing}
                    placeholder="e.g. Within 30 days or by Q1 2027"
                    onChange={(e) => set("timing", e.target.value)}
                  />
                </div>

                {/* MUST-HAVES */}
                <div className="scp-field">
                  <div className="scp-label-row">
                    <label className="scp-label" htmlFor="scp-musts">MUST-HAVES & FEATURES</label>
                    <span className="scp-field-hint">Tap to add common features</span>
                  </div>
                  <div className="scp-chips-wrap" role="group" aria-label="Common must-have requirements">
                    {MUST_HAVE_TAGS.map((tag) => {
                      const isSel = isTagActive(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`scp-chip${isSel ? " is-active" : ""}`}
                          onClick={() => toggleMustHave(tag)}
                        >
                          {isSel ? tag : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    id="scp-musts"
                    className="scp-input scp-input-mt"
                    value={form.mustHave}
                    placeholder="Other requirements separated by commas (e.g. 24/7 access, freight elevator)"
                    onChange={(e) => set("mustHave", e.target.value)}
                  />
                </div>

                {/* COMMERCIAL PROMOTION BUILDING NAME */}
                {form.signalType === SIGNAL_TYPES.COMMERCIAL_PROMOTION && (
                  <div className="scp-field scp-promo-building-field">
                    <div className="scp-label-row">
                      <label className="scp-label" htmlFor="scp-building">
                        <Building2 size={13} className="scp-label-icon" aria-hidden="true" />
                        BUILDING NAME (REQUIRED FOR PROMOTIONS)
                      </label>
                      <span className="scp-field-hint">Which building is this for?</span>
                    </div>
                    <input
                      id="scp-building"
                      className="scp-input"
                      value={form.buildingName}
                      placeholder="e.g. One Bonifacio High Street, BGC"
                      onChange={(e) => set("buildingName", e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: LOCATION & IDENTITY */}
            {step === 2 && (
              <div className="scp-fields" role="region" aria-label="Location and identity">
                <div className="scp-field">
                  <div className="scp-label-row">
                    <span className="scp-label">POPULAR DISTRICTS</span>
                    <span className="scp-field-hint">Tap to fill in district and city</span>
                  </div>
                  <div className="scp-chips-wrap" role="group" aria-label="Commercial districts">
                    {TOP_DISTRICTS.map((item) => {
                      const isSel = form.district === item.district && form.city === item.city;
                      return (
                        <button
                          key={item.district}
                          type="button"
                          className={`scp-chip scp-district-chip${isSel ? " is-active" : ""}`}
                          onClick={() => selectDistrict(item)}
                        >
                          <MapPin size={12} className="scp-chip-icon" aria-hidden="true" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="scp-row">
                  <div className="scp-field">
                    <label className="scp-label" htmlFor="scp-district">DISTRICT / NEIGHBORHOOD</label>
                    <input
                      id="scp-district"
                      className="scp-input"
                      value={form.district}
                      placeholder="e.g. BGC, Ortigas, Makati CBD"
                      onChange={(e) => set("district", e.target.value)}
                    />
                  </div>
                  <div className="scp-field">
                    <label className="scp-label" htmlFor="scp-city">CITY</label>
                    <input
                      id="scp-city"
                      className="scp-input"
                      value={form.city}
                      placeholder="e.g. Taguig, Pasig, Makati"
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </div>
                </div>

                <p className="scp-place-note">
                  <MapPin size={12} aria-hidden="true" />
                  A district or city is all you need. You do not have to give an exact street address.
                </p>

                <div className="scp-field">
                  <div className="scp-label-row">
                    <span className="scp-label">SEARCH COVERAGE / CATCHMENT RADIUS</span>
                    <span className="scp-field-hint">How wide should your beacon broadcast?</span>
                  </div>
                  <div className="scp-radius-grid" role="group" aria-label="Coverage radius options">
                    {COVERAGE_RADIUS_OPTIONS.map((opt) => {
                      const isSel = form.coverageRadius === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`scp-radius-chip${isSel ? " is-active" : ""}`}
                          onClick={() => set("coverageRadius", opt.value)}
                        >
                          <span className="scp-radius-label">{opt.label}</span>
                          <span className="scp-radius-hint">{opt.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="scp-field scp-id-section">
                  <span className="scp-label">HOW SHOULD YOUR NAME BE SHOWN?</span>
                  <div className="scp-identity" data-scoutit-guide="signal-composer-identity" role="radiogroup" aria-label="Posting identity">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={form.identityMode === "anonymous"}
                      className={`scp-id-card${form.identityMode === "anonymous" ? " is-active" : ""}`}
                      onClick={() => set("identityMode", "anonymous")}
                    >
                      <div className="scp-id-top">
                        <ShieldCheck size={14} className="scp-id-icon" aria-hidden="true" />
                        <span className="scp-id-name">ANONYMOUS (SCOUT ID)</span>
                      </div>
                      <div className="scp-id-preview-row">
                        <span className="scp-id-preview">{identity?.scoutId || "SCOUT-••••"}</span>
                        <span className="scp-id-trust-badge">
                          {identity?.trustTier || "[First-Time Verified Seeker]"}
                        </span>
                      </div>
                      <span className="scp-id-hint">
                        Your real name and phone stay private. Your verified behavioral standing ({identity?.trustTier || "[First-Time Verified Seeker]"}) is attached so counterparties know you are a trusted seeker.
                      </span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={form.identityMode === "public"}
                      className={`scp-id-card${form.identityMode === "public" ? " is-active" : ""}`}
                      onClick={() => set("identityMode", "public")}
                    >
                      <div className="scp-id-top">
                        <User size={14} className="scp-id-icon" aria-hidden="true" />
                        <span className="scp-id-name">SHOW YOUR PROFILE NAME</span>
                      </div>
                      <span className="scp-id-preview">{identity?.displayName || identity?.scoutId || "Your profile"}</span>
                      <span className="scp-id-hint">
                        Shows your name and verified badge so members recognize you directly.
                      </span>
                    </button>
                  </div>
                </div>

                <p className="scp-place-note">
                  <User size={12} aria-hidden="true" /> Posting as <strong>{identityPreview}</strong>
                </p>
              </div>
            )}

            {/* STEP 3: REVIEW */}
            {step === 3 && (
              <div className="scp-review" role="region" aria-label="Signal preview and review">
                <div className="scp-review-header">
                  <span className="scp-label">HOW YOUR POST WILL LOOK</span>
                  <span className="scp-review-status-tag">READY TO POST</span>
                </div>

                {/* LIVE PREVIEW CARD */}
                <div className={`scp-preview-card scp-preview-${activeGroup.role}`}>
                  <div className="scp-preview-spine" />
                  <div className="scp-preview-content">
                    <div className="scp-preview-top-row">
                      <span className={`scp-preview-role-pill scp-badge-${activeGroup.role}`}>
                        {activeGroup.role === "demand" ? "LOOKING FOR SPACE" : activeGroup.role === "supply" ? "AVAILABLE SPACE" : "MARKET UPDATE"}
                      </span>
                      {needsTransaction && form.transactionType && (
                        <span className="scp-preview-txn-pill">
                          {transactionLabel}
                        </span>
                      )}
                      {form.timing && (
                        <span className="scp-preview-timing-pill">
                          {form.timing}
                        </span>
                      )}
                    </div>

                    <h4 className="scp-preview-title">{form.title.trim() || "Untitled"}</h4>

                    <p className="scp-preview-body">{form.body.trim()}</p>

                    <div className="scp-preview-specs">
                      {sizeFormatted && (
                        <span className="scp-preview-chip">
                          AREA: {sizeFormatted} SQM
                        </span>
                      )}
                      {budgetFormatted && (
                        <span className="scp-preview-chip">
                          BUDGET: ₱{budgetFormatted}
                        </span>
                      )}
                      {form.spaceType && (
                        <span className="scp-preview-chip">
                          TYPE: {form.spaceType}
                        </span>
                      )}
                      {locationString && (
                        <span className="scp-preview-chip">
                          LOC: {locationString}
                        </span>
                      )}
                    </div>

                    {form.mustHave && (
                      <div className="scp-preview-reqs">
                        <span className="scp-preview-reqs-label">MUST-HAVES:</span>
                        <div className="scp-preview-reqs-tags">
                          {form.mustHave.split(",").map((t) => t.trim()).filter(Boolean).map((t, idx) => (
                            <span key={idx} className="scp-preview-req-tag">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="scp-preview-footer">
                      <div className="scp-preview-signer">
                        <ShieldCheck size={12} className="scp-preview-signer-icon" aria-hidden="true" />
                        <span>POSTED AS <strong>{form.identityMode === "anonymous" ? `${identityPreview} (ANONYMOUS)` : `${identityPreview} (PUBLIC)`}</strong></span>
                      </div>
                      <span className="scp-preview-cadence">ACTIVE FOR 7 DAYS</span>
                    </div>
                  </div>
                </div>

                {/* SUMMARY DETAILS */}
                <dl className="scp-dl">
                  <div className="scp-dl-row">
                    <dt>CATEGORY</dt>
                    <dd>{SIGNAL_TYPE_LABELS[form.signalType] || "-"}</dd>
                  </div>
                  {needsTransaction && (
                    <div className="scp-dl-row">
                      <dt>INTENT</dt>
                      <dd>{transactionLabel}</dd>
                    </div>
                  )}
                  <div className="scp-dl-row">
                    <dt>HEADLINE</dt>
                    <dd>{form.title.trim() || "-"}</dd>
                  </div>
                  <div className="scp-dl-row">
                    <dt>LOCATION</dt>
                    <dd>{locationString || "-"}</dd>
                  </div>
                  <div className="scp-dl-row">
                    <dt>POSTED BY</dt>
                    <dd>{form.identityMode === "anonymous" ? `${identityPreview} (Anonymous)` : `${identityPreview} (Public Profile)`}</dd>
                  </div>
                </dl>

                <p className="scp-review-note">
                  Your post stays live for {SIGNAL_EXPIRY_DAYS} days. You can refresh it each week with one click. Other members can mark it as helpful or connect with you.
                </p>
              </div>
            )}

            {errors.length > 0 && (
              <div className="scp-error-banner" role="alert">
                {errors.map((e) => (
                  <p key={e.code || e.message}>{e.message}</p>
                ))}
              </div>
            )}

            <div className="scp-actions">
              {step > 0 ? (
                <button
                  type="button"
                  className="scp-ghost-btn"
                  onClick={() => setStep(step - 1)}
                  disabled={publishing}
                >
                  <ArrowLeft size={12} aria-hidden="true" />
                  <span>BACK</span>
                </button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <button
                  type="button"
                  className="scp-primary-btn"
                  onClick={() => canNext && setStep(step + 1)}
                  disabled={!canNext}
                >
                  <span>CONTINUE</span>
                  <ArrowRight size={12} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  className={`scp-primary-btn${publishing ? " is-sending" : ""}`}
                  onClick={publish}
                  disabled={publishing}
                >
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