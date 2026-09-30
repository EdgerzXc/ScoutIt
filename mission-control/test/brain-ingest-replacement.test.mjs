import test from "node:test";
import assert from "node:assert/strict";
import { needsIngestion, replaceDocument } from "../scripts/ingest-vault.mjs";

const doc = {
  relPath: "_SCOUTIT_BRAIN/00_START_HERE.md",
  updated: "2026-09-27",
  title: "Start here",
  category: "root",
  body: "Current body",
  chunks: ["Current body"],
};
const stored = {
  id: "old",
  source: `vault:${doc.relPath}@${doc.updated}`,
  title: doc.title,
  category: doc.category,
  content: doc.body,
};

test("resume notices same-day content changes and duplicate stored rows", () => {
  assert.equal(needsIngestion(doc, [stored]), false);
  assert.equal(needsIngestion({ ...doc, body: "Edited today" }, [stored]), true);
  assert.equal(needsIngestion(doc, [stored, stored]), true);
});

test("an embedding failure leaves the previous Brain document untouched", async () => {
  const writes = [];
  await assert.rejects(
    replaceDocument(doc, ["old"], {
      embedChunks: async () => { throw new Error("quota exhausted"); },
      write: async (...args) => { writes.push(args); },
    }),
    /quota exhausted/
  );
  assert.deepEqual(writes, []);
});

test("a failed chunk insert cleans up only the incomplete replacement", async () => {
  const writes = [];
  await assert.rejects(
    replaceDocument(doc, ["old"], {
      embedChunks: async () => [[0.1]],
      write: async (path, init) => {
        writes.push([path, init.method]);
        if (path === "brain_documents" && init.method === "POST") return [{ id: "new" }];
        if (path === "brain_chunks") throw new Error("chunk insert failed");
      },
    }),
    /chunk insert failed/
  );
  assert.deepEqual(writes, [
    ["brain_documents", "POST"],
    ["brain_chunks", "POST"],
    ["brain_documents?id=eq.new", "DELETE"],
  ]);
});

test("a complete replacement retires the old document last", async () => {
  const writes = [];
  const count = await replaceDocument(doc, ["old"], {
    embedChunks: async () => { writes.push(["embedding"]); return [[0.1]]; },
    write: async (path, init) => {
      writes.push([path, init.method]);
      if (path === "brain_documents" && init.method === "POST") return [{ id: "new" }];
    },
  });
  assert.equal(count, 1);
  assert.deepEqual(writes, [
    ["embedding"],
    ["brain_documents", "POST"],
    ["brain_chunks", "POST"],
    ["brain_documents?id=eq.old", "DELETE"],
  ]);
});
