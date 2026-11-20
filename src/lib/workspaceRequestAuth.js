function hasVerifiedFactor(user) {
  return user?.factors?.some((factor) => factor.status === "verified");
}

export async function getWorkspaceAssuranceError(client, token, user) {
  if (!hasVerifiedFactor(user)) return { code: "mfa_enrollment_required", status: 403 };

  try {
    const { data, error } = await client.auth.getClaims(token);
    if (error) return error;

    const claims = data?.claims;
    if (claims?.sub !== user.id || !["aal1", "aal2"].includes(claims.aal)) {
      return { code: "invalid_session_assurance", status: 401 };
    }
    if (claims.aal !== "aal2") {
      return { code: "mfa_required", status: 403 };
    }
    return null;
  } catch {
    return { code: "session_assurance_unavailable", status: 503 };
  }
}

export async function getVerifiedWorkspaceUser(client, token) {
  const result = await client.auth.getUser(token);
  const user = result.data?.user;
  if (result.error || !hasVerifiedFactor(user)) return result;
  const error = await getWorkspaceAssuranceError(client, token, user);
  return error ? { data: { user: null }, error } : result;
}
