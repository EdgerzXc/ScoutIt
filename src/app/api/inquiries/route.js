import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const payload = await req.json();
    
    // In a real application, we would insert this into Supabase
    // const { data, error } = await supabase.from('property_leads').insert([payload]);
    
    // Log for debugging
    console.log("New Lead Capture:", payload);

    return NextResponse.json({ success: true, message: "Inquiry received" }, { status: 200 });
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return NextResponse.json({ success: false, message: "Failed to process inquiry" }, { status: 500 });
  }
}
