const http = require('http');

http.get('http://localhost:3000/api/deals?mockOwnerId=owner-dev', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});
