import BrokersClient from "./BrokersClient";
import { siteUrl } from "@/lib/siteUrl";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return {
    title: `Authorized Brokers — ${resolvedParams.id} — ScoutIt`,
    description: "Verified Philippine real estate brokers authorized for this asset.",
    // Declare our own canonical, otherwise src/app/property/layout.js's
    // "/property" canonical is inherited here too.
    alternates: { canonical: siteUrl(`/property/${resolvedParams.id}/brokers`) },
  };
}

export default async function BrokersRoute({ params }) {
  const resolvedParams = await params;
  return <BrokersClient slug={resolvedParams.id} />;
}
