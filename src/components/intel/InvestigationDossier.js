"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import "./investigation-dossier.css";

/*
 * INVESTIGATION DOSSIER
 *
 * The 8-chapter deep read behind a signal. This used to live inside the
 * Stratosphere LAYER page, which meant the layer carried the full article
 * payload — three thousand lines of story in front of a preview. The layer
 * previews; the dossier belongs to the article the reader chose to open.
 *
 * The numbered chapter registry is a locked ScoutIt brand system (see
 * PRODUCT.md design principle 5), not reflexive scaffolding: these sections
 * genuinely are an ordered investigation and the order carries meaning.
 */

const CHAPTERS = [
  { id: "chapter-1", num: "01", label: "The Signal" },
  { id: "chapter-2", num: "02", label: "The Territory" },
  { id: "chapter-3", num: "03", label: "The Requirement" },
  { id: "chapter-4", num: "04", label: "The Ledger" },
  { id: "chapter-5", num: "05", label: "The Timeline" },
  { id: "chapter-6", num: "06", label: "The Pressure" },
  { id: "chapter-7", num: "07", label: "The Shift" },
  { id: "chapter-8", num: "08", label: "The Impact" },
];

/** Maps a severity/risk word onto the semantic signal colors. */
function toneOf(value = "") {
  const v = String(value).toUpperCase();
  if (v.includes("HIGH") || v.includes("CRITICAL") || v.includes("REQUIRED")) {
    return "critical";
  }
  if (v.includes("MEDIUM") || v.includes("MODERATE") || v.includes("PENDING")) {
    return "caution";
  }
  return "clear";
}

function ChapterHeading({ num, label, headline }) {
  return (
    <>
      <p className="dossier-chapter-eyebrow">
        <span className="dossier-chapter-num">{num}</span>
        <span aria-hidden="true">—</span>
        {label}
      </p>
      {headline ? <h3 className="dossier-chapter-headline">{headline}</h3> : null}
    </>
  );
}

export default function InvestigationDossier({ dossier }) {
  const [openChapter, setOpenChapter] = useState(null);

  if (!dossier || !dossier.investigation) return null;

  const inv = dossier.investigation;
  const jumpTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="dossier" aria-labelledby="dossier-title">
      {/* ── Dossier masthead ── */}
      <header className="dossier-masthead">
        <p className="dossier-kicker">
          <ShieldCheck size={13} aria-hidden="true" />
          Full investigation
        </p>

        <h2 id="dossier-title" className="dossier-title">
          {dossier.title}
        </h2>

        <dl className="dossier-facts">
          <div className="dossier-fact">
            <dt>Corridor</dt>
            <dd>
              <MapPin size={11} aria-hidden="true" />
              {dossier.corridorName}
            </dd>
          </div>
          <div className="dossier-fact">
            <dt>Impact radius</dt>
            <dd>{dossier.impactRadius}</dd>
          </div>
          <div className="dossier-fact">
            <dt>Verification</dt>
            <dd>{dossier.verificationStatus}</dd>
          </div>
          <div className="dossier-fact">
            <dt>Confidence</dt>
            <dd>{dossier.confidence}</dd>
          </div>
        </dl>
      </header>

      {/* ── Chapter registry ── */}
      <nav className="dossier-registry" aria-label="Investigation chapters">
        {CHAPTERS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            className="dossier-registry-item"
            onClick={() => jumpTo(ch.id)}
          >
            <span className="dossier-registry-num">{ch.num}</span>
            <span className="dossier-registry-label">{ch.label}</span>
          </button>
        ))}
      </nav>

      {/* ── 01 — THE SIGNAL ── */}
      <article id="chapter-1" className="dossier-chapter">
        <ChapterHeading num="01" label="The Signal" headline={inv.chapter01?.headline} />
        <p className="dossier-lede">{inv.chapter01?.lede}</p>
        <div className="dossier-pair">
          <div>
            <span className="dossier-pair-label">Jurisdiction</span>
            <p>{inv.chapter01?.jurisdiction}</p>
          </div>
          <div>
            <span className="dossier-pair-label">Status</span>
            <p>{inv.chapter01?.statusSummary}</p>
          </div>
        </div>
      </article>

      {/* ── 02 — THE TERRITORY ── */}
      <article id="chapter-2" className="dossier-chapter">
        <ChapterHeading
          num="02"
          label="The Territory"
          headline={inv.chapter02?.territoryHeadline}
        />
        <p>{inv.chapter02?.territoryNotes}</p>
        <ul className="dossier-list">
          {(inv.chapter02?.corridors || []).map((c) => (
            <li key={c.name} className="dossier-list-row">
              <span className="dossier-row-title">{c.name}</span>
              <span className="dossier-row-meta">
                {c.length} · {c.towerCount} towers · {c.focus}
              </span>
            </li>
          ))}
        </ul>
      </article>

      {/* ── 03 — THE REQUIREMENT ── */}
      <article id="chapter-3" className="dossier-chapter">
        <ChapterHeading
          num="03"
          label="The Requirement"
          headline={inv.chapter03?.requirementHeadline}
        />
        <ol className="dossier-steps">
          {(inv.chapter03?.frameworkSteps || []).map((s) => (
            <li key={s.step} className="dossier-step">
              <span className="dossier-step-num">{s.step}</span>
              <div>
                <span className="dossier-row-title">{s.title}</span>
                <p>{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </article>

      {/* ── 04 — THE LEDGER ── */}
      <article id="chapter-4" className="dossier-chapter">
        <ChapterHeading
          num="04"
          label="The Ledger"
          headline={inv.chapter04?.classificationHeadline}
        />
        <ul className="dossier-list">
          {(inv.chapter04?.buildingLedger || []).map((b) => (
            <li key={b.name} className="dossier-list-row">
              <span className="dossier-row-title">{b.name}</span>
              <span className={`dossier-tag is-${toneOf(b.risk || b.status)}`}>
                {b.status}
              </span>
              <p className="dossier-row-detail">{b.detail}</p>
            </li>
          ))}
        </ul>
      </article>

      {/* ── 05 — THE TIMELINE ── */}
      <article id="chapter-5" className="dossier-chapter">
        <ChapterHeading num="05" label="The Timeline" />
        <ol className="dossier-timeline">
          {(inv.chapter05?.timeline || []).map((t) => (
            <li key={`${t.year}-${t.phase}`} className="dossier-timeline-row">
              <span className="dossier-timeline-year">{t.year}</span>
              <div>
                <span className="dossier-row-title">
                  {t.phase}
                  <span className={`dossier-tag is-${toneOf(t.status)}`}>
                    {t.status}
                  </span>
                </span>
                <p>{t.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </article>

      {/* ── 06 — THE PRESSURE ── */}
      <article id="chapter-6" className="dossier-chapter">
        <ChapterHeading num="06" label="The Pressure" />
        <ul className="dossier-list">
          {(inv.chapter06?.pressures || []).map((p) => (
            <li key={p.title} className="dossier-list-row">
              <span className="dossier-row-title">
                {p.title}
                <span className={`dossier-tag is-${toneOf(p.severity)}`}>
                  {p.severity}
                </span>
              </span>
              <p className="dossier-row-detail">{p.text}</p>
            </li>
          ))}
        </ul>
      </article>

      {/* ── 07 — THE SHIFT ── */}
      <article id="chapter-7" className="dossier-chapter">
        <ChapterHeading num="07" label="The Shift" />
        <div className="dossier-shift">
          {["certifiedStock", "legacyStock"].map((key) => {
            const side = inv.chapter07?.marketShift?.[key];
            if (!side) return null;
            const winning = key === "certifiedStock";
            return (
              <div
                key={key}
                className={`dossier-shift-side ${winning ? "is-up" : "is-down"}`}
              >
                <span className="dossier-shift-title">{side.title}</span>
                <ul>
                  {(side.points || []).map((pt) => (
                    <li key={pt}>
                      {winning ? (
                        <CheckCircle2 size={13} aria-hidden="true" />
                      ) : (
                        <AlertTriangle size={13} aria-hidden="true" />
                      )}
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </article>

      {/* ── 08 — THE IMPACT ── */}
      <article id="chapter-8" className="dossier-chapter">
        <ChapterHeading num="08" label="The Impact" />
        <div className="dossier-table-scroll">
          <table className="dossier-table">
            <thead>
              <tr>
                <th scope="col">Factor</th>
                <th scope="col">Short term</th>
                <th scope="col">Long term</th>
                <th scope="col">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {(inv.chapter08?.impactMatrix || []).map((row) => (
                <tr key={row.factor}>
                  <th scope="row">{row.factor}</th>
                  <td>
                    <span className={`dossier-tag is-${toneOf(row.shortTerm)}`}>
                      {row.shortTerm}
                    </span>
                  </td>
                  <td>
                    <span className={`dossier-tag is-${toneOf(row.longTerm)}`}>
                      {row.longTerm}
                    </span>
                  </td>
                  <td className="dossier-table-rationale">{row.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* ── Evidence ledger ── */}
      <footer className="dossier-evidence">
        <button
          type="button"
          className="dossier-evidence-toggle"
          aria-expanded={openChapter === "evidence"}
          onClick={() =>
            setOpenChapter(openChapter === "evidence" ? null : "evidence")
          }
        >
          <ShieldCheck size={13} aria-hidden="true" />
          <span>Evidence ledger</span>
          <span className="dossier-evidence-stats">{dossier.evidenceStats}</span>
        </button>

        {openChapter === "evidence" ? (
          <ul className="dossier-sources">
            {(inv.evidenceSources || []).map((src) => (
              <li key={src.name}>
                <span className="dossier-source-type">{src.type}</span>
                <span className="dossier-row-title">{src.name}</span>
                <span className="dossier-row-meta">
                  {src.date}
                  {src.verified ? " · Verified" : " · Unverified"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <Link
          href={`/property?q=${encodeURIComponent(dossier.location || "")}`}
          className="dossier-cta"
        >
          <span>Inspect spaces in this corridor</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </footer>
    </section>
  );
}
