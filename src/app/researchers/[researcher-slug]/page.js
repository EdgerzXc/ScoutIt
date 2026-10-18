import { permanentRedirect } from "next/navigation";
import { siteUrl } from "@/lib/siteUrl";

const DUMMY_RESEARCHERS = [];

export async function generateMetadata({ params }) {
  const { "researcher-slug": slug } = await params;
  const r = DUMMY_RESEARCHERS.find(x => x.id === slug);
  return {
    title: r ? `${r.name} · Site Intelligence Profile` : "Site Researcher Profile",
    description: r ? r.bio : "Verified ScoutIt partner site researcher.",
    // Without this the profile inherits `canonical: "/researchers"` from the
    // parent layout, pointing Google at the directory instead of this page.
    alternates: { canonical: siteUrl(`/researchers/${slug}`) },
    robots: { index: false, follow: true },
  };
}

export default async function ResearcherDetailPage({ params }) {
  const { "researcher-slug": slug } = await params;
  permanentRedirect(`/profile/${encodeURIComponent(slug)}?from=researchers`);
}
