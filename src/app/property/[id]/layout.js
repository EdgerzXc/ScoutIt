import Header from "@/components/Header";
import LedgerButtons from "@/components/shared/LedgerButtons";
import EcosystemActionBar from "@/components/shared/EcosystemActionBar";

export default function PropertyUniversalFrame({ children }) {
  return (
    <div className="property-universal-frame relative min-h-screen">
      <Header />
      
      {/* Floating Ledger / Reaction Buttons */}
      <div style={{ position: 'fixed', right: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 50 }}>
        <LedgerButtons />
      </div>

      <main className="injected-content-area">
        {children}
      </main>

      <EcosystemActionBar />
    </div>
  );
}
