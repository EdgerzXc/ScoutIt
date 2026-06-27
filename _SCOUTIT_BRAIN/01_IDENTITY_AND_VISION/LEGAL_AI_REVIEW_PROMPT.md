# Legal AI Review — the prompt to feed the PH AI lawyer (4-part version)

> Purpose: get ScoutIt's **Terms of Service** and **Privacy Policy** reviewed/rewritten by a
> Philippine-law AI tool so they're sound under RA 10173 (Data Privacy), RA 9646 (RESA),
> RA 8792 (E-Commerce), RA 7394 (Consumer Act) — and stay specific to ScoutIt's real model.
>
> The AI lawyer said the full prompt was too large, so it's split into **4 parts**. Paste them in
> order; after each of Parts 1–3 it should reply "READY"; it begins the work at the end of Part 4.
>
> **Before you start:** fill in PART A (only what you know — leave the rest as `[PLACEHOLDER]`).
> **Security:** paste only this public business model — never API keys, database URLs, or private
> user data into a third-party tool.
>
> When the reviewed text comes back, hand it to the build session — the pages (`src/app/terms/page.js`,
> `src/app/privacy/page.js`) are data-driven, so the new sections drop straight in and we update the
> draft banner + effective date. Linked: [[SCOUTIT_BIBLE]] (the model).

---

## PART A — fill these in first (what only you know)

You don't need all of them. Whatever you leave blank, the AI keeps as a `[PLACEHOLDER]` and lists.

- **Legal entity name:** __________ (or "not yet registered — sole proprietor")
- **Business structure:** __________ (sole proprietorship / One Person Corporation / corporation)
- **Registered business address:** __________
- **Data Protection Officer (DPO) name:** __________
- **DPO / privacy email:** __________ (a real inbox; a domain email is best)
- **Support email:** __________
- **Registered with the NPC yet?** __________ (yes / no / not yet)
- **Payment processor (when chosen):** __________ (PayMongo / Xendit / TBD)
- **Preferred court venue (city) for disputes:** __________

---

# ═══════ PART 1 of 4 — paste first ═══════

I'm sending a legal review request in 4 parts because it's long. **Do not answer yet.** After each
part, reply **"READY"** and wait for the next. I'll tell you in Part 4 when to begin.

You are a **Philippine lawyer** specializing in technology platforms, internet/e-commerce law, and
data privacy. You are deeply versed in:
- **RA 10173** (Data Privacy Act of 2012) and NPC implementing rules/circulars, including DPO
  registration and cross-border transfer requirements.
- **RA 9646** (Real Estate Service Act / RESA) — brokerage vs. a neutral information/technology service.
- **RA 8792** (Electronic Commerce Act) — electronic contracts and acceptance.
- **RA 7394** (Consumer Act) — refunds, fair terms, consumer protection.

**Your task:** review and rewrite two documents (a **Terms of Service** and a **Privacy Policy**,
sent in Parts 2–4) for a pre-launch Philippine startup called **ScoutIt**. Make them legally sound
under Philippine law, in clear plain language, faithful to ScoutIt's *actual* business model below.
**Do NOT turn this into a generic real-estate brokerage agreement — ScoutIt is deliberately NOT a
broker.** Keep the section structure close to the current drafts.

**What ScoutIt is — and is not:**
- The **Philippines' first "spatial commerce" platform**: a B2B2C *intelligence and connection
  layer* for every kind of space — homes, offices, short-term rentals, hospitality, restaurants,
  event venues. "Bloomberg for space," not a listings site.
- Standing rule: **"Intelligence first. Transactions never."** ScoutIt does **not** sell, lease,
  negotiate, represent any party in, or take a commission/cut from any transaction. The deal happens
  off-platform between the parties and their own professionals.
- This is **central to RESA (RA 9646) compliance** — confirm the documents keep ScoutIt clearly on
  the "technology/information service" side and not acting as, or appearing to act as, a
  broker/salesperson.

**Platform mechanics that need correct legal treatment:**
- **The Ledger** — a private wishlist stored in the user's own browser/device by default; reaches
  ScoutIt's servers only if the user logs in to sync.
- **Connects** — internal platform currency = an **authorization + anti-spam layer**, not a
  brokerage fee/commission. Three buckets: *granted* (monthly, expires/no roll-over), *purchased*
  (never expires), *earned via bounties* (never expires). Spent the instant an action is sent
  (handshake invite, pitch, contact request), **non-refundable** once spent because the action
  delivers instantly. Confirm this survives Consumer Act (RA 7394) scrutiny and is clearly **not** a
  transaction fee under RESA.
- **Subscriptions/tiers** — four per role (Starry free → Solar → Cluster → Universe). **Pre-launch:
  nothing billable yet** ("Coming Soon"); paid features are previews.
- **Owner–broker handshake** — a broker appears on a property only after a **two-key, double-opt-in
  handshake** (one invites/pitches, the other accepts). No exclusivity. **Scout Rating = verified
  closures only**, never bought.
- **Handshake Chat** — a private chat that is **ephemeral**: messages described as *permanently
  deleted when the chat closes*; ScoutIt doesn't archive/retain. (Note: the hard-delete is **not yet
  built** — see risk #2 in Part 4.)
- **Spatial Vault** — rich media (3D maps, 360° tours, drone heatmaps) mostly **produced by ScoutIt
  or its commissioned creators**, shown on a listing while the owner subscribes. ScoutIt owns the
  media it produces; if the owner cancels, that media **may stay and keep being shown** while the
  owner's privileges pause.
- **Listings & price** — owner/broker-submitted, reviewed before publishing, **never invented** (a
  blank = "unknown," not zero). **Price shows only in a listing's "Your Move" section, only when
  owner-verified, only as the owner's asking price** — ScoutIt never appraises or brokers a price.
- **Bounties** — small real-world data tasks; researchers/photographers earn Connects; owner
  approves payout where tied to their property.
- **Roles** — seeker, owner, broker, photographer, researcher, or event planner. Minimum age 18.

Reply **"READY"** and I'll send Part 2.

# ═══════ END PART 1 ═══════

---

# ═══════ PART 2 of 4 — still don't answer; reply "READY" ═══════

Here is the **CURRENT TERMS OF SERVICE draft (sections 01–09)**. It was written by a general AI to
match the business model, **not** by anyone trained in PH law — treat it as a starting point to
correct and make compliant, not as authority.

**01 · What ScoutIt is — and what it isn't.** ScoutIt is the Philippines' first spatial commerce
platform — a B2B2C intelligence layer for every kind of space. It is **not** a real estate broker,
agent, or dealer, and not a listings site; it does not sell, lease, negotiate, represent any party
in, or take a cut of any property transaction. Standing rule: *Intelligence first. Transactions
never.*

**02 · Your account and your role.** Browsing and the Ledger need no account. To list, connect with
an advisor, or use paid features you create an account and pick role(s): seeker, owner, broker,
photographer, researcher, event planner. Accurate info required; you're responsible for activity
under your account; 18+; ScoutIt may suspend/close accounts that break the terms or post false info.

**03 · The Ledger stays yours.** Saved/tagged spaces (Potential Fit / Interested / Inspired Me /
Save) live in your own browser/device, never gated, never required on our servers. Logging in to
sync = asking us to store a copy; until then we can't see it.

**04 · Connects — what they are.** Platform currency = an authorization/anti-spam layer; not a
brokerage fee/commission/transaction charge. Three buckets: *granted* (monthly, reset on the 1st, no
roll-over), *purchased* (never expire), *earned* (never expire). Spend order: granted → purchased →
earned. Tied to your account, non-transferable, no off-platform cash value.

**05 · Connects — spending and refunds.** A Connect is spent the moment the action is sent (handshake
invite, pitch, contact request), whether or not the other side responds; a decline is a signal, not
a refund. Typical costs: handshake 1 (accepting free), seeker→broker contact 1, commissioning
photographer/researcher/event planner 2. Spent Connects are non-refundable; unspent purchased packs
refundable only where PH consumer law requires.

**06 · Subscriptions, tiers, and pricing.** Four tiers per role (Starry free, Solar, Cluster,
Universe); higher = more intelligence/visibility/slots/Connects; each role is its own subscription.
Charges for access/intelligence/connection, never for listings or looking; public facts are free.
"Coming Soon" pricing is not yet billable; paid features are previews until launch inventory is
reached; Pioneer Cohort may get a locked-in rate. When billing is live, subscriptions auto-renew
unless cancelled before renewal; cancelling stops the next charge and is not a refund of the current
period.

**07 · Listings, accuracy, and price.** Owner/broker-submitted, reviewed before public; genuine
effort to verify but no guarantee of completeness/currency/accuracy; a listing is information, not
an offer. Never invent data — a blank means "unknown," not zero or N/A. Price shows only in "Your
Move," only when owner-verified, only as the owner's asking price; ScoutIt doesn't set/appraise/
broker price.

**08 · Owner authority and the broker handshake.** Authority comes from the owner, not whoever
entered it first; no built-in exclusivity. A broker appears only after a two-key handshake (one
invites/pitches, the other accepts). Lister credit ≠ monopoly. Scout Rating = verified closures
only, never bought/tier-granted/handshake-created. Authority disputes → human review, owner's word
default.

**09 · The Handshake Chat is temporary.** A private chat opens when two parties connect; it is
ephemeral — messages **permanently deleted when the chat closes** (both complete the handshake, or
either walks away); ScoutIt doesn't archive/review/retain. Every chat carries, as part of the terms:
*"This conversation is temporary and will be deleted when closed. ScoutIt is not a party to any
agreement made here."* Sharing private contact details inside the chat is the parties' decision and
can't be un-shared; don't share passwords/government IDs/bank details.

Reply **"READY"** for Part 3.

# ═══════ END PART 2 ═══════

---

# ═══════ PART 3 of 4 — still don't answer; reply "READY" ═══════

**CURRENT TERMS OF SERVICE draft (sections 10–18), continued:**

**10 · The Spatial Vault and who owns the media.** Vault holds 3D maps, 360° tours, drone heatmaps,
mostly produced by ScoutIt or its commissioned creators. ScoutIt-produced media is ScoutIt's
property; while you hold the subscription that includes it you have a license to display it on your
listing — you don't own it and can't reuse it elsewhere. If you cancel/downgrade, ScoutIt-produced
media may remain and keep being displayed to qualifying viewers while your owner privileges pause.
Bring-your-own pasted tours stay yours.

**11 · Removing a listing.** You can go off-market or remove a listing anytime — off the public site
immediately; behind the scenes archived rather than erased (restorable; preserves ScoutIt-produced
media). True permanent erase is via a support request, including a genuine data-removal request under
PH privacy law. No public "delete forever" button, by design.

**12 · Bounties.** Small real-world data tasks (verify address, confirm a space is open, photograph a
space); researchers/photographers claim, submit proof, earn Connects; owner approves before payout
where tied to their property; false proof forfeits the claim and may close the account.

**13 · What you may not do.** No false/misleading/fraudulent listings; no scraping/harvesting; no
bypassing access controls or reverse-engineering; no harassment/threats/impersonation; no
misrepresenting authority over a property or professional license; nothing that breaks PH law incl.
RA 9646. Breach → possible immediate closure and, where required, report to authorities.

**14 · Intellectual property.** The platform (brand, design, editorial briefings, the Connects
economy, the Vault framework, ScoutIt-produced media) belongs to ScoutIt; no copying/redistribution/
derivatives without written permission. Owner/broker-submitted photos/descriptions/data stay theirs;
by submitting, they grant ScoutIt a non-exclusive license to display it while the listing lives here.

**15 · No advice, and the limits of our liability.** Intelligence, not professional (legal/financial/
tax/investment) advice; decisions are yours. Platform "as is"; to the fullest extent PH law allows,
ScoutIt isn't liable for indirect/incidental/consequential losses, including anything in a real
estate transaction found/arranged/discussed through ScoutIt; ScoutIt isn't a party to those.

**16 · Disputes we handle — and ones we don't.** ScoutIt resolves platform disputes only (unauthorized
listings, impersonation, abuse). It does **not** mediate transaction disputes (price, commission,
terms) — those are between the parties and their advisors.

**17 · Electronic acceptance and changes.** Using ScoutIt = electronic acceptance with the effect of
a signature under RA 8792. Terms may update as the platform grows; material changes flagged in-app or
by email; continued use after a change = acceptance.

**18 · Governing law and contact.** Governed by Philippine law incl. RA 9646, RA 8792, RA 7394;
disputes under the appropriate Philippine courts. Contact via the platform's contact channel; a
dedicated legal contact address to be added before paid features go live.

Reply **"READY"** for Part 4 (the Privacy Policy + the instructions to begin).

# ═══════ END PART 3 ═══════

---

# ═══════ PART 4 of 4 — last part; begin after this ═══════

**CURRENT PRIVACY POLICY draft (sections 01–13):**

**01 · Our privacy-first principle.** Built to hold as little about you as possible; browsing and
saved spaces stay on-device by default; personal data collected only where genuinely needed; handled
per RA 10173 and NPC rules.

**02 · What we collect.** Account info (name, email, role(s); pros may add profile/credentials);
submissions (listings, photos, descriptions, their data); usage info (pages, searches, interactions).
No card details collected by ScoutIt — a licensed third-party processor handles payments when billing
goes live.

**03 · Your Ledger stays on your device.** Stored in browser local storage; reaches servers only if
you log in and choose to sync; until then ScoutIt can't see it.

**04 · Handshake Chat is not stored.** Messages ephemeral, permanently deleted when the chat closes;
not archived/reviewed/retained; shared contact details are the parties' decision and can't be
reversed; don't send passwords/IDs/bank details.

**05 · Why we use your data (lawful basis).** To run accounts/features, match users to spaces/
advisors/services, send requested/service notifications, keep the platform safe, improve it, meet
legal obligations. Lawful bases under RA 10173: consent, performance of the agreement (the Terms),
legitimate interests, legal obligations. No sale of personal data; no ad profiles.

**06 · Who we share it with.** Service providers only, minimum needed: hosting/delivery (Vercel),
database/storage (Supabase), maps/geocoding (Mapbox), AI extraction for listing intake (Google
Gemini). Some process data outside the PH; reasonable steps for comparable protection per RA 10173
cross-border rules. May disclose where law requires or to protect users/public; no selling/renting.

**07 · Cookies and analytics.** Essential cookies (e.g. keep you logged in); possibly
privacy-respecting aggregate analytics minimizing personal data; you can disable non-essential
cookies; disabling essential ones may break login/features.

**08 · How long we keep it.** Account data kept while active; removed listings archived (restorable)
not erased — you can ask for permanent deletion; on account closure, personal data deleted/anonymized
within a reasonable period except where law requires retention; anonymized aggregate data may be kept.

**09 · Your rights under the Data Privacy Act.** Rights to be informed, access, object/withdraw
consent, correct, erase/block where allowed, data portability, damages, and to complain to the NPC.
Exercise via the DPO; response within NPC-expected timeframes.

**10 · Security.** HTTPS, access controls, database-level security rules; no system is perfectly
secure; responsible vulnerability disclosure via the contact channel.

**11 · Not for minors.** 18+; no knowing collection from under-18s; tell us and we'll remove.

**12 · Our Data Protection Officer.** Contact the DPO via the platform's contact channel; a dedicated
DPO email to be published before paid features/full accounts go live; may also contact the NPC at
privacy.gov.ph.

**13 · Changes to this policy.** May update as the platform grows; material changes flagged in-app or
by email; effective date at the top reflects the current version.

---

**You now have everything. Begin the task.**

**High-risk clauses — scrutinize these hardest and explain your reasoning:**
1. **Vault media ownership through churn (Terms §10):** ScoutIt keeps displaying a **cancelled
   owner's** media to lure them back. Is the license-vs-ownership structure enforceable under PH law?
   Any consumer-protection, property-rights, or data-privacy problem? How should it be worded to be
   enforceable *and* fair?
2. **"Permanently deleted" chat promise (Terms §9, Privacy §4):** the docs promise permanent
   deletion, but **the hard-delete is not built yet**. Flag the misrepresentation/liability risk and
   propose truthful wording for current behavior while we build it.
3. **"Verified / no fake listings" brand claim vs. the accuracy disclaimer (Terms §7):** reconcile so
   the marketing claim doesn't create a misrepresentation/warranty problem.
4. **Connects as authorization, not brokerage (Terms §4–5):** confirm this keeps ScoutIt outside RESA
   brokerage, and that "spent = non-refundable" is defensible under the Consumer Act.
5. **DPO + dedicated contact (Privacy §12, Terms §18):** state exactly what RA 10173 requires (DPO
   registration with the NPC, what to publish, timing) before collecting real personal data.
6. **Cross-border data transfer (Privacy §6):** state what RA 10173 requires for lawful transfer to
   offshore providers (Vercel, Supabase, Mapbox, Google Gemini) and how the policy should reflect it.
7. **Price display under RESA (Terms §7):** confirm that displaying an owner-verified asking price, as
   information only, doesn't cross into brokerage/advertising-for-a-fee.
8. **Electronic acceptance, governing law & venue, minors:** confirm the RA 8792 acceptance clause,
   governing-law/venue clause, and under-18 handling are correct.

**Deliverables — give me back:**
1. A **revised full Terms of Service** and a **revised full Privacy Policy**, section by section,
   plain language, structure close to the drafts so they're easy to publish.
2. A **"Lawyer's Notes"** appendix: (a) assumptions you made, (b) any clause that still needs a
   *human* licensed attorney's sign-off before launch and why, (c) a **checklist of info ScoutIt must
   still supply** (entity name & structure, registered address, DPO name + email, NPC registration
   status, payment processor, court venue, anything else).
3. Where a clause rests on a specific law or NPC circular, **cite it** briefly.
4. Use `[PLACEHOLDER]` for anything not given — do not invent company names, addresses, emails, or
   registration numbers.

# ═══════ END — BEGIN NOW ═══════

---

*Saved to the vault 2026-06-27. If Part 1 is still rejected as too large, delete the bullet
sub-points under "Platform mechanics" and resend. When the reviewed text returns, hand it to the
build session to drop into `src/app/terms/page.js` + `src/app/privacy/page.js` and update the draft
banner / effective date.*
