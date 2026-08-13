---
section: "15_IMPLEMENTATION_RECORDS/historical/launch-readiness"
status: reference
tags: [security, authorization, rls, applied, evidence, supabase, intel]
updated: 2026-08-13
related:
  - "[[THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]]"
  - "[[SEARCH_ANALYTICS_DNS_AUDIT_2026-08-13]]"
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS]]"
---

# TWO AUTHORIZATION HOLES — CLOSED AND VERIFIED (2026-08-13)

**Status: APPLIED TO PRODUCTION** (project `yyixsuaimdzyiocswcgc`) with owner
approval, one at a time, each verified in both directions before moving on.

Found by the Cowork session, **independently re-verified** by Claude Code before
anything was applied. Every claim below is backed by a command that was actually
run against the live database.

---

## ⚠️ The headline lesson: the advisors never caught either of these

Supabase's security advisor reported **30 findings** before these fixes and
**30 after**. Neither of the two real authorization holes appeared in that list at
any point.

Both were found by querying the live database directly — one by reading
`information_schema.role_table_grants`, the other by reading the `roles` column
of `pg_policies` rather than trusting the policy's *name*.

**Rule 2 in its purest form: check the database, not the layer that describes
it.** The advisor list is a lint, not an authorization audit. A clean advisor run
is not evidence that access control is correct.

The one lint that *is* still flagged — `security_definer_view` on
`public_profiles` — is **deliberately left in place**; see §1.

---

## 1 · `public.public_profiles` was writable by anonymous visitors

### What was wrong

`public_profiles` is a `SECURITY DEFINER` view over `user_profiles`. Because it
is a simple single-table projection, Postgres makes it **auto-updatable**, and
`anon` / `authenticated` held far more than read access on it:

```
BEFORE  anon           DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
BEFORE  authenticated  DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
```

A write through the view executed as the **view's owner**, bypassing
`user_profiles` RLS entirely. `user_profiles` holds **15 real rows**.

### Proof it was live (rolled back, no data changed)

```sql
set local role anon;
update public.public_profiles set display_name = display_name
  where id in (select id from public.public_profiles limit 1);
-- PROOF (rolled back): anon UPDATE affected 1 row(s)
```

Anyone holding the publishable anon key — **which ships in every browser** —
could rewrite or delete any public profile.

### The fix

```sql
REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
```

Migration applied as `close_public_profiles_write_path`.

### Why NOT `security_invoker = true`

The obvious-looking fix is the wrong one, and it would have caused a visible
outage. The only SELECT policy on `user_profiles` is `id = auth.uid()`, so an
invoker-rights view returns **zero rows to anonymous visitors** — blanking every
public profile page and every ecosystem directory. `src/lib/profileClient.js`
reads this view with the browser anon client.

**Read-as-definer is deliberate and load-bearing. Only the write path was
accidental, so only the write path was revoked.** This is why the
`security_definer_view` advisor warning is still present and should stay present.

### Verification (all four run after applying)

| Check | Result |
|---|---|
| Grants now | `anon` = `SELECT` only; `authenticated` = `SELECT` only |
| Anonymous **write** | ❌ blocked — `permission denied` |
| Anonymous **read** | ✅ still works — **12 profiles visible** |
| **Live site** `/brokers` | ✅ HTTP 200, and all three real broker profiles (Marco Villanueva, Isabella Reyes, Daniel Ocampo) still render — confirmed on a **cache-busting fresh fetch** |

---

## 2 · `intel_briefings` / `intel_sources` were open to anonymous writes

### What was wrong

Two policies *named* `"Service role full access on …"` were never scoped to
`service_role`:

```
BEFORE  Service role full access on intel_briefings   roles={public}  cmd=ALL  USING(true)
BEFORE  Service role full access on intel_sources     roles={public}  cmd=ALL  USING(true)
```

The Postgres `public` role **includes `anon`**, and permissive policies combine
with **`OR`** — so this single policy overrode every other policy on both tables.

**The policy name was the trap.** Anyone reading the policy list would see
"Service role full access" and move on. Only the `roles` column reveals it.

### Proof it was live (rolled back)

```sql
set local role anon;
insert into public.intel_briefings (slug, title, city) values ('probe','probe','probe');
-- 1 row accepted
```

Both tables were **empty (0 rows)**, so nothing ever leaked. The risk was an
anonymous injection path into whatever renders on `/intel`.

### Owner decision, confirmed 2026-08-13

> **`/intel` is EDITORIAL.** Authored by the ScoutIt team and published through
> **Mission Control**. Each category is intended to become a library of
> presentation methods — scrollytelling, interactives, WebGL — chosen per piece.
> OSINT is used only to *gather source material* for the team's own take.
> **It is not user-generated.**

That decision settles the open question at the foot of the prepared migration:
signed-in users must **not** be able to create or rewrite briefings. So the fix
went further than just closing the anonymous hole.

### The fix

```sql
-- Part 1 - close the anonymous hole (recreate scoped, so intent stays legible)
DROP POLICY  "Service role full access on intel_briefings" ON public.intel_briefings;
CREATE POLICY "Service role full access on intel_briefings"
  ON public.intel_briefings FOR ALL TO service_role USING (true) WITH CHECK (true);
-- (same for intel_sources)

-- Part 2 - editorial lockdown, per the owner decision above
DROP POLICY "Authenticated users insert intel_briefings" ON public.intel_briefings;
DROP POLICY "Authenticated users update intel_briefings" ON public.intel_briefings;
DROP POLICY "Authenticated users insert intel_sources"   ON public.intel_sources;
DROP POLICY "Authenticated users update intel_sources"   ON public.intel_sources;
```

The two `SELECT` policies were **deliberately kept** so signed-in users can still
read briefings. Migration applied as `scope_intel_write_access_to_service_role`.

### Verification

| Check | Result |
|---|---|
| Policies now | `service_role` = ALL; `authenticated` = SELECT only; no `public` write |
| Anonymous INSERT | ❌ blocked |
| Signed-in user INSERT | ❌ blocked (editorial lockdown holds) |
| **Mission Control publish** (service role) | ✅ **still works** — insert accepted, rolled back |
| Rows left behind by probes | **0** — both tables still empty |

The Mission Control check is the one that mattered most: `service_role` has
`BYPASSRLS`, so the publishing pipeline
(`src/app/api/admin/osint/route.js`, `src/app/api/cron/osint-scraper/route.js`)
is unaffected. **Verified rather than assumed.**

---

## 3 · Noted in passing, not acted on

`public_profiles` exposes these columns to anonymous visitors:

```
id, display_name, avatar_url, location, headline, bio, firm, service,
member_since, subscription_tier, active_roles, provider_type,
provider_availability, is_profile_public, is_example_account,
prc_license, prc_verified, prc_expiry, dhsud_number
```

The last four are **regulatory identifiers**. `prc_license` and `prc_verified`
are plausibly intentional — public license verification is the point of the PRC
badge system. **`dhsud_number` and `prc_expiry` are worth a deliberate decision**
rather than an inherited default. Flagged only; nothing changed.

---

## 4 · What is still open

Three lower-priority migrations remain **written but unapplied** in
`supabase/migrations/`:

- `…000003_rls_initplan_wrap_auth_calls.sql` — 17 policies re-evaluate
  `auth.uid()` per row; compounds badly at 200 listings
- `…000004_revoke_st_estimatedextent.sql` — closes 6 advisor warnings at once
- `…000005_spatial_ref_sys_rls.sql` — ⚠️ **highest breakage risk**; the table is
  owned by the PostGIS extension. Apply alone, then immediately re-test a map or
  radius search

Still owner-only: leaked-password protection (one toggle, still off).

⚠️ `supabase/migrations/` is known to have **drifted from the live database**.
These files were generated from live introspection, not from that directory's
history. Always query the live schema before trusting anything in that folder.
