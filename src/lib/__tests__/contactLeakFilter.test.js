import { describe, it, expect } from 'vitest';
import { detectContactLeak, rejectIfContactLeak, maskContactDetails, CONTACT_MASK } from '../contactLeakFilter.js';

// The FAQ layer is the widest open-text surface on ScoutIt. If this filter
// regresses, seekers and owners can trade phone numbers in public and skip
// the Connects handshake entirely — so both directions are tested hard.

describe('contactLeakFilter — must BLOCK contact leakage', () => {
  const cases = [
    ['plain PH mobile with spaces',   'Call me at 0917 123 4567',                'ph_mobile'],
    ['international format',          'my number is +639171234567',              'ph_mobile'],
    ['dot-separated mobile',          '0917.123.4567 text me',                   'ph_mobile'],
    ['homoglyph evasion (o for 0)',   'o917-123-4567',                           'ph_mobile'],
    ['fully spaced digits',           '0917 1 2 3 4 5 6 7',                      'ph_mobile'],
    ['spelled-out digits',            'reach me at zero nine one seven one two three four five six seven', 'ph_mobile'],
    ['landline with area code',       '(02) 8123 4567 is the landline',          'ph_landline'],
    ['plain email',                   'email me juan@gmail.com',                 'email'],
    ['bracket-obfuscated email',      'juan (at) gmail (dot) com',               'email'],
    ['messaging app handle',          'viber me: juandelacruz',                  'messaging_handle'],
    ['telegram handle',               'contact me thru telegram @juan',          'messaging_handle'],
    ['bare social handle',            '@juandelacruz on IG',                     'social_handle'],
    ['competitor link',               'check www.otherportal.ph for details',     'external_link'],
    ['full competitor URL',           'visit https://lamudi.com.ph/listing',     'external_link'],
    ['off-platform solicitation',     'text me at my cell',                      'bypass_solicitation'],
  ];

  it.each(cases)('blocks %s', (_label, input, expectedCode) => {
    const result = detectContactLeak(input);
    expect(result.clean).toBe(false);
    expect(result.code).toBe(expectedCode);
    expect(result.message).toBeTruthy();
  });
});

describe('contactLeakFilter — must ALLOW legitimate property talk', () => {
  // Every one of these is a realistic FAQ answer. A false positive here means
  // a verified advisor cannot post a spec, which is worse than annoying.
  const cases = [
    'Is there a dedicated fibre riser on this floor?',
    'The unit is 120 sqm with 2.8m ceiling height.',
    'Monthly dues are 95 per sqm, turnover was 2023.',
    'Elevator wait is about 3 minutes at 8am.',
    'Yes, parking slot 14B is included in the CCT.',
    'See https://scoutit.space/property/one-bgc for the floor plan.',
    'See https://scoutit.ph/property/one-bgc for the floor plan.',
    'Built in 2019, renovated 2024. Price is 45000000.',
    'Asking is P 145,000,000 net of taxes.',
    "It's on the 32nd floor, unit 3204, facing east.",
    'Two parking slots, 4 bedrooms, 3 baths, 180 sqm.',
    'The lease is 5 years at 1200 per sqm per month.',
    'Meet me at the lobby at 2pm on Thursday.',
    'Ceiling is 2.7m and the riser is on floor 12 of 45.',
    'CGT is 6%, DST 1.5%, transfer tax 0.75%.',
  ];

  it.each(cases)('allows: %s', (input) => {
    expect(detectContactLeak(input).clean).toBe(true);
  });
});

describe('contactLeakFilter — edge cases', () => {
  it('treats empty and nullish input as clean', () => {
    expect(detectContactLeak('').clean).toBe(true);
    expect(detectContactLeak(null).clean).toBe(true);
    expect(detectContactLeak(undefined).clean).toBe(true);
  });

  // The allowed hosts come from lib/siteUrl.js OWN_DOMAINS. When the domain
  // moved scoutit.ph -> scoutit.space, a hardcoded hostname here would have
  // started rejecting links to our own site as "external".
  it.each([
    ['https://scoutit.space/intel/bgc-flood'],
    ['https://www.scoutit.space/discover'],
    ['https://scoutit.ph/intel/bgc-flood'],
    ['https://www.scoutit.ph/discover'],
  ])('never flags our own domain as external: %s', (url) => {
    expect(detectContactLeak(url).clean).toBe(true);
  });

  it('rejectIfContactLeak returns null when clean', () => {
    expect(rejectIfContactLeak('The unit faces north-east.')).toBeNull();
  });

  it('rejectIfContactLeak returns a code and message when dirty', () => {
    const rejection = rejectIfContactLeak('ring me on 09171234567');
    expect(rejection).not.toBeNull();
    expect(rejection.code).toBe('ph_mobile');
    expect(typeof rejection.message).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Display-layer masking (NEW_IDEAS.md §38.3 / §35 Layer 2)
//
// Chat is a DIFFERENT surface from the public FAQ. Inside a paid Connects
// thread, swapping numbers is the legitimate end state -- so the message is
// stored intact and only hidden at render time until both parties sign the
// handshake. These tests pin the two failure modes that matter: a number
// leaking BEFORE the handshake, and the text being mangled AFTER it.
// ─────────────────────────────────────────────────────────────────────────
describe('maskContactDetails — hides contacts until the handshake', () => {
  it.each([
    ['PH mobile',          'call me 09171234567'],
    ['spaced mobile',      'my number is 0917 123 4567'],
    ['international',      'reach me +639171234567'],
    ['landline',           'office line (02) 8123 4567'],
    ['plain email',        'email juan@gmail.com please'],
    ['obfuscated email',   'juan (at) gmail (dot) com'],
  ])('masks %s', (_label, input) => {
    const masked = maskContactDetails(input, false);
    expect(masked).toContain(CONTACT_MASK);
    expect(masked).not.toMatch(/\d{7,}/);
  });

  it('leaves the rest of the sentence readable', () => {
    const masked = maskContactDetails('Viewing Thursday, call me 09171234567 after', false);
    expect(masked).toContain('Viewing Thursday');
    expect(masked).toContain('after');
  });

  // A false positive here is expensive: these are the numbers a real
  // negotiation is actually about. Masking a price or a floor area would make
  // the shield look broken and push people off-platform to talk plainly.
  it.each([
    'The unit is 120 sqm with 2.8m ceiling height.',
    'Asking is 45,000,000 pesos.',
    'Parking slot 12B on the 34th floor.',
    'Lease is 1,200 per sqm per month.',
    'Turnover is Q3 2027.',
  ])('does not mask legitimate property talk: %s', (input) => {
    expect(maskContactDetails(input, false)).toBe(input);
  });

  it('returns the text untouched once revealed', () => {
    const raw = 'call me 09171234567 or juan@gmail.com';
    expect(maskContactDetails(raw, true)).toBe(raw);
  });

  it('handles null and undefined without throwing', () => {
    expect(maskContactDetails(null, false)).toBe('');
    expect(maskContactDetails(undefined, false)).toBe('');
  });
});
