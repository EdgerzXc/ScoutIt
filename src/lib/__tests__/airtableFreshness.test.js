import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stampAirtableFreshness } from '@/lib/airtableFreshness';
import { fetchProperties } from '@/lib/airtable';
import { fetchWithRetry } from '@/lib/fetchWithRetry';

vi.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: vi.fn() }));

describe('stampAirtableFreshness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails before fetching when required Airtable configuration is absent', async () => {
    const result = await stampAirtableFreshness({
      slug: 'one-ecom-center',
      isoDate: '2026-08-27T00:00:00.000Z',
      apiKey: '',
      baseId: '',
    });

    expect(result).toEqual({ ok: false, reason: 'missing_configuration' });
    expect(fetchWithRetry).not.toHaveBeenCalled();
  });

  it('finds by formula slug and patches only Last_Verified_Date', async () => {
    vi.mocked(fetchWithRetry)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ records: [{ id: 'rec-1' }] }) })
      .mockResolvedValueOnce({ ok: true });

    const isoDate = '2026-08-27T00:00:00.000Z';
    const result = await stampAirtableFreshness({
      slug: 'one-ecom-center',
      isoDate,
      apiKey: 'key',
      baseId: 'base',
    });

    expect(result).toEqual({ ok: true, recordId: 'rec-1' });
    expect(fetchWithRetry).toHaveBeenCalledTimes(2);
    const [lookupUrl, lookupOptions, lookupPolicy] = vi.mocked(fetchWithRetry).mock.calls[0];
    const lookup = new URL(lookupUrl);
    expect(lookup.searchParams.get('filterByFormula')).toBe("{Slug}='one-ecom-center'");
    expect(lookup.searchParams.get('maxRecords')).toBe('1');
    expect(lookupOptions).toEqual({ headers: { Authorization: 'Bearer key' } });
    expect(lookupPolicy).toEqual({ circuit: 'airtable-freshness' });
    const patchOptions = vi.mocked(fetchWithRetry).mock.calls[1][1];
    expect(JSON.parse(patchOptions.body)).toEqual({
      fields: { Last_Verified_Date: isoDate },
      typecast: true,
    });
    expect(patchOptions.body).not.toContain('Slug');
  });

  it('keeps quote-bearing slugs inside the Airtable formula string', async () => {
    vi.mocked(fetchWithRetry)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ records: [{ id: 'rec-1' }] }) })
      .mockResolvedValueOnce({ ok: true });

    await stampAirtableFreshness({
      slug: "tower' OR(TRUE())",
      isoDate: '2026-08-27T00:00:00.000Z',
      apiKey: 'key',
      baseId: 'base',
    });

    const lookup = new URL(vi.mocked(fetchWithRetry).mock.calls[0][0]);
    expect(lookup.searchParams.get('filterByFormula')).toBe("{Slug}='tower\\' OR(TRUE())'");
    expect(lookup.searchParams.get('maxRecords')).toBe('1');
  });

  it('projects the stamped Airtable date into the public property payload', async () => {
    const isoDate = '2026-08-27T00:00:00.000Z';
    vi.mocked(fetchWithRetry).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [{
          id: 'rec-public',
          fields: {
            Approved_For_ScoutIt: true,
            Title: 'One E-Com Center',
            Slug: 'one-ecom-center',
            Last_Verified_Date: isoDate,
          },
        }],
      }),
    });

    const properties = await fetchProperties('key', 'base');

    expect(properties).toHaveLength(1);
    expect(properties[0]).toMatchObject({
      slug: 'one-ecom-center',
      last_verified_date: isoDate,
    });
  });
});
