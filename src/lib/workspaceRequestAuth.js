export async function getVerifiedWorkspaceUser(client, token) {
  const result = await client.auth.getUser(token);
  const user = result.data?.user;
  if (result.error || !user?.factors?.some((factor) => factor.status === "verified")) return result;

  try {
    const { data, error } = await client.auth.getClaims(token);
    if (error) return { data: { user: null }, error };

    const claims = data?.claims;
    if (claims?.sub !== user.id || !["aal1", "aal2"].includes(claims.aal)) {
      return { data: { user: null }, error: { code: "invalid_session_assurance", status: 401 } };
    }
    if (claims.aal !== "aal2") {
      return { data: { user: null }, error: { code: "mfa_required", status: 403 } };
    }
    return result;
  } catch {
    return { data: { user: null }, error: { code: "session_assurance_unavailable", status: 503 } };
  }
}
