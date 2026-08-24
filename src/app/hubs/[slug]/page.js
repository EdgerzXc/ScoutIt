// ─────────────────────────────────────────────────────────────────────────
// LOCATION HUB PAGE — /hubs/[slug]
// SEO-03 · NEW_IDEAS_2.md §51.4 · WORK ORDER W7
//
// These three URLs were submitted to Google on 2026-08-05 and returned 404
// until this file existed (W1 withheld them from the sitemap to stop the
// soft-404 bleeding). This is the page they were always advertising.
//
// ✅ DONE IN THE SAME COMMIT AS THIS FILE: `HUB_PAGE_EXISTS` is gone from
// src/app/sitemap.js — the slugs are now mapped from `LOCATION_HUB_SLUGS`, so
// this page's `generateStaticParams` and the sitemap read one array and cannot
// drift. The assertion in src/lib/__tests__/sitemap.test.js was inverted at the
// same time (Standing Rule 14).
//
// ⚠️ THE RULE THAT PRODUCED ALL OF THAT: a sitemap entry must never lead the
// page it points at. Adding a hub to `LOCATION_HUBS` now ships both together.
//
// ── PUBLIC PAGE, SO: STRIPPED PAYLOAD ───────────────────────────────
// §45 found premium data in the public payload for every visitor. This page is
// anonymous by definition — an SEO landing surface — so every property is run
// through `stripPremiumFields(p, 'starry')` before it reaches the markup.
// Server components serialise their props into the HTML; anything not stripped
// here is readable with View Source.
//
// ── SERVER-RENDERED, NO CLIENT JS FOR THE CONTENT ───────────────────
// The whole point of this page is to be crawled and to load on a metered
// Philippine mobile connection. The listing grid is plain server-rendered
// markup — no client card component, no hydration cost, no map.
// ─────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCATION_HUBS, getLocationHub } from "@/lib/locationHubs";
import { getCmsBundle } from "@/lib/cmsCache";
import { stripPremiumFields } from "@/lib/premiumFields";
import { selectHubProperties, HUB_RADIUS_KM } from "@/lib/hubProperties";
import { siteUrl } from "@/lib/siteUrl";
import { escapeJsonLd } from "@/lib/jsonLdScript";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./hub.css";

export const revalidate = 3600;

export function generateStaticParams() {
  return LOCATION_HUBS.map((h) => ({ slug: h.slug }));
}

// Unknown slugs 404 rather than rendering an empty hub. An invented hub page
// is the same soft-404 problem W1 closed, one layer in.
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const hub = getLocationHub(slug);
  if (!hub) return { title: "Location not found — ScoutIt" };

  const url = siteUrl(`/hubs/${hub.slug}`);
  return {
    title: `${hub.name} — Property Intelligence | ScoutIt`,
    description: hub.tagline,
    alternates: { canonical: url },
    openGraph: {
      title: `${hub.name} — Property Intelligence`,
      description: hub.tagline,
      url,
      type: "website",
    },
  };
}

/** "1.2 km from the centre" — only ever rendered from a measured distance. */
function distanceLabel(km) {
  if (km === null || km === undefined) return null;
  return km < 1 ? `${Math.round(km * 1000)} m from centre` : `${km.toFixed(1)} km from centre`;
}

export default async function HubPage({ params }) {
  const { slug } = await params;
  const hub = getLocationHub(slug);
  if (!hub) notFound();

  let properties = [];
  let loadFailed = false;
  try {
    const bundle = await getCmsBundle();
    // Anonymous surface — always the starry (lowest) payload. Never derive the
    // tier from a request here; this page is statically regenerated and shared
    // by every visitor, so a subscriber's payload would be cached for all.
    properties = selectHubProperties(
      (bundle.properties || []).map((p) => stripPremiumFields(p, "starry")),
      hub
    );
  } catch (err) {
    console.error("[HUB PAGE] Could not load properties for", hub.slug, err);
    loadFailed = true;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${hub.name} — Property Intelligence`,
    description: hub.tagline,
    url: siteUrl(`/hubs/${hub.slug}`),
    about: {
      "@type": "Place",
      name: hub.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: hub.city,
        addressRegion: "Metro Manila",
        addressCountry: "PH",
      },
    },
    // Only listed when there is something to list. An empty ItemList telling
    // Google there are 0 items is worse than not making the claim.
    ...(properties.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: properties.length,
            itemListElement: properties.slice(0, 20).map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: siteUrl(`/property/${p.slug}`),
              name: p.title,
            })),
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(JSON.stringify(jsonLd)) }}
      />
      <Header />

      <main className="hub-page">
        <header className="hub-hero">
          <p className="hub-eyebrow">Location Intelligence</p>
          <h1 className="hub-title">{hub.name}</h1>
          <p className="hub-tagline">{hub.tagline}</p>
          <p className="hub-meta">
            {hub.city} · Metro Manila
            {properties.length > 0 && (
              <>
                {" · "}
                {properties.length} listing{properties.length === 1 ? "" : "s"}
              </>
            )}
          </p>
        </header>

        {hub.featuredCategories?.length > 0 && (
          <section className="hub-section" aria-labelledby="hub-cats">
            <h2 className="hub-h2" id="hub-cats">
              What people look for here
            </h2>
            <ul className="hub-chips">
              {hub.featuredCategories.map((c) => (
                <li className="hub-chip" key={c}>
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="hub-section" aria-labelledby="hub-listings">
          <h2 className="hub-h2" id="hub-listings">
            Properties in {hub.city}
          </h2>

          {/* ERROR — says what failed and what to do. Never a status code. */}
          {loadFailed && (
            <div className="hub-state" role="alert">
              <p className="hub-state__title">Listings couldn&apos;t be loaded just now</p>
              <p className="hub-state__body">
                The property catalogue didn&apos;t respond. Nothing is wrong with your connection —
                try again in a moment, or browse the full directory instead.
              </p>
              <Link className="hub-cta" href="/discover">
                Browse all properties
              </Link>
            </div>
          )}

          {/* EMPTY — says what goes here and offers one action. */}
          {!loadFailed && properties.length === 0 && (
            <div className="hub-state">
              <p className="hub-state__title">No listings in {hub.city} yet</p>
              <p className="hub-state__body">
                This page covers properties within {HUB_RADIUS_KM} km of {hub.name}, plus anything
                listed under {hub.city}. Nothing has been published here so far — if you own or
                manage a space in the area, yours would be the first.
              </p>
              <Link className="hub-cta" href="/dashboard">
                List a property here
              </Link>
            </div>
          )}

          {/* SUCCESS */}
          {properties.length > 0 && (
            <ul className="hub-grid">
              {properties.map((p) => {
                const distance = distanceLabel(p.hubDistanceKm);
                return (
                  <li key={p.slug}>
                    <Link className="hub-card" href={`/property/${p.slug}`}>
                      <span className="hub-card__title">{p.title}</span>
                      {p.spaceCategory && (
                        <span className="hub-card__cat">{p.spaceCategory}</span>
                      )}
                      {p.hook && <span className="hub-card__hook">{p.hook}</span>}
                      <span className="hub-card__foot">
                        {/* Only a MEASURED distance is shown. A property matched
                            by name has no trustworthy coordinate, so it shows its
                            location text instead of a number we'd be inventing. */}
                        {distance || p.location || p.city || hub.city}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="hub-section hub-section--last">
          <h2 className="hub-h2">Looking somewhere else?</h2>
          <ul className="hub-others">
            {LOCATION_HUBS.filter((h) => h.slug !== hub.slug).map((h) => (
              <li key={h.slug}>
                <Link className="hub-other" href={`/hubs/${h.slug}`}>
                  {h.name}
                </Link>
              </li>
            ))}
            <li>
              <Link className="hub-other" href="/discover">
                Search the full directory
              </Link>
            </li>
          </ul>
        </section>
      </main>

      <Footer />
    </>
  );
}
