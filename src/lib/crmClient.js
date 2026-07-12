// Client-side fetch helper for the CRM surfaces.
import { getSession } from "./authClient";

export async function crmFetch(path, { method = "GET", body, mockUserId } = {}) {
  const { data: { session } } = await getSession();
  const token = session?.access_token;

  let url = path;

  const headers = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (mockUserId && process.env.NODE_ENV === "development") {
    headers["x-mock-user-id"] = mockUserId;
  }

  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[crmFetch] API threw ${res.status}: ${data.error || 'Unknown error'}`);
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
