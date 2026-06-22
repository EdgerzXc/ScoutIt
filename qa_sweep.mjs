import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'directory', path: '/property' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'pricing', path: '/pricing' },
  { name: 'admin', path: '/admin' },
];

async function runQASweep() {
  console.log('Starting Playwright DOM QA Sweep...');
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext({
    viewport: { width: 393, height: 873 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  const allReports = {};

  for (const target of PAGES) {
    console.log(`\nNavigating to ${target.name} (${target.path})...`);
    try {
      await page.goto(`${BASE_URL}${target.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000); // allow animations/lazy rendering
      
      const report = await page.evaluate(() => {
        const issues = [];
        const screenWidth = window.innerWidth;
        
        if (document.documentElement.scrollWidth > screenWidth) {
          issues.push({
            type: 'PAGE_HORIZONTAL_SCROLL',
            details: `Page scrollWidth (${document.documentElement.scrollWidth}px) exceeds viewport (${screenWidth}px)`
          });
        }

        const allEls = document.querySelectorAll('*');
        for (let el of allEls) {
          const tag = el.tagName;
          if (['SCRIPT', 'STYLE', 'META', 'HEAD', 'TITLE', 'LINK', 'NOSCRIPT', 'HTML', 'BODY'].includes(tag)) continue;

          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const classList = Array.from(el.classList).join('.');
          const identifier = `${tag.toLowerCase()}${classList ? '.' + classList : ''}`;
          
          if (style.display === 'none' || style.visibility === 'hidden') continue;

          // 1. Element exceeds viewport width
          // We ignore absolute/fixed elements positioned off-screen intentionally unless they push the layout
          if (rect.right > screenWidth + 2 && style.position !== 'absolute' && style.position !== 'fixed') {
            // Check if it's actually pushing layout (not transformed away)
            issues.push({
              type: 'ELEMENT_OVERFLOW_X',
              element: identifier,
              details: `Element right edge (${Math.round(rect.right)}px) is outside viewport (${screenWidth}px)`,
              text: el.innerText ? el.innerText.substring(0, 40).replace(/\n/g, ' ') : ''
            });
          }

          // 2. Text/Content overflow within element
          if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
            if (style.overflowX !== 'auto' && style.overflowX !== 'scroll' && style.overflowX !== 'hidden') {
               issues.push({
                type: 'CONTENT_OVERFLOW_X',
                element: identifier,
                details: `scrollWidth (${el.scrollWidth}px) > clientWidth (${el.clientWidth}px) but overflow is '${style.overflow}'`,
                text: el.innerText ? el.innerText.substring(0, 40).replace(/\n/g, ' ') : ''
              });
            }
          }
        }
        
        // Deduplicate
        const uniqueIssues = [];
        const seen = new Set();
        for (const i of issues) {
          const key = i.type + '|' + (i.element || '') + '|' + i.details;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueIssues.push(i);
          }
        }

        return uniqueIssues;
      });

      console.log(`Found ${report.length} issues on ${target.name}.`);
      if (report.length > 0) {
        report.forEach(i => console.log(`  - [${i.type}] ${i.element || ''}: ${i.details} | Text: "${i.text || ''}"`));
      }
      allReports[target.name] = report;

    } catch (e) {
      console.error(`Failed to QA ${target.name}:`, e.message);
    }
  }

  await browser.close();
  console.log('\nSweep completed!');
}

runQASweep().catch(console.error);
