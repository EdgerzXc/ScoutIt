"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Radio } from "lucide-react";

import LayerNav from "@/components/descent/LayerNav";
import LayerTransition from "@/components/descent/LayerTransition";
import DescentBackdrop from "@/components/descent/DescentBackdrop";
import { getSignals } from "@/data/mock/mockArticles";
import "./stratosphere-layer.css";

/*
 * LAYER 02 - STRATOSPHERE
 *
 * This layer is a PREVIEW, not a workbench. Its whole job is to make a
 * first-time visitor understand, in about three seconds and without
 * reading, that ScoutIt watches the ground change and writes about it.
 *
 * Two hard rules, both deliberate:
 *   1. One line of prose. No second paragraph, ever. Words stacked in
 *      front of the articles are a tax on the reader.
 *   2. The investigation query does NOT live here. Composing a query is
 *      the job of Discover and Intel. This layer only opens those doors.
 *
 * The 10s skydiver descent runs behind everything and never blocks it.
 *
 * Styles live in ./stratosphere-layer.css rather than a <style jsx> block:
 * styled-jsx silently drops grid-template-columns, grid-template-areas and
 * backdrop-filter from the emitted rule, which shipped a broken layout.
 */

export default function StratospherePreview() {
  // Signals are just articles carrying a live status badge - one dataset,
  // so the radar and the archive can never disagree about a slug.
  const signals = useMemo(() => getSignals(), []);

  return (
    <div className="stratosphere-layer">
      {/* ── THE DESCENT ──────────────────────────────────────────────
          Two stages: the globe establishes the planet and the approach,
          then hands over to MapLibre for Metro Manila — real streets, real
          building footprints extruded to real heights.

          The handover exists because a globe physically cannot show a city:
          its geometry is 110m country borders, so there is nothing inside a
          country outline to reveal. Measured, a city is 0.8% of the frame
          at altitude 0.15, by which point the sphere is 242% of frame
          height and floods the screen. Detail has to come from a different
          renderer, not a lower camera. */}
      <div className="descent-backdrop" aria-hidden="true">
        <DescentBackdrop />
      </div>

      <LayerNav
        prev={{ href: "/layer/orbit", label: "Orbit" }}
        next={{ href: "/layer/metropolis", label: "Metropolis" }}
      />

      <main className="strat-main">
        <div className="strat-container">
          <header className="strat-intro">
            <p className="strat-kicker">
              <span className="strat-live-dot" aria-hidden="true" />
              Layer 02 &mdash; Stratosphere
            </p>

            <h1 className="strat-headline">
              The ground shifts. Find what changed near your{" "}
              <span className="strat-headline-accent">space</span>.
            </h1>

            <span className="strat-underline" aria-hidden="true" />
          </header>

          {/* The preview proper: live signals, shown rather than described.
              This panel is the one surface with a live WebGL scene moving
              behind it, which is why it is the one place glass is used. */}
          <section className="strat-signals" aria-labelledby="strat-signals-title">
            <h2 id="strat-signals-title" className="strat-signals-title">
              <Radio size={13} aria-hidden="true" />
              <span>Moving right now</span>
              <span
                className="strat-signals-count"
                aria-label={`${signals.length} live signals`}
              >
                {signals.length}
              </span>
            </h2>

            <ul className="strat-signal-list">
              {signals.map((signal, i) => (
                <li
                  key={signal.slug}
                  className="strat-signal-row"
                  style={{ "--row-index": i }}
                >
                  <Link href={`/intel/${signal.slug}`} className="strat-signal-link">
                    <span className="strat-signal-index" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span className="strat-signal-body">
                      <span className="strat-signal-status">{signal.status}</span>
                      <span className="strat-signal-title">{signal.title}</span>
                      <span className="strat-signal-meta">
                        <MapPin size={11} aria-hidden="true" />
                        {signal.city}
                        <span className="strat-signal-sep" aria-hidden="true">
                          /
                        </span>
                        <span className="strat-sr-only">, </span>
                        {signal.event}
                      </span>
                    </span>

                    {/* Targeted in CSS as `> svg:last-child`: lucide-react
                        replaces any className passed to its components. */}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Two doors. The query gets composed on the other side. */}
          <nav className="strat-doors" aria-label="Continue into Stratosphere">
            <Link href="/discover" className="strat-door strat-door--primary">
              <span className="strat-door-label">See it on the map</span>
              <span className="strat-door-sub">Where it is happening</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>

            <Link href="/intel" className="strat-door">
              <span className="strat-door-label">Read the intel</span>
              <span className="strat-door-sub">What has been written</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </nav>
        </div>

        <LayerTransition
          nextNum="03"
          nextName="Metropolis"
          nextHref="/layer/metropolis"
          teaser="Touch down. Walk the directory of verified spaces across the archipelago."
        />
      </main>
    </div>
  );
}
