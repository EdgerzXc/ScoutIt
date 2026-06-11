import Header from "@/components/layout/Header";
import LedgerButtons from "@/components/property/LedgerButtons";
import EcosystemActionBar from "@/components/property/EcosystemActionBar";

export default function PropertyUniversalFrame({ children }) {
  return (
    <div className="property-universal-frame relative min-h-screen">
      <Header />
      
      <main className="injected-content-area">
        {children}
      </main>

      <EcosystemActionBar />
    </div>
  );
}
