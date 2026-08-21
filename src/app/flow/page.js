"use client";

import Link from "next/link";
import MasterFlowGraph from "@/components/flow/MasterFlowGraph";
import { ArrowLeft, Layers, Compass } from "lucide-react";

export default function MasterFlowPage() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#08080c]">
      {/* Top Navbar */}
      <header className="h-12 bg-[#0d0d14] border-b border-white/10 px-4 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono uppercase text-text-secondary hover:text-gold-accent transition"
          >
            <ArrowLeft size={14} />
            <span>Back to ScoutIt</span>
          </Link>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm tracking-wider text-white">
              <span className="text-gold-accent">S</span>cout<span className="text-gold-accent">IT</span>
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gold-accent">
              Master System Flow Map
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/layer/orbit"
            className="text-[11px] font-mono uppercase text-text-secondary hover:text-white transition"
          >
            Orbit
          </Link>
          <Link
            href="/showcase"
            className="text-[11px] font-mono uppercase text-text-secondary hover:text-white transition"
          >
            Showcase
          </Link>
          <Link
            href="/property"
            className="text-[11px] font-mono uppercase text-text-secondary hover:text-white transition"
          >
            Directory
          </Link>
          <Link
            href="/dashboard"
            className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-gold-accent/20 border border-gold-accent/40 text-gold-accent hover:bg-gold-accent/30 transition font-bold"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Graph Component */}
      <main className="flex-1 overflow-hidden">
        <MasterFlowGraph />
      </main>
    </div>
  );
}
