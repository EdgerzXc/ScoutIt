import Link from "next/link";

import { ARTICLES } from "@/data/mock/mockArticles";
import { articlesNear, formatDistance } from "@/lib/geo";
import "./nearby-signals.css";

/*
 * NEARBY SIGNALS — the reverse link.
 *
 * Until now the connection between intel and space ran one way: an article
 * could point at the spaces it affects, but a property page listed no
 * articles at all. This closes it.
 *
 * It is a RISK READOUT, not a "related reading" strip. An owner looking at
 * their own building wants to know whether anything is moving nearby and how
 * close it is — "Zoning · 400m" tells them something an editorial carousel
 * never would. That is why distance leads and why the empty state reads as
 * reassurance rather than as a failed load: no signals near your building is
 * good news, not a broken component.
 *
 * Runs on the server. The distance maths is the same `articlesNear` used by
 * the radar on Intel and Discover, so the two directions can never disagree.
 */

const DEFAULT_RADIUS_KM = 25;
const MAX_ROWS = 5;

export default function NearbySignals({
  lat,
  lng,
  spaceName = "this space",
  radiusKm = DEFAULT_RADIUS_KM,
}) {
  // No coordinates means we genuinely cannot answer the question. Saying
  // nothing is better than implying "nothing nearby".
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const near = articlesNear(ARTICLES, lat, lng, radiusKm).slice(0, MAX_ROWS);

  return (
    <section className="nbs" aria-labelledby="nbs-title">
      <header className="nbs-head">
        <p className="nbs-kicker">Signals nearby</p>
        <h2 id="nbs-title" className="nbs-title">
          {near.length === 0
            ? "Nothing is moving near this space"
            : `${near.length} ${near.length === 1 ? "signal" : "signals"} within ${radiusKm} km`}
        </h2>
      </header>

      {near.length === 0 ? (
        /* Calm, not broken. Silence is the good outcome here. */
        <p className="nbs-quiet">
          No zoning changes, developments or transit work are currently tracked
          within {radiusKm} km of {spaceName}. We will surface them here when
          they appear.
        </p>
      ) : (
        <ul className="nbs-list">
          {near.map((art) => (
            <li key={art.slug} className="nbs-row">
              <Link href={`/intel/${art.slug}`} className="nbs-link">
                <span className="nbs-distance">{formatDistance(art.distanceKm)}</span>

                <span className="nbs-body">
                  <span className="nbs-row-title">{art.title}</span>
                  <span className="nbs-row-meta">
                    {art.event}
                    {art.city ? (
                      <>
                        <span className="nbs-sep" aria-hidden="true">
                          /
                        </span>
                        <span className="nbs-sr-only">, </span>
                        {art.city}
                      </>
                    ) : null}
                  </span>
                </span>

                {art.status ? (
                  <span className="nbs-status">{art.status}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/discover" className="nbs-more">
        Search all intel by area
      </Link>
    </section>
  );
}
