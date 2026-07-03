import { updateProperty, insertProperty } from "./airtable";

// Re-syncs a property's Airtable Units_JSON from the authoritative
// property_units rows (not the legacy details.units_inventory blob). No-op
// if the property isn't approved yet, or Airtable credentials are missing.
// Shared by /api/dashboard/units and /api/dashboard/units/delegate so both
// write paths stay in sync with a single source of truth.
export async function syncPropertyUnitsToAirtable(serviceClient, property) {
  if (property.pipeline_status !== "approved") return null;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) return null;

  const { data: units, error } = await serviceClient
    .from("property_units")
    .select("*")
    .eq("property_id", property.id)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const operatorIds = [...new Set(units.map((u) => u.operator_id).filter(Boolean))];
  const displayNames = {};
  if (operatorIds.length > 0) {
    const { data: profiles } = await serviceClient
      .from("user_profiles")
      .select("id, display_name")
      .in("id", operatorIds);
    for (const p of profiles || []) displayNames[p.id] = p.display_name;
  }

  const airtableUnits = units.map((u) => ({
    id: u.id,
    name: u.name || "",
    size: u.size_sqm ?? "",
    floor: u.floor || "",
    features: u.features || [],
    photos: u.photos || [],
    image: u.image || "",
    price: u.price || "",
    operator_id: u.operator_id || null,
    operator_display_name: u.operator_id ? displayNames[u.operator_id] || null : null,
  }));

  if (property.slug) {
    await updateProperty(apiKey, baseId, property.slug, { details: property.details }, airtableUnits);
    return null;
  }
  const created = await insertProperty(apiKey, baseId, {
    title: property.title,
    location: property.location,
    type: property.type,
    space_category: property.space_category,
    details: property.details,
  }, airtableUnits);
  if (created?.fields?.Slug) {
    await serviceClient.from("properties").update({ slug: created.fields.Slug }).eq("id", property.id);
  }
  return created;
}
