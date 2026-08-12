import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Mission Control rejects the unused Next image optimizer before routing", async () => {
  const source = await readFile(path.join(root, "src", "middleware.js"), "utf8");
  const block = source.indexOf('pathname.startsWith("/_next/image")');
  const auth = source.indexOf("createServerClient(");

  assert.ok(block >= 0, "Expected an explicit /_next/image rejection");
  assert.ok(block < auth, "Image optimization must be rejected before auth/database work");
  assert.match(source, /status:\s*404/);
  assert.doesNotMatch(
    source,
    /\(\?![^\n]*_next\/image/,
    "The middleware matcher must not exclude /_next/image"
  );
});
