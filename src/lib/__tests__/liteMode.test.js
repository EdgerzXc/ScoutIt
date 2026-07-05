import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isLiteMode, getStoredLiteMode, setLiteMode, LITE_MODE_KEY, LITE_MODE_EVENT } from '../liteMode.js';

describe('liteMode', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    document.documentElement.className = '';

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockStorage[key] = String(value);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isLiteMode', () => {
    it('returns false when lite-mode class is not present', () => {
      expect(isLiteMode()).toBe(false);
    });

    it('returns true when lite-mode class is present', () => {
      document.documentElement.classList.add('lite-mode');
      expect(isLiteMode()).toBe(true);
    });
  });

  describe('getStoredLiteMode', () => {
    it('returns false when no preference is stored', () => {
      expect(getStoredLiteMode()).toBe(false);
    });

    it('returns true when preference is stored as "1"', () => {
      mockStorage[LITE_MODE_KEY] = '1';
      expect(getStoredLiteMode()).toBe(true);
    });

    it('returns false when preference is stored as "0"', () => {
      mockStorage[LITE_MODE_KEY] = '0';
      expect(getStoredLiteMode()).toBe(false);
    });

    it('returns false on localStorage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Access denied');
      });
      expect(getStoredLiteMode()).toBe(false);
    });
  });

  describe('setLiteMode', () => {
    it('turns on lite mode: updates DOM, storage, and dispatches event', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      setLiteMode(true);

      expect(document.documentElement.classList.contains('lite-mode')).toBe(true);
      expect(mockStorage[LITE_MODE_KEY]).toBe('1');

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const event = dispatchSpy.mock.calls[0][0];
      expect(event.type).toBe(LITE_MODE_EVENT);
      expect(event.detail).toEqual({ on: true });
    });

    it('turns off lite mode: updates DOM, storage, and dispatches event', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      document.documentElement.classList.add('lite-mode');

      setLiteMode(false);

      expect(document.documentElement.classList.contains('lite-mode')).toBe(false);
      expect(mockStorage[LITE_MODE_KEY]).toBe('0');

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const event = dispatchSpy.mock.calls[0][0];
      expect(event.type).toBe(LITE_MODE_EVENT);
      expect(event.detail).toEqual({ on: false });
    });

    it('catches localStorage errors without throwing', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      expect(() => setLiteMode(true)).not.toThrow();
      expect(document.documentElement.classList.contains('lite-mode')).toBe(true);
    });
  });
});
