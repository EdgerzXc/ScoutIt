-- A-124 fix 1 — let the Brain's search see every loaded passage.
--
-- WHY
-- ---
-- 0007 built idx_brain_chunks_embedding as ivfflat (lists = 100) on an EMPTY
-- table. ivfflat learns its 100 groups from the rows present when it is built;
-- built on nothing, and queried with the default probes = 1, each question
-- searches a single group. Measured 2026-09-11 against the live database, using
-- a stored chunk as the query:
--
--   match_brain_chunks(<stored chunk>, 50, 0.1)  ->  17 rows
--   exact scan, same threshold                   ->  287 of 287 rows
--
-- So staff questions saw roughly 6% of what was loaded, and missed documents
-- that were in the table ("What does the Standing Council do?" found only one
-- unrelated passage).
--
-- HNSW has no training step, so it cannot be built "too early", and it stays
-- correct as the corpus grows toward ~3,360 chunks. pgvector 0.8.0 is installed
-- and supports it. match_brain_chunks is NOT changed; the default
-- hnsw.ef_search (40) is well above the console's match_count (6).
--
-- Changes no rows. Apply only after the day's ingestion run has finished
-- (CREATE INDEX briefly blocks writes to brain_chunks).
--
-- APPLY: owner-approved only (O-004 lane), on this exact file.
--
-- VERIFY AFTER (read-only):
--   with q as (select embedding from public.brain_chunks where embedding is not null limit 1)
--   select count(*) from public.match_brain_chunks((select embedding from q), 30, 0.1);
--   -- before: at most 17.  after: 30.
--   select indexdef from pg_indexes where indexname = 'idx_brain_chunks_embedding';
--   -- after: ... USING hnsw (embedding vector_cosine_ops)
--
-- ROLLBACK (restores exactly what is live today, read from pg_indexes 2026-09-11):
--   drop index if exists public.idx_brain_chunks_embedding;
--   create index idx_brain_chunks_embedding on public.brain_chunks
--     using ivfflat (embedding vector_cosine_ops) with (lists = '100');

drop index if exists public.idx_brain_chunks_embedding;

create index idx_brain_chunks_embedding
  on public.brain_chunks using hnsw (embedding vector_cosine_ops);
