import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminEntryFor } from "./adminEntryPath";
import { adminPageCookieOptions, readAdminPageSession } from "./adminPageSession.server";
import { requireAdmin } from "./adminGuard";

export async function requireAdminPage(destination) {
  const navigationSite = (await headers()).get("sec-fetch-site");
  if (navigationSite === "cross-site" || navigationSite === "same-site") {
    redirect(adminEntryFor(destination));
  }
  const cookie = (await cookies()).get(adminPageCookieOptions().name)?.value;
  const token = readAdminPageSession(cookie);
  if (token) {
    let authorized = false;
    try {
      const staff = await requireAdmin({ headers: new Headers({ Authorization: `Bearer ${token}` }) }, { label: "ADMIN PAGE" });
      authorized = !staff.error && Boolean(staff.userId);
    } catch {
      authorized = false;
    }
    if (authorized) return;
  }
  redirect(adminEntryFor(destination));
}
