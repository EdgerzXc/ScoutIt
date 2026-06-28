const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Buyer Leads & Ephemeral Chat Handshake Flow', () => {

  test('should allow buyer to connect and complete handshake with broker', async ({ browser }) => {
    // We will simulate two separate contexts (Buyer and Broker)
    // However, since we're using a single-page mocked frontend, we'll navigate between routes in one context.
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Buyer Flow: Navigate to a public property page
    // Using the development server port
    await page.goto('http://localhost:3000/property/aurelia-residences');
    
    // Wait for the Connect with an Authorized Broker button to load
    const contactBtn = page.getByRole('button', { name: /Connect with an Authorized Broker/i });
    await expect(contactBtn).toBeVisible({ timeout: 15000 });

    // Click "Connect with an Authorized Broker" via JS to avoid CSS overlap issues
    await contactBtn.evaluate(b => b.click());

    // The Hierarchy Roster Window should appear
    await expect(page.getByText('Select Representative')).toBeVisible();

    // Take screenshot of roster
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'buyer-chat-01-roster.png') });

    // Buyer selects the "ScoutIt Recommended" broker
    await page.getByRole('button', { name: /Elena Rostova/i }).click();

    // The Connects Paywall / Message Composer should appear
    await expect(page.getByText('1 Connect Required')).toBeVisible();
    await expect(page.getByText('Contact Elena Rostova')).toBeVisible();

    // Take screenshot of composer
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'buyer-chat-02-composer.png') });

    // Fill the message
    await page.fill('textarea[name="message"]', "Hi Elena, I'd like to schedule a viewing for next Tuesday.");

    // Submit and spend the connect
    await page.getByRole('button', { name: /Spend 1 Connect/i }).click();

    // Expect success screen
    await expect(page.getByText('Connection Established')).toBeVisible({ timeout: 5000 });
    
    // Take screenshot of success
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'buyer-chat-03-success.png') });

    // Wait for modal to auto-close
    await expect(page.getByText('Connection Established')).toBeHidden({ timeout: 5000 });


    // 2. Broker Flow: Navigate to the Dashboard Inbox
    await page.goto('http://localhost:3000/dashboard/inbox');

    // Select the "The Zuellig Building" deal
    await page.getByText('The Zuellig Building').first().click();

    // The ChatBox should appear
    await expect(page.getByText('Inquiry for The Zuellig Building')).toBeVisible();

    // Verify chat disclaimer is present
    await expect(page.getByText('This conversation is temporary and will be deleted when closed.')).toBeVisible();

    // Take screenshot of inbox
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'broker-chat-04-inbox.png') });

    // Click "Offer Handshake"
    await page.getByRole('button', { name: /Offer Handshake/i }).first().click();

    // Handshake Confirmation Modal should appear
    await expect(page.getByText('Exchange Contact Info?')).toBeVisible();
    await expect(page.getByText('Once linked, this chat will be deleted forever.')).toBeVisible();

    // Take screenshot of warning modal
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'broker-chat-05-warning.png') });

    // Confirm the offer
    await page.getByRole('button', { name: 'Offer Handshake', exact: true }).click();

    // The button should now change to "Accept Handshake" 
    // (In reality this would be on the Buyer's screen, but we test the mock state here)
    const acceptBtn = page.getByRole('button', { name: /Accept Handshake/i });
    await expect(acceptBtn).toBeVisible();

    // 3. Buyer Flow: Accept Handshake
    await acceptBtn.click();

    // Handshake Animation Overlay ("Deal Linked") should appear
    await expect(page.getByText('Deal Linked')).toBeVisible();
    await expect(page.getByText('You are now officially connected. This temporary chat will close permanently.')).toBeVisible();

    // Take screenshot of the linked state
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'buyer-chat-06-linked.png') });
  });

});
