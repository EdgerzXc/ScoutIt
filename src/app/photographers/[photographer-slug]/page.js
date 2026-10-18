import { permanentRedirect } from "next/navigation";
import { siteUrl } from "@/lib/siteUrl";


const DUMMY_PHOTOGRAPHERS = [];

export async function generateMetadata({ params }) {
  const { "photographer-slug": slug } = await params;
  const ph = DUMMY_PHOTOGRAPHERS.find(p => p.id === slug);
  return {
    title: ph ? `${ph.name} · Photographer Profile` : "Photographer Profile",
    description: ph ? ph.bio : "Verified ScoutIt partner photographer.",
    // Without this the profile inherits `canonical: "/photographers"` from the
    // parent layout, pointing Google at the directory instead of this page.
    alternates: { canonical: siteUrl(`/photographers/${slug}`) },
    // A-146: the roster is empty, so every slug 404s — a canonical on a
    // guaranteed 404 is a crawl-budget claim on nothing. Noindex until a real
    // profile can resolve.
    robots: { index: false, follow: true },
  };
}

export default async function PhotographerDetailPage({ params }) {
  const { "photographer-slug": slug } = await params;
  permanentRedirect(`/profile/${encodeURIComponent(slug)}?from=photographers`);
}
