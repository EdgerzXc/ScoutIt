---
section: "08_OPERATIONS_AND_BACKLOG/ACTION/INBOX"
status: unverified
tags: [inbox, mobile, owner-journey, non-executable]
updated: 2026-08-22
related: ["[[00_MASTER_ACTION_PLAN]]", "[[RULES]]"]
---

# The owner's create-listing control may be hidden on mobile once they have a listing

> **Not executable.** Read from source while closing A-005. Not yet confirmed in
> a browser at a real phone width.

## What the source shows

`src/components/dashboard/OwnerMode.js` has three create-listing triggers:

| Line | Label | Classes |
|---|---|---|
| ~715 | `Add Property →` | always visible — inside the zero-listings panel |
| ~790 | `+ New Property File` | `hidden md:inline-block` |
| ~899 | `+ New Property` | `hidden md:inline-block` |

The zero-listings CTA is fine. But both controls that appear **once the owner
has at least one listing** are hidden below the `md` breakpoint (768px). If no
other affordance exists at phone width, an owner with one listing cannot add a
second one from their phone.

## Why it may matter

Mobile-first is the project instruction, and the owner journey is the current
vertical slice. A create path that exists only on desktop would be a silent
funnel break rather than a visible bug.

## What must be checked before promoting

1. Open `/dashboard` as an owner **with at least one listing** at 390px and
   confirm whether any create affordance is reachable (bottom nav, FAB, a menu
   entry, or the wizard opening from elsewhere).
2. If none exists, decide the mobile affordance before writing code — this is
   UI design work, not a class-name change.
3. Related: the filtered-list empty state renders "No properties match your
   search." even when nothing was searched, which the four-states rule in
   [[RULES]] would call an empty state without an action.
