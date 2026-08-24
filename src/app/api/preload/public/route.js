import { NextResponse } from "next/server";
import { getCmsBundle } from "@/lib/cmsCache";
import { MAX_PUBLIC_DATA_BYTES } from "@/lib/firstVisitWarmPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROPERTIES = 3;
const PUBLIC_CACHE = "public, max-age=300, s-maxage=300, stale-while-revalidate=600";

function text(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function serialize(properties) {
  const body = JSON.stringify({
    version: 1,
    properties: (properties || []).slice(0, MAX_PROPERTIES).map((property) => ({
      slug: text(property.slug || property.id, 160),
      title: text(property.title || property.name, 120),
      category: text(property.spaceCategory || property.category, 64),
      location: text(property.location || property.city, 120),
    })),
  });
  return Buffer.byteLength(body) <= MAX_PUBLIC_DATA_BYTES
    ? body
    : JSON.stringify({ version: 1, properties: [] });
}

function response(body, source = "cms") {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Cache-Control": PUBLIC_CACHE,
      "Content-Length": String(Buffer.byteLength(body)),
      "Content-Type": "application/json; charset=utf-8",
      "X-ScoutIt-Preload": source,
    },
  });
}

export async function GET() {
  try {
    const bundle = await getCmsBundle();
    return response(serialize(bundle.properties));
  } catch {
    return response(JSON.stringify({ version: 1, properties: [] }), "degraded");
  }
}
