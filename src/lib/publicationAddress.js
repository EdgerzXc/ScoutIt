export async function isReservedPublicationAddress(client, slug, propertyId) {
  const results = await Promise.all([
    client.from("properties").select("id").eq("canonical_slug", slug).neq("id", propertyId).limit(1),
    client.from("property_slug_redirects").select("old_slug").eq("old_slug", slug).limit(1),
    client.from("property_slug_history").select("old_slug").eq("old_slug", slug).limit(1),
  ]);
  if (results.some(({ data, error }) => error || !Array.isArray(data))) {
    throw new Error("The public address reservations could not be verified");
  }
  return results.some(({ data }) => data.length > 0);
}
