export async function generateMetadata({ params }) {
  const { "article-slug": slug } = await params;
  return {
    title: slug
      ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Intel",
    description: "In-depth real estate intelligence and market analysis by ScoutIt.",
  };
}

export default async function IntelArticlePage({ params }) {
  const { "article-slug": slug } = await params;
  return (
    <main>
      <h1>Intel: {slug}</h1>
    </main>
  );
}
