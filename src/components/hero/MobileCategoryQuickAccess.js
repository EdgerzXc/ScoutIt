"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";
import { CELESTIAL_SPACES } from "./DriftingPropertyBubbles";
import styles from "./mobileCategoryQuickAccess.module.css";

const BUBBLE_IMG_V = "20261015-v6";
const getBubbleImg = (diorama) => `/images/bubbles/bubble_${diorama}.png?v=${BUBBLE_IMG_V}`;

// SVG Vector Icons for Category Chips
const CATEGORY_ICONS = {
  commercial: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="9" y1="6" x2="9" y2="6.01"/>
      <line x1="15" y1="6" x2="15" y2="6.01"/>
      <line x1="9" y1="10" x2="9" y2="10.01"/>
      <line x1="15" y1="10" x2="15" y2="10.01"/>
      <line x1="9" y1="14" x2="9" y2="14.01"/>
      <line x1="15" y1="14" x2="15" y2="14.01"/>
      <line x1="9" y1="18" x2="15" y2="18"/>
    </svg>
  ),
  residential: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>
    </svg>
  ),
  restaurants: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  venues: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <polygon points="12 7 15 17 12 14 9 17 12 7"/>
    </svg>
  ),
  str: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="m4.93 4.93 4.24 4.24"/>
      <path d="m14.83 14.83 4.24 4.24"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  hospitality: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
};

export default function MobileCategoryQuickAccess() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const trackRef = React.useRef(null);
  const pointerDownX = React.useRef(null);
  const scrollStart = React.useRef(0);
  const startX = React.useRef(0);
  const isDragging = React.useRef(false);
  const DRAG_THRESHOLD = 5;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelect = useCallback((categoryType) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("scoutit:black-hole-consume", {
          detail: { category: categoryType },
        })
      );
    }
    setSheetOpen(false);
  }, []);

  // Drag-to-scroll handlers for mouse / trackpad ergonomics
  const onDragStart = (e) => {
    if (e.pointerType === "touch") return; // Touch handles scrolling natively
    if (e.button !== 0) return; // Only primary click
    pointerDownX.current = e.pageX;
    scrollStart.current = trackRef.current ? trackRef.current.scrollLeft : 0;
  };

  const onDragEnd = (e) => {
    pointerDownX.current = null;
    if (!isDragging.current) return;
    if (trackRef.current) {
      trackRef.current.style.cursor = "grab";
      trackRef.current.style.scrollBehavior = "";
      trackRef.current.style.scrollSnapType = "";
      if (e?.pointerId != null) {
        try {
          trackRef.current.releasePointerCapture(e.pointerId);
        } catch {}
      }
    }
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  const onDragMove = (e) => {
    if (pointerDownX.current == null || !trackRef.current) return;
    if (!isDragging.current) {
      if (Math.abs(e.pageX - pointerDownX.current) < DRAG_THRESHOLD) return;
      isDragging.current = true;
      startX.current = pointerDownX.current;
      trackRef.current.style.cursor = "grabbing";
      trackRef.current.style.scrollBehavior = "auto";
      trackRef.current.style.scrollSnapType = "none";
      try {
        trackRef.current.setPointerCapture(e.pointerId);
      } catch {}
    }
    e.preventDefault();
    const delta = (e.pageX - startX.current) * 1.3;
    trackRef.current.scrollLeft = scrollStart.current - delta;
  };

  const handleChipClick = (e, categoryType) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    handleSelect(categoryType);
  };

  // Escape key listener for the modal sheet
  useEffect(() => {
    if (!sheetOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sheetOpen]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (!sheetOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [sheetOpen]);

  return (
    <section
      className={styles.container}
      aria-label="Direct Category Quick Access"
      data-testid="mobile-category-quick-access"
    >
      {/* Header bar: Eyebrow + All Categories Dropdown Trigger */}
      <div className={styles.headerRow}>
        <div className={styles.headerLead}>
          <span className={styles.leadPulse} aria-hidden="true" />
          <span className={styles.leadText}>QUICK CATEGORIES</span>
        </div>
        <button
          type="button"
          className={styles.sheetTrigger}
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-label="Open all space categories sheet"
        >
          <span>ALL (6)</span>
          <svg className={styles.chevronIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Swipeable 1-tap Category Fast-Track Chips */}
      <div
        ref={trackRef}
        className={styles.chipsTrack}
        role="list"
        aria-label="Category quick jump chips"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerLeave={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        {CELESTIAL_SPACES.map((space) => {
          const href = `/property?type=${encodeURIComponent(space.type)}`;

          return (
            <div key={space.id} role="listitem">
              <Link
                href={href}
                className={styles.categoryChip}
                onClick={(e) => handleChipClick(e, space.type)}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                aria-label={`Jump immediately to ${space.label}`}
              >
                <span className={styles.chipIcon}>
                  {CATEGORY_ICONS[space.id] || null}
                </span>
                <span className={styles.chipLabel}>{space.label}</span>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Full Category Bottom Action Sheet (Mounted via Portal) */}
      {sheetOpen && mounted && typeof document !== "undefined" && createPortal(
        <div
          className={styles.sheetOverlay}
          onClick={() => setSheetOpen(false)}
          role="presentation"
        >
          <div
            className={styles.sheetPanel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-sheet-title"
          >
            {/* Sheet Handle */}
            <div className={styles.sheetHandleBar} aria-hidden="true">
              <div className={styles.sheetHandle} />
            </div>

            {/* Sheet Header */}
            <div className={styles.sheetHeader}>
              <div>
                <div className={styles.sheetEyebrow}>DIRECT SPACE ACCESS</div>
                <h2 id="category-sheet-title" className={styles.sheetTitle}>
                  Select Space Category
                </h2>
                <p className={styles.sheetSubtitle}>
                  Immediate ground access to curated Philippine hubs
                </p>
              </div>
              <button
                type="button"
                className={styles.sheetCloseBtn}
                onClick={() => setSheetOpen(false)}
                aria-label="Close categories sheet"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Category Rows with 3D Diorama Previews */}
            <div className={styles.sheetList} role="list">
              {CELESTIAL_SPACES.map((space) => {
                const href = `/property?type=${encodeURIComponent(space.type)}`;

                return (
                  <div key={space.id} role="listitem">
                    <Link
                      href={href}
                      className={styles.sheetCard}
                      onClick={() => handleSelect(space.type)}
                      aria-label={`Explore ${space.label}: ${space.subtitle}`}
                    >
                      <div className={styles.orbWrapper} aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getBubbleImg(space.diorama)}
                          alt=""
                          className={styles.orbImage}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      <div className={styles.cardDetails}>
                        <div className={styles.cardZone}>{space.zone}</div>
                        <div className={styles.cardName}>{space.label}</div>
                        <div className={styles.cardSubtitle}>{space.subtitle}</div>
                      </div>

                      <ChevronRight className={styles.cardChevron} size={16} aria-hidden="true" />
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Footer Direct CTA */}
            <div className={styles.sheetFooter}>
              <Link
                href="/property"
                className={styles.viewAllBtn}
                onClick={() => setSheetOpen(false)}
              >
                Browse All Spaces (Full Catalog) →
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
