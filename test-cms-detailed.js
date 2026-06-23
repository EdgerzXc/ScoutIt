const http = require('http');

http.get('http://localhost:3000/api/cms', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const payload = JSON.parse(data);
    const props = payload.properties || payload; 
    console.log('Total:', props.length);
    props.forEach(p => {
      console.log(`\n--- [${p.slug}] ---`);
      console.log(`Photos (${p.photos.length}):`, p.photos);
      console.log(`Listed Price:`, p.listed_price);
      console.log(`Cat Price:`, p.cat.residential?.price, p.cat.commercial?.rentFrom, p.cat.str?.nightlyRate);
      console.log(`Location:`, p.location, p.city);
      console.log(`Units (${p.units_inventory.length}):`, p.units_inventory);
    });
  });
}).on('error', e => console.error(e.message));
