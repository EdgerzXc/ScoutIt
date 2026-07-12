const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
};

const files = walk(path.join(__dirname, 'src/app/api'));

const pattern = /async function resolveUserId\(request\) \{[\s\S]*?\n\}/;
const replacement = `import { resolveUserId } from "@/lib/serverAuth";`;

let count = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (pattern.test(content) && content.includes('function resolveUserId(request)')) {
    // Remove the function block
    content = content.replace(pattern, '');
    
    // Check if the import is already there
    if (!content.includes('import { resolveUserId } from "@/lib/serverAuth";')) {
      // Find the last import statement
      const importMatches = [...content.matchAll(/^import .*?;$/gm)];
      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const index = lastImport.index + lastImport[0].length;
        content = content.slice(0, index) + '\n' + replacement + content.slice(index);
      } else {
        content = replacement + '\n' + content;
      }
    }
    
    // Also we need to clean up unused `createClient` import if it's there
    // but honestly it's safe to leave it. Let's just remove it if it's unused.
    // A simple regex might be flaky, so we won't do AST, but we can do a naive check.
    if (!content.includes('createClient(') && content.includes('import { createClient }')) {
      content = content.replace(/import\s+\{\s*createClient\s*\}\s+from\s+["']@supabase\/supabase-js["'];?\n?/, '');
    }

    fs.writeFileSync(file, content);
    console.log('Refactored ' + file);
    count++;
  }
}
console.log('Total refactored: ' + count);
