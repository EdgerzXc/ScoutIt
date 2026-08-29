---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: locked
tags: [rules, standards, frontend, lessons, binding]
updated: 2026-08-27
related:
  - "[[../00_START_HERE]]"
  - "[[00_MASTER_ACTION_PLAN]]"
---

# 4 · RULES — binding, not advisory

Standards consulted together for architecture, frontend, and action control:

- **Part A — the 25 standing rules.** Each one cost a real bug.
- **Part B — the frontend standard.** A gate any screen must clear before it ships.
- **Part C — the action documentation lifecycle.** Mandatory transaction rules for tasks.
- **Part D — direct Codex execution.** The active single-agent execution rule.

> Merged 2026-08-13 from `05_STANDING_RULES.md` and `02_FRONTEND_STANDARD.md`; Part D revised 2026-08-23 after the owner retired the Antigravity workflow.
> Rule numbers are **never reused** — a reference to "Rule 6" is unambiguous
> forever. There is no Rule 2ʹ, and two rules share 14 (a historical slip kept
> deliberately; renumbering would silently invalidate every existing reference).

---

# PART A — THE 25 STANDING RULES

## Truth and evidence

**1.** A checklist tick must name the **behaviour it guarantees**, not the file it created.

**2.** **Check the database, not the layer that describes it.** The API response and the spec agreed with each other and both were wrong.

**3.** **Never render a number you cannot source.** Omit it. A fabricated figure is worse than a blank.

**12.** A number repeated across a document **acquires authority it never earned**. "40 real users" appeared in five sections, all copied, none true.

**13.** **An endpoint with no caller is not a feature, it is a plan.** Name the screen a user touches. If there isn't one, the status is "backend ready" — never "done".

## Gates and security

**5.** **A gate the client evaluates is a suggestion.** If data reaches the browser it is public.

**6.** **A boolean gate written as a negative check fails open.** `!== bad` passes everything unexpected; `=== good` passes only what you meant.

**7.** **A schema default must never manufacture a claim.** Defaulting `adult_eligibility_status` would have recorded a legal attestation nobody made.

**8.** **Any new `SECURITY DEFINER` function must REVOKE EXECUTE from PUBLIC/anon/authenticated in the same migration that creates it.** Postgres' default grant is the trap.

**14.** **A NULL is never an assertion.** A listing with no declared relationship is *claimable, not owned.* Silence is not consent.

## Product boundaries

**9.** **A tier buys DATA about a PROPERTY, never access to a PERSON.** Identity is gated by an *act* — acceptance, then handshake — never by a subscription.

**10.** **Never gate a privacy control behind a tier.** Defaults may differ by tier; access never may.

## Mechanics

**4.** An exact-match filter on a status string **fails by showing nothing, and showing nothing looks exactly like having nothing.**

**11.** **Time-dependent logic must be tested against a fixed instant.** Never mutate the last character of a base64 value to simulate tampering — it is partially padding.

**14.** **When a change invalidates a test, the test is part of the change.** Re-aim it in the same commit. Never delete it — a removed assertion protects nothing.

**15.** **Before building a UI on an endpoint that has never been called, RUN IT.** Three of four backends built on in one session were broken, and every failure was silent.

**16.** **A fixture invented by the same person who wrote the query tests the assumption, not the code.** Build DB fixtures from the REAL schema.

**18.** **Audit what a query WRITES, not only what it reads.** Audit/telemetry writes are wrapped in `try {} catch {}` by design, so a rejected write is invisible *by design*. Reads found 1 bug; writes found 6.

**19.** **A database mock must reject what the database would reject** — then **watch the guard fail** by re-introducing the bug. A regression test nobody has seen go red is a test nobody knows works.

**20.** **`information_schema` is a test fixture.** Assert column lists against the live schema, not a document or a mock. Cheap enough to run every session.

**21.** **A feature that produces data must have a named consumer, and one that consumes data must have a named producer.** Check the direction that is missing — it is never the one you are looking at.

**22.** **Never render content attributed to a real institution that the institution did not publish.** A fabricated PSE filing about a real listed company is a securities problem, not a content problem. If demo atmosphere is needed, invent the institution too.

**23.** **A render fallback must never return a non-primitive.** `{field.label || field}` guards `undefined` and crashes on `""`. Return a string or return nothing.

**24.** **A CSS custom property holding colour channels has a syntax contract.** `rgb(var(--x) / <alpha>)` needs `12 34 56`; `rgba(var(--x), .4)` needs `12, 34, 56`. Mixing them yields no error and no colour. Name them `-ch` (space) and `-rgb` (comma).

**25.** **`filter` on an ancestor breaks every `position: fixed` descendant.** A `filter: invert()` light mode cost 54 broken fixed elements. Theming by filter is a layout change wearing a colour costume.

---

# PART B — FRONTEND STANDARD

> Every UI item must pass this before it closes. Not a style guide to consult —
> a gate to clear. ScoutIt is not selling listings, it is selling **judgement**,
> and judgement is read off the interface before a single word is.

## Load before writing a component

Skills reach this repo by two different mechanisms, and confusing them is how
this section came to name two files that do not exist. Check which kind you are
reaching for.

**1 — Invocable skills.** Loaded by name through the Skill tool. Nothing is
cloned and nothing lives in this repo. For frontend work:
`ui-ux-pro-max`, `emil-design-eng`, `impeccable`, `frontend-design`,
`design-taste-frontend`, `apple-design`, and for motion specifically
`animate`, `improve-animations`, `find-animation-opportunities`.

**2 — Reference skills on disk.** Files under `.agents/skills/`, read like any
other file. `taste-skill` is the one Part B depends on that exists only here.

Load them. Do not paraphrase from memory.

> **Corrected 2026-08-27.** This section previously ordered every component
> author to load `make-interfaces-feel-better` and `motion-ui`. **Neither has
> ever existed**, under that name or any other, in `.agents/skills/` or as an
> invocable skill. A binding rule pointed at two missing files, so the only way
> to comply was to ignore it. Motion guidance now names skills that resolve.

### The Anthropic skills are already available — do not install them

`github.com/anthropics/skills` is **not** installed on this machine and must not
be. Verified 2026-08-27: no registered marketplace points at that repository,
`installed_plugins.json` holds five plugins and none is it, and no matching
directory exists on disk.

It is unnecessary. Those skills ship with Claude Code and are invocable now
under the `anthropic-skills:` namespace — `docx`, `pdf`, `pptx`, `xlsx`,
`canvas-design`, `skill-creator`, `mcp-builder`, `web-artifacts-builder`.

**Cloning the repo would make things worse, not better.** A local copy is a
fork frozen at the moment it was taken: it never updates, and it shadows the
maintained version with a stale one. The failure is silent — the skill still
loads, it is simply older than the one it replaced.

Two are directly load-bearing for ScoutIt rather than incidental:

| Skill | Where it already applies |
|---|---|
| `pdf` | The owner-PDF-to-listing path, which AGENTS.md section 2.4 singles out as the one draft that must be verified against its source document before publication |
| `docx` / `pptx` / `xlsx` | Any owner-facing export; the broker briefing print layout in W-004's acceptance pass is the nearest live surface |

Reach for these before hand-rolling document parsing or generation. Hand-rolled
PDF handling is how the DOMPurify/jsdom class of failure gets reintroduced.

**"Impeccable" is not a skill file — it is the bar.** Nothing ships that you
would not screenshot and post. If you would caveat it, it is not done.

## Mobile first is the project instruction, not a breakpoint

Write the 390px layout first. Widen after. Never design at 1440 and squeeze.

| Rule | Why |
|---|---|
| **`100dvh`, never `100vh`** | iOS Safari's toolbar makes `vh` lie. Reintroducing it reopens a closed bug |
| **Hit areas ≥ 44 × 44px** | A missed Decline button is a support ticket |
| **Primary action thumb-reachable** | Bottom third on mobile, not top-right |
| **No hover-only affordance** | It does not exist on a phone |
| **Test at 390×844 and 360×640** | iPhone, and the cheapest Android that matters in PH |
| **Tables become cards under 768px** | A horizontally-scrolling table is a table nobody reads |
| **Bandwidth is a design constraint** | PH mobile data is metered |

## The dials, set for ScoutIt

```
DESIGN_VARIANCE: 6      # composed, confident
MOTION_INTENSITY: 4     # motion clarifies state; it never performs
VISUAL_DENSITY: 5       # this is an instrument — information earns its space
```

Marketing surfaces only may move to `8 / 6 / 4`. Dashboard, inbox, property
pages and admin never do.

## Design DNA — non-negotiable

Source of truth is `DESIGN.md` at the repo root.

| Token | Value |
|---|---|
| Background | `#0d0d0d` / `#0e0e0e` — ~95% of every screen |
| Surface | `#161616` → `#1e1e1e` → `#242424` (elevation by surface, not shadow) |
| **Spatial Gold** | `#E8AE3C` / bright `#F7C64E` — **~5% maximum** |
| Muted gold | `#6E531A` — borders, dividers |
| Text | `#f0ede8` / secondary `#c8c8c8` — never pure white on near-black |
| Signals | green `#4caf7d` · amber `#e8c84a` · red `#e8644a` — status only, never decoration |
| Body type | 16px minimum on mobile — iOS zooms inputs below 16px |

**The 95/5 rule is the whole identity.** If a screen has two gold buttons, one is wrong.

**Anti-slop — do not ship:** AI-purple gradients · centered hero on a dark mesh ·
three equal feature cards · glassmorphism on everything · infinite-loop
micro-animations · Inter + slate-900 · emoji as production iconography · a
spinner where a skeleton belongs · drop shadows doing a border's job.

## Motion

**First question: should this animate at all?**

| Seen how often | Decision |
|---|---|
| 100+ times/day (tab switch) | **No animation. Ever.** |
| Several times a session (modal, toast) | Yes — 150–250ms `ease-out` |
| Rare / consequential (Connect spent, listing published) | Yes — the one place motion may be felt |

Never `transition: all`. Nothing appears from nothing (`scale(0.95)`, not `scale(0)`).
`ease-out` for entrances. Every button gets `:active`. Respect `prefers-reduced-motion`.

## The four states nobody builds

Every data-driven surface ships **all four** or it is not done: **loading**
(skeleton matching the real layout, not a spinner) · **empty** (says what goes
here + one action, never "No data found") · **error** (says what failed and what
to do, never a raw status code) · **success**.

## Pre-flight — tick before closing any UI item

```
[ ] Design read declared in one line before coding
[ ] Built at 390px first, then widened
[ ] Checked at 360 / 390 / 768 / 1280
[ ] dvh not vh · no horizontal scroll at any width
[ ] All tap targets >= 44px · primary action thumb-reachable
[ ] Gold used once, on the single most important action
[ ] Loading / empty / error / success all implemented
[ ] No unsourced numbers rendered
[ ] Motion: named properties, ease-out, :active, reduced-motion honoured
[ ] Keyboard: tab order sane, focus visible, Esc closes overlays
[ ] Contrast >= 4.5:1 on body text (gold on black — verify, do not assume)
[ ] Images have dimensions + lazy loading
[ ] Opened in a real browser on a real phone — not just in tests
[ ] Nothing on the anti-slop list
```

> 📌 **A feature is not done when it works. It is done when someone can find it,
> use it on a phone, and not notice the interface at all.**

⚠️ **Measuring contrast:** inject `* { transition: none !important; animation:
none !important; }` first. In a background tab Chrome does not tick transitions,
so any element with `transition: color` returns its frozen pre-toggle value —
this produced 9 phantom failures on `/settings`.

---

# PART C — ACTION DOCUMENTATION LIFECYCLE

## The documentation transaction

Every piece of work is one transaction with two inseparable outputs:

1. the verified product, data, operational, or documentation change; and
2. the truthful action-control update that records where the task now stands.

If either output is missing, the task is not finished. This applies to every
agent, every turn, and every file under this repository—not only large features.

## Before work starts

1. Open [[00_MASTER_ACTION_PLAN|the Master Action Plan]].
2. Verify the claimed need against current code, tests, or connected live state.
3. Find the task's stable ID and confirm it appears in exactly one authorized
   queue: Urgent, Active, Waiting, Owner Actions, or Future.
4. If the finding is new or uncertain, record it in the Inbox. Inbox items are
   research inputs only and cannot assign implementation work.
5. If the finding is proven and ready, promote it into exactly one live queue
   before implementation begins.

## While work is happening

- Keep the same task ID from discovery through closure.
- Never copy a task into a second queue. A move removes the former entry in the
  same documentation change.
- If scope materially changes, update the task's acceptance boundary before
  expanding the implementation.
- Specifications describe intended behavior. They do not act as competing task
  lists and should not contain executable unchecked checkboxes.
- A newly discovered issue gets a new Inbox entry unless it is immediately
  verified and deliberately promoted.
- An owner-approved surface remains locked. Record explicit owner authorization
  on the task before editing that surface; never refresh a checksum as cleanup.

## Before the turn ends

Every touched task must have one truthful disposition:

| State at handoff | Required documentation action |
|---|---|
| Still being implemented | Update its current queue entry with the latest verified state and next exit test. |
| Technically blocked | Move it to Waiting and name the exact unblock condition. |
| Needs owner action or judgment | Move it to Master Owner Actions and state the one decision/action required. |
| Deliberately deferred | Move it to Future with its trigger; Future does not authorize a build. |
| Completed | Remove it from every live queue and add one concise evidence row to the current monthly Done file. |
| Newly noticed but unverified | Put it in the Inbox, clearly marked unverified. |

If the work changed behavior, architecture, schema, operations, or a user flow,
update the matching canonical `_SCOUTIT_BRAIN/` document in the same turn.

## Evidence required to say Done

A Done row must include:

- the behavior or guarantee now delivered;
- the verification performed: test, build, read-back, browser/device check, or
  connected live-system evidence as appropriate;
- a commit or deployment reference when one exists; and
- the remaining boundary, follow-up, or explicit statement that none remains.

Creating a file, drafting a plan, or reporting that code was edited is not proof
of completion. Do not close work whose acceptance condition was not checked.

## Sources that cannot assign work

Do not execute directly from archived ledgers, handoffs, implementation records,
specifications, comments, audit notes, or historical unchecked checkboxes. These
are evidence and context only. Re-verify and promote the item through the Master
Action Plan first. Do not edit a stale legacy ledger except to add provenance or
a pointer to its canonical replacement.

## Queue hygiene

- One item, one ID, one home.
- Never leave a completed item in a live queue.
- Never record the same completion in multiple Done files.
- Respect every queue limit shown in the Master Action Plan.
- If a queue reaches its limit, consolidate duplicates and split it by product
  domain before accepting more items.

---

# PART D — DIRECT CODEX EXECUTION

The Action queues in `08_OPERATIONS_AND_BACKLOG/ACTION/` are the **sole backlog**
and execution authority. Codex works directly from one authorized item at a time;
the retired agent workspace and its reports are historical evidence only.

1. Re-check the queue item's claimed need against current code or connected live state.
2. Preserve unrelated working-tree changes and implement only the bounded item.
3. Run verification proportional to risk, including a failure-path proof when a guard is material.
4. Update the same task's queue disposition and canonical documentation in the same turn.
5. Never claim independent review when Codex authored the change; report the actual self-verification performed.

No queue item by itself authorizes commits, pushes, deployments, live database
migrations, data mutations, DNS/credential changes, or approved-surface checksum
updates. Those actions still require their exact owner gate.
