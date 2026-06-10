import ShowcaseStage from "@/components/ShowcaseStage";

export const metadata = {
  title: "The Board · ScoutIT",
  description: "The most-inquired Philippine properties, ranked across cosmic tiers — ScoutIT's Space Intelligence showcase.",
};

export default function ShowcasePage() {
  return (
    <main style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "#000", overflow: "hidden" }}>
      <ShowcaseStage mode="full" />
    </main>
  );
}
