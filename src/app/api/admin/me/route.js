import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request) {
  const gate = await requireAdmin(request, { label: "ADMIN ME", minTier: 1 });
  if (gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status, headers: NO_STORE });
  }

  return NextResponse.json(
    {
      authenticated: true,
      userId: gate.userId,
      email: gate.staff?.email || gate.user?.email || null,
      displayName: gate.staff?.display_name || null,
      tier: gate.tier,
      isFinance: gate.isFinance,
    },
    { headers: NO_STORE }
  );
}
