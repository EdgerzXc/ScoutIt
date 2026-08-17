import ShowcaseStage from "@/components/board/ShowcaseStage";

export const metadata = {
  title: "Orbit Rankings · ScoutIT",
  description: "The most-inquired Philippine properties, ranked across cosmic tiers — ScoutIT's Space Intelligence showcase.",
};

export default function ShowcasePage() {
  return (
    <main className="min-h-screen w-full bg-black text-[#f5f3ee] overflow-x-hidden">
      <ShowcaseStage mode="full" />
    </main>
  );
}
