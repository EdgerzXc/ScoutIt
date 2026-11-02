"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, FileEdit, Eye, ArrowRight, Save, Sparkles } from "lucide-react";
import WorkspaceCommandBar from "./WorkspaceCommandBar";
import { registerMobileBackAction } from "@/lib/mobileBackStack";

/**
 * WorkspaceDeckDrawer — Android Notification & Quick Settings Shade for Mobile ScoutIt.
 *
 * Implements the uppermost mobile pull-down shade pattern:
 * - Collapsed: Razor-thin capacitive top bar with a central glowing amber handle line.
 *   Takes virtually zero screen height, leaving 100% of the mobile viewport free.
 * - Uppermost Pull-Down Gesture: Dragging down from the top of the phone (>20px)
 *   pulls down the Quick Settings & Notification shade.
 * - Inside the Shade:
 *   1. Quick Settings Toggles: If in Property Wizard, houses Editor/Preview slider,
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

  // Gesture: Uppermost screen drag listener (swipe down from near top of phone)
  useEffect(() => {
    const handleGlobalTouchStart = (e) => {
      if (e.touches && e.touches.length === 1) {
        const y = e.touches[0].clientY;
        // If touch starts in uppermost 75px of the phone and shade is closed, prime pull-down
        if (y <= 75 && !isOpen) {
          touchStartY.current = y;
          isDragging.current = true;
        }
      }
    };

    const handleGlobalTouchEnd = (e) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (e.changedTouches && e.changedTouches.length === 1) {
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        if (deltaY > 25 && !isOpen) {
          setIsOpen(true);
        }
      }
    };

    window.addEventListener("touchstart", handleGlobalTouchStart, { passive: true });
    window.addEventListener("touchend", handleGlobalTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleGlobalTouchStart);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isOpen]);

  const handleHandleTouchStart = useCallback((e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  }, []);

  const handleHandleTouchEnd = useCallback((e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (e.changedTouches && e.changedTouches.length === 1) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 20 && !isOpen) {
        setIsOpen(true);
      } else if (deltaY < -20 && isOpen) {
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

  const handleOpenRoleSheet = () => {
    window.dispatchEvent(new CustomEvent("scoutit:open-role-sheet"));
  };

  const activeLabel =
    active === "workspace"
      ? (roleLabel ? `${roleLabel.toUpperCase()} WORKSPACE` : "WORKSPACE")
      : active.toUpperCase();

  const totalUnread = Object.values(badges).reduce((sum, count) => sum + (Number.isFinite(count) ? count : 0), 0);

  return (
    <div
      className={`workspace-deck-drawer relative w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`}
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
              className="shadow-inner"
            />
          </div>

          {/* Quick Status & Notifications Bar */}
          <div className="flex items-center justify-between px-2 pt-2 border-t border-surface-variant/40 text-[12px] font-mono">
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-gold-accent shrink-0 animate-pulse" />
              <span>
                {totalUnread > 0 ? `${totalUnread} Unread Inquiries / Alerts` : "All Systems Nominal · 0 Overdue"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenRoleSheet}
              className="min-h-[44px] inline-flex items-center text-gold-accent hover:text-gold-bright font-bold uppercase tracking-wider underline underline-offset-4"
            >
              Switch Lens ▾
            </button>
          </div>
        </div>
      </div>

      {/* ── ANDROID-STYLE GLOWING CAPACITIVE PULL HANDLE (UPPERMOST RAIL) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onTouchStart={handleHandleTouchStart}
        onTouchEnd={handleHandleTouchEnd}
        aria-expanded={isOpen}
        aria-controls="workspace-deck-content"
        aria-label={isOpen ? "Collapse Quick Settings Shade" : "Pull down Quick Settings Shade"}
        className="group relative w-full flex items-center justify-between px-3 py-1 min-h-[44px] bg-surface/85 hover:bg-surface-variant/40 border-y border-surface-variant/30 backdrop-blur-xl transition-all duration-200 select-none active:scale-[0.99] touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-accent"
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

        {/* Center: Glowing Gold Capacitive Handle Bar (Android notification shade cue) */}
        <div className="flex flex-col items-center justify-center gap-0.5 px-4 py-1">
          <div
            className="w-12 h-1 rounded-full bg-gold-accent transition-all duration-300 group-hover:w-16 group-hover:shadow-[0_0_14px_rgba(var(--accent-rgb),0.85)] shadow-[0_0_8px_rgba(var(--accent-rgb),0.55)]"
            aria-hidden="true"
          />
        </div>

        {/* Right: State Action Cue */}
        <div className="flex items-center gap-1 text-text-muted group-hover:text-gold-accent transition-colors">
          <span className="font-mono text-[12px] uppercase tracking-wider text-text-muted">
            {isOpen ? "Tuck" : "Pull"}
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
