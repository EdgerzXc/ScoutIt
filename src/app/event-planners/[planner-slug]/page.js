import { permanentRedirect } from "next/navigation";
import { siteUrl } from "@/lib/siteUrl";

const DUMMY_PLANNERS = [];

export async function generateMetadata({ params }) {
  const { "planner-slug": slug } = await params;
  const ep = DUMMY_PLANNERS.find(x => x.id === slug);
  return {
    title: ep ? `${ep.name} · Event Design Profile` : "Event Designer Profile",
    description: ep ? ep.bio : "Verified ScoutIt partner event planner & designer.",
    // Without this the profile inherits `canonical: "/event-planners"` from the
    // parent layout, pointing Google at the directory instead of this page.
    alternates: { canonical: siteUrl(`/event-planners/${slug}`) },
    robots: { index: false, follow: true },
  };
}

export default async function EventPlannerDetailPage({ params }) {
  const { "planner-slug": slug } = await params;
  permanentRedirect(`/profile/${encodeURIComponent(slug)}?from=event-planners`);
}
