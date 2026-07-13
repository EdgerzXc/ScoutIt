import { test, expect } from '@playwright/test';

test.describe('Full Flow Mockups: Discovery to Handshake', () => {
  
  test('End-to-End: Buyer discovers property, connects to broker, and requests viewing', async ({ page }) => {
    // Mock the initiate API so the test passes without needing a real Supabase session
    await page.route('**/api/deals/initiate', async route => {
      await route.fulfill({ status: 200, json: { success: true, dealId: 'mock-deal-123', newBalance: 4 } });
    });

    // 1. Property Details Page Discovery
    await page.goto('http://localhost:3000/property/the-ridgeline-at-capitol-commons');
    await expect(page.locator('text=The Ridgeline').first()).toBeVisible({ timeout: 15000 });
    // Look for the "Connect with an Authorized Broker" button
    const connectBtn = page.locator('button:has-text("Connect with an Authorized Broker")');
    await expect(connectBtn).toBeVisible();
    await connectBtn.evaluate(b => b.click());

    // 6. Inquiry Modal (Spending 1 Connect)
    const modalTitle = page.locator('text=Contact the Owner');
    await expect(modalTitle).toBeVisible();
    
    const textArea = page.locator('textarea[name="message"]');
    await textArea.fill('Hi, I am interested in this property. Is there an available schedule?');

    const spendConnectBtn = page.locator('button:has-text("Spend 1 Connect")');
    await spendConnectBtn.click();

    await expect(page.locator('text=Connection Established')).toBeVisible({ timeout: 15000 });
    
    // Wait for the modal to auto-close (it has a setTimeout of 3000ms)
    await page.waitForTimeout(3500);

    // 8. Go to Dashboard Inbox
    await page.goto('http://localhost:3000/dashboard/inbox');
    await expect(page.locator('text=ScoutIT').first()).toBeVisible();
    
    // Select the deal to open the ChatBox
    await page.locator('h3:has-text("The Zuellig Building")').click();
    await page.waitForTimeout(500);

    // 9. Buyer requests a live viewing inside the Chatbox
    const requestViewingBtn = page.locator('button:has-text("Request Live Viewing")');
    await expect(requestViewingBtn).toBeVisible();
    await requestViewingBtn.click();

    // 10. Verify the Booking Modal opens
    // Exact match: "Request Live Viewing" (the button, still on screen behind the
    // modal) also contains the substring "Live Viewing", so a loose text= locator
    // resolves to two elements. The modal's own badge has the exact text "Live Viewing".
    const bookingTitle = page.getByText('Live Viewing', { exact: true });
    await expect(bookingTitle).toBeVisible();

    // 11. Select Date
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
    
    // Pick tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await dateInput.fill(dateString);

    // 12. Select Time
    const timeBtn = page.locator('button:has-text("10:00 AM")');
    await expect(timeBtn).toBeVisible();
    await timeBtn.click();

    // 13. Submit the request
    const submitBtn = page.locator('button:has-text("Send Request")');
    await submitBtn.click();

    // 14. Verify the system message appears in the chat
    await expect(page.locator('text=[SYSTEM] I have requested a live viewing')).toBeVisible();
  });

});
