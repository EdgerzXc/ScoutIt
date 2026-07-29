import { describe, it, expect } from 'vitest';
import {
  leadsToCsv,
  leadToText,
  leadToVCard,
  normaliseLead,
  exportFilename,
} from '../leadExport.js';

const LEAD = {
  name: 'Juan Dela Cruz',
  email: 'juan@example.com',
  phone: '0917 123 4567',
  propertyTitle: 'One BGC Tower',
  propertySlug: 'one-bgc',
  status: 'accepted',
  pitch_message: 'Interested in a 120sqm unit, Q4 move-in.',
  created_at: '2026-07-20T09:30:00Z',
};

describe('leadsToCsv — spreadsheet safety', () => {
  // A cell starting with = + - or @ is executed as a formula by Excel and
  // Google Sheets. A lead named "=cmd|..." would be a live injection into
  // the broker's spreadsheet the moment they open the export.
  it.each([
    ['=cmd|/c calc', "'="],
    ['+1234', "'+"],
    ['-5', "'-"],
    ['@SUM(A1)', "'@"],
  ])('neutralises a leading %s', (value, expectedPrefix) => {
    expect(leadsToCsv([{ name: value }])).toContain(expectedPrefix);
  });

  it('quotes fields containing commas', () => {
    expect(leadsToCsv([{ name: 'Dela Cruz, Juan' }])).toContain('"Dela Cruz, Juan"');
  });

  it('doubles embedded quotes per RFC 4180', () => {
    expect(leadsToCsv([{ pitch_message: 'He said "yes"' }])).toContain('""yes""');
  });

  it('uses CRLF line endings for Excel on Windows', () => {
    expect(leadsToCsv([LEAD])).toContain('\r\n');
  });
});

describe('leadsToCsv — content', () => {
  it('emits a header row', () => {
    expect(leadsToCsv([LEAD]).split('\r\n')[0]).toMatch(/^Name,Email,Phone/);
  });

  it('includes the lead data', () => {
    const csv = leadsToCsv([LEAD]);
    expect(csv).toContain('Juan Dela Cruz');
    expect(csv).toContain('juan@example.com');
  });

  it('returns header only for an empty list', () => {
    expect(leadsToCsv([]).split('\r\n')).toHaveLength(1);
  });

  it('survives a nullish list', () => {
    expect(typeof leadsToCsv(null)).toBe('string');
  });
});

describe('leadToText', () => {
  const text = leadToText(LEAD);

  it('leads with the name', () => {
    expect(text.startsWith('Juan Dela Cruz')).toBe(true);
  });

  it('includes contact details and the property URL', () => {
    expect(text).toContain('Email: juan@example.com');
    expect(text).toContain('scoutit.ph/property/one-bgc');
  });

  it('ends with attribution', () => {
    expect(text.trim().endsWith('— via ScoutIt')).toBe(true);
  });

  // Honest Blank Rule: a label with nothing after it is noise a broker has
  // to mentally filter every time they paste.
  it('omits labels for missing fields entirely', () => {
    const sparse = leadToText({ name: 'Ana' });
    expect(sparse).not.toContain('Phone:');
    expect(sparse).not.toContain('Budget:');
    expect(sparse).not.toContain('Email:');
  });
});

describe('leadToVCard', () => {
  it('produces a well-formed card', () => {
    const vcard = leadToVCard(LEAD);
    expect(vcard.startsWith('BEGIN:VCARD')).toBe(true);
    expect(vcard.endsWith('END:VCARD')).toBe(true);
    expect(vcard).toContain('FN:Juan Dela Cruz');
    expect(vcard).toContain('TEL;TYPE=CELL:');
  });

  it('escapes commas per RFC 6350', () => {
    expect(leadToVCard({ name: 'X', propertyTitle: 'A, B' })).toContain('A\\, B');
  });

  // An empty vCard imports as a blank contact — worse than no button.
  it('returns null when there is nothing to save', () => {
    expect(leadToVCard({ propertyTitle: 'Just a property' })).toBeNull();
    expect(leadToVCard({})).toBeNull();
  });
});

describe('normaliseLead — accepts the shapes leads actually arrive in', () => {
  it('reads a nested buyerContact', () => {
    expect(normaliseLead({ buyerContact: { email: 'b@x.com' } }).email).toBe('b@x.com');
  });

  it('reads a targetListing title', () => {
    expect(normaliseLead({ targetListing: { title: 'T' } }).property).toBe('T');
  });

  it('handles an empty object', () => {
    expect(normaliseLead({}).name).toBe('');
  });
});

describe('exportFilename', () => {
  it('slugs and date-stamps', () => {
    expect(exportFilename()).toMatch(/^scoutit-leads-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('sanitises an arbitrary prefix into a safe filename', () => {
    expect(exportFilename('One BGC Tower!!')).toMatch(/^one-bgc-tower-/);
  });
});
