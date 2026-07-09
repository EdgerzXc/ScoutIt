// Client-side fetch helper for the CRM surfaces. Centralizes the
// session-token + dev-mock dance every dashboard component was repeating:
// real sessions send a Bearer token; the mock id is only attached when no
// token exists (dev toolbox / master-dev convention — matches how
// /api/notifications and /api/deals treat mockOwnerId server-side).
import { getSession } from "./authClient";

export async function crmFetch(path, { method = "GET", body, mockUserId } = {}) {
  const { data: { session } } = await getSession();
  const token = session?.access_token;
  const mock = !token && mockUserId ? mockUserId : undefined;

  let url = path;
  if (mock && (method === "GET" || method === "DELETE")) {
    url += (url.includes("?") ? "&" : "?") + `mockOwnerId=${encodeURIComponent(mock)}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify({ ...body, ...(mock ? { mockOwnerId: mock } : {}) }) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
