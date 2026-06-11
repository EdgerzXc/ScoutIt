import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LedgerButtons from "@/components/property/LedgerButtons";
import EcosystemActionBar from "@/components/property/EcosystemActionBar";

export default function PropertyUniversalFrame({ children }) {
  return (
    <div className="property-universal-frame relative min-h-screen">
      <Header />
      
      <main className="injected-content-area">
        {children}
      </main>

      <Footer />

      <EcosystemActionBar />
    </div>
  );
}
