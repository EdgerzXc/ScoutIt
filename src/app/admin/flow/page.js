"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { DashboardProvider } from "@/context/DashboardContext";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";
import { StaffAccessState, useStaffRead } from "@/components/auth/StaffWorkspaceAccess";
import { ArrowLeft } from "lucide-react";
import InfoTip from "@/components/ui/InfoTip";

const MasterFlowGraph = dynamic(() => import("@/components/flow/MasterFlowGraph"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface/50" aria-label="Loading" />,
});

function AdminFlowPageInner() {
  const { status, data, retry } = useStaffRead("/api/admin/flow");
  if (status !== "ready" || !Array.isArray(data?.nodes) || !data.nodes.length || !Array.isArray(data.edges)) {
    return <StaffAccessState status={status === "ready" ? "unavailable" : status} retry={retry} />;
  }

  return (
    <div className="h-screen h-dvh w-screen overflow-hidden flex flex-col bg-background">
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
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gold-accent whitespace-nowrap">
              Master System Flow Map (Internal)
              <InfoTip tipId="adminFlowMap" label="About system flow map" />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="hidden sm:inline text-xs font-mono uppercase text-text-secondary hover:text-white transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/layer/orbit"
            className="hidden sm:inline text-xs font-mono uppercase text-text-secondary hover:text-white transition-colors"
          >
            Orbit
          </Link>
          <Link
            href="/showcase"
            className="hidden sm:inline text-xs font-mono uppercase text-text-secondary hover:text-white transition-colors"
          >
            Showcase
          </Link>
          <Link
            href="/property"
            className="hidden sm:inline text-xs font-mono uppercase text-text-secondary hover:text-white transition-colors"
          >
            Directory
          </Link>
          <Link
            href="/dashboard"
            className="shrink-0 whitespace-nowrap text-xs font-mono uppercase px-2.5 py-1 rounded bg-gold-accent/20 border border-gold-accent/40 text-gold-accent hover:bg-gold-accent/30 transition-colors font-bold"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Graph Component */}
      <main className="flex-1 overflow-hidden">
        <MasterFlowGraph nodes={data.nodes} edges={data.edges} />
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
