"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, FileEdit, Eye, ArrowRight, Save, Sparkles } from "lucide-react";
import WorkspaceCommandBar from "./WorkspaceCommandBar";
import { registerMobileBackAction } from "@/lib/mobileBackStack";

/**
 * WorkspaceDeckDrawer — Android Quick Settings & Command Deck Shade for Mobile ScoutIt.
 *
 * Designed specifically for Mobile Chrome & Android ergonomics:
 * - Solves Mobile Chrome Pull-to-Refresh: Removed global top-edge drag interception that triggered
 *   Chrome browser reload. Opening and collapsing is now a frictionless 1-tap thumb touch
 *   on the glowing amber handle, with safe direct dragging that blocks browser pull-to-refresh.
 * - Collapsed: Razor-thin capacitive top bar with a central glowing amber handle line.
 *   Takes virtually zero screen height, leaving 100% of the mobile viewport free.
 * - Inside the Shade:
 *   1. Quick Settings Toggles: If in Property Wizard, houses Spec Sheet / Live Dossier switcher,
 *      step indicators, and primary Next/Save actions.
 *   2. Command Deck Tiles: 4 connected deal tools (Workspace, Inbox, CRM, Calendar).
 *   3. Quick Status & Notifications: Nominal telemetry and role switcher trigger.
 * - Mobile Back Button Integration: Pressing the phone's physical back button
 *   smoothly tucks the shade back up instead of navigating away or kicking the user home.
 */
export default function WorkspaceDeckDrawer({
  active = "workspace",
  badges = {},
  roleLabel = null,
  isWizardActive = false,
  className = "",
  mode = "owner",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editorQuickState, setEditorQuickState] = useState({
    active: isWizardActive,
    tab: "editor",
    step: 1,
    isEditing: false,
    canProceed: true,
  });

  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  // Sync wizard activity
  useEffect(() => {
    if (isWizardActive) {
      setEditorQuickState((prev) => ({ ...prev, active: true }));
    }
  }, [isWizardActive]);

  // Listen for live editor quick state broadcasts from LiveEditorWorkspace
  useEffect(() => {
    const handleQuickState = (e) => {
      if (e?.detail) {
        setEditorQuickState((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener("scoutit:editor-quick-state", handleQuickState);
    return () => window.removeEventListener("scoutit:editor-quick-state", handleQuickState);
  }, []);

  // Back button integration: if shade is pulled down, pressing mobile back collapses it
  useEffect(() => {
    if (isOpen) {
      return registerMobileBackAction(() => {
        setIsOpen(false);
      }, { action: "deck_drawer" });
    }
  }, [isOpen]);

  // 60-second auto-tuck timer when drawer is opened
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 60000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Auto-tuck drawer on downward scroll to keep workspace view clear
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 40) {
        setIsOpen(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Safe direct handle touch handlers (blocks Chrome pull-to-refresh on direct drag)
  const handleHandleTouchStart = useCallback((e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  }, []);

  const handleHandleTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    // Prevent Mobile Chrome pull-to-refresh while dragging handle
    if (e.cancelable) {
      e.preventDefault();
    }
  }, []);

  const handleHandleTouchEnd = useCallback((e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (e.changedTouches && e.changedTouches.length === 1) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      // Drag down > 15px opens drawer; drag up > 15px closes drawer
      if (deltaY > 15 && !isOpen) {
        setIsOpen(true);
      } else if (deltaY < -15 && isOpen) {
        setIsOpen(false);
      }
    }
  }, [isOpen]);

  const handleTabSwitch = (tab) => {
    setEditorQuickState((prev) => ({ ...prev, tab }));
    window.dispatchEvent(new CustomEvent("scoutit:set-editor-tab", { detail: { tab } }));
  };

  const handleEditorAction = (action) => {
    window.dispatchEvent(new CustomEvent("scoutit:trigger-editor-action", { detail: { action } }));
  };

  const activeLabel =
    active === "workspace"
      ? (roleLabel ? `${roleLabel.toUpperCase()} WORKSPACE` : "WORKSPACE")
      : active.toUpperCase();

  const totalUnread = Object.values(badges).reduce((sum, count) => sum + (Number.isFinite(count) ? count : 0), 0);

  return (
    <div
      className={`workspace-deck-drawer relative w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${className}`}
      style={{ overscrollBehaviorY: "contain" }}
      role="region"
      aria-label="Android Quick Settings and Notification Shade"
    >
      {/* ── EXPANDED PULL-DOWN SHADE (QUICK SETTINGS + NOTIFICATIONS) ── */}
      <div
        id="workspace-deck-content"
        className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "max-h-[500px] opacity-100 pb-3" : "max-h-0 opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="bg-surface-alt/95 backdrop-blur-2xl border-b border-surface-variant/50 p-3 rounded-b-2xl shadow-[0_12px_32px_rgba(0,0,0,0.65)] flex flex-col gap-3">
          
          {/* Quick Settings: Live Editor Toggles (Visible when property wizard/editor is active) */}
          {editorQuickState.active && (
            <div className="bg-surface/80 border border-gold-accent/30 rounded-xl p-2.5 flex flex-col gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between text-[12px] font-mono uppercase tracking-wider text-text-secondary px-1">
                <span className="flex items-center gap-1.5 text-gold-accent font-bold">
                  <Sparkles size={12} className="animate-spin" />
                  Quick Controls · Property Dossier
                </span>
                <span className="text-text-muted">
                  Step {editorQuickState.step} of 3
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* 1-Tap Editor / Preview Switcher */}
                <div className="flex items-center gap-1 bg-surface-container-lowest border border-surface-variant/50 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => handleTabSwitch("editor")}
                    className={`min-h-[44px] px-3 py-1.5 rounded-md text-[12px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 ${
                      editorQuickState.tab === "editor"
                        ? "bg-gold-accent text-background shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)]"
                        : "text-text-secondary hover:text-on-surface"
                    }`}
                    aria-label="Switch to Spec Sheet"
                  >
                    <FileEdit size={13} />
                    <span>Spec Sheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch("preview")}
                    className={`min-h-[44px] px-3 py-1.5 rounded-md text-[12px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 ${
                      editorQuickState.tab === "preview"
                        ? "bg-gold-accent text-background shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)]"
                        : "text-text-secondary hover:text-on-surface"
                    }`}
                    aria-label="Switch to Live Dossier Preview"
                  >
                    <Eye size={13} />
                    <span>Live Dossier</span>
                  </button>
                </div>

                {/* Primary Quick Action Button */}
                {editorQuickState.step < 3 ? (
                  <button
                    type="button"
                    onClick={() => handleEditorAction("next")}
                    disabled={!editorQuickState.canProceed}
                    className="min-h-[44px] px-4 py-1.5 rounded-lg bg-gold-accent text-background font-mono text-[12px] font-bold uppercase tracking-wider hover:bg-gold-bright active:scale-95 transition-all shadow-[0_0_14px_rgba(var(--accent-rgb),0.3)] disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    <span>Next</span>
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEditorAction("save")}
                    className="min-h-[44px] px-4 py-1.5 rounded-lg bg-gold-accent text-background font-mono text-[12px] font-bold uppercase tracking-wider hover:bg-gold-bright active:scale-95 transition-all shadow-[0_0_14px_rgba(var(--accent-rgb),0.3)] flex items-center gap-1.5 shrink-0"
                  >
                    <span>{editorQuickState.isEditing ? "Update" : "Save"}</span>
                    <Save size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Settings Tiles: Command Deck Tools */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-mono uppercase tracking-widest text-text-muted px-1">
              Connected Deal Deck
            </span>
            <WorkspaceCommandBar
              active={active}
              badges={badges}
              roleLabel={roleLabel}
              mode={mode}
              className="shadow-inner"
            />
          </div>

          {/* Quick Status & Notifications Bar */}
          <div className="flex items-center px-2 pt-2 border-t border-surface-variant/40 text-[12px] font-mono">
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-gold-accent shrink-0 animate-pulse" />
              <span>
                {totalUnread > 0 ? `${totalUnread} Unread Inquiries / Alerts` : "All Systems Nominal · 0 Overdue"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEAMLESS GLOWING CAPACITIVE PULL HANDLE (1-TAP THUMB OPERABLE) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onTouchStart={handleHandleTouchStart}
        onTouchMove={handleHandleTouchMove}
        onTouchEnd={handleHandleTouchEnd}
        aria-expanded={isOpen}
        aria-controls="workspace-deck-content"
        aria-label={isOpen ? "Tuck Command Deck Shade" : "Open Command Deck Shade"}
        className="group relative w-full flex flex-col items-center justify-center py-2 min-h-[44px] bg-surface/90 hover:bg-surface-variant/40 border-y border-surface-variant/30 backdrop-blur-xl transition-all duration-200 select-none active:scale-[0.99] touch-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-accent"
      >
        <div className="relative flex flex-col items-center justify-center gap-1">
          <div
            className="w-14 h-1.5 rounded-full bg-gold-accent transition-all duration-300 group-hover:w-20 shadow-[0_0_12px_rgba(var(--accent-rgb),0.75)] animate-pulse"
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted group-hover:text-gold-accent transition-colors flex items-center gap-1">
            <span>‹</span> {isOpen ? "Tap or drag up to tuck" : "Click to drag · Connected Deck"} <span>›</span>
          </span>

          {totalUnread > 0 && !isOpen && (
            <span
              className="absolute -right-8 top-0 px-1.5 py-0.5 min-w-[18px] h-4 rounded-full bg-gold-accent text-background font-mono text-[11px] font-bold leading-none flex items-center justify-center shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
              aria-label={`${totalUnread} unread items`}
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
