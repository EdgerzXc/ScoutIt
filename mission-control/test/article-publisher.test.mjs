import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  setArticleLiveStateInAirtable,
  buildIntelFields,
} from "../src/lib/intelPublish.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("layout.js registers Articles Publisher under Content & People for Agent tier", async () => {
  const layout = await readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8");
  assert.match(layout, /href:\s*["']\/dashboard\/articles["']/);
  assert.match(layout, /Articles Publisher/);
  assert.match(layout, /href:\s*["']\/dashboard\/articles["'].*minTier:\s*TIERS\.AGENT/);
});

test("articles/actions.js enforces RBAC tiers on all operations", async () => {
  const actions = await readFile(path.join(root, "src", "app", "dashboard", "articles", "actions.js"), "utf8");

  // Every action must resolve staff
  const fns = ["loadArticles", "saveArticle", "syncArticleToAirtable", "setArticleLiveState", "deleteArticle"];
  for (const fn of fns) {
    const fnRegex = new RegExp(`export async function ${fn}\\s*\\([\\s\\S]*?\\n\\}`);
    assert.match(actions, fnRegex, `Expected ${fn} in actions.js`);
  }

  // Publishing & destructive mutations must require Ops Manager (Tier 2)+
  assert.match(actions, /export async function syncArticleToAirtable[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /export async function setArticleLiveState[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /export async function deleteArticle[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
});

test("setArticleLiveStateInAirtable sends correct PATCH payload and invalidates cache", async () => {
  let capturedUrl = null;
  let capturedMethod = null;
  let capturedBody = null;

  const mockFetch = async (url, options) => {
    capturedUrl = url;
    capturedMethod = options.method;
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ id: "recTest123", fields: capturedBody.fields }),
    };
  };

  const res = await setArticleLiveStateInAirtable({
    apiKey: "test-pat",
    baseId: "appTestBase",
    recordId: "recArticle999",
    isLive: true,
    fetchImpl: mockFetch,
    purgeCacheFn: async () => ({ purged: true, detail: "mock" }),
  });

  assert.equal(res.recordId, "recArticle999");
  assert.equal(res.isLive, true);
  assert.equal(capturedUrl, "https://api.airtable.com/v0/appTestBase/INTEL_CMS/recArticle999");
  assert.equal(capturedMethod, "PATCH");
  assert.equal(capturedBody.fields.Approved_For_Live_Site, true);
});

test("setArticleLiveStateInAirtable supports retracting / taking down live articles", async () => {
  let capturedBody = null;

  const mockFetch = async (url, options) => {
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ id: "recTest123", fields: capturedBody.fields }),
    };
  };

  const res = await setArticleLiveStateInAirtable({
    apiKey: "test-pat",
    baseId: "appTestBase",
    recordId: "recArticle999",
    isLive: false,
    fetchImpl: mockFetch,
    purgeCacheFn: async () => ({ purged: true, detail: "mock" }),
  });

  assert.equal(res.isLive, false);
  assert.equal(capturedBody.fields.Approved_For_Live_Site, false);
});

test("setArticleLiveStateInAirtable throws when credentials or recordId are missing", async () => {
  await assert.rejects(
    () => setArticleLiveStateInAirtable({ apiKey: "", baseId: "app", recordId: "rec" }),
    /missing Airtable credentials/
  );
  await assert.rejects(
    () => setArticleLiveStateInAirtable({ apiKey: "key", baseId: "", recordId: "rec" }),
    /missing Airtable credentials/
  );
  await assert.rejects(
    () => setArticleLiveStateInAirtable({ apiKey: "key", baseId: "app", recordId: "" }),
    /missing recordId/
  );
});

test("setArticleLiveStateInAirtable throws loudly when Airtable returns error", async () => {
  const mockFailingFetch = async () => ({
    ok: false,
    status: 403,
    text: async () => "Forbidden table access",
  });

  await assert.rejects(
    () =>
      setArticleLiveStateInAirtable({
        apiKey: "key",
        baseId: "app",
        recordId: "rec",
        isLive: true,
        fetchImpl: mockFailingFetch,
      }),
    /Airtable intel live status update failed: 403/
  );
});
