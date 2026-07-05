const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function dump() {
  const { data: prop } = await supabase.from('properties').select('*').eq('id', '6846fd18-f2ad-4673-93c7-4b7fb8ac202d').single();
  console.log("PROPERTY:", JSON.stringify(prop, null, 2));
}

dump();
