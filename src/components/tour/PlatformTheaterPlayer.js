"use client";

import { useState, useEffect } from "react";
import { Play, Pause, ExternalLink, ShieldCheck, Film, Layers, Radio, Sparkles } from "lucide-react";

export const TOUR_CLIPS = [
  {
    id: "radar",
    number: "01",
    title: "10-Layer Space Radar & GIS Hazards",
    subtitle: "3D Vector Terrain, Project NOAH Flood Envelopes & Fault Buffers",
    duration: "0:45",
    totalSeconds: 45,
    telemetry: "RADAR // GIS-L10 // ACTIVE",
    description:
      "Interactive 3D elevation modeling cross-referenced with statutory hazards: 5m/25m/100m flood return intervals, West Valley Fault line proximity, and PEZA economic zone boundaries.",
    statutoryBasis: "DOST-PAGASA Project NOAH / PHIVOLCS VFS 2024",
    embedUrl: null, // Pluggable external YouTube / CDN URL
  },
  {
    id: "dual-cms",
    number: "02",
    title: "Dual-CMS Publishing & Slug Continuity",
    subtitle: "Airtable Public Read-Only + Supabase Private Workspace Bridge",
    duration: "0:38",
    totalSeconds: 38,
    telemetry: "DUAL-CMS // SYNC-V2 // LOCKED",
    description:
      "Dual-database architecture: owner drafts stay in private Supabase PostgreSQL, sync to Airtable CMS on publication, and lock their canonical public URL to prevent broken links.",
    statutoryBasis: "Dual-Database Architectural Invariant",
    embedUrl: null,
  },
  {
    id: "via-attribution",
    number: "03",
    title: "VIA Priority Attribution & Broker Portal",
    subtitle: "RESA RA 9646 Lead Protection & Position Zero Routing",
    duration: "0:42",
    totalSeconds: 42,
    telemetry: "RESA-RA9646 // PRC-VERIFIED // DIRECT",
    description:
      "Every licensed broker receives a personal VIA link (/property/[id]/via/[broker]). 100% of tenant inquiries route directly to their private inbox with no middleman fees and no commission cuts.",
    statutoryBasis: "Republic Act No. 9646 (RESA Law)",
    embedUrl: null,
  },
  {
    id: "open-gate",
    number: "04",
    title: "Open Gate Inbound Landlord Flow",
    subtitle: "Zero-Connect Inquiry Delivery for Direct Building Owners",
    duration: "0:35",
    totalSeconds: 35,
    telemetry: "OPEN-GATE // 0-CONNECT // LIVE",
    description:
      "Direct property owners and leasing desks receive qualified enterprise tenant inquiries at zero Connect credit cost. Inbound demand flows directly into their private Landlord Cockpit.",
    statutoryBasis: "ScoutIt Open Gate Standard",
    embedUrl: null,
  },
  {
    id: "crm-mobility",
    number: "05",
    title: "People & Dealings CRM & 1-Click Mobility",
    subtitle: "5-Stage Pipeline, Account-Scoped Notes & Complete CSV/vCard Export",
    duration: "0:40",
    totalSeconds: 40,
    telemetry: "CRM // 5-STAGE // ZERO-LOCKIN",
    description:
      "A fast, focused CRM for inquiries, viewings, and negotiations. Includes 1-click CSV and vCard export so professionals maintain complete data portability.",
    statutoryBasis: "Data Sovereignty & Portability Standard",
    embedUrl: null,
  },
];

export default function PlatformTheaterPlayer({
  initialClipId = "radar",
  onClipSelect = null,
  className = "",
}) {
  const [activeClipId, setActiveClipId] = useState(initialClipId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressSec, setProgressSec] = useState(0);

  const activeClip = TOUR_CLIPS.find((c) => c.id === activeClipId) || TOUR_CLIPS[0];
  const totalSec = activeClip.totalSeconds || 45;

  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgressSec((prev) => {
          if (prev >= totalSec) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, totalSec]);

  const handleSelectClip = (clip) => {
    setActiveClipId(clip.id);
    setIsPlaying(false);
    setProgressSec(0);
    if (onClipSelect) onClipSelect(clip);
  };

  return (
    <div className={`platform-theater-container ${className}`}>
      {/* HUD Telemetry Top Rail */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border border-border-solid rounded-t-xl text-[12px] font-mono tracking-wider text-text-muted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-accent uppercase font-bold">[LAYER 05 // MANTLE]</span>
          <span className="hidden sm:inline text-text-muted">·</span>
          <span className="hidden sm:inline uppercase text-text-secondary">SYSTEM THEATER</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-secondary font-bold uppercase">{activeClip.telemetry}</span>
          <span className="hidden md:inline px-1.5 py-0.5 rounded border border-accent-muted text-accent font-semibold text-[12px]">
            4K UHD
          </span>
        </div>
      </div>

      {/* 16:9 Obsidian Theater Stage */}
      <div className="relative aspect-video w-full bg-background border-x border-border-solid overflow-hidden group select-none shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        {/* Corner Reticles */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent pointer-events-none z-20 opacity-80" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent pointer-events-none z-20 opacity-80" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent pointer-events-none z-20 opacity-80" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent pointer-events-none z-20 opacity-80" />

        {/* Ambient Backdrop Grid & Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(var(--accent-rgb),0.12),transparent_70%)] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(var(--accent-rgb),0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.2) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Dynamic Scanline Beam when playing */}
        {isPlaying && (
          <div
            className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-accent/15 to-transparent pointer-events-none z-15 motion-safe:animate-[pulse_2s_ease-in-out_infinite]"
            aria-hidden="true"
          />
        )}

        {activeClip.embedUrl ? (
          <iframe
            src={activeClip.embedUrl}
            title={activeClip.title}
            className="w-full h-full border-0 relative z-10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          /* Interactive Simulation Stage */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center z-10">
            {/* Ambient Watermark Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-muted bg-surface/80 backdrop-blur-md mb-4 text-[12px] font-mono text-accent">
              <ShieldCheck size={14} className="text-accent-bright" />
              <span>CLIP {activeClip.number} · {activeClip.duration} BROADCAST</span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-on-surface font-semibold max-w-xl mb-2 tracking-tight">
              {activeClip.title}
            </h3>
            <p className="font-sans text-xs sm:text-sm text-text-secondary max-w-lg mb-6 leading-relaxed">
              {activeClip.subtitle}
            </p>

            {/* Tactical Play Trigger */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-2.5 px-6 py-3 min-h-[44px] rounded-full bg-accent-bright hover:bg-accent text-background font-mono text-[12px] font-bold uppercase tracking-wider shadow-[0_0_24px_rgba(var(--accent-rgb),0.35)] transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                aria-label={isPlaying ? "Pause walkthrough clip" : "Play walkthrough clip"}
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                <span>{isPlaying ? "PAUSE PREVIEW" : "PLAY SYSTEM WALKTHROUGH"}</span>
              </button>
            </div>

            {/* Bottom Telemetry Ticker inside Frame */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[12px] font-mono text-text-muted border-t border-border-solid/60 pt-2">
              <span className="truncate max-w-[60%] text-left">
                STATUTORY BASIS: <strong className="text-text-primary">{activeClip.statutoryBasis}</strong>
              </span>
              <span className="text-accent font-mono font-bold flex items-center gap-2">
                <span>{isPlaying ? "STREAMING // ACTIVE" : "STANDBY // READY"}</span>
                {isPlaying && (
                  <span className="text-text-secondary font-mono">
                    (00:{String(progressSec).padStart(2, "0")} / {activeClip.duration})
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Timeline Scrub Rail */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-variant/60 z-20 overflow-hidden pointer-events-none">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${Math.min(100, Math.round((progressSec / totalSec) * 100))}%` }}
          />
        </div>
      </div>

      {/* Modular Clip Playlist Selector Rail */}
      <div className="bg-surface border-x border-b border-border-solid rounded-b-xl p-3 sm:p-4">
        <div className="text-[12px] font-mono tracking-wider text-text-muted uppercase mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Film size={14} className="text-accent" />
            <span>MODULAR TECHNICAL CLIPS (30s–45s EACH)</span>
          </span>
          <span className="text-accent font-bold">5 SOVEREIGN MODULES</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {TOUR_CLIPS.map((clip) => {
            const isSelected = clip.id === activeClipId;
            return (
              <button
                key={clip.id}
                type="button"
                onClick={() => handleSelectClip(clip)}
                className={`text-left p-2.5 sm:p-3 rounded-lg border transition-all duration-150 flex flex-col justify-between min-h-[78px] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  isSelected
                    ? "bg-accent/10 border-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.18)]"
                    : "bg-surface-variant/30 border-border hover:border-border-mid hover:bg-surface-variant/50"
                }`}
              >
                <div className="flex items-center justify-between text-[12px] font-mono mb-1">
                  <span className={isSelected ? "text-accent font-bold" : "text-text-muted"}>
                    CLIP {clip.number}
                  </span>
                  <span className="text-text-muted font-mono">{clip.duration}</span>
                </div>
                <div
                  className={`font-mono text-[12px] font-semibold leading-tight line-clamp-2 ${
                    isSelected ? "text-on-surface" : "text-text-secondary"
                  }`}
                >
                  {clip.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
