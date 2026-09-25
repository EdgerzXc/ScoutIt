"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Share2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bookmark,
} from "lucide-react";
import SignalGlyph from "./glyphs/SignalGlyph";
import { getSession } from "@/lib/authClient";
import { SIGNAL_TYPES, SIGNAL_TYPE_LABELS, SIGNAL_COLORS } from "@/lib/communitySignalsAdapter";
import "./signal-dossier-card.css";

export default function SignalDossierCard({
  signal,
  isActive = false,
  isHovered = false,
  onSelect = () => {},
  onHover = () => {},
  onConnect = () => {},
  returnStage = "all",
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [relevant, setRelevant] = useState(false);
  const [relevantCount, setRelevantCount] = useState(signal.relevantCount || 0);
  const [saved, setSaved] = useState(false);
  const [showMetropolisMatches, setShowMetropolisMatches] = useState(false);
  // C2: optimism rolls back visibly. A failed tap says so on the card for a
  // few seconds instead of dying silent — the count on screen is a promise.
  const [actionError, setActionError] = useState(null);
  const errorTimer = useRef(null);
  const flashActionError = useCallback((message) => {
    setActionError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setActionError(null), 4000);
  }, []);
  useEffect(() => () => {
    if (errorTimer.current) clearTimeout(errorTimer.current);
  }, []);

  const typeColor = SIGNAL_COLORS[signal.signalType] || "var(--accent)";
  const typeLabel = SIGNAL_TYPE_LABELS[signal.signalType] || signal.signalType;
  // A-145 separation: one card renders two provenances. Name the source so a
  // reader can tell a human community post from a ScoutIt building update.
  const isPipelineUpdate = typeof signal.id === "string" && signal.id.startsWith("pipeline-");
  const sourceKind = isPipelineUpdate ? "SCOUTIT INTEL" : "COMMUNITY";

  // Live member posts vote through the community endpoints (one tap per
  // account, server-counted). Everything else keeps its prior path: samples
  // stay local-only, pipeline rows keep the A-142 reactions meter.
  const communityFetch = async (path, method) => {
    const { data: { session } } = await getSession().catch(() => ({ data: {} }));
    const token = session?.access_token;
    if (!token) {
      router.push("/onboarding");
      return null;
    }
    const res = await fetch(`/api/community/signals/${encodeURIComponent(signal.id)}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      router.push("/onboarding");
      return null;
    }
    return res.json().catch(() => ({}));
  };

  const handleRelevantClick = (e) => {
    e.stopPropagation();
    // A-145 honesty: samples aggregate locally only. They never write to
    // /api/reactions — a fake signal id must not become a stored row.
    if (signal.isSample) {
      setRelevant(!relevant);
      setRelevantCount((c) => (relevant ? Math.max(0, c - 1) : c + 1));
      return;
    }
    if (signal.liveCommunity) {
      const next = !relevant;
      setRelevant(next);
      setRelevantCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
      communityFetch("/relevant", next ? "POST" : "DELETE").then((json) => {
        if (!json || json.ok !== true) {
          setRelevant(!next);
          setRelevantCount((c) => (next ? Math.max(0, c - 1) : c + 1));
          if (json) flashActionError("Couldn't record that — try again.");
        } else if (typeof json.relevantCount === "number") {
          setRelevantCount(json.relevantCount);
        }
      }).catch(() => {
        setRelevant(!next);
        setRelevantCount((c) => (next ? Math.max(0, c - 1) : c + 1));
        flashActionError("Couldn't record that — try again.");
      });
      return;
    }
    if (!relevant) {
      setRelevant(true);
      setRelevantCount((c) => c + 1);
      // Background anonymous reaction under A-142
      try {
        fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: signal.matchingSpaces?.[0]?.slug || signal.id,
            reaction_type: "Interested",
            city: signal.city || signal.district || "",
            category: signal.category || "",
          }),
        }).catch(() => {});
      } catch {}
    } else {
      setRelevant(false);
      setRelevantCount((c) => Math.max(0, c - 1));
    }
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    const nextSaved = !saved;
    // A-145 honesty: sample saves are local-only, never a stored row.
    if (signal.isSample) {
      setSaved(nextSaved);
      return;
    }
    if (signal.liveCommunity) {
      setSaved(nextSaved);
      communityFetch("/save", nextSaved ? "POST" : "DELETE").then((json) => {
        if (!json || json.ok !== true) {
          setSaved(!nextSaved);
          if (json) flashActionError("Couldn't save that — try again.");
        }
      }).catch(() => {
        setSaved(!nextSaved);
        flashActionError("Couldn't save that — try again.");
      });
      return;
    }
    setSaved(nextSaved);
    if (nextSaved) {
      try {
        fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: signal.matchingSpaces?.[0]?.slug || signal.id,
            reaction_type: "Save",
            city: signal.city || signal.district || "",
            category: signal.category || "",
          }),
        }).catch(() => {});
      } catch {}
    }
  };

  const handlePrimaryAction = (e) => {
    e.stopPropagation();
    if (signal.actionType === "EXPLORE_DATA" && signal.id?.startsWith("pipeline-") && signal.id.slice(9)) {
      const place = new URLSearchParams(window.location.search).get("place");
      const query = new URLSearchParams({ fromStratosphere: "1", view: "radar", stage: returnStage, signal: signal.id });
      if (place) query.set("place", place);
      router.push(`/intel/${encodeURIComponent(signal.id.slice(9))}?${query}`);
      return;
    }
    if (signal.isSample) {
      setExpanded(true);
      return;
    }
    if (signal.actionType === "VIEW_SPACE") {
      const slug = signal.matchingSpaces?.[0]?.slug;
      if (slug) router.push(`/property/${encodeURIComponent(slug)}`);
      else setExpanded(true);
      return;
    }
    if (signal.actionType === "PROPOSE_SPACE" || signal.actionType === "VIEW_MATCHES") {
      if (signal.matchingSpaces?.length) {
        setShowMetropolisMatches(true);
        setExpanded(true);
      } else {
        onConnect(signal);
      }
      return;
    }
    if (signal.actionType === "VIEW_DETAILS") setExpanded(true);
    else onConnect(signal);
  };

  const renderActionButton = () => {
    if (signal.isSample && signal.actionType !== "EXPLORE_DATA") {
      return <button type="button" className="sdc-btn sdc-btn-secondary" onClick={handlePrimaryAction}>VIEW EXAMPLE <ArrowRight size={13} aria-hidden="true" /></button>;
    }
    switch (signal.actionType) {
      case "PROPOSE_SPACE":
        return (
          <button type="button" className="sdc-btn sdc-btn-primary" onClick={handlePrimaryAction}>
            <span>PROPOSE SPACE</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        );
      case "VIEW_SPACE":
        return (
          <button type="button" className="sdc-btn sdc-btn-secondary" onClick={handlePrimaryAction}>
            <span>{signal.matchingSpaces?.length ? "VIEW SPACE" : "VIEW DETAILS"}</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        );
      case "EXPLORE_DATA":
        return (
          <button type="button" className="sdc-btn sdc-btn-secondary" onClick={handlePrimaryAction}>
            <span>READ UPDATE</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        );
      case "VIEW_DETAILS":
        return (
          <button type="button" className="sdc-btn sdc-btn-ghost" onClick={() => setExpanded(!expanded)}>
            <span>VIEW DETAILS</span>
          </button>
        );
      case "CONNECT":
      default:
        return (
          <button type="button" className="sdc-btn sdc-btn-primary" onClick={handlePrimaryAction}>
            <span>CONNECT</span>
            <span className="sdc-connect-cost">1 CONNECT</span>
          </button>
        );
    }
  };

  return (
    <article
      className={`sdc-card ${isActive ? "active" : ""} ${isHovered ? "hovered" : ""}`}
      onClick={() => onSelect(signal)}
      onMouseEnter={() => onHover(signal.id)}
      onMouseLeave={() => onHover(null)}
      aria-label={`${typeLabel}: ${signal.title}`}
    >
      {/* ── CARD HEADER (1-3s Scannable Kicker) ── */}
      <div className="sdc-header">
        <div className="sdc-kicker-row">
          <span className="sdc-district-tag">
            <MapPin size={11} aria-hidden="true" />
            <span>{signal.district.toUpperCase()}</span>
          </span>
          <span className="sdc-divider" aria-hidden="true">/</span>
          <span className="sdc-type-pill" style={{ "--pill-color": typeColor }}>
            {typeLabel.toUpperCase()}
          </span>
          <span className="sdc-divider" aria-hidden="true">/</span>
          <span className="sdc-source-pill" title={isPipelineUpdate ? "Sourced building update from ScoutIt intelligence" : "Posted by a community member"}>
            {sourceKind}
          </span>
        </div>

        <div className="sdc-freshness-chip" title="Signal Freshness">
          <span className={`sdc-status-dot ${signal.freshness}`} aria-hidden="true" />
          <span>{signal.freshness.toUpperCase()}</span>
        </div>
      </div>

      {/* ── CARD BODY (Layout with Micro Spatial Glyph) ── */}
      <div className="sdc-main-split">
        <div className="sdc-content-col">
          <h3 className="sdc-title">{signal.title}</h3>
          {signal.isSample ? <span className="sdc-sample-tag">SAMPLE — FOR EXPLORING ONLY</span> : null}

          {/* Quick Specifications Strip */}
          <div className="sdc-specs-strip">
            {signal.areaSqm ? (
              <span className="sdc-spec-chip">
                <Building2 size={11} aria-hidden="true" />
                <span>
                  {typeof signal.areaSqm === "object"
                    ? `${signal.areaSqm.min}–${signal.areaSqm.max} sqm`
                    : `${signal.areaSqm} sqm`}
                </span>
              </span>
            ) : null}

            {signal.timing ? (
              <span className="sdc-spec-chip">
                <Calendar size={11} aria-hidden="true" />
                <span>{signal.timing}</span>
              </span>
            ) : null}

            {signal.budget ? (
              <span className="sdc-spec-chip sdc-budget-chip">
                <span>{signal.budget}</span>
              </span>
            ) : null}
          </div>

          {/* Key tags */}
          {signal.specs && signal.specs.length > 0 && (
            <div className="sdc-tag-list" aria-label="Key specifications">
              {signal.specs.slice(0, 3).map((spec, i) => (
                <span key={i} className="sdc-spec-tag">
                  {spec}
                </span>
              ))}
              {signal.specs.length > 3 && (
                <span className="sdc-spec-more">+{signal.specs.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Micro Spatial Glyph (Architectural Volume or Trend Diagram) */}
        <div className="sdc-glyph-col">
          <SignalGlyph type={signal.glyphType} data={signal.glyphData} label={signal.title} />
        </div>
      </div>

      {/* ── CARD METRICS & ACTIONS ── */}
      <div className="sdc-footer">
        {!signal.isSample ? <div className="sdc-metric-group">
          {/* Relevant to Me (Demand Aggregation) */}
          <button
            type="button"
            className={`sdc-action-metric ${relevant ? "sdc-relevant-active" : ""}`}
            onClick={handleRelevantClick}
            title="Indicate that this market signal also matters to your organization"
            aria-pressed={relevant}
          >
            <Zap size={12} aria-hidden="true" />
            <span className="sdc-num">{relevantCount}</span>
            <span className="sdc-metric-text">RELEVANT</span>
          </button>

          {/* Matching Metropolis Spaces */}
          {signal.matchingSpaces && signal.matchingSpaces.length > 0 && (
            <button
              type="button"
              className={`sdc-action-metric sdc-spaces-metric ${showMetropolisMatches ? "open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowMetropolisMatches(!showMetropolisMatches);
                setExpanded(true);
              }}
              title="Verified spaces in Metropolis matching this signal"
            >
              <Building2 size={12} aria-hidden="true" />
              <span className="sdc-num">{signal.matchingSpaces.length}</span>
              <span className="sdc-metric-text">MATCHING SPACES</span>
            </button>
          )}

          {/* Bookmark / Save */}
          <button
            type="button"
            className={`sdc-icon-btn ${saved ? "saved" : ""}`}
            onClick={handleSaveClick}
            title={saved ? "Saved" : "Save signal"}
            aria-label={saved ? "Saved" : "Save signal"}
            aria-pressed={saved}
          >
            <Bookmark size={13} aria-hidden="true" />
          </button>
        </div> : null}

        <div className="sdc-cta-group">
          {renderActionButton()}
          <button
            type="button"
            className="sdc-expand-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse dossier details" : "Expand dossier details"}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>
      {actionError ? (
        <p className="sdc-action-error" role="alert">{actionError}</p>
      ) : null}

      {/* ── EXPANDED DOSSIER DETAILS ── */}
      {expanded && (
        <div className="sdc-expanded-drawer">
          <p className="sdc-summary-text">{signal.summary}</p>

          {/* Structured Requirements Matrix */}
          {signal.requirements && Object.keys(signal.requirements).length > 0 && (
            <div className="sdc-req-table">
              <h4 className="sdc-section-heading">STRUCTURED SPECIFICATION</h4>
              <dl className="sdc-dl">
                {Object.entries(signal.requirements).map(([key, val]) => (
                  <div key={key} className="sdc-dl-row">
                    <dt className="sdc-dt">{key.replace(/([A-Z])/g, " $1").toUpperCase()}</dt>
                    <dd className="sdc-dd">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Metropolis Space Matches Bridge */}
          {!signal.isSample && showMetropolisMatches && signal.matchingSpaces && signal.matchingSpaces.length > 0 && (
            <div className="sdc-matches-drawer">
              <h4 className="sdc-section-heading">
                RELATED SPACES ({signal.matchingSpaces.length})
              </h4>
              <ul className="sdc-matches-list">
                {signal.matchingSpaces.map((space, i) => (
                  <li key={i} className="sdc-match-item">
                    <div className="sdc-match-info">
                      <span className="sdc-match-title">{space.title}</span>
                      <span className="sdc-match-dist">{space.distance} from centroid</span>
                    </div>
                    <Link
                      href={`/property/${space.slug}`}
                      className="sdc-match-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>VIEW SPACE</span>
                      <ArrowRight size={11} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Author Trust and Sample Disclosure */}
          <div className="sdc-author-bar">
            <div className="sdc-author-info">
              <ShieldCheck size={13} className="sdc-shield-icon" aria-hidden="true" />
              <span className="sdc-scout-id">{signal.author.scoutId}</span>
              <span className="sdc-trust-badge">{signal.author.trustTier}</span>
              {signal.author.name && <span className="sdc-author-name">({signal.author.name})</span>}
            </div>
            {signal.isSample && (
              <span className="sdc-sample-tag" title="Demonstration community signal for launch testing">
                SAMPLE SIGNAL
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
