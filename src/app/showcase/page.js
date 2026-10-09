import ShowcaseStage from "@/components/board/ShowcaseStage";

export const metadata = {
  alternates: { canonical: "/showcase" },
  title: "Orbit Rankings · ScoutIt",
  description: "The most-inquired Philippine properties, ranked across cosmic tiers — ScoutIT's Space Intelligence showcase.",
};

export default function ShowcasePage() {
  return (
    <main className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] overflow-x-hidden">
      <ShowcaseStage mode="full" />
    </main>
  );
}
