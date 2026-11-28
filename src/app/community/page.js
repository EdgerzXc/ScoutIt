import { permanentRedirect } from "next/navigation";

export const metadata = {
  title: "Community · Spatial Radar & Market Signals | ScoutIt",
  description:
    "Browse community signals in the Stratosphere feed.",
  alternates: { canonical: "/stratosphere/signals" },
};

// A-145 continuity: /community was an orphaned duplicate of the
// /stratosphere radar view (same terminal, no in-app links to it).
// Community signals live in one place — the Stratosphere workspace —
// so this route hands off instead of maintaining a second copy.
export default function CommunityPage() {
  permanentRedirect("/stratosphere/signals?source=community");
}
