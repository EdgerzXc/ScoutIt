import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StratosphereWorkspace from "@/components/stratosphere/StratosphereWorkspace";

export const metadata = {
  title: "Stratosphere: Articles & Spatial Radar | ScoutIt",
  description: "Browse ScoutIt articles and explore sourced building updates by stage and area.",
  alternates: { canonical: "/stratosphere" },
};

export default async function StratospherePage({ searchParams }) {
  const sp = await searchParams;
  const initialView = sp?.view === "radar" ? "radar" : "articles";
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
      <Header />
      <StratosphereWorkspace
        initialView={initialView}
        initialStage={sp?.stage}
        initialQuery={sp?.q}
        initialSignal={sp?.signal}
      />
      <Footer />
    </div>
  );
}
