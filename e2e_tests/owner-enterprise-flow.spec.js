const { test, expect } = require('@playwright/test');

test.describe('Enterprise Mission Control Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Owner can access enterprise mode, delegate task, and delegate unit', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    // 1. Mock the user as an Enterprise Owner
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.setItem('scoutit_user', JSON.stringify({
        id: "master-dev",
        name: "Jules (Enterprise)",
        email: "jules@scoutit.com",
        primaryMode: "mc_enterprise",
        tags: ["owner", "mc_enterprise"]
      }));
    });

    // 2. Go to dashboard
    await page.goto('http://localhost:3000/dashboard');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Unlock sandbox
    const unlockBtn = page.getByRole('button', { name: /Unlock Enterprise Sandbox/i });
    await expect(unlockBtn).toBeVisible({ timeout: 10000 });
    await unlockBtn.click();

    // Wait for Mission Control tabs
    await expect(page.getByText('Enterprise Dashboard')).toBeVisible({ timeout: 10000 });

    // 3. Delegate a Task
    // Click Team tab
    await page.click('button:has-text("Team")');
    
    // Check that we are on Team Management view (expect "Invite Member" button)
    await expect(page.getByRole('button', { name: 'Invite Member' })).toBeVisible();

    // Click Alignment tab for the active member
    await page.click('button:has-text("Alignment")');

    // Click Assign Task
    await page.click('button:has-text("Assign Task")');

    // Fill form
    await page.fill('input[placeholder="e.g., Audit building Q3 compliance..."]', 'Conduct Fire Safety Audit');
    await page.selectOption('select', 'Urgent');
    await page.fill('input[placeholder="e.g., Next Friday"]', 'Tomorrow 10AM');
    
    // Click Submit (Delegate to [Name])
    await page.click('button[type="submit"]');

    // Verify task is added
    await expect(page.getByText('Conduct Fire Safety Audit')).toBeVisible();

    // 4. Delegate a Unit
    // Click Inventory tab
    await page.click('button:has-text("Inventory")');
    
    // Verify InventoryGridManager is rendered by looking for the search placeholder
    await expect(page.getByPlaceholder('Search name, floor, or feature…')).toBeVisible();

    // Verify the grid renders units count label
    await expect(page.getByText(/units|unit/i).first()).toBeVisible();

    // 5. Delegate Unit to Operator
    // Click Add Unit if no units are present, or just to create a new one
    const addFirstUnitBtn = page.getByRole('button', { name: /Add your first unit/i });
    if (await addFirstUnitBtn.isVisible()) {
      await addFirstUnitBtn.click();
    }

    // Find the first unit's Operator dropdown
    // Wait for the select elements to appear in the table
    await page.waitForSelector('table select', { timeout: 5000 });
    const firstOperatorSelect = page.locator('table select').nth(1); // the second select in the row (first is Availability)
    
    // Select "Jerzel (Operator)"
    await firstOperatorSelect.selectOption('op_2');

    // Wait and verify that the select value is updated
    await expect(firstOperatorSelect).toHaveValue('op_2', { timeout: 5000 });

    console.log('Successfully validated Enterprise Mission Control delegation flow.');
  });
});
