"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";
import { embed, generateAnswer, chunkText, brainHasAI } from "@/lib/brain";
import { buildCitation, citationLine } from "@/lib/brainCitation";

/**
 * Ingest a document into the Brain. Agent (Tier 1)+.
 * Stores the source doc, splits it into chunks, embeds each chunk if an
 * embedding key is configured (otherwise stores text-only for keyword search).
 * @param {FormData} formData
 */
export async function ingestDocument(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const title = formData.get("title")?.toString().trim();
  const category = formData.get("category")?.toString().trim() || null;
  const source = formData.get("source")?.toString().trim() || "manual";
  const content = formData.get("content")?.toString();

  if (!title) throw new Error("A title is required.");
  if (!content?.trim()) throw new Error("Content cannot be empty.");

  const admin = createAdminClient();

  const { data: doc, error: docErr } = await admin
    .from("brain_documents")
    .insert({ title, category, source, content, created_by: staff.email })
    .select("id")
    .single();
  if (docErr) throw new Error(docErr.message);

  const pieces = chunkText(content);
  const rows = [];
  for (let i = 0; i < pieces.length; i++) {
    const vector = await embed(pieces[i]); // null in keyword-only mode
    rows.push({
      document_id: doc.id,
      chunk_index: i,
      content: pieces[i],
      embedding: vector,
    });
  }

  if (rows.length) {
    const { error: chunkErr } = await admin.from("brain_chunks").insert(rows);
    if (chunkErr) throw new Error(chunkErr.message);
  }

  await logAction({
    staff,
    action: "brain.ingest",
    targetTable: "brain_documents",
    targetId: doc.id,
    metadata: { title, chunks: rows.length, embedded: brainHasAI() },
  });

  revalidatePath("/dashboard/brain");
}

/**
 * Remove a document (and its chunks via ON DELETE CASCADE). Ops Manager+.
 * @param {FormData} formData
 */
export async function deleteDocument(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const id = formData.get("documentId")?.toString();
  if (!id) throw new Error("Missing document id.");

  const admin = createAdminClient();
  const { error } = await admin.from("brain_documents").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "brain.delete",
    targetTable: "brain_documents",
    targetId: id,
  });

  revalidatePath("/dashboard/brain");
}

/**
 * Ask the Brain. Called from the client via useActionState, so it returns a
 * result object (never throws to the user). Semantic search when embeddings
 * are available; keyword search otherwise. Answer synthesis is best-effort.
 * @param {any} _prev
 * @param {FormData} formData
 */
export async function askBrain(_prev, formData) {
  const staff = await getCurrentStaff();
  if (!staff) return { error: "Not authorized." };

  const question = formData.get("question")?.toString().trim();
  if (!question) return { error: "Ask a question first." };

  const admin = createAdminClient();

  try {
    let chunks = [];
    let mode = "keyword";

    const queryEmbedding = await embed(question);
    if (queryEmbedding) {
      const { data, error } = await admin.rpc("match_brain_chunks", {
        query_embedding: queryEmbedding,
        match_count: 6,
        similarity_threshold: 0.1,
      });
      if (!error && data) {
        chunks = data;
        mode = "semantic";
      }
    }

    // Keyword fallback (no embeddings, or semantic returned nothing).
    if (chunks.length === 0) {
      const { data, error } = await admin
        .from("brain_chunks")
        .select("id, document_id, content")
        .textSearch("content_tsv", question, { type: "websearch", config: "english" })
        .limit(6);
      if (error) {
        // websearch parse can fail on odd input — fall back to ILIKE.
        const { data: ilike } = await admin
          .from("brain_chunks")
          .select("id, document_id, content")
          .ilike("content", `%${question.slice(0, 60)}%`)
          .limit(6);
        chunks = ilike || [];
      } else {
        chunks = data || [];
      }
      mode = "keyword";
    }

    if (chunks.length === 0) {
      return {
        answer: null,
        sources: [],
        mode,
        empty: true,
        aiAvailable: brainHasAI(),
      };
    }

    // Resolve document titles.
    const docIds = [...new Set(chunks.map((c) => c.document_id))];
    const { data: docs } = await admin
      .from("brain_documents")
      .select("id, title, category, source, updated_at")
      .in("id", docIds);

    // A-124: the citation is built here, once, and both the prompt and the UI
    // read the same object. Two independent formatters is how a displayed date
    // and a cited date drift apart.
    const citationById = Object.fromEntries(
      (docs || []).map((d) => [
        d.id,
        buildCitation({ title: d.title, source: d.source, rowUpdatedAt: d.updated_at }),
      ])
    );
    const citationFor = (chunk) =>
      citationById[chunk.document_id] || buildCitation({ title: "Untitled" });

    const contexts = chunks.map((c) => {
      const citation = citationFor(c);
      return {
        title: citation.title,
        citation: citationLine(citation),
        content: c.content,
      };
    });

    // A-124 fix 2: the answer carries the model that wrote it, so an answer
    // from the backup model is labelled as one.
    const generated = await generateAnswer(question, contexts);

    return {
      answer: generated?.text ?? null,
      answeredBy: generated?.model ?? null,
      mode,
      aiAvailable: brainHasAI(),
      sources: chunks.map((c) => {
        const citation = citationFor(c);
        return {
          id: c.id,
          title: citation.title,
          // Every source carries its own provenance. An answer without a dated
          // citation is the failure mode A-124 exists to prevent, so this is
          // never conditional on the document having been tidy.
          citation,
          snippet: c.content.length > 320 ? c.content.slice(0, 320) + "…" : c.content,
          similarity: typeof c.similarity === "number" ? c.similarity : null,
        };
      }),
    };
  } catch (err) {
    return { error: err.message || "Search failed. Has migration 0007 been applied?" };
  }
}
