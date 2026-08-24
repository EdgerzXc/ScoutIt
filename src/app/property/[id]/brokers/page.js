import BrokersClient from "./BrokersClient";
import { notFound } from "next/navigation";

import { loadPublicProperty } from "@/lib/publicPropertyRouteData";
import { siteUrl } from "@/lib/siteUrl";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const property = await loadPublicProperty(resolvedParams.id);
  if (!property) notFound();

  const slug = property.slug || resolvedParams.id;
  return {
    title: `Authorized Brokers — ${property.title || slug} — ScoutIt`,
    description: "Verified Philippine real estate brokers authorized for this asset.",
    // Declare our own canonical, otherwise src/app/property/layout.js's
    // "/property" canonical is inherited here too.
    alternates: { canonical: siteUrl(`/property/${slug}/brokers`) },
  };
}

export default async function BrokersRoute({ params }) {
  const resolvedParams = await params;
  const property = await loadPublicProperty(resolvedParams.id);
  if (!property) notFound();

  return <BrokersClient slug={property.slug || resolvedParams.id} />;
}
