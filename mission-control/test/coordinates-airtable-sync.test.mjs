import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parsePointToLatLng } from "../src/lib/geoPoint.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const actions = await readFile(
  path.join(root, "src", "app", "dashboard", "coordinates", "actions.js"),
  "utf8",
);
const airtable = await readFile(path.join(root, "src", "lib", "airtable.js"), "utf8");
const cache = await readFile(path.join(root, "src", "lib", "publicCatalogueCache.js"), "utf8");

// ── The parse the two sides share ────────────────────────────────────────────
// Supabase writes POINT(lng lat) — longitude FIRST. Airtable holds Latitude and
// Longitude as separate numbers. Reading that pair backwards is the single most
// common way to put a Manila listing in the Pacific, so it is pinned by value
// rather than by inspection.

test("POINT is read longitude-first, the way PostGIS writes it", () => {
  assert.deepEqual(parsePointToLatLng("POINT(121.0437 14.5547)"), {
    lng: 121.0437,
    lat: 14.5547,
  });
});

test("a missing or malformed position yields nothing rather than a guess", () => {
  for (const bad of [null, undefined, "", "14.5547,121.0437", "POINT()", 42]) {
    assert.equal(parsePointToLatLng(bad), null, `accepted ${JSON.stringify(bad)}`);
  }
});

// ── The defect A-060 names ───────────────────────────────────────────────────

test("a staff correction reaches Airtable, not just Supabase", () => {
  assert.match(actions, /syncCoordinatesToAirtable/);
  const sync = actions.indexOf("syncCoordinatesToAirtable({");
  const write = actions.indexOf('.from("properties")\n    .update({ coordinates:');
  assert.notEqual(sync, -1, "the action never pushes the pin to Airtable");
  assert.notEqual(write, -1, "the action no longer writes coordinates to Supabase");
  assert.ok(
    sync < write,
    "Supabase is written before the public sync — a failed sync would leave the queue clean and the map wrong",
  );
});

test("a failed public sync fails the whole correction rather than half of it", () => {
  const failure = actions.slice(actions.indexOf("} catch (err) {"));
  assert.match(failure, /ok: false/, "a failed Airtable sync still reports success");
  assert.match(failure, /coordinates\.verify\.failed/, "a failed sync is not audited");
});

test("only a published listing is corrected in Airtable", () => {
  assert.match(actions, /row\.pipeline_status === "approved" && Boolean\(row\.slug\)/);
  assert.match(actions, /state: "not_published"/);
});

test("the public cache in front of Airtable is dropped after a correction", () => {
  assert.match(actions, /purgePublicCatalogueCache/);
  assert.match(cache, /cms_bundle/, "purges a key the main app does not own");
  assert.match(cache, /method: "POST"/);
});

test("the correction is written to the human action log with its real outcome", () => {
  assert.match(actions, /action: "coordinates\.verify"/);
  assert.match(actions, /public_sync: publicSync\.state/);
});

// ── The narrow PATCH ─────────────────────────────────────────────────────────
// Republishing to move two numbers would rewrite ~90 fields and re-assert the
// live gate. A correction must not be able to publish, unpublish, or overwrite
// anything an owner has since changed.

test("the coordinate sync writes latitude and longitude and nothing else", () => {
  const fn = airtable.slice(airtable.indexOf("export async function syncCoordinatesToAirtable"));
  const body = fn.slice(0, fn.indexOf("\n}\n") + 1);
  const patched = body.match(/fields: \{([^}]*)\}/);
  assert.ok(patched, "no PATCH body found");
  const keys = patched[1].split(",").map((s) => s.split(":")[0].trim()).filter(Boolean);
  assert.deepEqual(keys.sort(), ["Latitude", "Longitude"]);
  assert.doesNotMatch(body, /Approved_For_ScoutIt/, "a pin correction can flip the live gate");
  assert.doesNotMatch(body, /Slug:/, "never write Airtable's computed Slug");
});

test("the sync refuses a listing that is not actually in the public CMS", () => {
  const fn = airtable.slice(airtable.indexOf("export async function syncCoordinatesToAirtable"));
  assert.match(fn.slice(0, 2000), /if \(!recordId\)/);
});

// ── The gap that made the queue pointless even at publish time ───────────────

test("publishing from Mission Control carries the pin", () => {
  assert.match(airtable, /\.\.\.coordinateFields\(property\),/);
  assert.match(airtable, /Latitude: point\.lat, Longitude: point\.lng/);
});

test("an unreachable cache never throws over a correction that already landed", () => {
  assert.match(cache, /catch \(err\)/);
  assert.doesNotMatch(cache, /throw new Error/);
});
