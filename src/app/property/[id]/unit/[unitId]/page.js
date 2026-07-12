import UnitMasterPage from "@/components/property/UnitMasterPage";

import { fetchProperties } from "@/lib/airtable";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  
  let seoTitle = `Unit Intel — ${resolvedParams.id} — ScoutIt`;
  let seoDescription = "Unit-level Space Intelligence Vector";
  let imageUrl = "https://scoutit.com/og-default.jpg";
  let url = `https://scoutit.com/property/${resolvedParams.id}/unit/${resolvedParams.unitId}`;

  if (apiKey && baseId) {
    try {
      const properties = await fetchProperties(apiKey, baseId);
      const match = properties.find(
        (p) =>
          (p.slug && p.slug.toLowerCase() === resolvedParams.id.toLowerCase()) ||
          (p.id && p.id === resolvedParams.id)
      );
      if (match) {
        const unit = (match.units_inventory || []).find(u => u.id === resolvedParams.unitId);
        if (unit) {
          seoTitle = `${unit.name} · ${match.title} | ScoutIt`;
          seoDescription = `Premium ${unit.size ? `${unit.size} sqm ` : ""}space at ${match.title}. Explore floor plans, 3D layouts, and pricing on ScoutIt.`;
          
          const photo = Array.isArray(unit.photos) && unit.photos.length > 0 
            ? unit.photos.find(Boolean) 
            : (unit.image || unit.photo);
            
          if (photo) {
            imageUrl = photo;
          } else {
            // Fallback to property photo if unit has no photo
            const propPhoto = Array.isArray(match.photos) ? match.photos.find(Boolean) : (match.photo || match.image);
            if (propPhoto) imageUrl = propPhoto;
          }
        }
        if (match.slug) url = `https://scoutit.com/property/${match.slug}/unit/${resolvedParams.unitId}`;
      }
    } catch {}
  }

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: url,
      siteName: 'ScoutIt',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: seoTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [imageUrl],
    },
  };
}

export default async function UnitRoute({ params }) {
  const resolvedParams = await params;
  return <UnitMasterPage slug={resolvedParams.id} unitId={resolvedParams.unitId} />;
}
