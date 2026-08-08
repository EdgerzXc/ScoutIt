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
//     <h3>LOADING DIRECTORY LEDGER...</h3>
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
import DirectoryClient from "./DirectoryClient";

// The directory reads live CMS data and ?type= filters, so it must not be
// statically prerendered at build time. Same directive /discover uses.
export const dynamic = "force-dynamic";

export default function PropertyRootPage() {
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
          <h3 style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
            LOADING DIRECTORY LEDGER...
          </h3>
        </div>
      }
    >
      <DirectoryClient />
    </Suspense>
  );
}
