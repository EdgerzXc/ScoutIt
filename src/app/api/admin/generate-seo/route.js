import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchProperties, updateProperty } from "@/lib/airtable";
import { requireAdmin } from "@/lib/adminGuard";
import { sanitizeError } from "@/lib/sanitizeError";

// ⚠️ 🟠 UNDER-GATED UNTIL 2026-08-06 (§59, full-system audit).
//
// This lives under `/api/admin/` and writes AI-generated SEO copy straight to
// Airtable via `updateProperty()` — i.e. it mutates a listing's PUBLIC search
// metadata. But it only checked `resolveUserId`, which answers "is anyone signed
// in?", not "may THIS person edit THIS listing?". There was no admin check and
// no ownership check, so any signed-in user could rewrite any property's public
// SEO copy by passing its id.
//
// Now staff-gated. It has no production caller, so tightening it breaks nothing.
// If owners are ever meant to run this on their OWN listing, add an ownership
// branch — do not relax this back to a bare session check.

export async function POST(request) {
  try {
    // Read body exactly once.
    const body = await request.json().catch(() => ({}));

    // Public Airtable metadata is a real mutation. Preview identities never
    // authorize it; staff authority must be validated for every environment.
    const gate = await requireAdmin(request, { label: "ADMIN GENERATE-SEO" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

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
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
