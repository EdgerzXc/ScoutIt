import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Mission Control sends noindex, private no-store, and display-capture denial headers", async () => {
  const config = (await import(pathToFileURL(path.join(root, "next.config.mjs")))).default;
  const rules = await config.headers();
  const headers = Object.fromEntries(rules.flatMap((rule) => rule.headers).map(({ key, value }) => [key.toLowerCase(), value]));
  assert.match(headers["x-robots-tag"], /noindex/);
  assert.match(headers["cache-control"], /private/);
  assert.match(headers["cache-control"], /no-store/);
  assert.match(headers["permissions-policy"], /display-capture=\(\)/);
  assert.equal(headers["x-frame-options"], "DENY");
});

test("sensitive workspace has watermark, print redaction, visibility redaction, and real sign-in recovery", async () => {
  const [component, css, layout] = await Promise.all([
    readFile(path.join(root, "src", "components", "security", "SensitiveWorkspaceGuard.js"), "utf8"),
    readFile(path.join(root, "src", "app", "globals.css"), "utf8"),
    readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8"),
  ]);
  assert.match(component, /visibilitychange/);
  assert.match(component, /RISKY_HIDDEN_MS = 5 \* 60 \* 1000/);
  assert.match(component, /action="\/auth\/signout"/);
  assert.match(component, /mc-watermark/);
  assert.match(css, /@media print/);
  assert.match(css, /mc-print-notice/);
  assert.match(layout, /SensitiveWorkspaceGuard/);
  assert.doesNotMatch(component, /contextmenu|PrintScreen|selectstart/);
});
