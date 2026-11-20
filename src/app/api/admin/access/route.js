import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const auth = await requireAdmin(request, { label: "ADMIN ACCESS" });
    if (auth.error) return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status, headers });
    return NextResponse.json({ allowed: true }, { headers });
  } catch {
    return NextResponse.json({ error: "Could not verify staff access." }, { status: 503, headers });
  }
}
