import { test, expect } from '@playwright/test';

const CATEGORIES = [
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "str", label: "Short-Term Rental" },
  { id: "hospitality", label: "Hospitality" },
  { id: "restaurants", label: "Restaurant" },
  { id: "venues", label: "Venue" }
];

test.describe('Owner Deep Intelligence Studio Flow', () => {
  const mockOwnerUser = {
    id: "owner-123-master-dev",
    role: "owner",
    name: "E2E Property Owner",
    tier: "Solar",
    tags: ["owner"],
    primaryMode: "owner"
  };

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('Maximum update depth exceeded')) {
        console.log(`PAGE LOG ERROR: ${msg.text()}`);
        console.log(`LOCATION: ${msg.location().url} ${msg.location().lineNumber}`);
        if (msg.args().length > 0) {
          msg.args()[0].jsonValue().then(arg => {
            console.log(`ARG: ${arg}`);
          }).catch(() => {});
        }
        page.screenshot({ path: 'error-overlay-console.png' }).catch(() => {});
      }
    });

    page.on('pageerror', error => {
      console.log(`PAGE ERROR TRACE: ${error.message}\n${error.stack}`);
      page.screenshot({ path: 'error-overlay-pageerror.png' }).catch(() => {});
    });

    page.on('pageerror', error => {
      console.log('PAGE UNCAUGHT ERROR:', error.message);
      console.log('STACK:', error.stack);
    });

    await page.addInitScript((user) => {
      localStorage.setItem('scoutit_user', JSON.stringify(user));
      // Force the onboarding "List Property Now" wizard open to skip clicks
      localStorage.setItem("scoutit_open_wizard", "1");
    }, mockOwnerUser);
  });

  for (const category of CATEGORIES) {
    test(`Owner can fill out Deep Intel Studio for ${category.label}`, async ({ page }) => {
        // Mock Mapbox Geocoding
      await page.route('**/geocoding/v5/mapbox.places/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            features: [{ center: [121.0, 14.5] }]
          })
        });
      });

      // Mock Supabase property inserts/updates to avoid RLS/Auth errors
      await page.route('**/rest/v1/properties*', async route => {
        if (route.request().method() === 'POST') {
          const postData = JSON.parse(route.request().postData() || '[{}]');
          const newDoc = { ...postData[0], id: `mock-id-${Date.now()}` };
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify([newDoc])
          });
        } else if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{}]) // Returns array of updated rows
          });
        } else {
          await route.continue();
        }
      });

      // Mock the publish and update endpoints so the wizard can close successfully
      await page.route('**/api/dashboard/publish', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      await page.route('**/api/dashboard/update', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(2000);

      // We should be on the "How would you like to create this listing?" screen
      await expect(page.locator('h1:has-text("How would you like to create this listing?")')).toBeVisible({ timeout: 10000 });

      // Click "Deep Intelligence Vault"
      await page.locator('h3:has-text("Deep Intelligence Vault")').click();
      await page.waitForTimeout(1000);

      // Step 1: The Space
      await expect(page.locator('h3:has-text("Step 1: The Space")')).toBeVisible();

      // Select Category
      await page.locator(`button:has-text("${category.label}")`).click();

      // Fill out required title and location and price
      await page.getByPlaceholder('e.g. Premium High-Rise Office in BGC Core').fill(`${category.label} E2E Test Property`);
      await page.getByPlaceholder('e.g. BGC Core').fill(`E2E ${category.label} Location`);
      await page.getByPlaceholder('e.g. 50000').fill('150000');
      
      // Mock Supabase storage
      await page.route('**/storage/v1/object/property_photos/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ Key: 'property_photos/dummy.png' })
        });
      });

      // Fill out required photos.
      // A fixed sleep here was flaky under real async upload timing (PhotoUploader.js
      // shows "Uploading..." while a slot is in flight) -- some categories intermittently
      // landed on 4/5 photos instead of 5, which silently keeps mustHaves.media false and
      // "Submit for Approval" disabled forever. Wait for the actual completion signal
      // instead of guessing a duration.
      const fileInputs = await page.locator('input[type="file"]').all();
      for (let i = 0; i < Math.min(5, fileInputs.length); i++) {
        await fileInputs[i].setInputFiles('e2e_tests/dummy.png');
        // The "Uploading..." label may or may not appear before this check runs;
        // either way, wait until no slot is still showing it.
        await page.getByText('Uploading...').waitFor({ state: 'visible', timeout: 800 }).catch(() => {});
        await page.getByText('Uploading...').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      }

      // Next
      await page.locator('button:has-text("Next Step →")').click();
      await page.waitForTimeout(500);

      // Step 2: Location & Context
      await expect(page.locator('h3:has-text("Step 2: Location")')).toBeVisible();
      await page.locator('button:has-text("Next Step →")').click();
      await page.waitForTimeout(500);

      // Step 3: Life Here
      await expect(page.locator('h3:has-text("Step 3: Life Here")')).toBeVisible();
      await page.locator('button:has-text("Next Step →")').click();
      await page.waitForTimeout(500);

      // Step 4: Where To
      await expect(page.locator('h3:has-text("Step 4: Where To?")')).toBeVisible();
      await page.locator('button:has-text("Next Step →")').click();
      await page.waitForTimeout(500);

      // Step 5: Build Plans & Specs
      await expect(page.locator('h3:has-text("Step 5: Build Plans")')).toBeVisible();
      await page.locator('button:has-text("Next Step →")').click();
      await page.waitForTimeout(500);

      // Step 6: Units & Universe
      await expect(page.locator('h3:has-text("Step 6: Units & Universe")')).toBeVisible();
      
      // Hit Save & Publish
      // Using button that has "Publish" in it, DeepIntelligenceStudio.js line 603 says: "Save & Publish"
      await page.locator('button', { hasText: /Submit for Approval/ }).click();

      // Wait for the wizard to close
      await expect(page.locator('h3:has-text("Step 6: Units & Universe")')).toBeHidden({ timeout: 5000 });

      // Verification (Checking)
      // Take a screenshot to see where we landed
      await page.screenshot({ path: `test-results/debug-${category.label.replace(/[^a-zA-Z]/g, '')}.png` });
      // Dump HTML
      const html = await page.content();
      require('fs').writeFileSync(`debug-${category.label}.html`, html);

      // Assert the 'Add Deep Intel' button is visible, showing the dossier loaded correctly
      await expect(page.locator('button:has-text("Add Deep Intel")')).toBeVisible();

      // Click "Add Deep Intel" to open the DeepIntelligenceStudio in edit mode
      await page.locator('button:has-text("Add Deep Intel")').click();

      // Verify DeepIntelligenceStudio opens in edit mode
      await expect(page.locator('h3:has-text("Step 1: The Space")')).toBeVisible();

      // Wait a moment for state to settle
      await page.waitForTimeout(500);

      // Verify the input is pre-filled with the original title
      const titleInput = page.getByPlaceholder('e.g. Premium High-Rise Office in BGC Core');
      await expect(titleInput).toHaveValue(`${category.label} E2E Test Property`);

      // Edit the Title
      await titleInput.fill(`${category.label} E2E Test Property - EDITED`);

      // Fast-forward through the steps to submit the edit
      for (let i = 0; i < 5; i++) {
        await page.locator('button', { hasText: /Next Step/ }).click();
        await page.waitForTimeout(200);
      }

      // Hit Save & Publish to save the edit
      await page.locator('button', { hasText: /Submit for Approval/ }).click();

      // Wait for the wizard to close
      await expect(page.locator('h3:has-text("Step 6: Units & Universe")')).toBeHidden({ timeout: 5000 });

      // Verify the dashboard Dossier reflects the edited title
      // We check if the edited title text is now visible somewhere on the dossier page.
      await expect(page.locator(`text=${category.label} E2E Test Property - EDITED`).first()).toBeVisible();
    });
  }
});
