const fs = require('fs');

const html = fs.readFileSync('C:/Users/jerze/.gemini/antigravity/scratch/scoutit/src/app/property/scoutit_property_raw.html', 'utf8');

// 1. Extract CSS
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch) {
  fs.mkdirSync('C:/Users/jerze/.gemini/antigravity/scratch/scoutit/src/app/property/[slug]', { recursive: true });
  fs.writeFileSync('C:/Users/jerze/.gemini/antigravity/scratch/scoutit/src/app/property/[slug]/property.css', cssMatch[1]);
}

// 2. Extract Body HTML
let bodyInner = html.substring(html.indexOf('<div class="page">'), html.indexOf('<script>'));

// 3. Simple HTML to JSX conversion
let jsx = bodyInner
  .replace(/class=/g, 'className=')
  .replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}')
  .replace(/stroke-width=/g, 'strokeWidth=')
  .replace(/stroke-linecap=/g, 'strokeLinecap=')
  .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
  .replace(/fill-rule=/g, 'fillRule=')
  .replace(/clip-rule=/g, 'clipRule=')
  .replace(/style="([^"]*)"/g, (match, p1) => {
    const styles = p1.split(';').filter(Boolean).map(s => {
      let [k,v] = s.split(':');
      if(!k||!v) return '';
      k = k.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
      return k + ': "' + v.trim() + '"';
    }).join(', ');
    return 'style={{' + styles + '}}';
  })
  .replace(/<br>/g, '<br/>')
  .replace(/<hr>/g, '<hr/>')
  // For unclosed svgs/rects etc
  .replace(/<(path|rect|circle|polyline|ellipse|line)([^>]*[^/])>/g, (m, p1, p2) => {
    if (p2.endsWith('/')) return m;
    return '<' + p1 + p2 + '/>';
  });

fs.writeFileSync('C:/Users/jerze/.gemini/antigravity/scratch/scoutit/src/app/property/[slug]/raw-jsx.txt', jsx);
console.log('Done');
