import assert from "node:assert/strict";
import test from "node:test";

// A-071 (Mission Control half) — the console that renders service-role views of
// every user, deal, dispute and claim had effectively no CSP:
//
//   Content-Security-Policy: frame-ancestors 'none'; object-src 'none';
//
// No `default-src`, no `script-src`. So any origin on the internet could serve
// a script into the highest-privilege surface ScoutIt operates, while the
// public marketing site had a full policy. It also set no HSTS header, though
// the main app does.
//
// The main site's CSP is deliberately NOT touched here — removing its
// 'unsafe-inline'/'unsafe-eval' is A-056 and needs its own risk pass.

process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://example.supabase.co";
const { default: config } = await import("../next.config.mjs");

const headers = (await config.headers())[0].headers;
const get = (key) => headers.find((h) => h.key === key)?.value;
const csp = get("Content-Security-Policy") || "";
const directive = (name) => {
  const match = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `) || d === name);
  return match ? match.slice(name.length).trim() : null;
};

test("the console declares a real default-src and script-src", () => {
  assert.ok(directive("default-src"), "default-src is missing");
  assert.ok(directive("script-src"), "script-src is missing");
  assert.match(directive("default-src"), /'self'/);
  assert.match(directive("script-src"), /'self'/);
});

test("script-src is an allowlist, not open to any origin", () => {
  const scriptSrc = directive("script-src");
  assert.ok(!scriptSrc.includes("*"), "script-src must not contain a wildcard origin");
  assert.ok(!scriptSrc.includes("'unsafe-eval'"), "the console runs no WebGL; unsafe-eval is not needed");
  // Leaflet is loaded from unpkg by the Security Center map. Pinning it is a
  // deliberate allowance, recorded — not an accident.
  assert.match(scriptSrc, /https:\/\/unpkg\.com/);
});

test("the directives the console actually needs are all present", () => {
  for (const name of [
    "default-src",
    "script-src",
    "style-src",
    "img-src",
    "font-src",
    "connect-src",
    "frame-ancestors",
    "object-src",
    "base-uri",
    "form-action",
  ]) {
    assert.ok(directive(name) !== null, `${name} is missing from the console CSP`);
  }
});

test("the two directives the old policy did have are preserved", () => {
  assert.match(directive("frame-ancestors"), /'none'/);
  assert.match(directive("object-src"), /'none'/);
});

test("the browser can still reach Supabase, or the console cannot sign anyone in", () => {
  assert.match(directive("connect-src"), /example\.supabase\.co/);
});

test("the Security Center map can still load its tiles and stylesheet", () => {
  assert.match(directive("img-src"), /cartocdn\.com|https:/);
  assert.match(directive("style-src"), /https:\/\/unpkg\.com/);
});

test("the console sends HSTS, which the main app already did and this did not", () => {
  const hsts = get("Strict-Transport-Security");
  assert.ok(hsts, "Strict-Transport-Security is missing");
  assert.match(hsts, /max-age=\d{7,}/);
  assert.match(hsts, /includeSubDomains/);
});

test("the headers that were already correct are untouched", () => {
  assert.match(get("X-Frame-Options"), /DENY/);
  assert.match(get("X-Robots-Tag"), /noindex/);
  assert.match(get("Referrer-Policy"), /no-referrer/);
  assert.match(get("X-Content-Type-Options"), /nosniff/);
});
