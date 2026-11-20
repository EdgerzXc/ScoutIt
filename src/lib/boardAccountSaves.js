export async function readBoardAccountSaves(client, userId) {
  const items = [];
  let cursor;
  for (;;) {
    let query = client.from("saved_intel")
      .select("id, property_id, reaction_type, created_at, properties!saved_intel_property_id_fkey(canonical_slug)")
      .eq("user_id", userId)
      .not("property_id", "is", null)
      .order("id", { ascending: true })
      .limit(250);
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error("Account saves query did not return rows");
    if (!data.length) break;
    for (const row of data) {
      items.push({
        account_property_id: row.property_id,
        property_id: row.properties?.canonical_slug || row.property_id,
        reaction_type: row.reaction_type || "Save",
        created_at: row.created_at,
      });
    }
    cursor = data.at(-1).id;
  }
  return items.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
