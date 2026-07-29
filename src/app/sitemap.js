import { fetchProperties } from "@/lib/airtable";
import { siteUrl } from "@/lib/siteUrl";

export default async function sitemap() {
  const baseUrl = siteUrl();
  const currentDate = new Date().toISOString();

  // Core static public pages
  const staticRoutes = [
    { url: `${baseUrl}`, lastModified: currentDate, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/discover`, lastModified: currentDate, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/brokers`, lastModified: currentDate, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/enterprise`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/intel`, lastModified: currentDate, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/photographers`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/event-planners`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/researchers`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/badges`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: currentDate, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Dynamic property pages from Airtable
  let propertyRoutes = [];
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (apiKey && baseId) {
      const properties = await fetchProperties(apiKey, baseId);
      propertyRoutes = properties
        .filter((p) => p.slug)
        .map((p) => ({
          url: `${baseUrl}/property/${p.slug}`,
          lastModified: currentDate,
          changeFrequency: "weekly",
          priority: 0.8,
        }));
    }
  } catch (error) {
    console.error("Sitemap: Failed to fetch property routes from Airtable", error);
  }

  return [...staticRoutes, ...propertyRoutes];
}
