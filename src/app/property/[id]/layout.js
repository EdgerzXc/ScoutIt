import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCmsBundle } from "@/lib/cmsCache";

async function getPropertyAmbientContext(params) {
  try {
    const { id } = await params;
    const bundle = await getCmsBundle();
    const property = (bundle?.properties || []).find(
      (item) =>
        item?.slug?.toLowerCase() === id?.toLowerCase() ||
        item?.id === id
    );
    const latitude = Number(property?.latitude ?? property?.lat);
    const longitude = Number(property?.longitude ?? property?.lng);
    const shortName = String(property?.city || property?.location || "").trim();

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !shortName) {
      return null;
    }

    return {
      key: `property:${property.slug || property.id || id}`,
      source: "property",
      latitude,
      longitude,
      shortName,
    };
  } catch {
    return null;
  }
}

export default async function PropertyUniversalFrame({ children, params }) {
  const ambientContext = await getPropertyAmbientContext(params);

  return (
    <div className="property-universal-frame relative min-h-screen">
      <Header ambientContext={ambientContext} />
      
      <main className="injected-content-area">
        {children}
      </main>

      <Footer />
    </div>
  );
}
