import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ShieldCheck, Search, SlidersHorizontal } from "lucide-react";
import { PROFESSIONAL_CATEGORIES } from "@/lib/professionalDirectory";
import styles from "./professionalDirectory.module.css";

export default function ProfessionalDirectorySkeleton({ category = "broker" }) {
  const config = PROFESSIONAL_CATEGORIES[category] || PROFESSIONAL_CATEGORIES.broker;

  return (
    <div className={styles.page} aria-busy="true">
      <Header />
      <main>
        <section className={styles.hero} aria-labelledby="directory-title-skeleton">
          <div className={styles.orbit} aria-hidden="true"><span /><span /><span /></div>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>{config.eyebrow}</span>
            <h1 id="directory-title-skeleton">{config.title}</h1>
            <p>{config.description}</p>
          </div>
          <aside className={styles.truthPanel}>
            <span className={styles.sectionLabel}>Evidence protocol</span>
            <strong><ShieldCheck size={17} aria-hidden="true" /> Named signals only</strong>
            <p>Credentials show their source. Availability is owner-declared. Activity appears only with a named, fresh observation.</p>
          </aside>
        </section>

        <section className={styles.directory}>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <Search size={17} aria-hidden="true" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                SEARCH NAME, PLACE, OR SPECIALTY
              </span>
            </div>
            <div className={styles.selects}>
              <SlidersHorizontal size={15} aria-hidden="true" />
              <div style={{ height: "44px", width: "130px", border: "1px solid var(--border-solid)", background: "var(--surface)" }} />
              <div style={{ height: "44px", width: "130px", border: "1px solid var(--border-solid)", background: "var(--surface)" }} />
              <div style={{ height: "44px", width: "130px", border: "1px solid var(--border-solid)", background: "var(--surface)" }} />
            </div>
          </div>

          <div className={styles.resultMeta}>
            <span>Scanning verified directory roster…</span>
            <span>Private saves never create a public count</span>
          </div>

          <div className={styles.grid}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={styles.card} style={{ minHeight: "340px", opacity: 0.65 }}>
                <div className={styles.portrait} style={{ minHeight: "220px" }}>
                  <span style={{ opacity: 0.3 }}>◈</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.location} style={{ width: "80px", height: "14px", background: "rgba(232, 174, 60, 0.15)", borderRadius: "2px" }} />
                  <div style={{ width: "65%", height: "28px", background: "rgba(255, 255, 255, 0.08)", marginTop: "8px", borderRadius: "2px" }} />
                  <div style={{ width: "45%", height: "14px", background: "rgba(255, 255, 255, 0.04)", marginTop: "10px", borderRadius: "2px" }} />
                  <div style={{ width: "100%", height: "48px", background: "rgba(255, 255, 255, 0.03)", marginTop: "16px", borderRadius: "2px" }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
