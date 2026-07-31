-- Team Brain — pgvector-backed knowledge base for natural-language staff Q&A.
-- ADDITIVE ONLY, idempotent, service-role only (RLS on, no policies).
--
-- Embedding dimension is 768 to match Google's text-embedding-004 (the app
-- already ships a GEMINI_API_KEY). If no embedding key is configured the module
-- degrades to keyword search over the tsvector column below — everything still
-- works, just without semantic ranking.

-- pgvector. Supabase's default search_path includes the `extensions` schema,
-- so an unqualified `vector(768)` type + `<=>` operator resolve regardless of
-- which schema the extension is installed into.
create extension if not exists vector;

-- ── Source documents ─────────────────────────────────────────────────────────
create table if not exists public.brain_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null default 'manual',   -- manual | sop | obsidian:<path> | …
  category text,
  content text not null,
  created_by text,                          -- staff email
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.brain_documents enable row level security;

create index if not exists idx_brain_documents_category
  on public.brain_documents (category);

-- ── Chunks (one embedding per chunk) ─────────────────────────────────────────
create table if not exists public.brain_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.brain_documents (id) on delete cascade,
  chunk_index int not null default 0,
  content text not null,
  embedding vector(768),                    -- null when no embedding key configured
  content_tsv tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now()
);
alter table public.brain_chunks enable row level security;

-- Keyword-search fallback index (always usable).
create index if not exists idx_brain_chunks_tsv
  on public.brain_chunks using gin (content_tsv);

-- Semantic index (cosine). Safe to build on an empty table.
create index if not exists idx_brain_chunks_embedding
  on public.brain_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ── Semantic match RPC ───────────────────────────────────────────────────────
-- Returns the closest chunks by cosine similarity. search_path is pinned to
-- avoid the function_search_path_mutable advisor warning.
create or replace function public.match_brain_chunks(
  query_embedding vector(768),
  match_count int default 6,
  similarity_threshold float default 0.0
)
returns table (id uuid, document_id uuid, content text, similarity float)
language sql
stable
set search_path = public, extensions
as $$
  select c.id,
         c.document_id,
         c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.brain_chunks c
  where c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
