// Case-sensitivity routing diagnostics trigger and async params fix
import PropertyDetailClient from "./PropertyDetailClient";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return {
    title: `Property Intel — ${resolvedParams.id} — ScoutIt`,
    description: "Property Intelligence Vector"
  };
}

export default async function PropertyRoute({ params }) {
  const resolvedParams = await params;
  return (
    <main>
      <PropertyDetailClient slug={resolvedParams.id} />
    </main>
  );
}
