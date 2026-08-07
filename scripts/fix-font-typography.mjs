import fs from 'fs';
import path from 'path';

const targetFiles = [
  'c:/Users/jerze/ScoutIt/src/components/property/UnitMasterPage.js',
  'c:/Users/jerze/ScoutIt/src/components/property/CommercialFlow.js',
  'c:/Users/jerze/ScoutIt/src/components/property/ResidentialFlow.js',
  'c:/Users/jerze/ScoutIt/src/app/property/[id]/property-detail.css'
];

targetFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace hardcoded Courier New fonts with CSS font variable var(--font-mono)
  content = content.replaceAll("fontFamily: \"'Courier New',monospace\"", 'fontFamily: "var(--font-mono)"');
  content = content.replaceAll("fontFamily: \"'Courier New', monospace\"", 'fontFamily: "var(--font-mono)"');
  content = content.replaceAll("fontFamily: `'Courier New',monospace`", 'fontFamily: "var(--font-mono)"');
  content = content.replaceAll("fontFamily: `'Courier New', monospace`", 'fontFamily: "var(--font-mono)"');
  content = content.replaceAll("font-family: 'Courier New', monospace", 'font-family: var(--font-mono)');
  content = content.replaceAll("font-family: 'Courier New',monospace", 'font-family: var(--font-mono)');
  content = content.replaceAll("'Courier New',monospace", "var(--font-mono)");
  content = content.replaceAll("'Courier New', monospace", "var(--font-mono)");

  // Upgrade sub-10px font sizes in inline styles for better legibility
  content = content.replaceAll('fontSize: "9px"', 'fontSize: "11px"');
  content = content.replaceAll('fontSize: "10px"', 'fontSize: "11px"');
  content = content.replaceAll('fontSize:"9px"', 'fontSize:"11px"');
  content = content.replaceAll('fontSize:"10px"', 'fontSize:"11px"');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Upgraded typography in ${path.basename(filePath)}`);
});
