"use client";

import { useState } from "react";
import Link from "next/link";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import PlatformTheaterPlayer, { TOUR_CLIPS } from "@/components/tour/PlatformTheaterPlayer";
import {
  Compass,
  Database,
  Link2,
  DoorOpen,
  Users2,
  Eye,
  Briefcase,
  Building2,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  GitBranch,
} from "lucide-react";

const CAPABILITIES = [
  {
    id: "radar",
    number: "01",
    title: "10-Layer Space Radar & Elevation GIS",
    kicker: "SPATIAL CLARITY OVER GUESSWORK",
    icon: Compass,
    problem:
      "Traditional property portals show isolated pins on flat 2D maps without context on terrain elevation, flood hazards, or seismic risk, forcing buyers and tenants to conduct separate, arduous research.",
    technicalStandard:
      "Statutory integration of DOST-PAGASA Project NOAH flood hazard return intervals (5-yr, 25-yr, 100-yr) cross-referenced against PHIVOLCS Valley Fault System buffer zones.",
    simulator: {
      tag: "LIVE RADAR TELEMETRY",
      metricA: "ELEVATION: 24.8m AMSL",
      metricB: "FLOOD HAZARD: LOW (100-YR PASS)",
      metricC: "FAULT DISTANCE: 3.4km WEST",
      status: "OPTIMAL SITE ENVELOPE",
    },
  },
  {
    id: "dual-cms",
    number: "02",
    title: "Dual-CMS Publishing & Slug Sovereignty",
    kicker: "SEPARATING PUBLIC RECORD FROM PRIVATE WORKSPACE",
    icon: Database,
    problem:
      "Single-database platforms expose private landlord drafts and notes to accidental publication or crawl indexation, while URL slug changes break existing tenant bookmarks and QR codes.",
    technicalStandard:
      "Air-gapped dual-database architecture: Supabase holds private authentication and uncommitted property drafts; Airtable serves immutable, edge-cached public listings with permanent first-slug reservation.",
    simulator: {
      tag: "PUBLISH BRIDGE V2",
      metricA: "PRIVATE SOURCE: SUPABASE (RLS SECURED)",
      metricB: "PUBLIC PROXY: AIRTABLE (EDGE CACHED)",
      metricC: "CANONICAL SLUG: IMMUTABLE LOCK",
      status: "ZERO SLUG DRIFT VERIFIED",
    },
  },
  {
    id: "via-attribution",
    number: "03",
    title: "VIA Priority Attribution & Broker Portal",
    kicker: "RESA RA 9646 REGULATORY COMPLIANCE",
    icon: Link2,
    problem:
      "Portals frequently redirect leads from a broker's marketing efforts to competing sponsors or undisclosed call centers, poaching relationships built on professional reputation.",
    technicalStandard:
      "Republic Act No. 9646 statutory compliance: Position Zero routing ensures 100% of tenant inquiries via /property/[id]/via/[broker] deliver directly to the licensed practitioner's private inbox.",
    simulator: {
      tag: "VIA DIRECT LEAD RAILS",
      metricA: "BROKER PRC: 0019284 VERIFIED",
      metricB: "INQUIRY DESTINATION: PRIVATE BROKER INBOX",
      metricC: "PLATFORM FEE: 0% COMMISSION SKIM",
      status: "100% EXCLUSIVE ATTRIBUTION",
    },
  },
  {
    id: "open-gate",
    number: "04",
    title: "Open Gate Inbound Landlord Flow",
    kicker: "ZERO-CONNECT FRICTIONLESS INQUIRIES",
    icon: DoorOpen,
    problem:
      "Pay-per-lead and pay-per-message fees discourage direct building owners from engaging with prospective corporate tenants, creating artificial barriers to physical space occupancy.",
    technicalStandard:
      "Open Gate Protocol: direct inbound tenant inquiries to property owners are 100% free of Connect credit deductions, establishing a frictionless handshake bridge directly with leasing desks.",
    simulator: {
      tag: "OPEN GATE INBOUND",
      metricA: "CONNECT COST: 0 CONNECTS (FREE)",
      metricB: "TENANT VERIFICATION: AUTHENTICATED",
      metricC: "RESPONSE SLA: < 24 HOURS",
      status: "DIRECT LANDLORD HANDSHAKE",
    },
  },
  {
    id: "crm-engine",
    number: "05",
    title: "People & Dealings CRM & Mobility Engine",
    kicker: "CLEAN PIPELINE WITHOUT TENANT ERP BLOAT",
    icon: Users2,
    problem:
      "Legacy real estate CRMs are bloated with restaurant menus, cleaning schedules, and invoice accounting, locking brokers and owners into cumbersome proprietary systems with painful export walls.",
    technicalStandard:
      "Pure People & Dealings Engine: 5 clean stages (New Inquiry → Discussion → Tour → Handshake → Passed) with account-scoped private notes and 1-click unconditional .csv & .vcf data export.",
    simulator: {
      tag: "DEALINGS PIPELINE V1.3",
      metricA: "STAGES: 5-STEP STREAMLINED FLOW",
      metricB: "NOTE ISOLATION: MULTI-TENANT AIR-GAPPED",
      metricC: "DATA EXPORT: UNCONDITIONAL CSV / VCARD",
      status: "PORTABLE DEAL SOVEREIGNTY",
    },
  },
];

const ROLES = [
  {
    id: "seeker",
    title: "Space Seeker",
    badge: "DISCOVERY & DUE DILIGENCE",
    icon: Eye,
    description:
      "For corporate executives, founders, and families searching for physical spaces with verified integrity.",
    highlights: [
      "Inspect 3D spatial terrain elevation, Project NOAH flood envelopes, and seismic buffers",
      "Curate private property boards without tracking or unsolicited advertiser calls",
      "Direct one-click connection to verified building leasing desks or licensed brokers",
    ],
  },
  {
    id: "broker",
    title: "Licensed Broker",
    badge: "RESA RA 9646 PROTECTED",
    icon: Briefcase,
    description:
      "For PRC-licensed real estate practitioners who demand protected lead attribution and professional dignity.",
    highlights: [
      "Sovereign VIA links route 100% of client inquiries directly to your private inbox",
      "Zero commission skimming or platform transaction fees on deals closed",
      "5-Stage People & Dealings pipeline with 1-click vCard and client CSV export",
    ],
  },
  {
    id: "owner",
    title: "Property Owner",
    badge: "ASSET PERFORMANCE & CONTROL",
    icon: Building2,
    description:
      "For landlords, asset managers, and leasing executives aiming to maximize commercial occupancy.",
    highlights: [
      "Open Gate protocol gives you free, zero-Connect inbound tenant inquiry delivery",
      "Dual-CMS safeguards ensure draft edits remain private until verified publication",
      "Permanent canonical slug reservation prevents broken marketing URLs and QR links",
    ],
  },
  {
    id: "operator",
    title: "Unit Operator",
    badge: "HOSPITALITY & VENUES",
    icon: Layers,
    description:
      "For event space managers, shoot studio hosts, and serviced unit operators managing dynamic bookings.",
    highlights: [
      "Sub-unit delegation allows staff to answer inquiries under verified authority",
      "Direct Web Audio Hotline connects serious production coordinators in seconds",
      "Automated calendar sync coordinates tours without double-booking collisions",
    ],
  },
];

const TRANSMISSIONS = [
  {
    version: "v1.3",
    title: "People & Dealings CRM & Mobility",
    date: "OCTOBER 2026",
    summary:
      "Delivered a zero-bloat CRM focused purely on human relationships, 5-stage inquiry pipelines, private note isolation, and instant CSV/vCard export.",
  },
  {
    version: "v1.2",
    title: "Open Gate Landlord Standard",
    date: "SEPTEMBER 2026",
    summary:
      "Enabled frictionless 0-Connect inbound tenant messaging for direct building owners, removing lead credit hurdles across Philippine commercial inventory.",
  },
  {
    version: "v1.1",
    title: "Sovereign Broker VIA Attribution",
    date: "AUGUST 2026",
    summary:
      "Implemented RESA RA 9646 Position Zero lead routing. Every licensed broker's vanity link locks 100% of tenant inquiries directly to their private account.",
  },
  {
    version: "v1.0",
    title: "Genesis Spatial Radar & Dual-CMS",
    date: "JUNE 2026",
    summary:
      "Launched 10-layer 3D elevation GIS radar with Project NOAH flood modeling, air-gapped Airtable/Supabase dual-database pipeline, and Mapbox geocoding.",
  },
];

export default function PlatformTourPage() {
  const [activeCapId, setActiveCapId] = useState("radar");
  const [activeRoleId, setActiveRoleId] = useState("seeker");

  const currentCap = CAPABILITIES.find((c) => c.id === activeCapId) || CAPABILITIES[0];
  const currentRole = ROLES.find((r) => r.id === activeRoleId) || ROLES[0];

  return (
    <div className="relative min-h-screen bg-background text-text-primary flex flex-col selection:bg-accent/20">
      <AtmosphereBackground variant="default" />

      {/* Global Kicker Header */}
      <header className="relative z-20 border-b border-border-solid bg-surface/80 backdrop-blur-xl px-4 py-3 sm:px-8 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-display text-xl text-accent tracking-tighter hover:text-accent-bright transition-colors"
            >
              S<span className="text-on-surface">cout</span>IT
            </Link>
            <span className="text-text-muted">/</span>
            <span className="font-mono text-[12px] uppercase tracking-wider text-text-secondary">
              Platform Tour & Guidebook 101
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/discover"
              className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-wider text-text-muted hover:text-accent transition-colors"
            >
              <span>Explore Spaces</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-full border border-accent text-accent hover:bg-accent hover:text-background font-mono text-[12px] uppercase font-bold tracking-wider transition-all duration-200"
            >
              Enter Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header Act */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-12 w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-solid bg-surface/60 backdrop-blur-md mb-4 text-[12px] font-mono tracking-wider text-accent uppercase">
            <Sparkles size={14} className="text-accent-bright" />
            <span>LAYER 05 // SYSTEM BRIEFING & OPERATING ARCHITECTURE</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-on-surface font-semibold tracking-tight leading-tight mb-4">
            The features <span className="text-accent">are</span> the promotion.
          </h1>
          <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
            ScoutIt eliminates marketing hype by demonstrating real, unvarnished capabilities. Inspect our
            3D Spatial Radar, Dual-CMS publishing pipeline, RESA VIA attribution, and zero-bloat CRM engine.
          </p>
        </div>

        {/* ACT 0: THE OBSIDIAN THEATER */}
        <section className="mb-16" aria-label="Platform Theater Player">
          <PlatformTheaterPlayer initialClipId={activeCapId} />
        </section>

        {/* ACT 1: THE 5 SOVEREIGN CAPABILITIES */}
        <section className="mb-16 pt-4 border-t border-border-solid" aria-label="Sovereign Capabilities">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="font-mono text-[12px] tracking-wider text-accent uppercase font-bold mb-1">
                ACT 01 // CORE SYSTEM CAPABILITIES
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-on-surface font-semibold tracking-tight">
                Inspect how the platform operates under the hood.
              </h2>
            </div>
            <div className="font-mono text-[12px] text-text-muted">
              SELECT CAPABILITY TO INSPECT ARCHITECTURE
            </div>
          </div>

          {/* Scrub Bar / Tab Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
            {CAPABILITIES.map((cap) => {
              const isSelected = cap.id === activeCapId;
              const Icon = cap.icon;
              return (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => setActiveCapId(cap.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[90px] ${
                    isSelected
                      ? "bg-surface border-accent shadow-[0_0_16px_rgba(var(--accent-rgb),0.15)]"
                      : "bg-surface/50 border-border-solid hover:border-border-mid hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={18} className={isSelected ? "text-accent-bright" : "text-text-muted"} />
                    <span className="font-mono text-[12px] text-text-muted">{cap.number}</span>
                  </div>
                  <div
                    className={`font-mono text-[12px] font-semibold leading-tight ${
                      isSelected ? "text-on-surface" : "text-text-secondary"
                    }`}
                  >
                    {cap.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Inspector Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 rounded-2xl bg-surface border border-border-solid">
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="font-mono text-[12px] tracking-wider uppercase text-accent font-bold mb-2">
                  {currentCap.kicker}
                </div>
                <h3 className="font-display text-2xl sm:text-3xl text-on-surface font-semibold mb-4 leading-snug">
                  {currentCap.title}
                </h3>

                <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
                  <div>
                    <h4 className="font-mono text-[12px] tracking-wider uppercase text-text-muted mb-1 font-bold">
                      THE REAL PROBLEM IT SOLVES
                    </h4>
                    <p>{currentCap.problem}</p>
                  </div>
                  <div>
                    <h4 className="font-mono text-[12px] tracking-wider uppercase text-text-muted mb-1 font-bold">
                      TECHNICAL & STATUTORY STANDARD
                    </h4>
                    <p className="text-text-primary">{currentCap.technicalStandard}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border-solid flex items-center gap-2 text-[12px] font-mono text-accent">
                <CheckCircle2 size={16} className="text-accent" />
                <span>ACTIVE STANDARD IN PRODUCTION BUILDS</span>
              </div>
            </div>

            {/* Live Interactive UI Simulator Card */}
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-xl bg-background border border-border-solid flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[12px] font-mono text-text-muted uppercase mb-4 border-b border-border-solid pb-2">
                  <span>{currentCap.simulator.tag}</span>
                  <span className="text-accent animate-pulse font-bold">ONLINE</span>
                </div>

                <div className="space-y-3 font-mono text-[12px]">
                  <div className="p-2.5 rounded bg-surface border border-border-solid flex justify-between items-center">
                    <span className="text-text-muted">PARAM 01</span>
                    <span className="text-text-primary font-bold">{currentCap.simulator.metricA}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface border border-border-solid flex justify-between items-center">
                    <span className="text-text-muted">PARAM 02</span>
                    <span className="text-accent font-bold">{currentCap.simulator.metricB}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface border border-border-solid flex justify-between items-center">
                    <span className="text-text-muted">PARAM 03</span>
                    <span className="text-text-primary font-bold">{currentCap.simulator.metricC}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-accent/10 border border-accent/40 text-center font-mono text-[12px] text-accent font-bold tracking-wider">
                {currentCap.simulator.status}
              </div>
            </div>
          </div>
        </section>

        {/* ACT 2: ROLE-SPECIFIC OPERATING LENSES */}
        <section className="mb-16 pt-4 border-t border-border-solid" aria-label="Role Lenses">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="font-mono text-[12px] tracking-wider text-accent uppercase font-bold mb-1">
                ACT 02 // ROLE-SPECIFIC OPERATING LENSES
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-on-surface font-semibold tracking-tight">
                Designed for how you actually work.
              </h2>
            </div>
            <div className="font-mono text-[12px] text-text-muted">
              CHOOSE A WORKSPACE PERSPECTIVE
            </div>
          </div>

          {/* Role Pill Switcher */}
          <div className="flex flex-wrap gap-2 mb-6">
            {ROLES.map((role) => {
              const isSelected = role.id === activeRoleId;
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setActiveRoleId(role.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border font-mono text-[12px] tracking-wider uppercase transition-all duration-150 ${
                    isSelected
                      ? "bg-accent-bright text-background border-accent font-bold shadow-[0_0_16px_rgba(var(--accent-rgb),0.3)]"
                      : "bg-surface border-border-solid text-text-secondary hover:text-text-primary hover:border-border-mid"
                  }`}
                >
                  <Icon size={14} />
                  <span>{role.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Role Showcase Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border-solid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="font-display text-2xl text-on-surface font-semibold">
                {currentRole.title} Workspace
              </h3>
              <span className="font-mono text-[12px] px-3 py-1 rounded-full border border-accent-muted text-accent font-bold uppercase tracking-wider self-start sm:self-auto">
                {currentRole.badge}
              </span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
              {currentRole.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentRole.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-background border border-border-solid flex flex-col justify-between"
                >
                  <span className="font-mono text-[12px] text-accent mb-2">CAPABILITY 0{index + 1}</span>
                  <p className="text-xs sm:text-sm text-text-primary leading-relaxed">{highlight}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border-solid flex flex-wrap items-center justify-between gap-4">
              <span className="font-mono text-[12px] text-text-muted uppercase">
                READY TO ENTER THIS WORKSPACE?
              </span>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent hover:bg-accent-bright text-background font-mono text-[12px] font-bold uppercase tracking-wider transition-colors duration-150"
              >
                <span>Activate {currentRole.title} Account</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ACT 3: THE TRANSMISSION ARCHIVE (VERSION LEDGER) */}
        <section className="pt-4 border-t border-border-solid" aria-label="Version Transmissions">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="font-mono text-[12px] tracking-wider text-accent uppercase font-bold mb-1">
                ACT 03 // TECHNICAL VERSION LEDGER
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-on-surface font-semibold tracking-tight">
                Platform Transmissions & Evolutionary Releases.
              </h2>
            </div>
            <div className="font-mono text-[12px] text-text-muted">
              CHRONOLOGICAL CODE & FEATURE DEPLOYMENTS
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRANSMISSIONS.map((item) => (
              <div
                key={item.version}
                className="p-5 sm:p-6 rounded-xl bg-surface border border-border-solid flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[12px] font-mono mb-2">
                    <span className="px-2 py-0.5 rounded border border-accent-muted text-accent font-bold">
                      {item.version}
                    </span>
                    <span className="text-text-muted">{item.date}</span>
                  </div>
                  <h4 className="font-display text-lg text-on-surface font-semibold mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Guidebook 101 Bottom CTA Bridge */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-surface to-background border border-border-solid text-center max-w-2xl mx-auto">
            <h3 className="font-display text-2xl text-on-surface font-semibold mb-2">
              Need personalized operator assistance?
            </h3>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Our engineering team and verified real estate directors are available to brief enterprise
              landlords, brokerage houses, and corporate occupiers on custom spatial integration.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/about"
                className="px-5 py-2.5 rounded-full border border-border-solid hover:border-accent text-text-primary font-mono text-[12px] uppercase tracking-wider transition-colors"
              >
                Read Complete Manifesto
              </Link>
              <Link
                href="/property"
                className="px-5 py-2.5 rounded-full bg-accent hover:bg-accent-bright text-background font-mono text-[12px] font-bold uppercase tracking-wider transition-colors"
              >
                Inspect Live Space Radar
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
