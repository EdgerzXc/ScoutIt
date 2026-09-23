import { describe, expect, it } from "vitest";
import { mergeStratosphereArticles } from "../stratosphereArticles";

describe("Stratosphere article library", () => {
  it("shows every published article and keeps only unmatched examples", () => {
    const rows = mergeStratosphereArticles(
      [{ slug: "same", title: "Published title", lifecycle: "completed" }, { slug: "live", title: "Live update" }],
      [{ slug: "same", title: "Example title" }, { slug: "sample", title: "Sample update" }]
    );
    expect(rows.map((row) => row.slug)).toEqual(["same", "live", "sample"]);
    expect(rows[0]).toMatchObject({ title: "Published title", isSample: false, lifecycle: "completed" });
    expect(rows[2]).toMatchObject({ isSample: true });
  });
});
