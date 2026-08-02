import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PropertyUniversalFrame({ children }) {
  return (
    <div className="property-universal-frame relative min-h-screen">
      <Header />
      
      <main className="injected-content-area">
        {children}
      </main>

      <Footer />
    </div>
  );
}
