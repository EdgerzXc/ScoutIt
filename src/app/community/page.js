import Header from "@/components/layout/Header";
import StratosphereTerminal from "@/components/stratosphere/StratosphereTerminal";

export const metadata = {
  title: "Community — Spatial Radar & Market Signals | ScoutIt",
  description:
    "Spatial intelligence terminal and community demand radar across Metro Manila's commercial and residential landscape.",
  alternates: { canonical: "/community" },
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans">
      <Header />
      <main className="flex-1 w-full flex flex-col">
        <StratosphereTerminal initialViewMode="SPATIAL" />
      </main>
    </div>
  );
}
