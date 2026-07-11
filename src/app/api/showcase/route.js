import { NextResponse } from "next/server";
import { getShowcaseEntries, BOARD_CATEGORIES, BOARD_AWARDS } from "@/data/mockShowcase";
import { getCmsBundle } from "@/lib/cmsCache";

// SHOWCASE_CMS proxy. Entries are derived from the live property feed with
// seeded demo engagement numbers; when a real SHOWCASE_CMS table exists,
// fetch it here (filter Is_Active, map fields) and use these as fallback.
export async function GET() {
  try {
    const { properties, source } = await getCmsBundle();
    return NextResponse.json({
      entries: getShowcaseEntries(properties),
      categories: BOARD_CATEGORIES,
      awards: BOARD_AWARDS,
      source: `seeded_from_${source}`,
    });
  } catch (error) {
    return NextResponse.json({
      entries: [],
      categories: BOARD_CATEGORIES,
      awards: BOARD_AWARDS,
      source: "mock_error",
      error: error.message,
    });
  }
}
