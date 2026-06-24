# ScoutIT — Option 3: Shared Services & Data Sync (Backend Hardening) — Architecture Plan

> Drafted 2026-06-24 from the running code (`lib/airtable.js`, `api/dashboard/publish`, `api/dashboard/invite`).
> Pairs with `SUPABASE_AUTH_INTEGRATION_PLAN.md`. **Plan only — no code changes without owner approval.**
> Headline: Option 3 **cannot be truly "un-spoofable" until real Auth exists.** See §1.

---

## 0. What's already built (good news)
- **Sync engine exists:** `POST /api/dashboard/publish` → reads the Supabase `properties` row → sets
  `pipeline_status='approved'` → calls `insertProperty()` to push it to Airtable `PROPERTIES_CMS`.
- **Connects ledger exists server-side:** `POST /api/dashboard/invite` → checks `connect_balances` →
  inserts a `deals` row → writes a `connect_transactions` record → decrements balance (with a manual
  deal-rollback if the tx insert fails).
- **Airtable bridge is rich:** `reverseMapCategoryFields()` maps all 6 category field groups
  (CM/RS/STR/RST/HOSP/VEN) + embedded units (`Units_JSON`).

So Option 3 is **hardening + fixing**, not building from zero.

---

## 1. ⚠️ THE BLOCKER — identity is currently spoofable (Council: this reframes Option 3)

Both the sync route and the Connects route take **`userId` from the request body**:
```
const { submissionId, userId } = await request.json();   // publish
const { listingId, brokerName, userId } = await request.json();  // invite
```
The server then "verifies ownership" with `owner_id !== userId`. **But the client supplies `userId`** —
so anyone can POST any id and publish/spend as someone else. The deliverable *"server-side validated so
it cannot be spoofed"* is **not achievable while identity is a body field.**

**Council ruling (Founder + security lens):** real server-trust requires identity derived from a
**verified Supabase Auth session (JWT)**, read server-side via `supabase.auth.getUser(jwt)` — never from
the body. Therefore **Auth (the other plan) is a prerequisite for the "secure" half of Option 3.** The two
plans merge into one ordered backend program (§5).

Corollary: once **RLS is hardened**, these API routes (which carry no user session today) will be
**blocked by RLS** unless they use a **service-role client**. There is currently no service-role client.

---

## 2. Bugs found in the current sync engine (fix regardless of auth)

| # | Bug | Effect | Fix |
|---|---|---|---|
| B1 | `insertProperty()` **never writes `Slug`** to Airtable (it computes a `slug` var, then omits it from `fields`). | `fetchProperties()` filters out any record missing `Slug` → **published properties never appear publicly.** | Add `Slug: slug` (+ City, Photos, price fields) to the insert payload. |
| B2 | Publish **always INSERTs** a new Airtable record. | Re-publishing the same listing creates **duplicate** public records. | Upsert: look up by `Slug` (like `updateProperty` does) → PATCH if exists, else INSERT. |
| B3 | Publish auto-sets `Approved_For_ScoutIt: true`. | Owner self-publish goes **straight live, bypassing the admin gate** the Bible/`/api/admin/approve` describe. | Decide policy (see §4-D): admin-gated vs owner-auto-live. |
| B4 | No transaction: Supabase set to `approved` first; if Airtable insert throws, status is already approved but not public. | Drift between "published" state and reality. | Set Supabase `approved` **only after** Airtable success, or add a reconcile/retry queue. |
| B5 | Server routes import the **anon** `supabaseClient`. | Works only because RLS is dev-open; breaks the moment RLS hardens. | Add a server-only **service-role** client (§3). |

---

## 3. Target architecture

**3a. Service-role client (new `lib/supabaseAdmin.js`, server-only).**
- Uses `SUPABASE_SERVICE_ROLE_KEY` (server env, **never** `NEXT_PUBLIC_`, never shipped to client).
- All `/api/**` routes that write privileged data use this client → they keep working after RLS hardens.

**3b. Identity from the session, not the body.**
- Routes read the Auth JWT (cookie/header), call `getUser()`, derive the real `userId`.
- Body `userId` is ignored/removed. Ownership checks become trustworthy.

**3c. Connects = one atomic Postgres RPC** (`spend_connects(p_user, p_amount, p_reason, p_ref_type, p_ref_id)`).
- Inside a single transaction: re-check balance → insert `connect_transactions` → decrement `connect_balances`
  → return new balance (or raise on insufficient funds). No partial states, no client-side trust.
- Called by the service-role client from the route. (Matches the RLS file's note: "Connects MUST go via
  Edge Functions using the Service Role key.")

**3d. Sync engine = idempotent upsert + complete field map + Slug fix (B1/B2), Supabase-approved-after-Airtable-success (B4).**

**3e. RLS hardening LAST**, per-table, verified, dev-open kept as rollback (same as the Auth plan's Phase 6).

---

## 4. Decisions the owner needs to make
- **A. Auth-first?** Confirm we wire real Supabase Auth before/with Option 3 (Council says yes — otherwise
  "secure" is cosmetic). Alternative: ship Option 3 now as *functional but not yet secure*, harden after auth.
- **B. Service-role key:** OK to add `SUPABASE_SERVICE_ROLE_KEY` to Vercel (server-only, sensitive)?
- **C. Email confirmation on signup?** (carried from the Auth plan.)
- **D. Publish gate:** owner Publish → **straight live**, or → **admin review queue** then live? (B3.)

---

## 5. Merged sequence (Auth + Option 3 as one ordered program)
1. **Auth foundation** (Auth plan Phase 1–2): real session + `auth.uid()`.
2. **Service-role client** (`lib/supabaseAdmin.js`) + route refactor to read identity from JWT (3a/3b).
3. **Fix the sync engine** B1/B2/B4 + complete field map (3d) — verify a draft actually appears publicly.
4. **Atomic Connects RPC** (3c); point `invite`/spend routes at it.
5. **Wishlist hybrid sync** (Auth plan Phase 4) + protected routes (Phase 5).
6. **RLS hardening LAST**, per-table, verified, rollback ready (3e).
7. **Pre-launch:** remove demo login + dev-open fallback (separate gated step).

Each step: smallest change, verify (e2e + live round-trip), nothing to `main` without owner sign-off.

---

## 6. Invariants honored
Dual-CMS (Airtable public untouched as a *read* surface) · Ledger never gated · Connects only via
service-role/RPC · `NEXT_PUBLIC_*` stay non-sensitive, service-role key stays server-only · additive +
verified per step · owner approves every deploy.
