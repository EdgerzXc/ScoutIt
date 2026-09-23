"use client";

import React, { useRef, useState } from "react";
import { X, Shield, Send, CheckCircle2, Zap } from "lucide-react";
import { INTRO_MAX } from "@/lib/connectIntro";
import { getSession } from "@/lib/authClient";
import PrivacyNotice from "@/components/ui/PrivacyNotice";
import { useModalDialog } from "@/components/ui/useModalDialog";
import "./community-connect-modal.css";

export default function CommunityConnectModal({
  signal = null,
  isOpen = false,
  onClose = () => {},
}) {
  const [intro, setIntro] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  // A-153 — Tab stays inside the dialog, Escape closes like ✕/CANCEL.
  // Hooks before the early return: isOpen gates the effect, not the call.
  const dialogRef = useRef(null);
  useModalDialog(dialogRef, { active: isOpen && signal !== null, onClose });

  if (!isOpen || !signal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // In sample / demonstration signal mode, simulate dispatch
    if (signal.isSample) {
      setTimeout(() => {
        setSent(true);
        setSubmitting(false);
      }, 450);
      return;
    }

    try {
      const { data: { session } } = await getSession().catch(() => ({ data: {} }));
      const token = session?.access_token;

      const payload = {
        source_type: "stratosphere_signal",
        source_id: signal.id,
        source_title: signal.title,
        message: intro.trim(),
        recipient_id: signal.author?.scoutId,
        district: signal.district,
      };

      if (signal.matchingSpaces?.[0]?.slug) {
        payload.propertySlug = signal.matchingSpaces[0].slug;
      }

      // Calls deal initiation with stratosphere_signal context
      const res = await fetch("/api/deals/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Please sign in to your ScoutIt account to initiate a Connect.");
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Unable to initiate Connect at this time.");
      }

      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to initiate connect.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ccm-overlay" onClick={onClose}>
      <div ref={dialogRef} className="ccm-panel" role="dialog" aria-modal="true" aria-label="Connect to Signal" onClick={(e) => e.stopPropagation()}>
        <div className="ccm-header">
          <div className="ccm-title-wrap">
            <Zap size={14} className="ccm-zap-icon" aria-hidden="true" />
            <h3 className="ccm-title">INITIATE PERMISSIONED CONNECT</h3>
          </div>
          <button type="button" className="ccm-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {sent ? (
          <div className="ccm-success-state">
            <CheckCircle2 size={36} className="ccm-success-icon" aria-hidden="true" />
            <h4 className="ccm-success-title">Connect Dispatched</h4>
            <p className="ccm-success-desc">
              Your introduction and matching proposal have been sent to{" "}
              <strong>{signal.author?.name || signal.author?.scoutId}</strong>. Once accepted, a private conversation thread will open in your ScoutIt Dashboard.
            </p>
            <button type="button" className="ccm-primary-btn" onClick={onClose}>
              RETURN TO RADAR
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ccm-form">
            <div className="ccm-signal-summary">
              <span className="ccm-target-kicker">TARGET SIGNAL // {signal.district.toUpperCase()}</span>
              <h4 className="ccm-target-title">{signal.title}</h4>
              <div className="ccm-target-meta">
                <span>AUTHOR: {signal.author?.name || signal.author?.scoutId}</span>
                <span>•</span>
                <span>{signal.author?.trustTier}</span>
              </div>
            </div>

            <div className="ccm-field-group">
              <div className="ccm-field-header">
                <label htmlFor="ccm-intro-input" className="ccm-label">
                  PROPOSAL & INTRODUCTION NOTE
                </label>
                <span className="ccm-char-count">
                  {intro.length} / {INTRO_MAX || 280}
                </span>
              </div>
              <textarea
                id="ccm-intro-input"
                className="ccm-textarea"
                rows={4}
                maxLength={INTRO_MAX || 280}
                placeholder="State how your space or mandate addresses this requirement. Be specific regarding location, floor area, and commercial terms."
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                required
              />
            </div>

            {error && <div className="ccm-error-banner">{error}</div>}

            <div className="ccm-disclosure-bar">
              <Shield size={13} className="ccm-shield-icon" aria-hidden="true" />
              <span>
                Costs <strong>1 Connect</strong>. The recipient reviews your proposal before opening a private conversation thread.
              </span>
            </div>

            <div className="ccm-actions">
              <button type="button" className="ccm-cancel-btn" onClick={onClose} disabled={submitting}>
                CANCEL
              </button>
              <button type="submit" className="ccm-primary-btn" disabled={submitting || !intro.trim()}>
                <Send size={12} aria-hidden="true" />
                <span>{submitting ? "DISPATCHING..." : "DISPATCH (1 CONNECT)"}</span>
              </button>
            </div>
            {/* A-150: explicit Privacy Policy link (RA 10173 §11). */}
            <PrivacyNotice />
          </form>
        )}
      </div>
    </div>
  );
}
