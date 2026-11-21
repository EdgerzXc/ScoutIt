import { NextResponse } from "next/server";
import { readAdminBearer, requireAdmin } from "@/lib/adminGuard";
import { adminPageCookieOptions, sealAdminPageSession } from "@/lib/adminPageSession.server";

const HEADERS = { "Cache-Control": "private, no-store" };

function sameOrigin(request) {
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") === "https" ? "https:" : url.protocol;
  return request.headers.get("origin") === `${protocol}//${host}`;
}

function json(body, status) {
  return NextResponse.json(body, { status, headers: HEADERS });
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "Open staff access from the ScoutIt site." }, 403);

  try {
    const staff = await requireAdmin(request, { label: "ADMIN PAGE SESSION" });
    if (staff.error) return json({ error: staff.error, code: staff.code }, staff.status);
    const session = sealAdminPageSession(readAdminBearer(request));
    if (staff.userId && session) {
      const response = new NextResponse(null, { status: 204, headers: HEADERS });
      response.cookies.set({ ...adminPageCookieOptions(), value: session });
      return response;
    }
  } catch {
    return json({ error: "Could not verify staff access." }, 503);
  }
  return json({ error: "Staff document access is unavailable." }, 503);
}

export async function DELETE(request) {
  if (!sameOrigin(request)) return json({ error: "Open staff access from the ScoutIt site." }, 403);
  const response = new NextResponse(null, { status: 204, headers: HEADERS });
  response.cookies.set({ ...adminPageCookieOptions(0), value: "" });
  return response;
}
