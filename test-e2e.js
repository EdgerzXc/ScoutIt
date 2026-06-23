const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');

// Simple dotenv parser
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    acc[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("1. Creating dummy property in Supabase...");
  const title = "E2E Test Property " + Date.now();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const { data: prop, error } = await supabase
    .from('properties')
    .insert({
      title,
      slug,
      type: 'Commercial',
      space_category: 'Office',
      location: 'Makati',
      pipeline_status: 'pending',
      details: { units_inventory: [] }
    })
    .select('*')
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return;
  }
  
  const submissionId = prop.id;
  console.log("Created property ID:", submissionId);

  console.log("2. Updating property with units (Simulate Owner Save)...");
  
  const updatePayload = JSON.stringify({
    submissionId,
    data: {
      details: {
        units_inventory: [
          { name: "Unit 101", size: "150 sqm", price: "Php 1,500/sqm" },
          { name: "Unit 202", size: "300 sqm", price: "Php 1,400/sqm" }
        ]
      }
    }
  });

  const updateRes = await fetch('http://localhost:3000/api/dashboard/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: updatePayload
  });
  const updateJson = await updateRes.json();
  console.log("Update response:", updateJson);

  // Read back from supabase to confirm units are inside
  const { data: verifyProp } = await supabase.from('properties').select('details').eq('id', submissionId).single();
  console.log("Supabase details verify:", JSON.stringify(verifyProp.details.units_inventory));

  console.log("3. Approving property (Admin)...");
  const approvePayload = JSON.stringify({ submissionId });
  const approveRes = await fetch('http://localhost:3000/api/admin/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: approvePayload
  });
  const approveJson = await approveRes.json();
  console.log("Approve response:", approveJson);

  console.log("4. Fetching from CMS to verify Airtable got it...");
  const cmsRes = await fetch('http://localhost:3000/api/cms');
  const cmsJson = await cmsRes.json();
  
  const props = cmsJson.properties || cmsJson;
  const foundInCMS = props.find(p => p.slug === slug);
  if (foundInCMS) {
    console.log("FOUND IN CMS!");
    console.log("CMS Units:", foundInCMS.units_inventory);
  } else {
    console.log("NOT FOUND IN CMS. (Might need to wait for ISR/Cache or it failed to insert)");
  }

  // Cleanup
  console.log("Cleaning up DB...");
  await supabase.from('properties').delete().eq('id', submissionId);
  // (Note: Airtable record will remain unless manually deleted, but it's fine for testing)
}

run();
