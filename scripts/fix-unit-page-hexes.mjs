import fs from 'fs';
import path from 'path';

const filePath = 'c:/Users/jerze/ScoutIt/src/components/property/UnitMasterPage.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace text colors
content = content.replaceAll('color: "#f0ede8"', 'color: "var(--text-primary)"');
content = content.replaceAll('color: "#e8e4dd"', 'color: "var(--text-primary)"');
content = content.replaceAll('color: "#c8c8c8"', 'color: "var(--text-muted)"');
content = content.replaceAll('color: "#5a5a5a"', 'color: "var(--text-muted)"');
content = content.replaceAll('color: "#a0a0a0"', 'color: "var(--text-secondary)"');
content = content.replaceAll('color: "#0e0e0e"', 'color: "var(--on-accent)"');

// Replace backgrounds & borders
content = content.replaceAll('background: "#0d0d0d"', 'background: "var(--surface)"');
content = content.replaceAll('background: "#0e0e0e"', 'background: "var(--bg)"');
content = content.replaceAll('background: "#161616"', 'background: "var(--surface)"');
content = content.replaceAll('background: "#141414"', 'background: "var(--surface2)"');
content = content.replaceAll('background: "rgba(14,14,14,0.6)"', 'background: "var(--surface-var)"');
content = content.replaceAll('background: "rgba(22,22,22,0.5)"', 'background: "var(--surface)"');

content = content.replaceAll('background: "#262626"', 'background: "var(--border)"');
content = content.replaceAll('border: "0.5px solid #262626"', 'border: "0.5px solid var(--border)"');
content = content.replaceAll('border: "0.5px solid #333"', 'border: "0.5px solid var(--border)"');
content = content.replaceAll('borderBottom: "1px solid #262626"', 'borderBottom: "1px solid var(--border)"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated UnitMasterPage.js theme hexes!');
