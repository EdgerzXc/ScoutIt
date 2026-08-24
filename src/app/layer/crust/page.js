"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Building2, CalendarDays, Camera, Search } from "lucide-react";

import BackgroundCrust from "@/components/descent/BackgroundCrust";
import LayerHeader from "@/components/descent/LayerHeader";
import LayerNav from "@/components/descent/LayerNav";
import LayerTransition from "@/components/descent/LayerTransition";
import {
  CRUST_SERVICE_DATA,
  CRUST_SERVICE_KEYS,
} from "@/components/descent/crustServiceData";
import styles from "./page.module.css";

const SERVICE_ICONS = {
  advisors: Building2,
  photography: Camera,
  research: Search,
  events: CalendarDays,
};

function normalizeCategory(value) {
  return CRUST_SERVICE_KEYS.includes(value) ? value : "advisors";
}

export default function CrustLayer() {
  const [activeCategory, setActiveCategory] = useState("advisors");
  const tabRefs = useRef({});
  const service = CRUST_SERVICE_DATA[activeCategory];
  const Icon = SERVICE_ICONS[activeCategory];

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveCategory(normalizeCategory(params.get("category")));
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  function selectCategory(key, { updateHistory = true, focus = false } = {}) {
    const normalized = normalizeCategory(key);
    setActiveCategory(normalized);

    if (updateHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set("category", normalized);
      window.history.pushState({ crustCategory: normalized }, "", url);
    }
    if (focus) tabRefs.current[normalized]?.focus();
  }

  function onTabKeyDown(event, currentKey) {
    const currentIndex = CRUST_SERVICE_KEYS.indexOf(currentKey);
    let nextIndex = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % CRUST_SERVICE_KEYS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + CRUST_SERVICE_KEYS.length) % CRUST_SERVICE_KEYS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = CRUST_SERVICE_KEYS.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    selectCategory(CRUST_SERVICE_KEYS[nextIndex], { focus: true });
  }

  return (
    <main className={styles.root}>
      <LayerNav
        prev={{ href: "/layer/metropolis", label: "Metropolis" }}
        next={{ href: "/layer/mantle", label: "Mantle" }}
      />
      <div className={styles.background} aria-hidden="true">
        <BackgroundCrust />
      </div>

      <div className={styles.pane}>
        <LayerHeader
          layerNum="04"
          layerName="Crust"
          title="The Service Ecosystem"
          description="Understand each professional role, the evidence ScoutIt actually holds, and when that specialist belongs in your space decision."
          missionText="Crust maps the people around a space decision without flattening them into one generic verified roster. Advisor license evidence is shown only when checked; provider profiles, pilot signals, examples, availability, and launch limits remain explicitly labelled."
          ctaText="Review the advisor roster →"
          ctaHref="/brokers"
        />

        <section className={styles.experience} aria-labelledby="crust-professional-heading">
          <aside className={styles.sidebar}>
            <p className={styles.sidebarLabel} id="crust-professional-heading">Choose a professional lens</p>
            <div
              className={styles.tabList}
              role="tablist"
              aria-label="Professional categories"
              aria-orientation="vertical"
            >
              {CRUST_SERVICE_KEYS.map((key, index) => {
                const category = CRUST_SERVICE_DATA[key];
                const selected = activeCategory === key;
                return (
                  <button
                    key={key}
                    ref={(node) => { tabRefs.current[key] = node; }}
                    type="button"
                    role="tab"
                    id={`crust-tab-${key}`}
                    aria-controls="crust-professional-panel"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    className={styles.tab}
                    onClick={() => selectCategory(key)}
                    onKeyDown={(event) => onTabKeyDown(event, key)}
                  >
                    <span className={styles.tabIndex}>{String(index + 1).padStart(2, "0")}</span>
                    <span className={styles.tabName}>{category.navLabel}</span>
                    <span className={styles.tabArrow} aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div
            className={styles.panel}
            role="tabpanel"
            id="crust-professional-panel"
            aria-labelledby={`crust-tab-${activeCategory}`}
            aria-live="polite"
          >
            <div className={styles.panelInner}>
              <header className={styles.panelHeader}>
                <div className={styles.iconShell} aria-hidden="true">
                  <Icon size={25} strokeWidth={1.4} />
                </div>
                <div>
                  <p className={styles.eyebrow}>{service.eyebrow}</p>
                  <h2 className={styles.title}>{service.title}</h2>
                  <p className={styles.summary}>{service.summary}</p>
                </div>
                <span className={`${styles.status} ${service.statusTone === "live" ? styles.statusLive : ""}`}>
                  {service.status}
                </span>
              </header>

              <div className={styles.dossierGrid}>
                <section className={styles.dossierSection}>
                  <span className={styles.sectionLabel}>What they do</span>
                  <p>{service.purpose}</p>
                </section>
                <section className={styles.dossierSection}>
                  <span className={styles.sectionLabel}>What ScoutIt has checked</span>
                  <p>{service.evidence}</p>
                </section>
                <section className={styles.dossierSection}>
                  <span className={styles.sectionLabel}>When to engage</span>
                  <p>{service.engage}</p>
                </section>
              </div>

              <section className={styles.boundary} aria-label="ScoutIt role boundary">
                <span className={styles.sectionLabel}>ScoutIt’s boundary</span>
                <p>{service.boundary}</p>
              </section>

              <div className={styles.actions}>
                <Link className={styles.primaryAction} href={service.href}>
                  {service.cta} <span aria-hidden="true">→</span>
                </Link>
                {service.secondaryHref && (
                  <Link className={styles.secondaryAction} href={service.secondaryHref}>
                    {service.secondaryCta}
                  </Link>
                )}
              </div>

              <div className={styles.rosterNote}>
                <span className={styles.rosterLabel}>Roster truth</span>
                <p>{service.rosterNote}</p>
              </div>
            </div>
          </div>
        </section>

        <LayerTransition
          nextNum="05"
          nextName="Mantle"
          nextHref="/layer/mantle"
          teaser="Dig beneath the surface. The deep archive holds everything."
        />
      </div>
    </main>
  );
}
