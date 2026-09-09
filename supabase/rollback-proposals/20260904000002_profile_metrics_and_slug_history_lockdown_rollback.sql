-- ============================================================================
-- ROLLBACK for 20260904000002_profile_metrics_and_slug_history_lockdown.sql
-- O-019 stage 2 · U-016, U-018, spatial_ref_sys
--
-- ⚠️ Running this restores three live defects:
--    · a broker or researcher can set their own scout_rating, verified_closures
--      and credibility_score to anything;
--    · any signed-in user can forge a property URL redirect for a listing they
--      do not own, naming an innocent staff member as the author of the change;
--    · `anon` regains DELETE and TRUNCATE on ~8,500 PostGIS reference rows.
--
-- It exists so a mistake can be undone quickly. If a legitimate write broke,
-- prefer widening one grant (see the note at the bottom) over running this.
-- ============================================================================

begin;

-- ── Undo U-016 ────────────────────────────────────────────────────────────
revoke insert (user_id) on public.broker_profiles from authenticated;
revoke insert (user_id) on public.researcher_profiles from authenticated;

grant insert, update, delete on public.broker_profiles to authenticated;
grant insert, update, delete on public.broker_profiles to anon;
grant insert, update, delete on public.researcher_profiles to authenticated;
grant insert, update, delete on public.researcher_profiles to anon;

-- ── Undo U-018 ────────────────────────────────────────────────────────────
grant insert, update, delete on public.property_slug_history to authenticated;
grant insert, update, delete on public.property_slug_history to anon;

create policy "Authenticated insert property_slug_history"
  on public.property_slug_history
  for insert
  with check (auth.uid() is not null);

-- ── Undo the spatial_ref_sys revoke ───────────────────────────────────────
grant insert, update, delete, truncate on public.spatial_ref_sys to authenticated;
grant insert, update, delete, truncate on public.spatial_ref_sys to anon;

commit;

-- ============================================================================
-- PARTIAL ALTERNATIVE — prefer this to a full rollback.
--
-- The likely failure is a client write naming a column it can no longer set.
-- The symptom is a save silently failing, or a 42501 in the browser console.
--
--   broker_profiles / researcher_profiles
--     Only `user_id` is insertable and nothing is updatable. If a legitimate
--     client path needs another column, add it narrowly:
--       grant insert (<column>) on public.broker_profiles to authenticated;
--     But check first WHY the browser is writing it. A metric written from a
--     browser is the defect U-016 describes, not a grant to widen — it belongs
--     in a server route running as service_role.
--
--   property_slug_history
--     Write is revoked outright because no client writer existed. If one is
--     added later it must be a server route, and `replaced_by_staff_id` must be
--     server-assigned — U-018's acceptance test says so explicitly.
-- ============================================================================
