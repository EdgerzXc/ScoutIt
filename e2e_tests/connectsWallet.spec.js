import { test, expect } from '@playwright/test';
import { addPurchasedConnects, getBalance, getWallet } from '../src/lib/connectsWallet.js';

test.describe('connectsWallet', () => {
  let store = {};

  test.beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = val.toString(); },
    };
    global.window = { localStorage: mockStorage };
    global.localStorage = mockStorage;
  });

  test.afterEach(() => {
    delete global.window;
    delete global.localStorage;
  });

  test('addPurchasedConnects adds amount to purchased connects and updates storage', () => {
    const role = 'seeker';
    const tier = 'basic';
    const amount = 50;

    // Initial check
    const initialWallet = getWallet(role, tier);
    expect(initialWallet.purchased).toBe(0);
    const initialBalance = getBalance(role, tier);

    // Call function
    addPurchasedConnects(role, tier, amount);

    // Verify wallet object
    const updatedWallet = getWallet(role, tier);
    expect(updatedWallet.purchased).toBe(amount);

    // Verify balance
    const newBalance = getBalance(role, tier);
    expect(newBalance).toBe(initialBalance + amount);

    // Call again to verify it increments
    addPurchasedConnects(role, tier, 25);
    const finalWallet = getWallet(role, tier);
    expect(finalWallet.purchased).toBe(amount + 25);
    const finalBalance = getBalance(role, tier);
    expect(finalBalance).toBe(newBalance + 25);
  });
});
