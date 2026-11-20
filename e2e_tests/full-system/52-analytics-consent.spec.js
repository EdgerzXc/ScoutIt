import { expect, test } from '@playwright/test';

const gaId = process.env.NEXT_PUBLIC_GA_ID;

test.beforeEach(({ baseURL }) => {
  test.skip(!gaId || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Requires the local Analytics build fixture');
});

async function watchTag(context) {
  const requests = [];
  await context.route('https://www.googletagmanager.com/gtag/js?**', (route) => {
    requests.push(route.request().url());
    return route.fulfill({ contentType: 'application/javascript', body: 'window.scoutitGaFixtureLoaded = true;' });
  });
  return requests;
}

test('Google Analytics stays unloaded before a choice and after decline', async ({ context, page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('scoutit-ga-test-started')) {
      localStorage.removeItem('scoutit_cookie_consent');
      sessionStorage.setItem('scoutit-ga-test-started', '1');
    }
  });
  const requests = await watchTag(context);
  await page.goto('/about');
  const dialog = page.getByRole('dialog', { name: 'Cookie consent' });
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(id => window[`ga-disable-${id}`], gaId)).toBe(true);
  expect(requests).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Decline' }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect.poll(() => page.evaluate(id => window[`ga-disable-${id}`], gaId)).toBe(true);
  await expect(dialog).toHaveCount(0);
  expect(requests).toHaveLength(0);
  expect(await page.evaluate(() => typeof window.gtag)).toBe('undefined');
});

test('Analytics loads after grant, omits private URL data and stops after cross-tab denial', async ({ context, page, baseURL }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('scoutit-ga-test-started')) {
      localStorage.removeItem('scoutit_cookie_consent');
      sessionStorage.setItem('scoutit-ga-test-started', '1');
    }
  });
  const requests = await watchTag(context);
  await page.goto('/about?reference=synthetic#private-marker');
  await page.getByRole('dialog', { name: 'Cookie consent' }).getByRole('button', { name: 'Accept' }).click();
  await expect.poll(() => page.evaluate(() => window.scoutitGaFixtureLoaded)).toBe(true);
  expect(requests).toHaveLength(1);
  const commands = () => page.evaluate(() => (window.dataLayer ?? []).map(entry => Array.from(entry)));
  const getPageViews = async () => (await commands()).filter(([operation]) => operation === 'config');
  await expect.poll(getPageViews).toEqual([['config', gaId, { page_path: '/about', page_location: new URL('/about', baseURL).href }]]);
  const consent = (await commands()).filter(([operation]) => operation === 'consent');
  expect(consent).toEqual([
    ['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }],
    ['consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }],
  ]);

  await page.evaluate(() => history.pushState(null, '', '/wishlist/shared/synthetic-share-token?ref=marker#other'));
  await expect.poll(async () => (await getPageViews()).at(-1)).toEqual([
    'config', gaId, { page_path: '/wishlist/shared', page_location: new URL('/wishlist/shared', baseURL).href },
  ]);
  await page.evaluate(() => history.replaceState(null, '', '/about'));
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.scoutitGaFixtureLoaded)).toBe(true);
  await expect.poll(async () => (await getPageViews()).length).toBeGreaterThan(0);

  const other = await context.newPage();
  await other.goto('/about');
  await other.evaluate(() => localStorage.setItem('scoutit_cookie_consent', 'denied'));
  await expect.poll(() => page.evaluate(id => window[`ga-disable-${id}`], gaId)).toBe(true);
  const viewsAfterDenial = await getPageViews();
  await page.evaluate(() => history.pushState(null, '', '/privacy'));
  await expect(page).toHaveURL(/\/privacy$/);
  expect(await getPageViews()).toEqual(viewsAfterDenial);
});
