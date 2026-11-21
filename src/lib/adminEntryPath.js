export const ADMIN_ENTRY_PATH = "/admin/access";
export const ADMIN_SESSION_API = "/api/admin/session";

export function adminReturnPath(value) {
  return value === "/admin/flow" ? value : "/admin";
}

export function adminEntryFor(destination) {
  return `${ADMIN_ENTRY_PATH}?next=${encodeURIComponent(adminReturnPath(destination))}`;
}
