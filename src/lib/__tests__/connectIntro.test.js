import { describe, it, expect } from 'vitest';
import { validateIntroMessage, INTRO_MAX } from '../connectIntro.js';

// The intro is the only thing a recipient reads before deciding whether to
// accept a Connect. The cost of getting this wrong is asymmetric: a message
// wrongly rejected costs an edit, but a message silently truncated on the
// request card loses the point of something the sender paid for.

describe('validateIntroMessage', () => {
  it('accepts a normal message and returns it trimmed', () => {
    const result = validateIntroMessage('  Is this unit still available in March?  ');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('Is this unit still available in March?');
  });

  it.each([
    ['empty string', ''],
    ['whitespace only', '   \n\t  '],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_label, input) => {
    const result = validateIntroMessage(input);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it(`accepts a message exactly at the ${INTRO_MAX} limit`, () => {
    const result = validateIntroMessage('x'.repeat(INTRO_MAX));
    expect(result.ok).toBe(true);
  });

  it('rejects one character over the limit', () => {
    const result = validateIntroMessage('x'.repeat(INTRO_MAX + 1));
    expect(result.ok).toBe(false);
    expect(result.error).toContain(String(INTRO_MAX));
  });

  // Trailing whitespace tipping a message over the cap is a rejection with no
  // visible cause -- the user counts their characters and sees nothing wrong.
  it('trims before measuring, so trailing whitespace never pushes it over', () => {
    const result = validateIntroMessage('x'.repeat(INTRO_MAX) + '    \n  ');
    expect(result.ok).toBe(true);
    expect(result.value.length).toBe(INTRO_MAX);
  });

  it('counts characters, not bytes, so accented and Filipino text is not penalised', () => {
    const result = validateIntroMessage('Magandang araw pô — available pa ba ito?');
    expect(result.ok).toBe(true);
  });
});
