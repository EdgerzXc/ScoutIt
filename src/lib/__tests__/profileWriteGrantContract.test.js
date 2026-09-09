import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PROFILE_SYNC_COLUMNS } from "@/lib/profileClient";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

// ── A-115 — browser writes must stay inside the granted columns ─────────────
//
// WHY THIS EXISTS
// ---------------
// U-022 revoked table-level UPDATE on `user_profiles` from `authenticated` and
// re-granted exactly ten columns. Its evidence said the list was "tight without
// being too tight" — but the control that proved it exercised the Settings page
// only. Three other browser writers named columns outside the grant, and all
// three broke in production on 2026-09-04 and stayed broken for five days,
// because every one of them discarded the error:
//
//   BrokerMode.handleUpdateLicense    → prc_license, prc_expiry, dhsud_number,
//                                       prc_verified, prc_verified_at  (U-025)
//   profileClient.updateProfilePublic → is_profile_public              (U-026)
//   profileClient.upsertProfile       → subscription_tier, connects_balance,
//                                       member_since, provider_type,
//                                       prc_license, and INSERT itself (U-027)
//
// Standing Rule 20: the schema is a test fixture — assert against what the
// database actually grants, not against a document. These are source contracts
// because the writers are client components, which the JSX-in-`.js` render-test
// limit puts out of reach.
//
// KEEPING THE LIST HONEST
// -----------------------
// GRANTED_COLUMNS is the live grant, read on 2026-09-09 with:
//   select column_name from information_schema.column_privileges
//   where table_schema='public' and table_name='user_profiles'
//     and grantee='authenticated' and privilege_type='UPDATE';
// If a migration widens or narrows the grant, re-read it and update this
// constant in the same change — never edit it to make a test pass.
const GRANTED_COLUMNS = Object.freeze([
  "active_roles",
  "bio",
  "display_name",
  "firm",
  "headline",
  "location",
  "primary_mode",
  "provider_availability",
  "service",
  "updated_at",
]);

// Server-only by grant AND carrying a claim the browser must never make about
// itself: staff role, paid tier, wallet, credential state, public visibility.
const FORBIDDEN_IN_BROWSER_WRITES = Object.freeze([
  "connects_balance",
  "subscription_tier",
  "prc_verified",
  "prc_verified_at",
  "is_profile_public",
  "role",
]);

describe("A-115 user_profiles browser-write grant contract", () => {
  it("the profile sync sends only granted columns", () => {
    for (const column of PROFILE_SYNC_COLUMNS) {
      expect(GRANTED_COLUMNS, `PROFILE_SYNC_COLUMNS names ${column}`).toContain(column);
    }
  });

  it("the profile sync updates an existing row rather than upserting one", () => {
    // `authenticated` holds no INSERT on user_profiles, so an upsert fails
    // outright — taking the granted columns travelling with it down too.
    const source = read("src/lib/profileClient.js");
    const syncBody = source.slice(
      source.indexOf("export async function upsertProfile"),
      source.indexOf("export async function loadOwnProfile")
    );
    expect(syncBody).toContain(".update(profile)");
    expect(syncBody).not.toContain(".upsert(");
  });

  it("no browser writer names a server-only user_profiles column", () => {
    const browserWriters = [
      "src/lib/profileClient.js",
      "src/components/dashboard/BrokerMode.js",
      "src/components/profile/PrivacyControls.js",
      "src/components/profile/panels/PhotographerPanel.js",
      "src/app/settings/page.js",
    ];

    let windowsChecked = 0;

    for (const file of browserWriters) {
      const source = read(file);

      // The window reaches BACKWARDS as well as forwards. The first version of
      // this guard scanned only forward from `.from('user_profiles')` and was
      // vacuous against the exact defect it was written for: `upsertProfile`
      // builds its payload object ABOVE the `.from(` call, so re-introducing
      // `subscription_tier:` left it green. Found by mutation-testing the
      // guard (Rule 19), not by reading it.
      const LOOKBEHIND = 1200;
      const LOOKAHEAD = 600;

      for (const match of source.matchAll(/\.from\(['"]user_profiles['"]\)/g)) {
        const start = Math.max(0, match.index - LOOKBEHIND);
        const window = source.slice(start, match.index + LOOKAHEAD);
        if (!/\.update\(|\.upsert\(|\.insert\(/.test(window)) continue;
        windowsChecked += 1;

        // A whitespace-normalised substring, deliberately NOT a regex built in
        // a template literal. The first attempt used
        //   new RegExp(`\b${column}\s*:`)
        // where \b is a BACKSPACE character and \s is a literal "s" — the
        // pattern matched nothing and the guard survived its own mutation.
        const normalised = window.replace(/\s+/g, " ");
        for (const column of FORBIDDEN_IN_BROWSER_WRITES) {
          expect(normalised, `${file} writes ${column} from the browser`).not.toContain(
            `${column}:`
          );
        }
      }
    }

    // Non-vacuity: if the writers are refactored so no window is found, this
    // test must fail rather than pass by scanning nothing (A-026's rule).
    expect(windowsChecked).toBeGreaterThan(0);
  });

  it("credential and visibility changes go through a server route", () => {
    const broker = read("src/components/dashboard/BrokerMode.js");
    expect(broker).toContain("/api/broker/credential");
    expect(broker).not.toMatch(/\.from\(['"]user_profiles['"]\)/);

    const client = read("src/lib/profileClient.js");
    const visibility = client.slice(client.indexOf("export async function updateProfilePublic"));
    expect(visibility).toContain("/api/user/privacy-settings");
    expect(visibility.slice(0, visibility.indexOf("\n}"))).not.toContain("is_profile_public:");
  });

  it("the credential route forces the verification reset server-side", () => {
    // The client must not be able to keep a badge alive across a credential
    // change simply by not sending the reset.
    const route = read("src/app/api/broker/credential/route.js");
    expect(route).toContain("updates.prc_verified = false");
    expect(route).toContain("updates.prc_verified_at = null");
    expect(route).not.toMatch(/body\.prcVerified/);
  });
});
