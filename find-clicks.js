const fs = require('fs');
const files = [
  'src/app/dashboard/page.js',
  'src/components/dashboard/BrokerMode.js',
  'src/components/dashboard/OwnerMode.js',
  'src/components/dashboard/panels/TeamManagementPanel.js',
  'src/components/dashboard/providers/DesignerHUD.js',
  'src/components/dashboard/providers/PhotographerHUD.js',
  'src/components/dashboard/providers/ResearcherHUD.js'
];
files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  let match;
  const regex = /<(div|span|svg|li|a)\s+[^>]*?onClick/gs;
  while ((match = regex.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    console.log(f + ':' + line + ' -> ' + match[0].replace(/\s+/g, ' ').substring(0, 50));
  }
});
