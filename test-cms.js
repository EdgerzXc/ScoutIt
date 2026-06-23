const http = require('http');

http.get('http://localhost:3000/api/cms', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const payload = JSON.parse(data);
      const props = payload.properties || payload; // Depending on API format
      console.log('Total:', props.length);
      props.forEach(p => {
        const missing = [];
        if (!p.photos || p.photos.length === 0) missing.push('images');
        if (!p.price_formatted && !p.price) missing.push('price');
        if (!p.location && !p.city) missing.push('location');
        if (!p.units_inventory || p.units_inventory.length === 0) missing.push('units');
        if (missing.length > 0) console.log('[' + p.slug + '] missing:', missing.join(', '));
      });
    } catch (e) {
      console.error("Parse error:", e, data.substring(0, 100));
    }
  });
}).on('error', e => console.error(e.message));
