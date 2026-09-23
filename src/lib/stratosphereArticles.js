import { getArticles } from "@/data/mock/mockArticles";

// Published CMS articles take precedence over illustrative rows with the same slug.
// The remaining examples stay visible and clearly labeled for launch testing.
export function mergeStratosphereArticles(liveRows = [], sampleRows = getArticles()) {
  const live = Array.isArray(liveRows) ? liveRows : [];
  const samples = Array.isArray(sampleRows) ? sampleRows : [];
  const bySlug = new Map();
  for (const row of live) {
    if (!row?.slug || !row?.title) continue;
    bySlug.set(row.slug, { ...row, isSample: false });
  }
  for (const row of samples) {
    if (!row?.slug || !row?.title || bySlug.has(row.slug)) continue;
    bySlug.set(row.slug, { ...row, isSample: true });
  }
  return [...bySlug.values()];
}
