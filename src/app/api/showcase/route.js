import { NextResponse } from "next/server";
import { getShowcase } from "@/data/mockShowcase";

// SHOWCASE_CMS proxy.
// Mock-only for now. When the Airtable SHOWCASE_CMS table exists, fetch it
// here (filter Is_Active = true, sort by Rank asc, group by Section/Category)
// and fall back to getShowcase() on any error — same pattern as /api/cms.
export async function GET() {
  try {
    return NextResponse.json({ showcase: getShowcase(), source: "mock" });
  } catch (error) {
    return NextResponse.json(
      { showcase: getShowcase(), source: "mock_error", error: error.message },
      { status: 200 }
    );
  }
}
