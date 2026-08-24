import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// A-017 — every paid submit path currently depends on ImpeccableButton staying
// correct. A-016 fixed that component, but "the money is safe because a
// presentational component disables itself" is a fragile arrangement: the guard
// belongs next to the spend.
//
// WHY A REF AND NOT `if (status === "submitting")`:
// `status` is React state. Within a single tick it is STALE -- two clicks
// dispatched before the next render both read "composing" and both proceed.
// A ref updates synchronously, so the second call sees the first one's write.
// A state-based guard would look correct in review and fail under exactly the
// double-click it exists to stop, so these tests pin the ref specifically.

const PAID_SUBMIT_MODALS = [
  "src/components/property/InquiryModal.js",
  "src/components/property/UnitInquiryModal.js",
  "src/components/property/OperatorRequestModal.js",
];

function codeWithoutComments(path) {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join(" ");
}

describe.each(PAID_SUBMIT_MODALS)("%s", (file) => {
  it("holds an in-flight ref", () => {
    const code = codeWithoutComments(file);

    expect(code).toMatch(/useRef\(false\)/);
  });

  it("refuses a second submit before the first one settles", () => {
    const code = codeWithoutComments(file);
    const handler = code.slice(code.indexOf("const handleSubmit"));

    // The guard must appear before the status write that begins the submit.
    const guardAt = handler.search(/if\s*\([a-zA-Z]+Ref\.current\)\s*return/);
    const statusAt = handler.indexOf('setStatus("submitting")');

    expect(guardAt).toBeGreaterThan(-1);
    expect(statusAt).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(statusAt);
  });

  it("releases the guard so a genuine retry after an error still works", () => {
    const code = codeWithoutComments(file);
    const handler = code.slice(code.indexOf("const handleSubmit"));

    // A guard that is set but never cleared turns one failed submit into a
    // permanently dead button.
    expect(handler).toMatch(/finally\s*\{[^}]*Ref\.current\s*=\s*false/);
  });

  it("imports useRef", () => {
    expect(readFileSync(file, "utf8")).toMatch(/import\s*\{[^}]*useRef[^}]*\}\s*from\s*"react"/);
  });
});
