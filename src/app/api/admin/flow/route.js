import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from "@/data/masterFlowGraphData";

export async function GET(request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const auth = await requireAdmin(request, { label: "ADMIN FLOW" });
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status, headers });
    return NextResponse.json({ nodes: MASTER_FLOW_NODES, edges: MASTER_FLOW_EDGES }, { headers });
  } catch {
    return NextResponse.json({ error: "Could not load the system flow map." }, { status: 503, headers });
  }
}
