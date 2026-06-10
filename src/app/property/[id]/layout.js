import Header from "@/components/Header";
import LedgerButtons from "@/components/shared/LedgerButtons";
import EcosystemActionBar from "@/components/shared/EcosystemActionBar";

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
