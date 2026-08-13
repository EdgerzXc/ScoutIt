import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("human-testing sample inventory contract", () => {
  it("normalizes the Airtable checkbox and displays the full disclosure", () => {
    const airtable = read("src/lib/airtable.js");
    const badge = read("src/components/ui/ProvenanceBadge.js");
    expect(airtable).toContain("is_sample:");
    expect(airtable).toContain("f.Is_Sample === true");
    expect(airtable).toContain("isSamplePropertySlug(f.Slug)");
    expect(badge).toContain("Sample data &mdash; for human testing");
    expect(badge).toContain("isSamplePropertySlug(record.slug)");
    expect(badge).not.toContain("text-[#");
  });

  it("discloses sample records in the main property directory", () => {
    const directory = read("src/app/property/DirectoryClient.js");
    const discover = read("src/app/discover/DiscoverClient.js");
    const residential = read("src/components/property/ResidentialFlow.js");
    const cmsCache = read("src/lib/cmsCache.js");
    expect(directory).toContain("is_sample:     p.is_sample === true");
    expect(directory).toContain("<ProvenanceBadge record={p} />");
    expect(discover).toContain("is_sample: p.is_sample === true");
    expect(discover).toContain("...property, is_sample: true");
    expect(residential).toContain('mobile-hero-title">{d.title}<ProvenanceBadge record={d} />');
    expect(cmsCache).toContain("normalizeSampleBundle(cachedBundle)");
  });
  it("keeps sample property and child-space routes out of indexing", () => {
    const propertyPage = read("src/app/property/[id]/page.js");
    const unitPage = read("src/app/property/[id]/unit/[unitId]/page.js");
    const sitemap = read("src/app/sitemap.js");
    expect(propertyPage).toContain("robots: { index: false, follow: true }");
    expect(unitPage).toContain("robots: { index: false, follow: true }");
    expect(sitemap).toContain(".filter((p) => p.slug && !p.is_sample)");
  });

  it("suppresses property structured data for samples", () => {
    const propertyPage = read("src/app/property/[id]/page.js");
    expect(propertyPage).toContain("if (match && !match.is_sample)");
    expect(propertyPage).toContain("{jsonLd && (");
  });
});
