import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BrokerDossierEditor from "@/components/brokers/BrokerDossierEditor";
import "../[broker-slug]/broker-detail.css";

export const metadata = {
  title: "Broker Dossier Editor · ScoutIt",
  description: "Private structured editor for a broker's ScoutIt dossier.",
  robots: { index: false, follow: false },
};

export default function BrokersPortalPage() {
  return (
    <div className="page-wrapper">
      <Header />
      <BrokerDossierEditor />
      <Footer />
    </div>
  );
}
