const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  return acc;
}, {});

async function check() {
  const url = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/PROPERTIES_CMS`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}` }});
  const data = await res.json();
  
  const testProps = data.records.filter(r => r.fields.Title && r.fields.Title.startsWith('E2E Test Property'));
  console.log(`Found ${testProps.length} test properties directly in Airtable.`);
  testProps.forEach(p => {
    console.log(`[${p.id}] Title:`, p.fields.Title);
    console.log(`Slug:`, p.fields.Slug);
    console.log(`Units_JSON:`, p.fields.Units_JSON);
  });
}

check();
