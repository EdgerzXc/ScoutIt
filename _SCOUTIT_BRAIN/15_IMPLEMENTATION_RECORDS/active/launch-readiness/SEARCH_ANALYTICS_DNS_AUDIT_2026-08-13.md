---
section: "15_IMPLEMENTATION_RECORDS/active/launch-readiness"
just: evidence
status: active
tags: [seo, search-console, analytics, ga4, dns, godaddy, audit, evidence]
updated: 2026-08-13
related:
  - "[[THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]]"
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN]]"
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS]]"
---

# SEARCH CONSOLE · ANALYTICS · DNS — 2026-08-13

Companion to `THREE_PLATFORM_SECURITY_AUDIT_2026-08-13.md`, covering the second
set of platforms. Read-only throughout: nothing was verified, submitted,
configured, or changed. Google properties were read through the owner's already
signed-in browser session; DNS was read from public resolvers (`8.8.8.8`).

> **Connector status:** there is **no MCP connector** available for Google Search
> Console, Google Analytics, or GoDaddy — the registry returns zero results for
> all three. Everything below came from the live site, public DNS, and the
> owner's browser. Standing API access would need owner-supplied credentials;
> see §5.

---

## 1 · Google Search Console — started, never finished

**This is the headline finding.**

| Signal | State |
|---|---|
| DNS `TXT` verification token | ✅ **present** on apex — `google-site-verification=7JuJY3yeardpNnfXokGbh7l5QUUXen4CJESset64uuM` |
| `google-site-verification` meta tag in live HTML | ❌ absent (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` unset in Vercel) |
| Verified property in the signed-in account | ❌ **none** — `search.google.com/search-console` renders the **welcome/onboarding** screen |
| Prompt shown by Google itself | *"Already started? finish verification"* |

**Read those four rows together.** Somebody placed the DNS verification token,
and then the property was never finished. Google is literally displaying the
"Already started? finish verification" prompt. The token is sitting in DNS doing
nothing.

⚠️ **One alternative explanation, not ruled out:** the token may belong to a
**different Google account** than the browser is signed into. Only the owner can
settle that by checking which account holds the property. Either way the
conclusion is the same — *the account being used day to day has no Search
Console property.*

**What this costs, concretely:**

- **No search performance data exists.** No queries, no impressions, no click
  data, no average position. There is no baseline and none is accumulating.
- **The sitemap has never been submitted.** `robots.txt` correctly advertises
  `https://www.scoutit.space/sitemap.xml`, and the sitemap serves valid XML with
  `lastmod` of 2026-08-12 — but nothing has told Google to read it.
- **No coverage diagnostics.** Soft-404s, "crawled — currently not indexed", and
  exclusions are all invisible.

**This invalidates the premise of §1.4.** That section instructs a future session
to *"Monitor the existing Google index in Search Console"* and *"Review soft-404,
excluded, and crawled-currently-not-indexed coverage."* **There is nothing to
monitor.** Those items cannot begin until a property is verified. §1.4's first
step was missing.

**The fix is small.** The DNS token is already in place, and GA4 is already
installed — either route completes verification in minutes.

---

## 2 · Google Analytics 4 — live, healthy, and measuring nothing that matters

Property `a402814034p547706435`. Measurement ID **`G-36WQZF409S`**, confirmed
present in the deployed HTML of `https://www.scoutit.space/`.

**The env-var remediation worked.** `src/components/analytics/GoogleAnalytics.js`
now reads `NEXT_PUBLIC_GA_ID` with no hardcoded fallback, and the variable is
correctly set in Vercel production. The file's own comment is accurate: GA
measurement IDs are public, so the old hardcoded value leaked nothing — the real
defect was silent misattribution across environments. That is closed.

### Last 7 days

| Metric | Value |
|---|---|
| Sessions | ~1.15K |
| `first_visit` | 1.1K |
| `session_start` | 1.1K |
| `page_view` | 2K |
| `user_engagement` | 649 |
| `scroll` | 175 |
| `form_start` | **2** |
| `click` | **1** |
| **Key events (conversions)** | **0** |

**Channels:** Direct 1.1K · Organic Search 30 · Referral 16 · Organic Social 2 ·
Unassigned 4
**Sources:** `(direct)/(none)` 1.1K · `google/organic` 30 · `accounts.google.com`
9 · `vercel.com` 7 · `m.facebook.com` 2 · `bing/organic` 0
**Geography:** Philippines 979 (+426%) · US 12 · Brazil/Canada/China/Syria 1 each
**Top pages:** homepage 597 · Ridgeline at Capitol Commons 151 · Space
Intelligence 129 · Cyber Sigma Tower 3 129 · Discover 112 · Directory 99 ·
Stories & Market Intel 82

### Four honest readings of that table

**1. `first_visit` ≈ `session_start` ≈ Direct sessions ≈ 1.1K. Essentially
nobody returns.** When almost every session is simultaneously a brand-new user
*and* direct-with-no-referrer, that is the signature of testing traffic, bot
crawling, or link-sharing that strips referrers — not of an audience. Per
**Rule 12**, "1.1K users" is a number that would acquire unearned authority fast.
It should be treated as **unattributed volume**, not reach, until conversions
exist to qualify it.

**2. Key events = 0. Nothing is measuring outcomes.** GA4 has no conversions
configured, so there is no data on saves to Your Board, inquiries sent, Connects
spent, signups, or publishes. `form_start` fired **twice** and `click` **once**
in a week across 1.1K sessions. The platform is measuring that people arrive and
nothing about whether the product works. This directly undercuts the
*"self-serve analytics on hold pending real instrumentation"* decision recorded
in the staff/enterprise plan — **this is that missing instrumentation.**

**3. Organic Social = 2 sessions. This is the OG-image bug showing up in the
data.** The companion audit found the OG/Twitter image renderer failing 208×
across 56 users continuously since 2026-08-01 — every shared listing link going
out with no preview image. Two social sessions in seven days is exactly what
that looks like downstream. **Two independent platforms, same root cause.**

**4. Organic Search = 30 sessions, up 1,400%.** Small, but real and growing —
Google is indexing and sending traffic **without any Search Console property**.
That makes §1 a missed-measurement problem, not a missed-indexing problem.

---

## 3 · DNS and GoDaddy — cutover has not happened

Read from public resolvers; the GoDaddy control panel confirmed the domain is in
the owner's portfolio (signed in as `JG`), but its DNS table had not rendered, so
**public DNS is the authority for everything below.**

| Record | Value | Note |
|---|---|---|
| `NS` | `ns57.domaincontrol.com`, `ns58.domaincontrol.com` | **GoDaddy — still authoritative** |
| `A` (apex) | `216.198.79.1` | Vercel |
| `CNAME` `www` | `3b76710be3bb321d.vercel-dns-017.com` → `64.29.17.1`, `216.198.79.1` | Vercel |
| `TXT` | `google-site-verification=7JuJY3yeardpNnfXokGbh7l5QUUXen4CJESset64uuM` | the orphaned token from §1 |
| `MX` | **none** | no mail on the domain |
| `AAAA` | none | no IPv6 |

**Three things follow:**

1. **The GoDaddy → Cloudflare cutover in `MASTER_OWNER_ACTIONS §4.1` has not
   started.** Nameservers are unchanged. That item is accurate and still open.
2. **No `MX` records confirms the deferred email decision.** [[MASTER_OWNER_ACTIONS]] §1.3
   and `[[MASTER_OWNER_ACTIONS]] §1.8` record that signup mail goes out through
   Resend's shared `onboarding@resend.dev` test domain because ScoutIt has no
   verified sending domain. The empty `MX` is the DNS-side proof. Nothing can be
   received at `@scoutit.space` today.
3. **The zone is small and clean** — which makes the Cloudflare migration low
   risk whenever the owner chooses to do it. Carry the `TXT` token across.

---

## 4 · Corrections to the existing record

1. **§1.4 "Search indexing follow-through" assumes a Search Console property
   exists. It does not.** Every monitoring item in that section is blocked on a
   verification step that was never written down.
2. **An intermediate reading in this session was wrong and is corrected here.** A
   first pass reported "no `google-site-verification` TXT record." That was a
   truncated resolver response — the record **does** exist. The meta tag is
   absent; DNS verification is the route that was started.
3. **GA4's status was previously unrecorded.** It is live, correctly
   env-configured, and collecting — but with **zero** conversions defined.

---

## 5 · Connectivity — what would be needed for standing access

| Platform | MCP connector | Path to real access |
|---|---|---|
| Search Console | ❌ none | Search Console API via a Google Cloud service account + JSON key, with the service account added as a property user. **Blocked on §1 — there is no property to grant access to.** |
| Analytics (GA4) | ❌ none | GA4 Data API, same service account, granted Viewer on property `402814034`. |
| GoDaddy | ❌ none | GoDaddy Developer API key + secret (owner-generated). ⚠️ Registrar credentials control domain transfer — treat as high-sensitivity and prefer completing the Cloudflare cutover instead of wiring long-lived GoDaddy API access. |

Until then, all three remain readable **through the owner's signed-in browser on
request** — which is how this audit was performed.

---

## 6 · Ranked queue

| # | Item | Cost | Owner-gated? |
|---:|---|---|---|
| 1 | **Finish Search Console verification.** DNS token is already live; GA4 is already installed. Either route completes it in minutes | minutes | **owner** |
| 2 | Submit `sitemap.xml` once the property exists | minutes | owner |
| 3 | **Define GA4 key events** — save-to-board, inquiry sent, signup, publish. Nothing is measuring outcomes today | small | no |
| 4 | Record the four agreed non-branded query baselines (§1.4) — now possible only after #1 | small | no |
| 5 | Fix the OG-image renderer — the likely cause of Organic Social = 2 | small | no |
| 6 | Re-classify the 1.1K direct sessions once conversions exist; do not quote it as reach before then (**Rule 12**) | — | no |
| 7 | Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel as a second verification method, so the property survives the Cloudflare DNS cutover | minutes | owner |
| 8 | Carry the `google-site-verification` TXT record across during the Cloudflare migration | — | owner |

⚠️ **Ordering trap:** doing the Cloudflare cutover (`§4.1`) *before* item 1 or 7
would drop the only verification token and reset Search Console to zero again.
**Verify first, then migrate DNS.**
