import { describe, it, expect } from 'vitest';
import { fieldLabel } from '@/lib/fieldLabel';

// Locks in the fix for three real production crashes (React #31) recorded in
// `error_reports` on /property/aurelia-residences:
//   "Objects are not valid as a React child (found: object with keys
//    {key, label, placeholder})"

describe('fieldLabel', () => {
  it('returns the label for a normal schema field', () => {
    expect(fieldLabel({ key: 'DI_CAMS', label: 'CAMS (CUSA)', placeholder: 'e.g. ₱185' }))
      .toBe('CAMS (CUSA)');
  });

  it('passes a bare string through — both flows pass either shape', () => {
    expect(fieldLabel('Floor Area')).toBe('Floor Area');
  });

  // THE ACTUAL BUG. `{field.label || field}` falls through on ANY falsy label,
  // and an empty string is falsy — so the object itself reached React.
  it('never returns the object when the label is an empty string', () => {
    const field = { key: 'DI_CAMS', label: '', placeholder: 'x' };
    const out = fieldLabel(field);

    expect(typeof out).toBe('string');
    expect(out).not.toBe(field);
    expect(out).toBe('DI_CAMS'); // falls back to the key, not the object
  });

  it('treats a whitespace-only label as absent', () => {
    expect(fieldLabel({ key: 'DI_AC', label: '   ' })).toBe('DI_AC');
  });

  it('never returns the object when the label is missing entirely', () => {
    const field = { key: 'DI_Escalation', placeholder: 'e.g. 5%' };
    expect(fieldLabel(field)).toBe('DI_Escalation');
  });

  it.each([
    [null, ''],
    [undefined, ''],
    [{}, ''],
    [{ label: null, key: null }, ''],
  ])('returns a renderable string for %p', (input, expected) => {
    const out = fieldLabel(input);
    expect(typeof out).toBe('string');
    expect(out).toBe(expected);
  });

  // The exhaustive guarantee: whatever goes in, a string comes out. This is
  // the property that makes React #31 impossible from these call sites.
  it.each([
    { key: 'k', label: 'L' },
    { key: '', label: '' },
    'plain',
    '',
    null,
    undefined,
    {},
    { nested: { deep: true } },
    42,
  ])('always returns a primitive string for %p', (input) => {
    expect(typeof fieldLabel(input)).toBe('string');
  });

  it('does not invent a placeholder label — a blank is honest, "Unknown" is not', () => {
    expect(fieldLabel({})).toBe('');
    expect(fieldLabel({})).not.toMatch(/unknown|untitled|n\/a/i);
  });
});
