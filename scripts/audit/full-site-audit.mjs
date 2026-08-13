import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const baseURL = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const displayMode = process.env.AUDIT_DISPLAY_MODE || 'dark';
const outputPath = process.env.AUDIT_OUTPUT || path.join(
  process.cwd(),
  '_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/launch-readiness/evidence/full-site-audit.json',
);
const axePath = path.join(process.cwd(), 'node_modules/axe-core/axe.min.js');

const scoutItRoutes = [
  '/', '/about', '/about-you', '/admin', '/badges', '/brokers', '/brokers/portal',
  '/dashboard', '/dashboard/calendar', '/dashboard/crm', '/dashboard/inbox',
  '/descent', '/discover', '/enterprise', '/event-planners', '/intel',
  '/layer/core', '/layer/crust', '/layer/mantle', '/layer/metropolis', '/layer/orbit',
  '/layer/stratosphere', '/login', '/off-market', '/onboarding', '/photographers',
  '/pricing', '/pricing/broker', '/pricing/bundles', '/pricing/creator', '/pricing/owner',
  '/pricing/seeker', '/privacy', '/profile', '/property', '/researchers', '/settings',
  '/showcase', '/showcase/chatbox', '/terms', '/transit', '/wishlist',
  '/wishlist/shared/audit-invalid-token', '/hubs/audit-invalid-hub',
  '/intel/audit-invalid-article', '/profile/audit-invalid-user',
  '/property/audit-invalid-property', '/property/audit-invalid-property/brokers',
  '/property/audit-invalid-property/unit/audit-invalid-unit',
];

const missionControlRoutes = [
  '/', '/dashboard', '/dashboard/audit', '/dashboard/badges', '/dashboard/brain',
  '/dashboard/cms', '/dashboard/cms/import', '/dashboard/crm', '/dashboard/disputes',
  '/dashboard/features', '/dashboard/inbox', '/dashboard/media', '/dashboard/metrics',
  '/dashboard/notifications', '/dashboard/osint', '/dashboard/security', '/dashboard/staff',
  '/dashboard/verification',
];

const sourceRoutes = process.env.AUDIT_ROUTE_SET === 'mission-control'
  ? missionControlRoutes
  : scoutItRoutes;

const profiles = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { ...devices['Pixel 5'] },
};

const ignoredResourcePatterns = [
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
];

function localPath(value) {
  try {
    const url = new URL(value, baseURL);
    if (url.origin !== new URL(baseURL).origin) return null;
    if (url.pathname.startsWith('/api/')) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

async function auditRoute(context, route) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    if (!ignoredResourcePatterns.some((pattern) => pattern.test(request.url()))) {
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' });
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !ignoredResourcePatterns.some((pattern) => pattern.test(response.url()))) {
      badResponses.push({ url: response.url(), status: response.status() });
    }
  });

  const startedAt = Date.now();
  let navigationStatus = null;
  let navigationError = null;
  try {
    const response = await page.goto(new URL(route, baseURL).href, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    navigationStatus = response?.status() ?? null;
    await page.waitForTimeout(1800);
  } catch (error) {
    navigationError = error.message;
  }

  let facts = null;
  let axe = null;
  let discoveredLinks = [];
  if (!navigationError) {
    facts = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      };
      const interactive = [...document.querySelectorAll('a,button,input,select,textarea,[tabindex]')]
        .filter(visible);
      const overflow = [...document.querySelectorAll('body *')]
        .filter(visible)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === 'string' ? element.className.slice(0, 120) : null,
          left: Math.round(element.getBoundingClientRect().left),
          right: Math.round(element.getBoundingClientRect().right),
        }))
        .filter((entry) => entry.left < -2 || entry.right > document.documentElement.clientWidth + 2)
        .slice(0, 20);
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((heading) => ({
        level: Number(heading.tagName.slice(1)),
        text: heading.textContent.trim().slice(0, 160),
      }));
      const headingSkips = headings.filter((heading, index) => index > 0 && heading.level > headings[index - 1].level + 1);
      const ids = [...document.querySelectorAll('[id]')].map((element) => element.id).filter(Boolean);
      const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
      const images = [...document.images];
      return {
        url: location.href,
        title: document.title,
        lang: document.documentElement.lang || null,
        bodyTextLength: document.body.innerText.trim().length,
        h1Count: document.querySelectorAll('h1').length,
        mainCount: document.querySelectorAll('main').length,
        navCount: document.querySelectorAll('nav').length,
        headings,
        headingSkips,
        duplicateIds,
        interactiveCount: interactive.length,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
        overflow,
        brokenImages: images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src).slice(0, 20),
        missingAltImages: images.filter((image) => !image.hasAttribute('alt')).map((image) => image.currentSrc || image.src).slice(0, 20),
        sampleDataLabels: (document.body.innerText.match(/SAMPLE DATA/gi) || []).length,
        loadingLanguage: [...document.querySelectorAll('body *')]
          .filter((element) => element.children.length === 0 && /loading|scanning|initializing|please wait/i.test(element.textContent || ''))
          .map((element) => element.textContent.trim().slice(0, 160)).slice(0, 20),
        canonical: document.querySelector('link[rel="canonical"]')?.href || null,
        robots: document.querySelector('meta[name="robots"]')?.content || null,
        themeBackground: getComputedStyle(document.body).backgroundColor,
      };
    });

    discoveredLinks = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
    try {
      await page.addScriptTag({ path: axePath });
      axe = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          resultTypes: ['violations'],
          rules: { 'color-contrast': { enabled: true } },
        });
        return result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.slice(0, 10).map((node) => ({
            target: node.target,
            html: node.html.slice(0, 300),
            failureSummary: node.failureSummary,
          })),
        }));
      });
    } catch (error) {
      axe = { error: error.message };
    }
  }

  await page.close();
  return {
    route,
    durationMs: Date.now() - startedAt,
    navigationStatus,
    navigationError,
    facts,
    axe,
    consoleErrors: [...new Set(consoleErrors)],
    pageErrors: [...new Set(pageErrors)],
    failedRequests,
    badResponses,
    discoveredLinks,
  };
}

const browser = await chromium.launch({ headless: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseURL,
  displayMode,
  limitations: [
    'Automated audit; human visual, assistive-technology, cognition, and real-device validation remain required.',
    'Authenticated routes are evaluated in anonymous/gated state unless a safe test fixture exposes a mock state.',
    'Invalid dynamic URLs verify failure surfaces; discovered live links supply representative valid dynamic routes.',
  ],
  profiles: {},
};

for (const [profileName, options] of Object.entries(profiles)) {
  const context = await browser.newContext(options);
  await context.addInitScript((mode) => {
    localStorage.setItem('scoutit_display_mode', mode);
    localStorage.setItem('scoutit-display-mode', mode);
  }, displayMode);
  const queue = [...sourceRoutes];
  const seen = new Set();
  const rows = [];
  while (queue.length && seen.size < 90) {
    const route = queue.shift();
    if (!route || seen.has(route)) continue;
    seen.add(route);
    const row = await auditRoute(context, route);
    rows.push(row);
    for (const href of row.discoveredLinks) {
      const candidate = localPath(href);
      if (candidate && !seen.has(candidate) && !queue.includes(candidate)) queue.push(candidate);
    }
  }
  report.profiles[profileName] = rows;
  await context.close();
}

await browser.close();
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Audit written to ${outputPath}`);
console.log(`Desktop routes: ${report.profiles.desktop.length}`);
console.log(`Mobile routes: ${report.profiles.mobile.length}`);
