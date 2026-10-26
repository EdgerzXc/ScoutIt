import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  setBrokerLiveStateInAirtable,
  setBrokerLicenseVerifiedInAirtable,
} from "../src/lib/brokerCms.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("layout.js registers Broker Directory under Content & People for Agent tier", async () => {
  const layout = await readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8");
  assert.match(layout, /href:\s*["']\/dashboard\/brokers["']/);
  assert.match(layout, /Broker Directory/);
  assert.match(layout, /href:\s*["']\/dashboard\/brokers["'][\s\S]*?minTier:\s*TIERS\.AGENT/);
});

test("brokers/actions.js enforces RBAC tiers and audit logging", async () => {
  const actions = await readFile(path.join(root, "src", "app", "dashboard", "brokers", "actions.js"), "utf8");
  assert.match(actions, /export async function loadBrokers[\s\S]*?assertTier\(staff,\s*TIERS\.AGENT\)/);
  assert.match(actions, /export async function setBrokerLiveStatus[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /export async function setBrokerLicenseVerification[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /logActionStrict\(\{[\s\S]*?targetTable:\s*["']BROKERS_CMS["']/);
  assert.match(actions, /notifyUser/);
});

test("setBrokerLiveStateInAirtable PATCHes Approved_For_Live_Site and purges cache", async () => {
  let capturedUrl = null;
  let capturedMethod = null;
  let capturedBody = null;
  let cachePurged = false;

  const mockFetch = async (url, options) => {
    capturedUrl = url;
    capturedMethod = options.method;
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ id: "recBroker123", fields: capturedBody.fields }),
    };
  };

  const res = await setBrokerLiveStateInAirtable({
    apiKey: "test-pat",
    baseId: "appBase123",
    recordId: "recBroker123",
    isLive: false,
    fetchImpl: mockFetch,
    purgeCacheFn: async () => {
      cachePurged = true;
      return { purged: true };
    },
  });

  assert.equal(res.recordId, "recBroker123");
  assert.equal(res.isLive, false);
  assert.equal(capturedUrl, "https://api.airtable.com/v0/appBase123/BROKERS_CMS/recBroker123");
  assert.equal(capturedMethod, "PATCH");
  assert.equal(capturedBody.fields.Approved_For_Live_Site, false);
  assert.equal(cachePurged, true);
});

test("setBrokerLicenseVerifiedInAirtable PATCHes License_Verified", async () => {
  let capturedBody = null;

  const mockFetch = async (url, options) => {
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ id: "recBroker123", fields: capturedBody.fields }),
    };
  };

  const res = await setBrokerLicenseVerifiedInAirtable({
    apiKey: "test-pat",
    baseId: "appBase123",
    recordId: "recBroker123",
    isVerified: true,
    fetchImpl: mockFetch,
    purgeCacheFn: async () => ({ purged: true }),
  });

  assert.equal(res.recordId, "recBroker123");
  assert.equal(res.isVerified, true);
  assert.equal(capturedBody.fields.License_Verified, true);
});

test("brokerCms functions throw when credentials or recordId are missing", async () => {
  await assert.rejects(
    () => setBrokerLiveStateInAirtable({ apiKey: "", baseId: "app123", recordId: "rec123" }),
    /missing Airtable credentials/
  );
  await assert.rejects(
    () => setBrokerLiveStateInAirtable({ apiKey: "key", baseId: "app123", recordId: "" }),
    /missing recordId/
  );
});
