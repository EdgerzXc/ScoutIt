"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MasterFlowGraph from "@/components/flow/MasterFlowGraph";
import { DashboardProvider } from "@/context/DashboardContext";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";
import { ArrowLeft } from "lucide-react";

// A-093: the internal system map no longer renders to every signed-in user.
// The map shows only for staff roles read from the server-side role route
// (the same endpoint the toolbox uses — the client never names its own
// role). This is disclosure reduction, NOT a gate: it grants and denies
// nothing, and every endpoint behind this surface stays independently
// staff-checked server-side. The real page-level gate ships with the
// cookie-session migration (A-073), which alone can see a session
// server-side on the main site.
function AdminFlowPageInner() {
  const [role, setRole] = useState(null);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile/me/role")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) {
          setRole(d?.role ?? null);
          setRoleChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setRoleChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isStaff = role === "admin" || role === "staff";

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* Top Navbar */}
      <header className="h-12 bg-surface border-b border-surface-variant px-4 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-mono uppercase text-text-secondary hover:text-gold-accent transition"
          >
            <ArrowLeft size={14} />
            <span>Admin Console</span>
          </Link>
          <span className="text-text-muted" aria-hidden="true">|</span>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm tracking-wider text-white">
              <span className="text-gold-accent">S</span>cout<span className="text-gold-accent">IT</span>
            </span>
            {isStaff && (
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gold-accent">
                Master System Flow Map (Internal)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs font-mono uppercase text-text-secondary hover:text-white transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/layer/orbit"
            className="text-xs font-mono uppercase text-text-secondary hover:text-white transition-colors"
          >
            Orbit
          </Link>
          <Link
            href="/showcase"
            className="text-xs font-mono uppercase text-text-secondary hover:text-white transition-colors"
          >
            Showcase
          </Link>
          <Link
            href="/property"
            className="text-xs font-mono uppercase text-text-secondary hover:text-white transition-colors"
          >
            Directory
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-gold-accent/20 border border-gold-accent/40 text-gold-accent hover:bg-gold-accent/30 transition-colors font-bold"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Graph Component */}
      <main className="flex-1 overflow-hidden">
        {!roleChecked ? (
          <div className="h-full w-full animate-pulse bg-surface/50" aria-label="Loading" />
        ) : isStaff ? (
          <MasterFlowGraph />
        ) : (
          <div className="h-full w-full flex items-center justify-center p-8">
            <div className="max-w-md text-center">
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold-accent mb-3">
                Staff workspace
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                The system flow map is limited to staff workspaces. Page-level
                staff checks for /admin ship with the session migration
                (A-073) — until then this preview hides the map without
                granting or denying anything: every endpoint behind it stays
                independently staff-checked server-side.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminFlowPage() {
  return (
    <DashboardProvider>
      <VerifiedWorkspaceBoundary>
        <AdminFlowPageInner />
      </VerifiedWorkspaceBoundary>
    </DashboardProvider>
  );
}
