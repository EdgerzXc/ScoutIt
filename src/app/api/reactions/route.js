import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { property_id, reaction_type, city, category } = body;

    if (!property_id || !reaction_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const reactionsTableId = process.env.AIRTABLE_REACTIONS_TABLE_ID;

    if (apiKey && baseId && reactionsTableId) {
      const airtableUrl = `https://api.airtable.com/v0/${baseId}/${reactionsTableId}`;
      await fetch(airtableUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            property_id,
            reaction_type,
            city: city || "",
            category: category || "",
            timestamp: new Date().toISOString(),
          },
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
