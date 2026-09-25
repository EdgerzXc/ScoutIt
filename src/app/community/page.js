import { permanentRedirect } from "next/navigation";

export const metadata = {
  title: "Community — Spatial Radar & Market Signals | ScoutIt",
  description:
    "Community signals live inside the Stratosphere workspace. You are being taken to the spatial radar.",
  alternates: { canonical: "/stratosphere" },
};

// A-145 continuity: /community was an orphaned duplicate of the
// /stratosphere radar view (same terminal, no in-app links to it).
// Community signals live in one place — the Stratosphere workspace —
// so this route hands off instead of maintaining a second copy.
export default function CommunityPage() {
  permanentRedirect("/stratosphere?view=radar");
}
