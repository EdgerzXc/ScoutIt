import { describe, test, expect } from "vitest";
import { escapeJsonLd } from "@/lib/jsonLdScript";
import { buildPropertyJsonLd, mergeFaqIntoOverride } from "@/lib/propertySchema";

// U-008 — JSON.stringify does not escape "<". Its output was passed straight to
// dangerouslySetInnerHTML inside <script type="application/ld+json">, so any
// owner-controlled string containing "</script>" terminated the block early and
// everything after it was parsed as HTML.

describe("escapeJsonLd", () => {
  test("escapes a closing script tag so it cannot terminate the block", () => {
    const raw = JSON.stringify({ name: "Tower</script><script>alert(1)</script>" });

    const escaped = escapeJsonLd(raw);

    expect(escaped).not.toContain("</script");
    expect(escaped).toContain(String.raw`\u003c`);
  });

  test("escapes an HTML comment opener", () => {
    const escaped = escapeJsonLd(JSON.stringify({ name: "<!--" }));

    expect(escaped).not.toContain("<!--");
  });

  test("preserves the data exactly — the escape is transport, not mutation", () => {
    const original = { name: "Tower</script>", note: "a & b", tag: "<b>bold</b>" };

    const parsed = JSON.parse(escapeJsonLd(JSON.stringify(original)));

    expect(parsed).toEqual(original);
  });

  test("escapes the line separators that are legal in JSON but not in JS", () => {
    const escaped = escapeJsonLd(JSON.stringify({ name: "a b c" }));

    expect(escaped).not.toContain(" ");
    expect(escaped).not.toContain(" ");
    expect(JSON.parse(escaped).name).toBe("a b c");
  });

  test("returns an empty string for a nullish payload rather than the word null", () => {
    expect(escapeJsonLd(null)).toBe("");
    expect(escapeJsonLd(undefined)).toBe("");
  });
});

describe("property JSON-LD is safe at the sink", () => {
  const hostileTitle = 'Penthouse</script><script>alert("xss")</script>';

  test("a hostile listing title cannot break out of the ld+json block", () => {
    const json = buildPropertyJsonLd(
      { title: hostileTitle, slug: "hostile-listing", location: "BGC, Taguig" },
      "hostile-listing",
      []
    );

    expect(escapeJsonLd(json)).not.toContain("</script");
  });

  test("an operator override returned untouched is still escaped at the sink", () => {
    // mergeFaqIntoOverride deliberately returns the operator's string unchanged
    // when there are no FAQs, so the builder cannot be the only place we escape.
    const override = JSON.stringify({ "@type": "Residence", name: hostileTitle });

    const merged = mergeFaqIntoOverride(override, [], "https://example.com/p/x");

    expect(merged).toContain("</script");
    expect(escapeJsonLd(merged)).not.toContain("</script");
  });
});

// A helper nobody calls is not a fix. These read the real source files and fail
// if any ld+json sink ever goes back to injecting an unescaped string.
describe("every ld+json sink routes through escapeJsonLd", () => {
  const fs = require("node:fs");

  const SINKS = [
    "src/app/property/[id]/page.js",
    "src/app/hubs/[slug]/page.js",
    "src/components/seo/JsonLd.js",
  ];

  test.each(SINKS)("%s imports the escaper", (file) => {
    expect(fs.readFileSync(file, "utf8")).toContain("escapeJsonLd");
  });

  test.each(SINKS)("%s has no raw JSON.stringify inside a ld+json sink", (file) => {
    const source = fs.readFileSync(file, "utf8");
    const rawInjection = /__html:\s*JSON\.stringify\(/g;
    expect(source.match(rawInjection)).toBeNull();
  });
});
