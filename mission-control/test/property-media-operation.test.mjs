import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policyPath = path.join(root, "src", "lib", "propertyMediaPolicy.mjs");
const operationPath = path.join(root, "src", "lib", "propertyMediaOperation.js");
const actionsPath = path.join(root, "src", "app", "dashboard", "operations", "actions.js");

test("media policy rejects known placeholders and images in embed fields", async () => {
  const { classifyPropertyMedia } = await import(pathToFileURL(policyPath));
  assert.equal(classifyPropertyMedia("https://my.matterport.com/show/?m=YWayaXpaJyH").kind, "placeholder");
  assert.equal(classifyPropertyMedia("https://lumalabs.ai/embed/b86b7928-f130-40a5-8cac-8095f30eed54").kind, "placeholder");
  assert.equal(classifyPropertyMedia("https://images.unsplash.com/photo-1").kind, "image");
  assert.equal(classifyPropertyMedia("https://www.youtube.com/embed/dQw4w9WgXcQ").kind, "placeholder");
  assert.equal(classifyPropertyMedia("https://my.matterport.com/show/?m=RealScan123").kind, "matterport");
});

test("cleanup is fixed to four fields, null-only writes, batching, and post-verification", async () => {
  const source = await readFile(operationPath, "utf8");
  for (const field of ["Video_URL", "Virtual_Tour_URL", "Luma_3D_Map_URL", "Drone_Heatmap_URL"]) assert.match(source, new RegExp(field));
  assert.match(source, /fields\[entry\.field\] = null/);
  assert.match(source, /index \+= 10/);
  assert.match(source, /if \(after\.unsafe\.length\) throw new Error/);
  assert.match(source, /schema metadata unavailable/);
  assert.match(source, /PROPERTY_MEDIA_OPERATION\.table/);
  assert.doesNotMatch(source, /delete|destroy/i);
});

test("cleanup and retained-media attestation require Super Admin and strict audit", async () => {
  const source = await readFile(actionsPath, "utf8");
  for (const name of ["clearInvalidMediaFields", "attestRetainedMedia"]) {
    const start = source.indexOf(`export async function ${name}`);
    assert.ok(start >= 0, `Expected ${name}`);
    const next = source.indexOf("export async function", start + 1);
    const body = source.slice(start, next < 0 ? source.length : next);
    assert.ok(body.indexOf("await getCurrentStaff()") >= 0);
    assert.ok(body.indexOf("assertTier(staff, TIERS.SUPER_ADMIN)") > body.indexOf("await getCurrentStaff()"));
    assert.match(body, /logActionStrict/);
  }
  assert.match(source, /property_media_cleanup\.intent/);
  assert.match(source, /property_media_cleanup\.complete/);
  assert.match(source, /property_media_cleanup\.failed/);
  assert.match(source, /property_media_retained\.attested/);
});
