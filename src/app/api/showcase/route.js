import { NextResponse } from "next/server";
import { getShowcaseEntries, BOARD_CATEGORIES, BOARD_AWARDS } from "@/data/mockShowcase";

// SHOWCASE_CMS proxy. Mock-only for now; when SHOWCASE_CMS exists, fetch it
// here (filter Is_Active, map fields) and fall back to getShowcaseEntries().
export async function GET() {
  try {
    return NextResponse.json({
      entries: getShowcaseEntries(),
      categories: BOARD_CATEGORIES,
      awards: BOARD_AWARDS,
      source: "mock",
    });
  } catch (error) {
    return NextResponse.json({ entries: getShowcaseEntries(), categories: BOARD_CATEGORIES, awards: BOARD_AWARDS, source: "mock_error", error: error.message });
  }
}
