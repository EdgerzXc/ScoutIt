-- A-193: allow 'operator' as a VIA promoter / routing recipient type.
-- Additive widening of existing CHECK constraints only: no rows change, no column
-- is dropped. Per AGENTS.md §7 / O-004 this file is staged locally and executed in
-- production only on the owner's separate database go.
--
-- Until applied, the eligibility endpoint degrades safely: an operator's link insert
-- is rejected by the old constraint and the caller receives the public canonical
-- link (owner and broker links keep working unchanged).

ALTER TABLE public.via_share_links
  DROP CONSTRAINT IF EXISTS via_share_links_promoter_type_check;
ALTER TABLE public.via_share_links
  ADD CONSTRAINT via_share_links_promoter_type_check
  CHECK (promoter_type IN ('broker', 'owner', 'operator'));

ALTER TABLE public.via_attributions
  DROP CONSTRAINT IF EXISTS via_attributions_promoter_type_check;
ALTER TABLE public.via_attributions
  ADD CONSTRAINT via_attributions_promoter_type_check
  CHECK (promoter_type IN ('broker', 'owner', 'operator'));

ALTER TABLE public.via_routing_decisions
  DROP CONSTRAINT IF EXISTS via_routing_decisions_selected_recipient_type_check;
ALTER TABLE public.via_routing_decisions
  ADD CONSTRAINT via_routing_decisions_selected_recipient_type_check
  CHECK (selected_recipient_type IN ('owner', 'broker', 'operator'));
