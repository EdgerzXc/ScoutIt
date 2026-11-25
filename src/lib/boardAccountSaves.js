const COLUMNS_WITH_REACTION = "id, property_id, reaction_type, created_at, properties!saved_intel_property_id_fkey(canonical_slug)";
const COLUMNS_BASE = "id, property_id, created_at, properties!saved_intel_property_id_fkey(canonical_slug)";

function isMissingReactionTypeColumn(error) {
  return Boolean(
    error &&
      (error.code === "42703" ||
        error.code === "PGRST204" ||
        /reaction_type/i.test(error.message || ""))
  );
}

export async function readBoardAccountSaves(client, userId) {
  const items = [];
  let cursor;
  let includeReactionType = true;

  for (;;) {
    const runPageQuery = async (withReactionType) => {
      let query = client.from("saved_intel")
        .select(withReactionType ? COLUMNS_WITH_REACTION : COLUMNS_BASE)
        .eq("user_id", userId)
        .not("property_id", "is", null)
        .order("id", { ascending: true })
        .limit(250);
      if (cursor) query = query.gt("id", cursor);
      return query;
    };

    let { data, error } = await runPageQuery(includeReactionType);
    if (error && includeReactionType && isMissingReactionTypeColumn(error)) {
      includeReactionType = false;
      ({ data, error } = await runPageQuery(false));
    }

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
