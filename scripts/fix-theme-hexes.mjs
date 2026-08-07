import fs from 'fs';
import path from 'path';

const files = [
  'c:/Users/jerze/ScoutIt/src/components/property/CommercialFlow.js',
  'c:/Users/jerze/ScoutIt/src/components/property/ResidentialFlow.js'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace text colors
  content = content.replaceAll('color:"#f0ede8"', 'color:"var(--text-primary)"');
  content = content.replaceAll('color: "#f0ede8"', 'color: "var(--text-primary)"');
  content = content.replaceAll("color: '#f0ede8'", "color: 'var(--text-primary)'");

  content = content.replaceAll('color:"#c8c8c8"', 'color:"var(--text-muted)"');
  content = content.replaceAll('color: "#c8c8c8"', 'color: "var(--text-muted)"');
  content = content.replaceAll("color: '#c8c8c8'", "color: 'var(--text-muted)'");

  content = content.replaceAll('color:"#5a5a5a"', 'color:"var(--text-muted)"');
  content = content.replaceAll('color: "#5a5a5a"', 'color: "var(--text-muted)"');

  content = content.replaceAll('color:"#6a6a6a"', 'color:"var(--text-muted)"');
  content = content.replaceAll('color: "#6a6a6a"', 'color: "var(--text-muted)"');

  // Replace borders & backgrounds
  content = content.replaceAll('background:"#262626"', 'background:"var(--border)"');
  content = content.replaceAll('background: "#262626"', 'background: "var(--border)"');

  content = content.replaceAll('borderBottom:"1px solid #262626"', 'borderBottom:"1px solid var(--border)"');
  content = content.replaceAll('borderBottom: "1px solid #262626"', 'borderBottom: "1px solid var(--border)"');

  content = content.replaceAll('background:"#161616"', 'background:"var(--surface)"');
  content = content.replaceAll('background: "#161616"', 'background: "var(--surface)"');

  content = content.replaceAll('background:"#1a1a1a"', 'background:"var(--surface)"');
  content = content.replaceAll('background: "#1a1a1a"', 'background: "var(--surface)"');

  content = content.replaceAll('border:"0.5px solid #2e2e2e"', 'border:"0.5px solid var(--border)"');
  content = content.replaceAll('border: "0.5px solid #2e2e2e"', 'border: "0.5px solid var(--border)"');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated theme hexes in ${path.basename(filePath)}`);
});
