import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sql = await readFile(
  path.join(root, "supabase", "migrations", "0008_retrieval_corpus_contract.sql"),
  "utf8",
);

test("retrieval migration creates separate derived tables without altering legacy Brain", () => {
  assert.match(sql, /create table if not exists public\.retrieval_documents/i);
  assert.match(sql, /create table if not exists public\.retrieval_chunks/i);
  assert.doesNotMatch(sql, /alter table public\.brain_(documents|chunks)/i);
  assert.doesNotMatch(sql, /drop\s+(table|function)/i);
});

test("public and internal corpora are constrained at the database boundary", () => {
  assert.match(sql, /corpus in \('public', 'internal'\)/i);
  assert.match(sql, /allowed_roles <@ array\['public', 'visitor', 'seeker', 'owner', 'broker', 'provider', 'enterprise'\]/i);
  assert.match(sql, /allowed_roles <@ array\['staff', 'admin', 'agent', 'ops_manager', 'super_admin'\]/i);
  assert.match(sql, /approved[\s\S]*release_status in \('PUBLIC_LIVE', 'LIMITED_LIVE'\)[\s\S]*canonical_url like '\/%'/i);
});

test("semantic RPC enforces corpus, role, expiry, and tombstone filters", () => {
  assert.match(sql, /d\.corpus = requested_corpus/i);
  assert.match(sql, /requested_role = any\(d\.allowed_roles\)/i);
  assert.match(sql, /d\.tombstoned_at is null/i);
  assert.match(sql, /c\.tombstoned_at is null/i);
  assert.match(sql, /d\.expires_at is null or d\.expires_at > now\(\)/i);
  assert.match(sql, /limit greatest\(1, least\(match_count, 25\)\)/i);
});

test("keyword fallback RPC enforces the same access and lifecycle boundary", () => {
  assert.match(sql, /function public\.search_retrieval_chunks_keyword/i);
  assert.match(sql, /websearch_to_tsquery\('english', query_text\)/i);
  assert.match(sql, /length\(btrim\(query_text\)\) > 0/i);
  assert.match(sql, /d\.corpus = requested_corpus/i);
  assert.match(sql, /requested_role = any\(d\.allowed_roles\)/i);
  assert.match(sql, /d\.tombstoned_at is null/i);
  assert.match(sql, /c\.tombstoned_at is null/i);
  assert.match(sql, /c\.content_tsv @@ websearch_to_tsquery/i);
});

test("tables and RPC are service-role only", () => {
  assert.match(sql, /revoke all on table public\.retrieval_documents from public, anon, authenticated/i);
  assert.match(sql, /revoke all on table public\.retrieval_chunks from public, anon, authenticated/i);
  assert.match(sql, /revoke execute on function public\.match_retrieval_chunks[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.match_retrieval_chunks[\s\S]*to service_role/i);
  assert.match(sql, /revoke execute on function public\.search_retrieval_chunks_keyword[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.search_retrieval_chunks_keyword[\s\S]*to service_role/i);
});

test("migration deliberately defers the ANN index pending measurements", () => {
  assert.doesNotMatch(sql, /using\s+(ivfflat|hnsw)/i);
});

test("both retrieval functions use balanced PostgreSQL dollar quotes", () => {
  assert.equal((sql.match(/\nas \$\$/g) || []).length, 2);
  assert.equal((sql.match(/\$\$;/g) || []).length, 2);
  assert.equal((sql.match(/\$\$/g) || []).length, 4);
});
