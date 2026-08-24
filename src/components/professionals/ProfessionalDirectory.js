"use client";

import { Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "@/app/property/property.css";
import { directoryFacets, filterAndSortProfessionals, PROFESSIONAL_CATEGORIES } from "@/lib/professionalDirectory";
import ProfessionalCard from "./ProfessionalCard";
import styles from "./professionalDirectory.module.css";

export default function ProfessionalDirectory({ category, initialRecords = [], initialError = "" }) {
  const config = PROFESSIONAL_CATEGORIES[category];
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("name");
  const facets = useMemo(() => directoryFacets(initialRecords), [initialRecords]);
  const records = useMemo(() => filterAndSortProfessionals(initialRecords, { query, specialty, location, sort }), [initialRecords, query, specialty, location, sort]);
  const hasFilters = Boolean(query || specialty || location);

  return (
    <div data-scoutit-guide="broker-prc-license-form" className={styles.page}>
      <Header />
      <main>
        <section className={styles.hero} aria-labelledby="directory-title">
          <div className={styles.orbit} aria-hidden="true"><span /><span /><span /></div>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>{config.eyebrow}</span>
            <h1 id="directory-title">{config.title}</h1>
            <p>{config.description}</p>
          </div>
          <aside className={styles.truthPanel}>
            <span className={styles.sectionLabel}>Evidence protocol</span>
            <strong><ShieldCheck size={17} aria-hidden="true" /> Named signals only</strong>
            <p>Credentials show their source. Availability is owner-declared. Activity appears only with a named, fresh observation.</p>
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
            </div>
          </div>

          <div className={styles.resultMeta} aria-live="polite">
            <span>{records.length.toString().padStart(2, "0")} public profile{records.length === 1 ? "" : "s"}</span>
            <span>Private saves never create a public count</span>
          </div>

          {initialError ? (
            <div className={styles.state} role="alert"><h2>Directory signal unavailable</h2><p>{initialError}</p></div>
          ) : records.length > 0 ? (
            <div className={styles.grid}>{records.map((record) => <ProfessionalCard key={record.key} record={record} actionLabel={config.actionLabel} />)}</div>
          ) : (
            <div className={styles.state}>
              <span>{hasFilters ? "No filter match" : "Roster boundary"}</span>
              <h2>{hasFilters ? "No profiles match this search" : config.emptyTitle}</h2>
              <p>{hasFilters ? "Clear a filter or search with a broader place or specialty." : config.emptyCopy}</p>
              {hasFilters && <button type="button" onClick={() => { setQuery(""); setSpecialty(""); setLocation(""); }}>Clear filters</button>}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
