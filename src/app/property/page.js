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
import DirectoryClient from "./DirectoryClient";

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

export default async function PropertyRootPage() {
  const initialProperties = await loadInitialProperties();

  return (
    <Suspense
      fallback={
        <div
          className="directory-layout"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100dvh",
          }}
        >
          <h1 style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
            LOADING DIRECTORY LEDGER...
          </h1>
        </div>
      }
    >
      <DirectoryClient initialProperties={initialProperties} />
    </Suspense>
  );
}
