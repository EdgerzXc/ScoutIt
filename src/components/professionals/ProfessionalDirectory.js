"use client";

import { Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import InfoTip from "@/components/ui/InfoTip";
import Breadcrumb from "@/components/ui/Breadcrumb";
import EmptyState from "@/components/ui/EmptyState";
import { getUser } from "@/lib/authClient";
import { supabase } from "@/lib/supabaseClient";
import { normalizeDashboardModes } from "@/lib/dashboardModes";
import { readDevelopmentMockUser } from "@/lib/developmentMock";
import { directoryFacets, filterAndSortProfessionals, PROFESSIONAL_CATEGORIES } from "@/lib/professionalDirectory";
import ProfessionalCard from "./ProfessionalCard";
import styles from "./professionalDirectory.module.css";


const ROLE_CTA_CONFIG = Object.freeze({
  broker: {
    joinLabel: "Be a Broker →",
    joinTitle: "Activate your Licensed Broker workspace",
    editLabel: "Edit Dossier →",
    editHref: "/brokers/portal",
    editTitle: "Edit your private broker dossier and coverage areas",
  },
  photographer: {
    joinLabel: "Be a Photographer →",
    joinTitle: "Activate your Space Photographer workspace",
    editLabel: "Edit Dossier →",
    editHref: "/settings#public-profile",
    editTitle: "Edit your public photographer profile and portfolio details",
  },
  researcher: {
    joinLabel: "Be a Researcher →",
    joinTitle: "Activate your Space Researcher workspace",
    editLabel: "Edit Dossier →",
    editHref: "/settings#public-profile",
    editTitle: "Edit your public researcher profile and specialties",
  },
  event_planner: {
    joinLabel: "Be a Designer →",
    joinTitle: "Activate your Space & Concept Designer workspace",
    editLabel: "Edit Dossier →",
    editHref: "/settings#public-profile",
    editTitle: "Edit your public concept designer profile and services",
  },
  designer: {
    joinLabel: "Be a Designer →",
    joinTitle: "Activate your Space & Concept Designer workspace",
    editLabel: "Edit Dossier →",
    editHref: "/settings#public-profile",
    editTitle: "Edit your public concept designer profile and services",
  },
});

function hasCategoryRole(category, modes, providerType) {
  if (category === "broker") return modes.includes("broker");
  if (!modes.includes("provider")) return false;
  if (!providerType) return true;
  const normalizedType = String(providerType).toLowerCase();
  if (category === "event_planner" || category === "designer") {
    return normalizedType === "event_planner" || normalizedType === "designer";
  }
  return normalizedType === category;
}

export default function ProfessionalDirectory({ category, initialRecords = [], initialError = "" }) {
  const config = PROFESSIONAL_CATEGORIES[category] || PROFESSIONAL_CATEGORIES.broker;
  const ctaConfig = ROLE_CTA_CONFIG[category] || ROLE_CTA_CONFIG.broker;
  const searchParams = useSearchParams();
  const forSlug = searchParams ? searchParams.get("for") : null;
  const forTitle = searchParams ? searchParams.get("title") : null;

  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("name");
  const [isRoleActive, setIsRoleActive] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const facets = useMemo(() => directoryFacets(initialRecords), [initialRecords]);
  const records = useMemo(() => filterAndSortProfessionals(initialRecords, { query, specialty, location, sort }), [initialRecords, query, specialty, location, sort]);
  const hasFilters = Boolean(query || specialty || location);

  useEffect(() => {
    let active = true;

    async function resolveProfessionalStatus() {
      try {
        const { data: { user } } = await getUser();
        if (user) {
          if (active) setIsSignedIn(true);
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("active_roles,primary_mode,role,provider_type")
            .eq("id", user.id)
            .maybeSingle();
          if (!active) return;
          const modes = normalizeDashboardModes(
            profile?.active_roles,
            profile?.primary_mode || profile?.role,
          );
          setIsRoleActive(hasCategoryRole(category, modes, profile?.provider_type));
          return;
        }
      } catch {
        // Fall through to development mock check
      }

      if (typeof window !== "undefined") {
        const mockUser = readDevelopmentMockUser(localStorage, {
          nodeEnv: process.env.NODE_ENV,
          hostname: window.location.hostname,
        });
        if (mockUser && active) {
          setIsSignedIn(true);
          const modes = normalizeDashboardModes(
            mockUser.tags || mockUser.active_roles,
            mockUser.primaryMode || mockUser.primary_mode || mockUser.role,
          );
          setIsRoleActive(
            hasCategoryRole(category, modes, mockUser.providerType || mockUser.provider_type),
          );
          return;
        }
      }

      if (active) {
        setIsSignedIn(false);
        setIsRoleActive(false);
      }
    }

    resolveProfessionalStatus();
    return () => { active = false; };
  }, [category]);

  return (
    <div data-scoutit-guide="broker-prc-license-form" className={styles.page}>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="directory-title">
          <div className={styles.orbit} aria-hidden="true"><span /><span /><span /></div>
          <div className={styles.heroCopy}>
            <Breadcrumb
              backHref={forSlug ? `/property/${encodeURIComponent(forSlug)}` : "/layer/crust"}
              backLabel={forSlug ? `Return to ${forTitle || "Property"}` : "Back to Layer 04 · Crust"}
              ariaLabel="Layer Breadcrumb"
              style={{ marginBottom: 12 }}
            />
            <span className={styles.eyebrow}>{config.eyebrow} <InfoTip tipId="layerNumber" label="About this layer" /></span>
            <h1 id="directory-title">{config.title}</h1>
            <p>{config.description}</p>
          </div>
          <aside className={styles.protocolRow} aria-label="Evidence protocol">
            <ShieldCheck size={16} aria-hidden="true" />
            <strong>Named signals only</strong>
            <InfoTip tipId="evidenceProtocol" label="About the evidence protocol" />
            {isRoleActive ? (
              <Link href={ctaConfig.editHref} className={styles.portalLink} title={ctaConfig.editTitle}>
                {ctaConfig.editLabel}
              </Link>
            ) : (
              <Link
                href={isSignedIn ? "/settings#account" : "/onboarding?next=%2Fsettings%23account"}
                className={styles.portalLink}
                title={ctaConfig.joinTitle}
              >
                {ctaConfig.joinLabel}
              </Link>
            )}
          </aside>
        </section>

        <section className={styles.directory} aria-label={`${config.title} directory`}>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search professionals</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SEARCH NAME, PLACE, OR SPECIALTY" />
            </label>
            <div className={styles.selects}>
              <SlidersHorizontal size={15} aria-hidden="true" />
              <label><span className="sr-only">Specialty</span><select value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="">All specialties</option>{facets.specialties.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className="sr-only">Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option value="">All locations</option>{facets.locations.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className="sr-only">Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Name A–Z</option><option value="credential">Credential evidence</option><option value="availability">Declared availability</option></select></label>
              <InfoTip tipId="credentialSort" label="How sorting works" />
            </div>
          </div>

          <div className={styles.resultMeta} aria-live="polite">
            <span>{records.length.toString().padStart(2, "0")} public profile{records.length === 1 ? "" : "s"}</span>
            <span>Your saves stay private <InfoTip tipId="privateSaves" label="About private saves" /></span>
          </div>

          {initialError ? (
            <div className={styles.state} role="alert"><h2>Directory signal unavailable</h2><p>{initialError}</p></div>
          ) : records.length > 0 ? (
            <div className={styles.grid}>{records.map((record) => <ProfessionalCard key={record.key} record={record} actionLabel={config.actionLabel} forSlug={forSlug} forTitle={forTitle} />)}</div>
          ) : (
            <EmptyState
              eyebrow={hasFilters ? "No filter match" : "Roster boundary"}
              title={hasFilters ? "No profiles match this search" : config.emptyTitle}
              description={hasFilters ? "Clear a filter or search with a broader place or specialty." : config.emptyCopy}
              action={hasFilters ? (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setSpecialty(""); setLocation(""); }}
                  className="px-5 py-2.5 bg-gold-accent text-background font-mono text-xs uppercase tracking-wider font-semibold rounded hover:bg-gold-bright active:scale-95 transition-all"
                >
                  Clear filters
                </button>
              ) : null}
            />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
