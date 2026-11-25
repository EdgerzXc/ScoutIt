export const BOARD_SYNC_BATCH_SIZE = 500;

export async function syncOfflineSpacesToAccount(accessToken, items, onConfirmed) {
  let confirmedCount = 0;
  let unlinkedCount = 0;
  for (let start = 0; start < items.length; start += BOARD_SYNC_BATCH_SIZE) {
    const batch = items.slice(start, start + BOARD_SYNC_BATCH_SIZE);
    let result;
    try {
      const response = await fetch("/api/wishlist/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          items: batch.map(({ property_id, public_slug, reaction_type }) => ({
            property_id: public_slug || property_id,
            reaction_type,
          })),
        }),
      });
      if (response.status === 401) return { confirmedCount, unlinkedCount, signInRequired: true };
      if (!response.ok) break;
      result = await response.json();
    } catch {
      break;
    }
    if (!Array.isArray(result?.confirmedProperties)) break;
    const acknowledged = new Map(result.confirmedProperties.map((property) => [property.inputId, property]));
    const confirmed = batch.flatMap((item) => {
      const property = acknowledged.get(item.public_slug || item.property_id);
      return property ? [{ ...item, account_property_id: property.propertyId, public_slug: property.slug }] : [];
    });
    confirmedCount += confirmed.length;
    unlinkedCount += batch.length - confirmed.length;
    onConfirmed(confirmed);
  }
  return { confirmedCount, unlinkedCount, signInRequired: false };
}
