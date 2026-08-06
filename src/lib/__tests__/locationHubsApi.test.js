import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/hubs/route';

describe('/api/hubs API endpoint', () => {
  it('returns location hubs list with 200', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.hubs)).toBe(true);
    expect(json.hubs.length).toBeGreaterThan(0);
    expect(json.hubs[0].slug).toBe('bgc-taguig');
  });
});
