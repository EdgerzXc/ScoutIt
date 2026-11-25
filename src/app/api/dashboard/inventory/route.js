import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";

const PAGE_SIZE = 250;
const ID_BATCH_SIZE = 100;

async function* readPages(buildQuery) {
  let cursor;
  for (;;) {
    let query = buildQuery().order("id", { ascending: true }).limit(PAGE_SIZE);
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error("Inventory query did not return rows");
    if (!data.length) return;
    yield data;
    cursor = data.at(-1).id;
  }
}

async function readRelated(table, columns, propertyIds, consume) {
  for (let start = 0; start < propertyIds.length; start += ID_BATCH_SIZE) {
    const ids = propertyIds.slice(start, start + ID_BATCH_SIZE);
    const pages = readPages(() => supabaseAdmin.from(table).select(columns).in("property_id", ids));
    for await (const page of pages) consume(page);
  }
}

async function countSaves(propertyIds) {
  const byProperty = new Map();
  let total = 0;
  try {
    await readRelated("saved_intel", "id, property_id", propertyIds, (rows) => {
      for (const { property_id } of rows) {
        byProperty.set(property_id, (byProperty.get(property_id) ?? 0) + 1);
        total += 1;
      }
    });
    return { byProperty, total };
  } catch (error) {
    console.warn("[INVENTORY] Saved-space counts unavailable:", error?.code || error?.name);
    return null;
  }
}

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Inventory is temporarily unavailable." }, { status: 503 });
    }

    const properties = [];
    const pages = readPages(() => supabaseAdmin.from("properties").select("*").eq("owner_id", userId));
    for await (const page of pages) properties.push(...page);

    const propertyIds = properties.map(({ id }) => id);
    const units = [];
    const [saves] = await Promise.all([
      countSaves(propertyIds),
      readRelated("property_units", "id, property_id, availability_status", propertyIds, (rows) => units.push(...rows)),
    ]);
    const stats = { total: units.length, occupied: 0, vacant: 0, maintenance: 0, saved_intel_count: saves?.total ?? null };
    for (const { availability_status } of units) {
      if (availability_status === "occupied") stats.occupied += 1;
      else if (availability_status === "maintenance") stats.maintenance += 1;
      else stats.vacant += 1;
    }

    return NextResponse.json({
      properties: properties.map((property) => ({
        ...property,
        saved_count: saves ? (saves.byProperty.get(property.id) ?? 0) : null,
      })),
      units,
      stats,
    });
  } catch (error) {
    console.error("[INVENTORY] Could not load inventory:", error?.code || error?.name);
    return NextResponse.json({ error: "Couldn't load your inventory. Try again." }, { status: 503 });
  }
}
