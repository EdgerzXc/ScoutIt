import { test, expect } from '@playwright/test';
import { getStoredLiteMode } from '../src/lib/liteMode.js';

test.describe('liteMode utility', () => {
  test('getStoredLiteMode handles localStorage throwing an error', () => {
    // Save original global objects
    const originalWindow = global.window;
    const originalLocalStorage = global.localStorage;

    // Mock window to avoid the "typeof window === 'undefined'" early exit
    global.window = {};

    // Mock localStorage to throw a SecurityError
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('SecurityError: access denied');
        }
      },
      writable: true,
      configurable: true
    });

    try {
      // Execute the function which should catch the error and return false
      const result = getStoredLiteMode();
      expect(result).toBe(false);
    } finally {
      // Restore globals
      global.window = originalWindow;
      global.localStorage = originalLocalStorage;
    }
  });
});
