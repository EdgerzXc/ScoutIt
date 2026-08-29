import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ─────────────────────────────────────────────────────────────────────────
// Regression cover for the sign-in hang of 2026-08-29.
//
// supabase-js holds an internal lock for the duration of an
// onAuthStateChange callback. Calling any supabase.auth.* method from inside
// that callback waits on the lock the callback still holds, so the promise
// never settles. In DashboardContext the callback was `async () => await
// fetchVerifiedUser()`, and fetchVerifiedUser awaits getUser() — so every
// magic-link sign-in deadlocked and VerifiedWorkspaceBoundary sat on
// "Verifying your access…" forever. An ordinary page load was unaffected,
// because it never fired the event.
//
// These are source assertions rather than render tests: this repo writes JSX
// in .js files, which the vitest pipeline will not parse (see ACTIVE.md,
// "Not in this queue, on purpose").
// ─────────────────────────────────────────────────────────────────────────

const ROOT = join(process.cwd(), "src");

const read = (relative) => readFileSync(join(ROOT, relative), "utf8");

const CALLBACK_SITES = [
  "context/DashboardContext.js",
  "components/descent/useVerifiedIdentity.js",
  "components/ui/ProfileButton.js",
];

/** Extract the argument list of the onAuthStateChange( ... ) call. */
function callbackSource(source) {
  const start = source.indexOf("onAuthStateChange(");
  if (start === -1) return "";
  let depth = 0;
  for (let i = start + "onAuthStateChange".length; i < source.length; i += 1) {
    if (source[i] === "(") depth += 1;
    if (source[i] === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return "";
}

describe("onAuthStateChange callbacks cannot deadlock supabase-js", () => {
  it.each(CALLBACK_SITES)("%s registers a synchronous callback", (file) => {
    const body = callbackSource(read(file));
    expect(body, `${file} should call onAuthStateChange`).not.toBe("");
    // An async callback is the shape that allowed `await` back in.
    expect(body).not.toMatch(/onAuthStateChange\(\s*async/);
  });

  it.each(CALLBACK_SITES)("%s never awaits inside the callback", (file) => {
    const body = callbackSource(read(file));
    expect(body).not.toMatch(/\bawait\b/);
  });

  it.each(CALLBACK_SITES)("%s defers its auth work out of the lock", (file) => {
    const body = callbackSource(read(file));
    // The work that touches supabase.auth must be scheduled, not called
    // straight from the callback body while the lock is still held.
    expect(body).toMatch(/setTimeout\(/);
  });

  it("DashboardContext bounds the auth check so it cannot spin forever", () => {
    const source = read("context/DashboardContext.js");
    expect(source).toMatch(/withAuthTimeout\(\s*getUser\(\)\s*\)/);
    expect(source).toMatch(/AUTH_RESOLVE_TIMEOUT_MS/);
    // A timeout must resolve to a signed-out shape, never reject — a
    // rejection here would land in the catch and strand the spinner again.
    expect(source).toMatch(/resolve\(\{\s*data:\s*\{\s*user:\s*null\s*\}/);
  });

  it("ProfileButton actually releases its subscription on unmount", () => {
    const source = read("components/ui/ProfileButton.js");
    // The old code returned a cleanup from inside .then(), which React never
    // received, so the subscription leaked on every mount.
    expect(source).toMatch(/subscription\?\.unsubscribe\(\)/);
    expect(source).not.toMatch(/return\s*\(\)\s*=>\s*subscription\?\.unsubscribe\(\);\s*\}\);/);
  });
});
