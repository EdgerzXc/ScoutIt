import { test, expect } from '@playwright/test';

test.describe('Owner Live Editor Flow with Unit Builder', () => {
  const mockOwnerUser = {
    id: "owner-123-master-dev",
    role: "owner",
    name: "E2E Property Owner",
    tier: "Solar", // Pro tier, can upload 5 photos
    tags: ["owner"],
    primaryMode: "owner"
  };

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('PAGE LOG ERROR:', msg.text());
      }
    });
    
    page.on('requestfailed', request => {
      console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    await page.addInitScript((user) => {
      localStorage.setItem('scoutit_user', JSON.stringify(user));
      localStorage.setItem("scoutit_open_wizard", "1");
      localStorage.setItem("scoutit_listing_draft", JSON.stringify({
        title: "Commercial Live Test Property",
        location: "BGC Live Location",
        price: "150000",
        category: "Commercial",
        type: "Commercial",
        photos: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c",
          "https://images.unsplash.com/photo-1497366216548-37526070297c",
          "https://images.unsplash.com/photo-1497366216548-37526070297c",
          "https://images.unsplash.com/photo-1497366216548-37526070297c",
          "https://images.unsplash.com/photo-1497366216548-37526070297c"
        ],
        details: {},
        units_inventory: []
      }));
    }, mockOwnerUser);
  });

  test(`Owner can fill out Live Editor Workspace and add Units`, async ({ page }) => {
      // Mock Mapbox
      await page.route('**/geocoding/v5/mapbox.places/*', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features: [{ center: [121.0, 14.5] }] }) });
      });

      let publishPayload = null;
      // Mock Supabase property inserts/updates
      await page.route('**/rest/v1/properties*', async route => {
        if (route.request().method() === 'POST') {
          const postData = JSON.parse(route.request().postData() || '[{}]');
          publishPayload = postData[0];
          await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([{ ...publishPayload, id: `mock-id-live` }]) });
        } else if (route.request().method() === 'PATCH') {
          const postData = JSON.parse(route.request().postData() || '{}');
          publishPayload = postData;
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{}]) });
        } else {
          await route.continue();
        }
      });

      // Mock the publish endpoint
      await page.route('**/api/dashboard/publish', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      });

      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(2000);

      // We should be on the "How would you like to create this listing?" screen
      await expect(page.locator('h1:has-text("How would you like to create this listing?")')).toBeVisible({ timeout: 10000 });

      // Click "Live Editor Workspace"
      await page.locator('h3:has-text("Live Editor Workspace")').click();
      await page.waitForTimeout(1000);

      // Step 1: Basic Property Information
      await expect(page.locator('h3:has-text("Basic Property Information")')).toBeVisible();

      // Next
      await page.locator('button:has-text("Next Step →")').click();
      await page.waitForTimeout(500);

      // Step 2: Public Listing Intel
      await expect(page.locator('h3:has-text("Public Listing Intel")')).toBeVisible();
      
      // Just click Publish to Directory (mocking bypasses 70% requirement via publishPayload interception)
      await page.locator('button:has-text("Publish to Directory")').click();
      await page.waitForTimeout(1000);

      // Verify that the property is created and we are back on the dashboard
      expect(publishPayload).not.toBeNull();
      await expect(page.locator('h1:has-text("Commercial Live Test Property")')).toBeVisible();

      // Click Manage Inventory
      await page.locator('a:has-text("Manage Inventory")').click();
      await page.waitForTimeout(1000);
      
      // We are now on the Inventory Manager page
      await expect(page.locator('text=Inventory Manager')).toBeVisible();

      // Add a unit
      await page.locator('button:has-text("Add Unit")').click();
      await page.waitForTimeout(500);

      // Fill unit details
      await page.getByPlaceholder('e.g. Studio Unit A, Floor 12').fill('Penthouse Suite A');
      await page.getByPlaceholder('e.g. 45').fill('120');
      await page.getByPlaceholder('e.g. 5000000').fill('15000000');

      // Add a unit photo
      const unitFileInputs = await page.locator('input[type="file"]').all();
      await unitFileInputs[0].setInputFiles({
        name: `unit0.png`,
        mimeType: 'image/png',
        buffer: Buffer.from('mock image data')
      });
      await page.waitForTimeout(1000); // Wait for upload

      // Save Changes
      await page.locator('button:has-text("Save Changes")').click();
      await page.waitForTimeout(1500); // wait for save
      
      // Verify Save State
      await expect(page.locator('text=Saved')).toBeVisible();
  });
});
