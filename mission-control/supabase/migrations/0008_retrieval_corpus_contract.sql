-- F-001 derived retrieval index contract.
-- ADDITIVE AND UNAPPLIED: do not run without the normal owner migration gate.
-- Keeps the legacy internal-only brain_documents/brain_chunks foundation intact.

create table if not exists public.retrieval_documents (
  id uuid primary key default gen_random_uuid(),
  contract_version text not null check (contract_version = '1.0.0'),
  corpus text not null check (corpus in ('public', 'internal')),
  source_system text not null check (length(btrim(source_system)) > 0),
  source_type text not null check (length(btrim(source_type)) > 0),
  source_id text not null check (length(btrim(source_id)) > 0),
  source_version text not null check (length(btrim(source_version)) > 0),
  title text not null check (length(btrim(title)) > 0),
  content text not null check (length(btrim(content)) > 0),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  canonical_url text,
  approved boolean not null,
  release_status text,
  allowed_roles text[] not null check (cardinality(allowed_roles) > 0),
  is_sample boolean not null,
  sample_disclosure text,
  provenance jsonb not null,
  source_updated_at timestamptz,
  indexed_at timestamptz not null default now(),
  reviewed_at timestamptz,
  expires_at timestamptz,
  tombstoned_at timestamptz,
  tombstone_reason text,
  unique (corpus, source_system, source_type, source_id),
  check (
    corpus <> 'public'
    or (
      approved
      and release_status in ('PUBLIC_LIVE', 'LIMITED_LIVE')
      and canonical_url like '/%'
      and allowed_roles <@ array['public', 'visitor', 'seeker', 'owner', 'broker', 'provider', 'enterprise']::text[]
    )
  ),
  check (
    corpus <> 'internal'
    or allowed_roles <@ array['staff', 'admin', 'agent', 'ops_manager', 'super_admin']::text[]
  ),
  check (not is_sample or length(btrim(sample_disclosure)) > 0),
  check ((tombstoned_at is null) = (tombstone_reason is null))
);

create table if not exists public.retrieval_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.retrieval_documents (id) on delete cascade,
  stable_chunk_id text not null check (length(btrim(stable_chunk_id)) > 0),
  chunk_key text not null check (length(btrim(chunk_key)) > 0),
  content text not null check (length(btrim(content)) > 0),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  embedding vector(768),
  content_tsv tsvector generated always as (to_tsvector('english', content)) stored,
  indexed_at timestamptz not null default now(),
  expires_at timestamptz,
  tombstoned_at timestamptz,
  tombstone_reason text,
  unique (document_id, chunk_key),
  unique (stable_chunk_id),
  check ((tombstoned_at is null) = (tombstone_reason is null))
);

alter table public.retrieval_documents enable row level security;
alter table public.retrieval_chunks enable row level security;

create index if not exists idx_retrieval_documents_source
  on public.retrieval_documents (corpus, source_system, source_type, source_id);
create index if not exists idx_retrieval_documents_active
  on public.retrieval_documents (corpus, tombstoned_at, expires_at);
create index if not exists idx_retrieval_chunks_document
  on public.retrieval_chunks (document_id);
create index if not exists idx_retrieval_chunks_tsv
  on public.retrieval_chunks using gin (content_tsv);

-- No vector ANN index yet: corpus size/relevance/latency must be measured first.
create or replace function public.match_retrieval_chunks(
  query_embedding vector(768),
  requested_corpus text,
  requested_role text,
  match_count int default 6,
  similarity_threshold float default 0.0
)
returns table (
  id uuid,
  document_id uuid,
  stable_chunk_id text,
  title text,
  content text,
  canonical_url text,
  provenance jsonb,
  similarity float
)
language sql
stable
set search_path = public, extensions
as $$
  select c.id,
         d.id,
         c.stable_chunk_id,
         d.title,
         c.content,
         d.canonical_url,
         d.provenance,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.retrieval_chunks c
  join public.retrieval_documents d on d.id = c.document_id
  where requested_corpus in ('public', 'internal')
    and d.corpus = requested_corpus
    and c.embedding is not null
    and d.tombstoned_at is null
    and c.tombstoned_at is null
    and (d.expires_at is null or d.expires_at > now())
    and (c.expires_at is null or c.expires_at > now())
    and (
      requested_role = any(d.allowed_roles)
      or (requested_corpus = 'public' and 'public' = any(d.allowed_roles))
    )
    and 1 - (c.embedding <=> query_embedding) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 25));
$$;

create or replace function public.search_retrieval_chunks_keyword(
  query_text text,
  requested_corpus text,
  requested_role text,
  match_count int default 6
)
returns table (
  id uuid,
  document_id uuid,
  stable_chunk_id text,
  title text,
  content text,
  canonical_url text,
  provenance jsonb,
  rank float
)
language sql
stable
set search_path = public
as $$
  select c.id,
         d.id,
         c.stable_chunk_id,
         d.title,
         c.content,
         d.canonical_url,
         d.provenance,
         ts_rank_cd(c.content_tsv, websearch_to_tsquery('english', query_text))::float as rank
  from public.retrieval_chunks c
  join public.retrieval_documents d on d.id = c.document_id
  where requested_corpus in ('public', 'internal')
    and length(btrim(query_text)) > 0
    and d.corpus = requested_corpus
    and d.tombstoned_at is null
    and c.tombstoned_at is null
    and (d.expires_at is null or d.expires_at > now())
    and (c.expires_at is null or c.expires_at > now())
    and (
      requested_role = any(d.allowed_roles)
      or (requested_corpus = 'public' and 'public' = any(d.allowed_roles))
    )
    and c.content_tsv @@ websearch_to_tsquery('english', query_text)
  order by rank desc, c.stable_chunk_id
  limit greatest(1, least(match_count, 25));
$$;

revoke all on table public.retrieval_documents from public, anon, authenticated;
revoke all on table public.retrieval_chunks from public, anon, authenticated;
grant all on table public.retrieval_documents to service_role;
grant all on table public.retrieval_chunks to service_role;
revoke execute on function public.match_retrieval_chunks(vector, text, text, int, float)
  from public, anon, authenticated;
grant execute on function public.match_retrieval_chunks(vector, text, text, int, float)
  to service_role;
revoke execute on function public.search_retrieval_chunks_keyword(text, text, text, int)
  from public, anon, authenticated;
grant execute on function public.search_retrieval_chunks_keyword(text, text, text, int)
  to service_role;
