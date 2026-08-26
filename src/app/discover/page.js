import DiscoverClient from "./DiscoverClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import { Suspense } from "react";
import { getCmsBundle } from "@/lib/cmsCache";
import { stripPremiumFields } from "@/lib/premiumFields";
import "./discover.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discover",
  description:
    "Browse intelligent property briefings across major Philippine hubs. Filter by city and structural specifications.",
};

async function loadInitialDiscoverData() {
  try {
    const bundle = await getCmsBundle();
    return {
      properties: (bundle?.properties || []).map((p) => stripPremiumFields(p, "starry")),
      intel: bundle?.intel || [],
    };
  } catch (err) {
    console.error("[/discover] server CMS load failed:", err?.message);
    return { properties: [], intel: [] };
  }
}

export default async function DiscoverPage() {
  const initialData = await loadInitialDiscoverData();

  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="discoverPage" aria-busy="true" style={{ minHeight: "100vh" }}>
            <AtmosphereBackground />
            <div className="discoverContainer">
              <aside className="categoryRail" aria-hidden="true">
                <div style={{ height: "40px", borderBottom: "1px solid var(--border-solid)", marginBottom: "20px" }} />
                <nav className="railNav">
                  {["Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues/Events"].map((cat) => (
                    <span key={cat} className="navLink" style={{ opacity: 0.5 }}>{cat}</span>
                  ))}
                </nav>
              </aside>
              <main className="engineContainer">
                <div className="engineFrame">
                  <div className="discoverTopBar">
                    <div className="discoverTitleBlock">
                      <span className="discoverKicker">Layer 2.1 // Discovery</span>
                      <h1 className="discoverTitle">Residential</h1>
                    </div>
                  </div>
                  <div style={{ minHeight: "300px", padding: "40px 0" }}>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontSize: "12px", letterSpacing: "0.12em" }}>
                      INITIALIZING DISCOVERY ENGINE…
                    </span>
                  </div>
                </div>
                <Footer />
              </main>
            </div>
          </div>
        }
      >
        <DiscoverClient initialProperties={initialData.properties} initialIntel={initialData.intel} />
      </Suspense>

    </>
  );
}
