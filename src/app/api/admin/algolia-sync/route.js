import { NextResponse } from "next/server";
import { getCmsBundle } from "@/lib/cmsCache";
import algoliasearch from "algoliasearch";

export const dynamic = 'force-dynamic';

export async function POST(request) {
  // Simple auth check to ensure only admins can trigger this sync
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_API_SECRET || 'dev-secret-key'}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY } = process.env;

  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    return NextResponse.json({ error: "Algolia credentials missing in environment" }, { status: 500 });
  }

  try {
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
    const index = client.initIndex('scoutit_properties');

    // Fetch the freshest data from Airtable (or cache)
    const bundle = await getCmsBundle();
    const properties = bundle.properties || [];

    // Map properties to Algolia schema
    const algoliaRecords = properties.map(p => {
      return {
        objectID: p.id,
        title: p.title,
        location: p.location,
        price: p.price,
        pipelineStatus: p.pipelineStatus,
        category: p.category || p.spaceCategory,
        // Geolocation for radius search in Algolia
        _geoloc: (p.lat && p.lng) ? {
          lat: parseFloat(p.lat),
          lng: parseFloat(p.lng)
        } : null,
        // Include any deep intel or details you want to search by
        ...p.details
      };
    });

    // Save objects to Algolia (replaces existing objects with same objectID, adds new ones)
    const { objectIDs } = await index.saveObjects(algoliaRecords);

    return NextResponse.json({
      message: "Successfully synced properties to Algolia",
      syncedCount: objectIDs.length
    });
  } catch (error) {
    console.error("[ALGOLIA SYNC ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
