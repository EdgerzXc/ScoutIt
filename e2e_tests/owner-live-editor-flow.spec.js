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
      // Mock Supabase property inserts/updates/reads.
      // /dashboard and /dashboard/inventory/[id] each mount their own independent
      // DashboardProvider (no shared provider at a layout level) -- navigating between
      // them remounts the context and re-fetches `listings` from scratch via a GET on
      // this same endpoint. Without mocking that GET too, the freshly-mounted provider
      // never sees the property this test just "created" (it was never really inserted,
      // only the POST was intercepted), so the inventory page's
      // "listing not found -> redirect to /dashboard" guard fires before the page renders.
      await page.route('**/rest/v1/properties*', async route => {
        if (route.request().method() === 'POST') {
          const postData = JSON.parse(route.request().postData() || '[{}]');
          publishPayload = { ...postData[0], id: 'mock-id-live' };
          await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([publishPayload]) });
        } else if (route.request().method() === 'PATCH') {
          const postData = JSON.parse(route.request().postData() || '{}');
          publishPayload = { ...publishPayload, ...postData };
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([publishPayload]) });
        } else if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(publishPayload ? [publishPayload] : []) });
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

      // We should be on the "How do you want to create your listing?" screen
      await expect(page.locator('h1:has-text("How do you want to create your listing?")')).toBeVisible({ timeout: 10000 });

      // Click "Build from Scratch"
      await page.locator('h3:has-text("Build from Scratch")').click();
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

      // The Inventory Manager reads/writes real property_units rows via
      // /api/dashboard/units (see SCOUTIT_MASTER_BUILD_SPEC.md §9) -- it no longer
      // reads the legacy details.units_inventory blob this test used to seed.
      // GET: no existing units yet. POST: echo back whatever was sent, assigning a
      // real-looking id to any client temp id so the save completes successfully.
      let savedUnits = [];
      await page.route('**/api/dashboard/units*', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ units: savedUnits }) });
        } else if (route.request().method() === 'POST') {
          const body = JSON.parse(route.request().postData() || '{}');
          savedUnits = (body.units || []).map((u, i) => ({ ...u, id: u.id || `mock-unit-${i}` }));
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, units: savedUnits, insertedIdByTempId: {} }) });
        } else {
          await route.continue();
        }
      });

      // Click Manage Inventory
      await page.locator('a:has-text("Manage Inventory")').click();
      await page.waitForTimeout(1000);

      // We are now on the Inventory Manager page
      await expect(page.locator('text=Inventory Manager')).toBeVisible();

      // Add a unit. The empty state's CTA reads "Add your first unit"; once units
      // exist, the toolbar's own "+ Add Unit" button takes over -- match either.
      await page.locator('button').filter({ hasText: /Add (your first unit|Unit)/i }).first().click();
      await page.waitForTimeout(500);

      // Fill unit details -- current InventoryGridManager.js placeholders
      // ("e.g. Unit 12-A" for name, "30" for size sqm, "e.g. 3" for floor).
      // The per-unit Price field was removed (commit 738f2e9); photo upload now
      // opens a modal / accepts drag-and-drop rather than an inline <input type="file">,
      // so it's exercised separately and not required for a unit to save.
      await page.getByPlaceholder('e.g. Unit 12-A').first().fill('Penthouse Suite A');
      await page.getByPlaceholder('30').first().fill('120');

      // Save Changes
      await page.locator('button:has-text("Save Changes")').click();
      await page.waitForTimeout(1500); // wait for save

      // Verify Save State
      // Exact match: the "All changes saved" status text also contains the
      // substring "saved", so a loose text= locator resolves to two elements.
      await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  });
});
