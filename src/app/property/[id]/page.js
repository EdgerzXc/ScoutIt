// Case-sensitivity routing diagnostics trigger
import PropertyDetailClient from "./PropertyDetailClient";

export async function generateMetadata({ params }) {
  // We can fetch from API for metadata if needed, but keeping it simple
  return {
    title: "Property Intel — ScoutIt",
    description: "Property Intelligence Vector"
  };
}

export default function PropertyRoute({ params }) {
  // Use params.id
  return (
    <main>
      <PropertyDetailClient slug={params.id} />
    </main>
  );
}
