import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StratosphereWorkspace from "@/components/stratosphere/StratosphereWorkspace";

export const metadata = {
  title: "Stratosphere — Articles & Spatial Radar | ScoutIt",
  description: "Browse ScoutIt articles and explore sourced building updates by stage and area.",
  alternates: { canonical: "/stratosphere" },
};

export default function StratospherePage() {
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
      <Header />
      <StratosphereWorkspace />
      <Footer />
    </div>
  );
}
