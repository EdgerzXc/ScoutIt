import BrokersClient from "./BrokersClient";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return {
    title: `Authorized Brokers — ${resolvedParams.id} — ScoutIt`,
    description: "Verified Philippine real estate brokers authorized for this asset."
  };
}

export default async function BrokersRoute({ params }) {
  const resolvedParams = await params;
  return <BrokersClient slug={resolvedParams.id} />;
}
