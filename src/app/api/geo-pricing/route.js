import { NextResponse } from 'next/server';

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function getPriceFieldForCategory(category) {
  const cat = category?.toLowerCase() || '';
  if (cat === 'residential') return 'RS_Price';
  if (cat === 'commercial') return 'CM_Rent_Per_Sqm';
  if (cat === 'str') return 'STR_Nightly_Rate';
  if (cat === 'hospitality') return 'Listed_Price';
  if (cat === 'restaurants') return 'RST_Rent';
  if (cat === 'venues') return 'VEN_Rental_Rate';
  return 'Listed_Price';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { location, category, price } = body;

    if (!location || !category || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const priceField = getPriceFieldForCategory(category);
    const targetPrice = parseFloat(price);

    // 1. Geocode the location
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}&limit=1`;
    
    const geocodeRes = await fetch(geocodeUrl);
    if (!geocodeRes.ok) {
      throw new Error('Failed to geocode location');
    }
    const geocodeData = await geocodeRes.json();
    
    if (!geocodeData.features || geocodeData.features.length === 0) {
      return NextResponse.json({ compsFound: 0, error: 'Location not found' });
    }

    const [lon, lat] = geocodeData.features[0].center;

    // 2. Fetch properties from Airtable
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/PROPERTIES_CMS?filterByFormula=AND(Approved_For_ScoutIt=TRUE(), LOWER(SpaceCategory)=LOWER('${category}'))`;
    
    const airtableRes = await fetch(airtableUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    if (!airtableRes.ok) {
      throw new Error('Failed to fetch from Airtable');
    }

    const airtableData = await airtableRes.json();

    // 3. Filter by radius and calculate average
    let totalPriceSum = 0;
    let compsCount = 0;

    airtableData.records.forEach((record) => {
      const compLat = record.fields.Latitude;
      const compLon = record.fields.Longitude;
      const compPrice = record.fields[priceField];

      if (compLat && compLon && compPrice) {
        const dist = calculateDistance(lat, lon, compLat, compLon);
        if (dist <= 1.5) { // within 1.5km
          totalPriceSum += parseFloat(compPrice);
          compsCount++;
        }
      }
    });

    if (compsCount === 0) {
      return NextResponse.json({ compsFound: 0 });
    }

    const averagePrice = totalPriceSum / compsCount;
    const percentageDiff = ((targetPrice - averagePrice) / averagePrice) * 100;

    return NextResponse.json({
      compsFound: compsCount,
      averagePrice: averagePrice,
      percentageDiff: percentageDiff,
      radiusKm: 1.5,
      priceField: priceField
    });

  } catch (error) {
    console.error('Geo-Pricing API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
