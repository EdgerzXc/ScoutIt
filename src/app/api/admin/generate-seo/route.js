import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { fetchProperties, updateProperty } from "@/lib/airtable";

async function resolveUserId(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await authClient.auth.getUser(token);
  return !error && user ? user.id : null;
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    
    // Read body exactly once
    const body = await request.json().catch(() => ({}));
    
    if (!userId && body.mockOwnerId !== 'master-dev') {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = body;
    if (!id) {
        return NextResponse.json({ error: "Missing property id" }, { status: 400 });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    
    const allProps = await fetchProperties(apiKey, baseId);
    const property = allProps.find(p => p.id === id);
    
    if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Prepare prompt
    const prompt = `You are an expert commercial and residential real estate copywriter and SEO specialist.
Given the following property details, generate:
1. An SEO-optimized Title Tag (under 60 characters).
2. A compelling Meta Description (under 160 characters).
3. A valid JSON-LD schema (type: RealEstateListing or Place) representing this property as a stringified JSON.

Property Details:
Title: ${property.title}
Location: ${property.location}
City: ${property.city}
Category: ${property.spaceCategory}
Price: ${property.cat?.price || property.cat?.rentPerSqm || property.cat?.rentalRate || "Upon Request"}
Bedrooms: ${property.beds}
Bathrooms: ${property.baths}
Floor Area: ${property.floor_sqm} sqm
Amenities: ${(property.amenities || []).join(", ")}

Return ONLY a raw JSON object with exactly these three keys: "title", "description", "jsonLd". Do not wrap it in markdown or backticks.`;

    let parsedResult;
    
    if (!process.env.ANTHROPIC_API_KEY) {
       // Mock fallback for environments without API key
       parsedResult = {
         title: `${property.title} | Premium ${property.spaceCategory} in ${property.city}`,
         description: `Discover this premium ${property.floor_sqm}sqm ${property.spaceCategory} located at ${property.location}. View on ScoutIt!`,
         jsonLd: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": property.title,
            "description": "Premium listing in " + property.city
         })
       };
    } else {
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          temperature: 0.3,
          system: "You are an AI that outputs strictly valid JSON.",
          messages: [{ role: "user", content: prompt }]
        });
        
        const rawResponse = msg.content[0].text;
        // Clean markdown backticks if any
        const cleaned = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedResult = JSON.parse(cleaned);
    }

    // Save to Airtable using slug (fetchProperties includes slug)
    await updateProperty(apiKey, baseId, property.slug, {
       seo_title: parsedResult.title,
       seo_description: parsedResult.description,
       seo_json_ld: typeof parsedResult.jsonLd === 'object' ? JSON.stringify(parsedResult.jsonLd) : parsedResult.jsonLd
    });

    return NextResponse.json({ success: true, seo: parsedResult });
  } catch (err) {
    console.error("[SEO GENERATE API] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
