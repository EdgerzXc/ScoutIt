// Read-only runtime contracts for dependency paths that have carried security
// advisories. These checks ensure a clean audit also preserves real behavior.
import { test, expect } from '@playwright/test';
import { getCommercialListing, gotoAndSettle, openYourMove } from './helpers';

test.describe('Dependency runtime contracts', () => {
  test('commercial tear-sheet exports a valid PDF', async ({ page, request }, testInfo) => {
    test.setTimeout(150000);
    test.skip(testInfo.project.name !== 'chromium', 'One desktop export proves the shared PDF bundle.');

    const { slug } = await getCommercialListing(request);
    await gotoAndSettle(page, `/property/${slug}`);
    await openYourMove(page);

    const exportButton = page.getByRole('button', { name: /download tear-sheet/i }).first();
    await expect(exportButton).toBeVisible({ timeout: 20000 });

    const clientErrors = [];
    page.on('pageerror', (error) => clientErrors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') clientErrors.push(`console: ${message.text()}`);
    });

    const downloadPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
    await exportButton.click({ trial: true });
    await exportButton.focus();
    await page.keyboard.press('Enter');
    const download = await downloadPromise;
    expect(download, clientErrors.join('\n') || 'The export did not start a download.').not.toBeNull();

    expect(download.suggestedFilename()).toMatch(/^ScoutIt_.+\.pdf$/);
    expect(await download.failure()).toBeNull();

    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);

    expect(bytes.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(1000);
  });

  test('Next image optimizer returns transformed image bytes', async ({ request }) => {
    const response = await request.get(
      '/_next/image?url=%2Fassets%2Fstratosphere_city.webp&w=640&q=75',
      { headers: { Accept: 'image/avif,image/webp,image/*' } },
    );

    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toMatch(/^image\/(avif|webp|jpeg|png)/);
    expect((await response.body()).length).toBeGreaterThan(1000);
  });
});
