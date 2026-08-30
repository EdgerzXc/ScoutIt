---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [active-work, engineering, pre-pilot]
updated: 2026-08-30
related: ["[[00_MASTER_ACTION_PLAN]]", "[[URGENT]]", "[[WAITING]]", "[[MASTER_OWNER_ACTIONS]]"]
---

# Active — approved work that can proceed

> Maximum 25 open items. An agent may work here only after Urgent is stable and
> after re-checking the named behavior against current code.

## Active domain plans

- [[A-023_BROKER_DOSSIER|A-023 — Canonical Broker Dossier and editor]]
  is the complete authoritative plan for the broker master-page workstream.
  Its statistics contract makes the read-only ScoutIt transaction record primary
  and keeps broker-editable historical career data secondary and clearly labelled.
  **All six delivery phases are complete as of 2026-08-27, and the line audit
  closed every gap that engineering can close (G1-G4).** The two remaining items
  are not code: G5 needs Airtable `BROKERS_CMS` columns, and G6 — a single Scout
  Rating composite — requires a published formula and separate owner approval.
  A-023 stays in Active only for the owner visual review; nothing in it is
  blocked on further implementation.

## Master Mission Control — four connector gaps

**Opened 2026-08-30 on owner direction**, each verified against Mission
Control's source, the main site's source, and the live database before entry.
**Scheduled for the 2026-08-31 session** — the order and the pre-flight checks
are in [[00_MASTER_ACTION_PLAN]] under "Next session".

Mission Control is deployed and responding (`mission-control-sigma-one-89`),
and most of it is genuinely built: 21 dashboard pages backed by 16 server-action
modules, RBAC tiers, and 86 audit call sites writing to
`mission_control_actions`. The gaps are not missing screens. **In three of the
four cases below a well-built console is wired to the wrong end of the
connector**, which is why the work looks finished and changes nothing.

## A-062 — Contact triage has no reply, so it is not the live chat it is taken for

`dashboard/contact` moves a `contact_messages` row through
new → in_progress → resolved → spam, with tier gating and `handled_at`/
`handled_by` recorded, and deliberately leaves those null while a message is
open so "nobody picked it up" stays distinguishable from "someone picked it up
and did nothing". That part is correct.

`setContactStatus` is the **only** exported action. There is no send, no reply,
no thread. The page says so itself: someone who has not signed up "has no
identity and no inbox here", and "the honest upgrade path is a real threaded
reply". Marking something resolved is not answering it.

`contact_messages` holds 0 rows, so nobody has been left unanswered yet.

**Decide before launch:** either replies go out by email from the console, or
contact is routed to an authenticated deal room, or the public page stops
implying a conversation will happen.

## A-058 — Monthly Scout Wrap has a backend and no front end

**Promoted 2026-08-30 on owner question, verified against live code and the
live database before entry.** It has never had a live queue entry, which is
the likeliest reason it stalled half-built: `RULES` forbids executing work
directly from a specification, and a specification is all it had.

**What exists.** `07_FEATURES_AND_FLOWS/MONTHLY_SCOUT_WRAP_IMPLEMENTATION_PLAN.md`
is `status: locked` and headed **"OWNER PRIORITY — REQUIRED BEFORE THE
CONTROLLED PUBLIC PILOT"**. It states the intent plainly: it "should feel like
Spotify Wrapped, but every number must be reproducible from real ScoutIt
events." `/api/wrap` is implemented for `property`, `owner_portfolio` and
`broker`, is authentication-gated, and is covered by
`monthlyScoutWrapApi.test.js`. The `monthly_scout_wraps` table is live.

**What does not exist.**

- **No caller.** A grep for `api/wrap` outside the route and the flow-graph
  data returns nothing. Rule 13: an endpoint with no caller is a plan, not a
  feature — the same defect A-038 records for the recommendation endpoints.
- **No rows.** `monthly_scout_wraps` holds 0 records, so nothing has ever been
  generated even server-side.
- **No Mission Control generation button**, which the plan names as the way the
  feature avoids depending on a paid scheduler before launch.
- **No "your wrap is ready" notification**, though `notifyUser` now exists and
  would carry it.

**Acceptance.** An owner and a broker can open a real wrap for a completed
month, every figure traceable to a recorded event rather than an estimate; a
staff member can generate one on demand; the archive replays previous months;
and nothing claims a deal "closed" or "sold" from a chat status, per the plan's
own §98 prohibition.

**Sequencing note.** The plan's honest-metrics rule means this is only worth
opening once there is enough real activity to summarise. Against sample-only
inventory a wrap would summarise nothing, so this sits behind A-059.

## A-059 — The human-testing sample set is too thin to exercise the product

**Promoted 2026-08-30 on owner direction.** The disclosure machinery is built
and correct; the volume is not.

**Built and working, not in question.** Every public listing is flagged
`is_sample` and badged "SAMPLE DATA — FOR HUMAN TESTING" (owner-authorised
2026-08-23, checksum updated). `lib/sampleInventory.js` allowlists sample slugs
and validates inquiry recipients, so an inquiry on a sample property cannot
email a real person. That guard must survive any expansion.

**The problem, measured live on 2026-08-30.** The catalogue holds **7
properties, 1 intel article, 3 brokers**:

| Dimension | Coverage |
| --- | --- |
| Category | Commercial 2; STR, Hospitality, Residential, Restaurants, Venues 1 each |
| City | Taguig 2; Pasay, Malay, Cebu City, Pasig, Makati 1 each |
| Coordinates | 7/7 |
| Images | 6/7 |

Every filter the product ships is therefore untestable in any meaningful way. A
category filter that returns one result cannot show sorting, pagination, an
empty state, or a crowded map. A radius search over six cities cannot show
clustering. One intel article cannot exercise the Intel layer's carousel,
topic filter or radar at all.

**What this needs.** Enough sample inventory that a tester can actually hit the
edges: several properties per category, multiple properties in the same city so
the map clusters, at least one category deliberately left empty to prove the
empty state is honest, a property with no image, and enough intel articles to
fill the carousel and the radar. The exact target is an owner call, but the
current set cannot answer "does the filtering work" for anyone.

**Boundary.** Sample inventory must never be presented as real. The
`is_sample` flag, the badge, and the inquiry-recipient allowlist are load-bearing
and are not optional on new records.

## A-038 — Post-deal satisfaction signal and client feedback, with moderation

**Promoted 2026-08-27 on owner direction.** Closes the producer half of A-023
gaps G1 and G2.

**The gap, verified in current code.** `/api/broker/recommendations` and
`/api/broker/contributions` exist, are authorization-correct, and are covered by
tests — and **nothing in the application calls either one**. A grep for callers
returns only their own test files. Every recommendation now visible on a dossier
was written directly into Supabase by an operator. This is Rule 13 exactly: an
endpoint with no caller is not a feature, it is a plan. Recommendations can
therefore never appear on their own, no matter how many deals complete.

**Owner direction.** After the two parties have actually dealt with each other —
at handshake completion, or at deal close — offer the counterparty (buyer,
owner, or client) a place to say how the broker they just worked with performed.
Route it through approval rather than publishing it straight to the page.

### Satisfaction signal — owner decisions, 2026-08-27

The owner directed a **satisfaction level, not a rating**: four faces, published
publicly as ScoutIt's own health metric for how counterparties felt about a
broker. Captured in one tap after a completed handshake, with an optional
comment, and computed only above a floor of five responses.

**On the anti-slop rule.** RULES Part B lists "emoji as production iconography"
among the things not to ship. The owner classified that as a purposeful default
rather than a lock, and this surface deliberately earns its way out: the faces
*are* the measure, not decoration. They must still be drawn assets rather than
system emoji, which render differently on every platform and cannot be styled,
sized, or given accessible names reliably.

#### The scale

Four ordered levels, no neutral: **angry · sad · smile · happy**. A forced
choice with two negative and two positive steps and no midpoint, so the
conflict-averse cannot park in the middle and hollow out the signal.

#### The computation

**Published figure — positive share:**

```
positive_share = (happy + smile) / (happy + smile + sad + angry)
```

reported with its denominator, always: *"82% positive · 17 responses"*.

**Why a share and not an average.** Averaging these four would mean assigning
numbers to them — happy=4, smile=3, sad=2, angry=1 — and that asserts the step
from *sad* to *angry* is exactly as large as the step from *smile* to *happy*.
Nobody knows that; it is not a measured quantity. A mean over ordinal labels
manufactures a precision the data never had, and it is how a "satisfaction
level" quietly becomes a 4.2-out-of-5 star rating. A share is a claim that can
be defended in one sentence: *this many of these people finished positive*.

**The distribution is shown, not just the headline.** A diverging stacked bar
centred between *smile* and *sad*, positive extending one way and negative the
other, with each segment's count available. Two brokers can both be "75%
positive" while one has no angry responses and the other has three; the headline
alone hides that and the bar does not.

**Floor.** Below **5 responses** nothing is computed or published — the section
states it is building, exactly as the response-rate metric already suppresses
below its own floor. The floor is a constant beside `MIN_RESPONSE_SAMPLE`, not a
literal repeated in the code.

**Eligibility.** One response per completed two-sided handshake, from the
counterparty only. Reuses the same qualification SQL as the ScoutIt Record so
"a real deal" cannot come to mean two different things. Self-dealing is already
rejected at the database.

### Window, dispute, and the evidence base — owner decisions, 2026-08-27

**All-time, not a rolling window.** The owner rejected recency decay: a window
would let a genuinely bad stretch quietly age out, and sympathy for a broker is
not worth degrading the signal buyers rely on. The remedy for an unfair response
is not time — it is **removal on evidence**.

**Why permanence is deliberate.** The owner's position, recorded as given: a
broker's record follows them, and that is what makes the signal worth reading.
This is harsh on incompetence by design rather than by oversight. The dispute
inbox is the counterweight — not leniency in the metric, but a real path to
remove a response the evidence does not support. Adjudication is to be assisted
by an AI applied strictly to law and evidence with a human gate, and counsel
retained for the standard; that work is recorded as
[[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|A-042]] and is trigger-gated on A-041
existing and counsel being engaged.

**So the broker gets a complaint path.** A broker may dispute a specific
satisfaction response. Staff adjudicate against evidence and may remove it. A
removed response leaves the denominator, is excluded from the published share,
and the adjudication is recorded — a removal that leaves no trace is
indistinguishable from a broker deleting criticism.

#### What already exists — verified against live code and schema

More than expected, and it is the right shape:

- **`deal_disputes` is live** with `deal_id`, `reporter_id`, `reason`,
  `details`, `status`, `hold_placed_at`, `resolved_at`.
- **Message bodies survive seven days after a deal closes**, then only the
  *bodies* are replaced with `[Purged after 7 days retention policy]`. The rows
  remain, so participants, timestamps and deal metadata stay as an audit trail.
- **A thread under an active dispute hold is exempt from purging** until the
  case resolves — statuses `open_hold` and `under_review`. The purge job reads
  the holds rather than trusting the deal row, precisely because a dispute is
  filed against a deal that is already closed.

#### The finding that changes the design

**Nothing can file a dispute.** A search across the application for writers to
`deal_disputes` returns exactly one file — the purge job, which only *reads* it.
No route, no screen, no staff tool creates a row. The hold mechanism is correct
and can never be triggered, so in practice **every closed thread purges at seven
days unconditionally**.

That matters here more than anywhere else: satisfaction responses are permanent
and all-time, but the evidence needed to overturn an unfair one has a **seven-day
life**. A broker disputing a response five weeks after close would be
adjudicated against a thread reading `[Purged after 7 days retention policy]`.
Evidence-based removal would be evidence-based in name only.

The Bible's shorthand that chat is "ephemeral, deleted on close" also understates
what is implemented; seven days after close, bodies only, is the real rule.

#### Retention decision — settled 2026-08-27 (option 1)

The owner chose **option 1: the dispute window is bounded by retention.** No
change to the published promise, no automatic holds, no snapshot bundle. A
satisfaction response may be disputed while its thread is still readable; fast
disputes are encouraged precisely so they are settled while the record exists.

The reasoning is deliberate: ScoutIt does not become a long-term archive of
private conversations. Each party downloads and keeps their own copy, outside
ScoutIt; the platform does its due diligence inside the seven days.

**That model depended on a feature that did not exist, and now does.** A-043
shipped on 2026-08-27: `GET /api/deals/[id]/export` returns a party's own
conversation as a plain-text record, and the control is reachable from the
conversation whether it is open or closed. Before that, "we don't keep it, they
do" was only half true — after seven days the record was gone for everyone, both
parties included, and there was nothing to adjudicate against. The prerequisite
is satisfied; see [[DONE/2026-08|D-2026-08-30]].

Two consequences to build to:
- The dispute window is **stated to the user at the moment they rate**, not
  discoverable later. A right that expires unannounced is not a remedy.
- Closing a deal should prompt both parties to download their copy, while the
  thread is still complete.

#### Removal rules

- **The broker never removes a response**, and neither does anyone able to
  benefit from its removal. Staff adjudicate.
- **Filing a dispute places the hold immediately**, before review begins.
  Reviewing evidence that a scheduled job may purge mid-review is the failure
  the exemption already exists to prevent.
- **A removal states its ground** from a fixed list — outside a real deal,
  identity or authorship failure, abuse or threat, retaliation for a lawful
  refusal, factual claim contradicted by the record. Never "the broker objected".
- **A removed response is retained, marked, and excluded from the computation.**
  Never hard-deleted: the audit is the thing that makes removal trustworthy.
- **The adjudication is auditable** — who decided, when, on what ground, against
  which thread.
- **Removals are visible in aggregate.** If a broker has had responses removed,
  staff can see the pattern. A broker who successfully disputes every negative
  response is either unusually unlucky or gaming the process, and neither is
  visible from a single case.
- **The share is recomputed after any removal**, and if the sample drops below
  the floor of five the figure is suppressed rather than published thinner.

#### Consequence for A-038's scope

A-038 cannot ship a credible evidence-based removal path on top of a dispute
table nothing writes to. Either it also builds the dispute producer, or that is
split into its own task and A-038 ships capture and moderation while removal
waits. **Recommend splitting**: the dispute producer is Trust & Safety
machinery with its own audit and staff surface, and it is needed by disputes
generally, not only by satisfaction responses.

#### Colour — validated, not chosen by eye

The obvious green-to-red scale **fails**: run through the palette validator
against the dark surface, the two middle steps sit at ΔE 2.7–4.4 for
deuteranopes. Red-green colour blindness affects roughly one man in twelve, and
those two faces are precisely the ones that decide whether the reading is
positive or negative.

The validated set is a blue-to-red ordered ramp:

| Level | Hex |
|---|---|
| happy | `#3d8bd4` |
| smile | `#7cc4ee` |
| sad | `#e8a05c` |
| angry | `#c0392b` |

Worst adjacent pair: **ΔE 17.2 under protanopia, 17.3 normal vision**, all four
at or above 3:1 against the surface. The remaining validator flags are the
*categorical* lightness-band and chroma checks, which its own scope note limits
to categorical palettes; this is an ordered scale, where monotonic lightness is
the intent.

**This introduces colour outside the 95/5 gold identity, and that is a real
cost.** It is confined to the marks of one instrument, never to chrome or
actions. If the owner prefers to hold the palette, the alternative is a
gold-only sequential ramp — accessible by lightness alone — at the price of
losing the intuitive good/bad read. Face shape and a text label carry identity
in either case, so no meaning ever rests on colour.

### Acceptance

- **Trigger.** Only a completed two-sided handshake makes the prompt eligible.
  Never an inquiry, a message thread, or a broker request. The eligibility test
  reuses the qualification SQL the ScoutIt Record already uses, rather than a
  second definition of "a real deal" that can drift from it.
- **Audience.** Offered to the counterparty, never to the broker about
  themselves; the existing no-self-dealing constraint must still reject it at
  the database if the app ever gets it wrong.
- **Placement.** A tab or panel the counterparty reaches from the deal or
  dashboard. It is an invitation, not a blocker: dismissible, never modal over
  the close, and it must not gate any other action.
- **Consent is explicit and per-submission.** Attribution mode is the client's
  choice at write time (full name, initials, role only, anonymous). The
  submission path must not accept `moderation_state`, `verified`, or author
  identity from the client — all three are resolved server-side, exactly as the
  existing route already does.
- **Approval.** Staff moderation decides published or not. A withdrawn or
  rejected row is retained so the consent record survives, and a moderator can
  never approve past a revoked consent.
- **Honest labelling.** A handshake-backed entry reads "Verified ScoutIt
  connection"; anything else reads "Client-submitted · unverified". Never
  unlabelled.
- **No star, no average, no composite.** The published figure is a share with
  its denominator, per the computation above. Nothing is emitted as
  `aggregateRating` in JSON-LD, because Google renders that as stars — which is
  the exact presentation this decision rejected.
- **The four states** ship on every new surface: loading, empty, error, success.
- Contributions (G2) stay **staff-credited**; this task does not give brokers a
  self-serve form, because a self-declared claim wearing a platform-credited
  label is the thing that design deliberately prevents.

### Dependencies and honest boundaries

- **It cannot be verified against real data today.** `deal_handshakes`, `deals`
  and `deal_messages` all hold zero rows, so no prompt can fire from real
  activity. Expect fixture-driven proof plus an explicit statement that the
  first real deal is the true test — the same boundary the ScoutIt Record
  carries.
- No migration is assumed. Both tables already exist and are RLS-enabled with
  zero policies, service-role only.
- Consider adding a `source` column to `broker_recommendations` and
  `broker_contributions`. `broker_metric_snapshots` has one and it is what stops
  demo figures laundering into computed ones; those two tables have no
  equivalent, so seeded demo rows are distinguishable only by the account's
  example flag.
- RA 9646: publishing client commentary about a licensed professional is not a
  brokerage act, but see O-013 — ScoutIt still has no salesperson role, and a
  salesperson carried as a "broker" would accumulate feedback under the wrong
  professional category.

**Not authorized by this item:** a public rating or score (that is G6), commits,
pushes, deployment, live data mutation, or any approved-surface checksum update.

## A-039 — The dossier's left record panel is now an orphan

**Opened 2026-08-27** as A-037's carried-forward presentation issue.

**What is wrong.** A-037 moved the three figures out of the left column's
`SCOUTIT RECORD` box and into the at-a-glance chart beside the advisor's name.
The box kept only its provenance sentence — "Computed only from activity
completed through ScoutIt. Self-reported career history never contributes to
these figures." — so a full-size bordered panel under the avatar now carries one
line of small print, and the page shows the heading `SCOUTIT RECORD` twice.

**Why it was left rather than fixed.** The sentence is load-bearing: it is the
provenance declaration A-023 requires of every public card, and it is also where
the BUILDING and UNAVAILABLE states explain themselves in words when no chart
renders. Deleting the panel would delete that. Where the copy should live is a
composition decision about what the left column is *for*, which is the owner's
call, not a tidy-up.

**Options, no recommendation without the owner seeing it.**
1. Fold the provenance line into the chart card's footer and drop the panel,
   leaving the left column as avatar plus credential.
2. Keep the panel but restyle it as a plain note rather than a bordered box, and
   drop the duplicate `SCOUTIT RECORD` heading.
3. Give the left column a different job entirely — credential, clearance,
   contact route — and move all record provenance to the chart.

**Acceptance.**
- `SCOUTIT RECORD` appears once in the page's heading structure.
- The provenance declaration remains visible on every state that publishes a
  figure, and the BUILDING/UNAVAILABLE explanations still appear when no chart
  renders — these are the states that have no chart to attach copy to.
- Verified at 390px and 1280px; the mobile stack order still reaches the
  advisor's name without scrolling past an empty frame.
- Heading semantics stay intact — A-024 owns the one-H1 rule this page follows.

**Not authorized by this item:** commits, pushes, deployment, or any
approved-surface checksum update.

## A-040 — Six live broker tables appear in no canonical schema document

**Promoted 2026-08-27** from GAP-07 in the full-stack gap audit, re-verified
against the live database and the doc before entry.

**Verified.** `04_DATA_AND_SCHEMA/DATA_DICTIONARY.md` contains **zero**
occurrences of `broker_metric_snapshots`, `broker_recommendations`,
`broker_contributions` or `broker_career_claims`. All six A-023 tables and three
functions are applied and live in the ScoutIT project since W-003 was cleared on
2026-08-27. The canonical schema document therefore describes a database that no
longer matches production.

**Why it matters more than tidiness.** AGENTS.md instructs every agent to read
the Data Dictionary before modifying data structures. An agent that obeys that
instruction today will conclude these tables do not exist, and the failure mode
is inventing a parallel store for data that already has one — precisely the
mistake A-023 phase 5 avoided only by reading the live database rather than the
documents.

**Acceptance.**
- All six tables documented with columns, types, nullability and constraints
  **read from `information_schema`, not from the migration files** (Rule 20 —
  migration text is a claim, the live schema is the fact).
- The `source` column on `broker_metric_snapshots` is documented with its
  purpose: it is what stops seeded demo figures being laundered into computed
  ones, and its absence on `broker_recommendations` and `broker_contributions`
  is recorded as a known gap rather than left to be rediscovered.
- The RLS posture is stated: enabled with zero policies, revoked from
  anon/authenticated, granted only to `service_role`.
- The three `SECURITY DEFINER` functions are named with their `search_path`
  pinning, per Rule 8.
- Dual-CMS boundary restated for this domain: identity is Airtable, every
  computed figure and every consented submission is Supabase.

**Boundary.** Documentation only. No schema change, no data change, no code.

## A-044 — Staff need a way to review and close a dispute

**Opened 2026-08-27.** Direct consequence of A-041 and the next link in that
chain.

**Why it exists.** A-041 lets a party file a dispute, and filing places the hold
that stops the conversation being wiped. Nothing moves a dispute out of that
state. So a held thread stays held indefinitely, and holds accumulate.

That is the safe direction to fail — evidence is kept rather than destroyed —
but it is not the finished behaviour. Retention is a promise ScoutIt publishes,
and a hold that never lifts quietly turns a seven-day promise into forever for
that thread.

**What is needed.**
- A staff queue of open disputes: who filed, against which deal, on what
  ground, when the hold was placed, how long it has been open.
- Move a dispute through its states and resolve it. Resolution lifts the hold
  and the thread becomes purgeable again on the normal schedule.
- Staff-only, resolved server-side, never accepted from the client.
- Every transition audited: who, when, outcome, reason.
- An ageing view. A hold open for months is either a real case nobody is
  working or an abandoned one keeping a conversation alive past its promise —
  both need to be visible rather than discovered.
- The four states on any new surface.

**Boundary.** Review and resolution only. The AI assistance for adjudication is
[[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|A-042]] and stays trigger-gated on
counsel. This task is the human workflow that A-042 would later assist.

## Where the owner's "list of 10" stands

The ten items raised on 2026-08-23 as the ones that actually matter at this size:

| # | Item | State |
|---:|---|---|
| 1 | IAM / authorization | Owner-parked. The security overhaul is one deliberate pass, not a drive-by. |
| 2 | Monitoring / alerting | Code complete (Sentry wired, `/api/health` exists). DSN + alert rules are owner/ops state in L-001. |
| 3 | Rate limiting | Done — A-012. |
| 4 | Caching | Already correct — `cmsCache.js` + Upstash. No task was needed. |
| 5 | Timeouts & retries | Done — A-013. |
| 6 | Secrets management | Done — A-015. |
| 7 | XSS / input validation | Done — U-008, U-009, U-010. |
| 8 | Idempotency | Client half done — A-016, A-017. Durable server half is migration-gated in [[WAITING|W-003]]. |
| 9 | Migrations / schema versioning | Owner-gated — [[WAITING|W-003]]. |
| 10 | Cold starts / serverless limits | Knowledge, not work. Nothing to build at 13 properties. |

Everything still open on that list is behind an owner gate rather than behind
engineering effort. **Do not promote 1, 9, or the server half of 8 without the
owner's explicit go-ahead** — they need migrations or the parked security pass.

## A-047 — CRM and calendar logic rebuild (slot engine + typed records)

**Opened 2026-08-29 on owner direction**, after a study of two open-source
references the owner named: `twentyhq/twenty` (CRM record model) and
`calcom/cal.diy` (scheduling). Neither is portable code — Twenty is NestJS +
Prisma, cal.diy is a tRPC monorepo — so what was taken is the *model*, rebuilt
on ScoutIt's Supabase tables.

### The defects this closes, each verified in code before the work started

1. **The buyer's time picker was mock data.** `BookingModal.js` carried
   `// Mock available times for the demo` and four hardcoded strings. It never
   read `/api/availability`. A host's saved hours had no effect on anything a
   buyer could book.
2. **Bookings were made in the wrong timezone.** `new Date("2026-09-01 2:00 PM")`
   is a non-standard string parsed in the BROWSER's zone, so a buyer abroad
   booked a different real instant than the label they clicked.
3. **Two booking endpoints with different rules.** `/api/deals/[id]/schedule`
   was buyer-only and blocked closed deals; `POST /api/viewing-appointments`
   allowed any party, never checked deal status, and validated `scheduledAt` as
   a bare `z.string()`. The second was a way around the first's guardrails.
4. **No endpoint validated the requested time at all.** Any timestamp was
   accepted: 3am, a day marked unavailable, a slot already taken.
5. **Saving weekly hours erased date overrides.** The panel POSTed only
   `weekly_schedule`; the route upserted `date_overrides: date_overrides || {}`
   and `timezone: timezone || 'Asia/Manila'`. Every save wiped both.
6. **`/api/availability?userId=` disclosed any host's schedule.** It returned a
   stranger's pending and confirmed appointment times to any signed-in caller.
7. **Viewings had no duration**, so overlap could not be detected and a viewing
   could not block calendar time.
8. **`calendar_events` never counted as busy** — a Google-synced event could be
   double-booked over.
9. **The merged activity feed could not paginate.** Two 50-row queries sliced to
   50 meant a user with busy properties never saw their deal activity, on any page.
10. **Tasks were a boolean.** No status, priority, assignee, or property link.

### What was built

**Calendar.** `lib/calendar/timezone.js` (IANA conversion, no dependency) and
`lib/calendar/slots.js` — the pure slot engine, the single definition of "is
that time bookable": weekly schedule ∩ date overrides − busy − buffers −
minimum notice − daily cap. `lib/calendar/availabilityService.js` does the I/O;
`lib/viewings/bookingService.js` is now the one booking path both endpoints
call. `GET /api/deals/[id]/slots` is what the picker reads, and the server
re-derives the same list before writing, so picker and gate cannot drift.

**CRM.** `lib/crm/activityRegistry.js` (typed timeline activities, lucide icon
names rather than emoji, unknown types degrade visibly) and
`lib/crm/taskModel.js` (statuses, priorities, validation, ordering, overdue).
The activity feed now uses a keyset cursor over one ordered query.

### Verification performed

- 63 new unit tests (40 slot engine incl. DST and the 3am case, 23 CRM model).
- Full suite **2027/2027 passing**, 199 files.
- `npm run lint` clean; `npm run build` clean, `/api/deals/[id]/slots` registered.
- `verify:surfaces` passed (3 surfaces, none touched); `audit:typography` passed.
- `test:e2e:list` parses, 578 tests in 32 files.

### Second pass, same day — defects found while wiring the first

**11. `rescheduleViewingMeet` had zero callers.** It sat in
`lib/calendar/meetLink.js` fully written and never invoked, so a viewing could
only be cancelled and rebooked — losing the Meet room both parties already had
and breaking the thread back to the original request. This is Rule 13 again: a
function with no caller is not a feature, it is a plan. The graph even carried a
planned `e_exc_viewing_noshow_to_reschedule_modal_149` edge for a modal that was
never built.

`PATCH /api/viewing-appointments/[id]` now takes a second shape,
`{ scheduledAt, durationMinutes }`, which runs the SAME availability gate a
first booking does — with the appointment itself excluded from the busy set, so
a viewing is never treated as blocking its own move. A rescheduled viewing
returns to `pending`: the host agreed to a specific time, and a new time needs a
new acceptance. Either party may propose; only the host confirms.

**12. The calendar drew every viewing as exactly one hour.** `CalendarShell`
added a flat `VIEWING_DURATION_MS` to every appointment, so once viewings could
be 30 or 90 minutes the block on the calendar would disagree with the booking.
It now reads the stored `endsAt`, falling back to the flat hour only for rows
written before viewings carried a duration. `AppointmentsSheet` shows the real
range rather than a bare start time.

**13. The master flow map did not know about the reschedule edge.** Adding
`confirmed -> pending` to `WORKFLOW_STATE_MACHINES` broke
`masterGraphValidation.test.js`, which pins the transition counts — correctly,
because the visual graph had no matching edge. Fixed properly rather than by
loosening the assertion: the edge was added to `src/data/masterFlowGraphData.js`
and the bundle regenerated with `node scripts/generateFlowBundle.mjs`
(now 128 nodes / 247 edges, schema valid, trust score 92.5%). The registry, the
route, and the visual map now agree.

**Note for whoever commits this.** The new edge's evidence carries
`"commitSha": "PENDING_A047"` because the code it points at is not committed
yet. Replace it with the real sha and regenerate the bundle at commit time.

### Regression cover added

Two suites now guard the fixes rather than trusting them:

- `src/lib/__tests__/viewingBookingGate.test.js` — 31 tests against
  `bookViewing` with a fake service client: party checks, every open and closed
  deal status, 3am, a closed day, a blocked override date, a taken slot, a
  synced calendar event, buffers, minimum notice, past times, unparseable input,
  and proof that a rejected booking writes NOTHING.
- `src/lib/__tests__/availabilityApi.test.js` — 18 tests on the route itself:
  that a weekly-hours save no longer erases date overrides or resets the
  timezone, that the response no longer discloses appointment times, and that
  reading another user's schedule is refused.

### Verification after the second pass

- Full suite **2076/2076 passing**, 201 files (63 + 49 new).
- `npm run lint` clean; `npm run build` clean.
- `verify:surfaces` passed (3 surfaces, none touched); `audit:typography` passed.
- `test:e2e:list` parses, 578 tests in 32 files.

### Third pass, same day — integration hardening review

The owner asked for a fresh end-to-end check against the current Cal.diy and
Twenty reference systems. The architecture remains correct: ScoutIt ports the
models into its own Next.js/Supabase boundary rather than installing either
monolith. The review found and fixed six gaps outside the earlier test set:

14. **Slot inputs could drift from booking inputs.** Impossible/reversed dates,
    fractional or >480-minute durations, closed deals, invalid guest timezones,
    and DST-gap wall times are now rejected consistently. The response reports
    the exact duration used by the engine. Daily booking caps count viewings,
    not unrelated personal calendar events.
15. **Calendar failures could look like free time.** A failed
    `calendar_events` busy read now fails closed with a retryable 503 instead of
    allowing a possible double-booking. Google REST calls have bounded
    timeouts/retries, inbound sync walks every result page, and failed Supabase
    writes stop the sync instead of incrementing a false success count.
16. **Two simultaneous requests could both pass the read-before-write gate.**
    The pending migration now adds a database GiST exclusion constraint over
    active host time ranges. A `23P01` race is returned as a normal 409
    slot-taken response.
17. **Failed Google cleanup discarded its own recovery key.** A failed
    reschedule/cancel now retains `google_event_id`; a Meet event whose
    identifiers cannot be stored is immediately cleaned up best-effort.
18. **The migration had hidden cross-system regressions.** Retyping
    `viewing_appointments.property_id` would have broken
    `generate_monthly_scout_wrap` again, and the legacy
    `Public can read availability` RLS policy remained underneath the private
    API. The migration now updates the RPC, removes that public policy, makes
    its FK repairable after a partial run, aligns SQL limits with the API, and
    makes Google event ids unique per owner.
19. **CRM ownership and assignment were incomplete.** The merged timeline now
    includes deals reached through property ownership even when an activity row
    has no `property_id`. Explicit assignees must be auth UUIDs and
    cross-account assignment/reassignment is limited to parties on the linked
    deal. Malformed filters and cursor limits are rejected before Postgres.

### Verification after the third-pass changes

- 111/111 focused calendar/booking/CRM tests pass across 6 files.
- `npm run verify` passes end to end: 3/3 owner-approved surface locks,
  repository ESLint, the 503-file typography audit, and 2093/2093 unit tests
  across 204 files.
- The Playwright collection parses successfully: 578 tests in 32 files.
- `npm run build` completes cleanly under Next.js 16.3, produces 125 static
  pages, and registers the deal-slot, viewing, CRM, and calendar API routes.
- `git diff --check` is clean for every file changed by this third pass.
- This machine has neither the Supabase CLI nor `psql`, so the owner-gated SQL
  was reviewed statically against the canonical PostgreSQL/Supabase exclusion-
  constraint pattern but has not been executed against a local Postgres clone.

### Fourth pass, same day — owner-directed Inbox and CRM curation

The owner explicitly extended A-047 to the connected workspace surfaces:
Inbox, ChatBox live scheduling, CRM, and Calendar. This is one lifecycle rather
than four adjacent screens. The appointment row is authoritative; ChatBox
cards, the CRM schedule, the Calendar view, and the deal timeline must all
render or mutate that same record.

The pre-edit trace found a concrete break in that contract: ChatBox's
`Accept Viewing` and reschedule controls only posted `[SYSTEM]` messages. They
never PATCHed `viewing_appointments`, so the conversation could say confirmed
while CRM and Calendar still showed pending, and a manually typed reschedule
could bypass the live slot picker completely.

This pass is accepted only when:

- Inbox and CRM share a ScoutIt workspace navigation language and use the
  canonical dark/gold tokens, mono control labels, restrained depth, and
  reduced-motion behavior;
- ChatBox loads the deal's real current appointment, books and reschedules
  through live host slots, and confirms/cancels through the appointment API;
- successful appointment mutations reconcile ChatBox immediately and remain
  visible from CRM, Calendar, and the typed deal timeline without a second
  source of truth;
- the mobile Calendar defaults to the legible Agenda view when no explicit URL
  view was requested; and
- focused connection/design contracts, full verification, production build,
  and the owner surface-lock gate pass before the work is reported complete.

### Migration applied 2026-08-29 — this boundary is CLEARED

**`20260829000001_crm_calendar_logic_v2.sql` is now live**, applied on explicit
owner approval. Two defects in the reviewed SQL only appeared against a real
PostgreSQL 17 server; both were fixed and the file updated to match what ran:

1. **`ends_at` could not be a generated column.** PostgreSQL rejected
   `GENERATED ALWAYS AS (scheduled_at + make_interval(mins => duration_minutes))`
   with `42P17 generation expression is not immutable` — `timestamptz + interval`
   is STABLE, not IMMUTABLE, because month/day intervals depend on the session
   TimeZone. An epoch round-trip was tried and rejected identically. It is now a
   plain column maintained by a BEFORE INSERT OR UPDATE trigger, which preserves
   the guarantee that matters (the app cannot store an end time disagreeing with
   its own start and duration) and still runs before constraint evaluation.
2. **`btree_gist` was not installed on this project**, so the exclusion
   constraint's `host_id WITH =` half had no uuid gist operator class. The
   extension is now installed in `extensions` with `SET LOCAL search_path`
   making the opclass resolvable at DDL time.

The first attempt failed atomically and changed nothing — verified before
retrying.

**Live post-checks.** All the new columns exist; `viewing_appointments.property_id`
and `crm_tasks.property_id` are now `uuid`. Behaviour was proven in a
self-rolling-back transaction against the real database: a 14:00 +08 booking of
90 minutes produced `ends_at` 15:30 +08 (trigger correct); a second overlapping
active booking for the same host raised `exclusion_violation` (race guard
correct); and an application audit action inserted successfully (A-046 closed).
All six tables are back to zero rows.

### Remaining boundary

**The former blocker was the migration; it is gone.** Nothing is committed and nothing is pushed. The
code paths now match the live schema, but no booking has been made through the
real UI yet — the first end-to-end booking is still the true test.

## Deployment state

GitHub and production are confirmed current through the 2026-08-24 release; the
follow-up action record is at `a35237d`. The live API and its Supabase/Airtable
dependencies reported healthy. The completed production audit routed U-011,
A-024 through A-027, O-011, F-006, and L-001 without duplicating their authority.

---

## Not in this queue, on purpose

- **Component render tests.** This repo writes JSX in `.js` files, which the
  Vite/Rolldown pipeline vitest runs on will not parse. No component can be
  render-tested today. Fixing it means changing build configuration or renaming
  files repo-wide; A-016 used source assertions instead and recorded the limit.
- **A distributed rate limiter.** `rateLimit.js` is per-instance and says so.
- **The 114 Supabase advisor lints** stay in [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]] §3.
- **`src/lib/isochrone.js`.** Bounded by its own AbortController; a test pins
  this so it stops being re-proposed as an A-013-style defect.
