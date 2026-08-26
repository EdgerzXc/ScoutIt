// ═══════════════════════════════════════════════════════════════
// SPACE DIRECTORY — /property   ·   SERVER COMPONENT SHELL
//
// 🔴 THIS FILE MUST NOT HAVE "use client". Read this before changing it.
//
// ── WHAT WAS WRONG (found live 2026-08-08, ACTION 01_NOW A5) ────────
// §65 fixed the raw-`<style>` freeze and both /discover and /property started
// rendering again in a browser. That was only half the bug. Fetching the live
// page WITHOUT JavaScript — which is what a crawler does — returned:
//
//     <h3>LOADING DIRECTORY LEDGER...</h1>
//
// …and nothing else. HTTP 200, correct <title>, correct canonical, empty body.
//
// ── WHY ─────────────────────────────────────────────────────────────
// The whole page was `"use client"`, so its <Suspense> was a CLIENT boundary.
// The server can only emit the FALLBACK of a client boundary; the real content
// is filled in by JS after hydration. A browser runs that JS and looks fine.
// Googlebot's first pass does not, so the highest-priority commercial surface
// in sitemap.js was serving a loading string to the index.
//
// /discover did not have this problem — its page.js is a server component that
// wraps a separate client child. This file now matches that shape exactly.
//
// ── THE RULE ────────────────────────────────────────────────────────
// A <Suspense> boundary only helps a crawler if the component that OWNS the
// boundary is a server component. Moving "use client" down one level — from
// the page to the child — is the entire fix. The client code is unchanged and
// lives in ./DirectoryClient.js.
//
// ⚠️ "It renders in my browser" is not evidence this is fixed. Fetch it with
// JS disabled and confirm real markup comes back. That check is what caught it.
// ═══════════════════════════════════════════════════════════════

import { Suspense } from "react";
import { getCmsBundle } from "@/lib/cmsCache";
import { stripPremiumFields } from "@/lib/premiumFields";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import DirectoryClient from "./DirectoryClient";
import "./property.css";

// The directory reads live CMS data and ?type= filters, so it must not be
// statically prerendered at build time. Same directive /discover uses.
export const dynamic = "force-dynamic";

// ── SERVER-SIDE FIRST PAINT ─────────────────────────────────────────
// Making the shell a server component (above) was only half the fix: the grid
// itself was fetched by a useEffect, so the crawler got a rendered page whose
// entire body was "LOADING THE DIRECTORY...". The list is loaded here instead
// and handed to the client as `initialProperties`.
//
// ⚠️ THIS PAGE IS ANONYMOUS — a public SEO surface. Server components
// serialise their props into the HTML, so anything not stripped here is
// readable with View Source (§45). Every record goes through
// `stripPremiumFields(p, "starry")`, the same guard `/hubs/[slug]` uses.
//
// The client's useEffect still runs and replaces this with a live, radius-aware
// fetch — so filtering behaviour is unchanged. This only decides what is in the
// FIRST response.
async function loadInitialProperties() {
  try {
    const bundle = await getCmsBundle();
    return (bundle?.properties || []).map((p) => stripPremiumFields(p, "starry"));
  } catch (err) {
    // Never let a CMS hiccup 500 the directory. An empty array falls straight
    // through to the client's existing loading state — degraded, not broken.
    console.error("[/property] server CMS load failed:", err?.message);
    return [];
  }
}

async function loadInitialIntel() {
  try {
    const bundle = await getCmsBundle();
    return bundle?.intel || [];
  } catch (err) {
    console.error("[/property] server CMS intel load failed:", err?.message);
    return [];
  }
}

export default async function PropertyRootPage() {
  const [initialProperties, initialIntel] = await Promise.all([
    loadInitialProperties(),
    loadInitialIntel(),
  ]);

  return (

    <Suspense
      fallback={
        <div data-scoutit-guide="scoutit-property-directory" className="directory-layout" aria-busy="true">
          <AtmosphereBackground variant="default" />
          <Header />
          <main className="directory-main">
            <header className="directory-header">
              <span className="vector-label">Layer 3.1 // Directory Ledger</span>
              <h1>The Space Directory</h1>
              <p className="page-subtitle">Every home, office, and venue on ScoutIt — searchable in one place.</p>
            </header>
            <div className="directory-container">
              <button
                className="mobile-filters-toggle"
                disabled
                aria-hidden="true"
                style={{ opacity: 0.6 }}
              >
                Filters
                <span className="filter-chevron">▼</span>
              </button>
              <aside className="filters-sidebar" aria-hidden="true">
                <div className="filter-card" style={{ height: "140px", opacity: 0.6 }} />
                <div className="filter-card" style={{ height: "180px", opacity: 0.6 }} />
                <div className="filter-card" style={{ height: "180px", opacity: 0.6 }} />
              </aside>
              <section style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <div className="search-wrapper" style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ flexGrow: 1, height: "48px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-solid)" }} />
                  <div style={{ width: "180px", height: "44px", background: "var(--bg)", border: "1px solid var(--accent)" }} />
                </div>
                <div className="directory-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} style={{ height: "380px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-solid)", borderRadius: "var(--radius-md, 6px)", opacity: 0.6 }} />
                  ))}
                </div>
              </section>
            </div>

          </main>
          <Footer />
        </div>
      }
    >
      <DirectoryClient initialProperties={initialProperties} initialIntel={initialIntel} />
    </Suspense>

  );
}
