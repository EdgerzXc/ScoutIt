const fs = require('fs');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('src');
let count = 0;
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  // Match div or span with onClick but NO role or tabIndex
  const regex = /<(div|span|svg|li|a)\s+(?![^>]*\brole=)(?![^>]*\btabIndex=)[^>]*?onClick/gs;
  while ((match = regex.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    console.log(f + ':' + line + ' -> ' + match[0].replace(/\s+/g, ' ').substring(0, 50));
    count++;
  }
});
console.log("Total: " + count);
