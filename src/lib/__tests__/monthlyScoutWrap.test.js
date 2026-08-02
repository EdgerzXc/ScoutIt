import { describe, it, expect } from 'vitest';
import { formatPeriodMonth, deduplicateUniqueEyes } from '@/lib/monthlyScoutWrap';

describe('LR-06 and LR-07 Monthly Scout Wrap analytics engine', () => {
  it('formats reporting period correctly to YYYY-MM in Manila time zone convention', () => {
    const testDate = new Date('2026-08-15T10:00:00Z');
    expect(formatPeriodMonth(testDate)).toBe('2026-08');
  });

  it('deduplicates unique viewer eyes accurately without inflating portfolio counts', () => {
    const events = [
      { event_type: 'property_view', viewer_key: 'viewer_a', property_id: 'p1' },
      { event_type: 'property_view', viewer_key: 'viewer_a', property_id: 'p2' }, // Same person, different property
      { event_type: 'property_view', viewer_key: 'viewer_b', property_id: 'p1' },
      { event_type: 'property_save', viewer_key: 'viewer_c', property_id: 'p1' }, // Save event ignored for view eyes count
    ];

    expect(deduplicateUniqueEyes(events)).toBe(2); // viewer_a and viewer_b
  });
});
