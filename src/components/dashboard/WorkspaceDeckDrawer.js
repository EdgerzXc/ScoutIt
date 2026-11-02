"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import WorkspaceCommandBar from "./WorkspaceCommandBar";

/**
 * WorkspaceDeckDrawer — Android Notification Shade / Pull-Down Drawer for Command Deck.
 *
 * Implements the tactile mobile "glowing drawer handle" pattern:
 * - Collapsed: An ultra-sleek, razor-thin bar with a central glowing gold handle line.
 *   Takes virtually zero vertical height, freeing 100% of the screen for property creation and dossiers.
 * - Expanded: Smoothly pulls down the 4 connected deal widgets (Workspace, Inbox, CRM, Calendar).
 * - Drag/Pull: Supports downward drag gesture or 1-tap thumb toggle.
 * - Auto-Collapse: Automatically defaults to collapsed whenever an owner is in property creation / wizard mode.
 */
export default function WorkspaceDeckDrawer({
  active = "workspace",
  badges = {},
  roleLabel = null,
  isWizardActive = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(!isWizardActive);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  // Auto-collapse when entering property wizard / live editor
  useEffect(() => {
    if (isWizardActive) {
      setIsOpen(false);
    }
  }, [isWizardActive]);

  // Listen to cross-component wizard state events
  useEffect(() => {
    const handleWizardState = (e) => {
      if (e?.detail?.active) {
        setIsOpen(false);
      }
    };
    window.addEventListener("scoutit:wizard-state", handleWizardState);
    return () => window.removeEventListener("scoutit:wizard-state", handleWizardState);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (e.changedTouches && e.changedTouches.length === 1) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      // Drag down > 25px opens drawer; drag up > 25px closes drawer
      if (deltaY > 25 && !isOpen) {
        setIsOpen(true);
      } else if (deltaY < -25 && isOpen) {
        setIsOpen(false);
      }
    }
  }, [isOpen]);

  const activeLabel =
    active === "workspace"
      ? (roleLabel ? `${roleLabel.toUpperCase()} WORKSPACE` : "WORKSPACE")
      : active.toUpperCase();

  const totalUnread = Object.values(badges).reduce((sum, count) => sum + (Number.isFinite(count) ? count : 0), 0);

  return (
    <div
      className={`workspace-deck-drawer relative w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`}
      role="region"
      aria-label="Workspace Command Deck Drawer"
    >
      {/* ── COLLAPSIBLE DRAWER CONTENT (4 WIDGETS) ── */}
      <div
        id="workspace-deck-content"
        className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "max-h-32 opacity-100 pb-2" : "max-h-0 opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <WorkspaceCommandBar
          active={active}
          badges={badges}
          roleLabel={roleLabel}
          className="shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        />
      </div>

      {/* ── ANDROID-STYLE GLOWING CAPACITIVE PULL HANDLE ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-expanded={isOpen}
        aria-controls="workspace-deck-content"
        aria-label={isOpen ? "Collapse Workspace Command Deck" : "Pull down Workspace Command Deck"}
        className="group relative w-full flex items-center justify-between px-3 py-1.5 min-h-[44px] bg-surface/80 hover:bg-surface-variant/40 border-y border-surface-variant/30 backdrop-blur-xl transition-all duration-200 select-none active:scale-[0.99] touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-accent"
      >
        {/* Left: Active Destination Micro-Label */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-accent shrink-0 animate-pulse" />
          <span className="font-mono text-[12px] font-bold uppercase tracking-widest text-text-secondary truncate">
            {activeLabel}
          </span>
          {totalUnread > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-gold-accent text-background font-mono text-[12px] font-bold">
              {totalUnread}
            </span>
          )}
        </div>

        {/* Center: Glowing Gold Capacitive Handle Bar */}
        <div className="flex flex-col items-center justify-center gap-0.5 px-4 py-1">
          <div
            className="w-10 h-1 rounded-full bg-gold-accent transition-all duration-300 group-hover:w-14 group-hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.75)] shadow-[0_0_8px_rgba(var(--accent-rgb),0.55)]"
            aria-hidden="true"
          />
        </div>

        {/* Right: State Action Cue */}
        <div className="flex items-center gap-1 text-text-muted group-hover:text-gold-accent transition-colors">
          <span className="hidden sm:inline font-mono text-[12px] uppercase tracking-wider">
            {isOpen ? "Tuck" : "Deck"}
          </span>
          {isOpen ? (
            <ChevronUp size={14} className="shrink-0 transition-transform" aria-hidden="true" />
          ) : (
            <ChevronDown size={14} className="shrink-0 transition-transform" aria-hidden="true" />
          )}
        </div>
      </button>
    </div>
  );
}
