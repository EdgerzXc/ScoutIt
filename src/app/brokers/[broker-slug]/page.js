export async function generateMetadata({ params }) {
  const { "broker-slug": slug } = await params;
  return {
    title: slug
      ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Broker Profile",
    description: "Verified ScoutIt broker profile and listing portfolio.",
  };
}

export default async function BrokerProfilePage({ params }) {
  const { "broker-slug": slug } = await params;
  return (
    <main>
      <h1>Broker: {slug}</h1>
    </main>
  );
}
