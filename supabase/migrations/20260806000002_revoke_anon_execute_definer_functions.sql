-- ═══════════════════════════════════════════════════════════════════════
-- 🔴 P0 — SEVEN SECURITY DEFINER FUNCTIONS WERE PUBLICLY EXECUTABLE
-- NEW_IDEAS.md §43.3
-- ═══════════════════════════════════════════════════════════════════════
--
-- ✅ APPLIED TO PRODUCTION 2026-08-06. Verified: all 15 app SECURITY DEFINER
--    functions now read anon=false / authenticated=false / service_role=true,
--    and the advisor's anon_security_definer_function_executable warnings
--    have cleared.
--
-- THE HOLE
-- --------
-- Postgres grants EXECUTE on new functions to PUBLIC by default. Supabase
-- exposes every function in the `public` schema at `/rest/v1/rpc/<name>`.
-- SECURITY DEFINER makes a function run with the OWNER's rights, ignoring RLS.
--
-- Those three facts together turned seven internal functions into public,
-- unauthenticated write endpoints sitting beside the real API — reachable with
-- nothing but the anon key that ships in every browser bundle:
--
--   create_routed_buyer_deal        Create deals WITHOUT spending a Connect.
--                                   Bypasses /api/deals/initiate and with it
--                                   the entire Connects economy — the thing
--                                   §35 Layer 2 calls the anti-scrape layer.
--   verify_pdf_draft                Mark ANY property verified. Verification
--                                   is the trust signal the whole directory
--                                   rests on.
--   complete_transaction_handshake  Force a contact reveal between two parties
--                                   and award +25 Scout Rating.
--   purge_expired_chat_messages     Destroy chat history on demand.
--   generate_monthly_scout_wrap     Generate a wrap for any entity id.
--   get_property_lead_recipients    Enumerate which brokers hold a property —
--                                   broker-competitive information.
--   generate_osint_master_prompt    Internal staff tooling.
--
-- Found by `get_advisors(security)` during the §43 RLS audit, not by reading
-- code — the call sites all looked correct, because they are. The exposure was
-- in the grant, which no application file mentions.
--
-- WHY REVOKING IS SAFE
-- --------------------
-- Every one of these is called only from a Next.js route holding the SERVICE
-- ROLE key, which is unaffected by these grants. Verified against every
-- `.rpc(` call site in src/ on 2026-08-06 — nothing in the browser calls any
-- of them.
--
-- `spend_connects` and `refund_connects_system_error` were already locked down
-- this way. This brings the other seven in line.

REVOKE ALL ON FUNCTION public.create_routed_buyer_deal(uuid, text, text, timestamptz, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_transaction_handshake(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_pdf_draft(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.purge_expired_chat_messages() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_property_lead_recipients(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_osint_master_prompt(uuid[]) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_routed_buyer_deal(uuid, text, text, timestamptz, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_transaction_handshake(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_pdf_draft(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_expired_chat_messages() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_property_lead_recipients(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_osint_master_prompt(uuid[]) TO service_role;

-- A mutable search_path on a SECURITY DEFINER function lets a caller who can
-- create objects shadow a referenced table or operator and have it run as the
-- function owner. Every other definer function here already pins it.
ALTER FUNCTION public.generate_osint_master_prompt(uuid[]) SET search_path = public;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFY — every row must read false / false / true
-- ═══════════════════════════════════════════════════════════════════════
-- select p.proname,
--        has_function_privilege('anon', p.oid, 'EXECUTE')          as anon,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth,
--        has_function_privilege('service_role', p.oid, 'EXECUTE')  as svc
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.prosecdef
-- order by anon desc, p.proname;
--
-- ⚠️ STANDING RULE: any NEW `SECURITY DEFINER` function must revoke EXECUTE
-- from PUBLIC/anon/authenticated and grant it only to service_role, in the
-- same migration that creates it. Postgres' default grant is the trap — the
-- function is exposed the moment it exists, and no application file will ever
-- mention it. Re-run `get_advisors(security)` after adding one.
