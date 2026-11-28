import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StratosphereWorkspace from "@/components/stratosphere/StratosphereWorkspace";

export const metadata = {
  title: "Community & Signals | ScoutIt Stratosphere",
  description: "Browse community posts and ScoutIt updates by district, role, or space type.",
  alternates: { canonical: "/stratosphere/signals" },
};

export default async function SignalResultsPage({ searchParams }) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
      <Header />
      <StratosphereWorkspace resultsOnly initialStage={params?.stage} />
      <Footer />
    </div>
  );
}
