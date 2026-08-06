import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHistoricalPropertyRedirect } from '../propertyRedirects.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

vi.mock('../supabaseAdmin.js', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe('propertyRedirects — getHistoricalPropertyRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for empty or nullish inputs', async () => {
    expect(await getHistoricalPropertyRedirect('')).toBeNull();
    expect(await getHistoricalPropertyRedirect(null)).toBeNull();
    expect(await getHistoricalPropertyRedirect(undefined)).toBeNull();
  });

  it('resolves historical slug from property_slug_history table', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { canonical_slug: 'the-grand-tower-bgc' },
            error: null,
          }),
        }),
      }),
    });
    supabaseAdmin.from = mockFrom;

    const result = await getHistoricalPropertyRedirect('old-grand-tower-url');
    expect(result).toBe('the-grand-tower-bgc');
    expect(mockFrom).toHaveBeenCalledWith('property_slug_history');
  });

  it('falls back to property_slug_redirects if property_slug_history has no match', async () => {
    const mockFrom = vi.fn().mockImplementation((tableName) => {
      if (tableName === 'property_slug_history') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { current_slug: 'legacy-redirect-target' },
              error: null,
            }),
          }),
        }),
      };
    });
    supabaseAdmin.from = mockFrom;

    const result = await getHistoricalPropertyRedirect('very-old-slug');
    expect(result).toBe('legacy-redirect-target');
    expect(mockFrom).toHaveBeenCalledWith('property_slug_history');
    expect(mockFrom).toHaveBeenCalledWith('property_slug_redirects');
  });
});
