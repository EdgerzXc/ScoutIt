import { describe, it, expect } from 'vitest';
import {
  getPreflightQuestions,
  preflightCategoryFor,
  findPreflightQuestion,
  preflightProgress,
  PREFLIGHT_TARGET,
} from '../faqPreflight.js';

const CATEGORIES = ['residential', 'commercial', 'str', 'hospitality', 'restaurants', 'venues'];

describe('preflightCategoryFor', () => {
  // Must stay in lockstep with deepIntelCategoryFor() in src/lib/airtable.js.
  // If those two diverge, a commercial listing gets residential questions.
  it.each([
    ['Commercial', 'commercial'],
    ['Residential', 'residential'],
    ['STR / Short Term', 'str'],
    ['Hospitality', 'hospitality'],
    ['Restaurant', 'restaurants'],
    ['Culinary', 'restaurants'],
    ['Event Venue', 'venues'],
  ])('maps %s to %s', (input, expected) => {
    expect(preflightCategoryFor(input)).toBe(expected);
  });

  it.each([[''], [null], [undefined], ['Nonsense']])(
    'falls back to residential for %s',
    (input) => {
      expect(preflightCategoryFor(input)).toBe('residential');
    },
  );
});

describe('question sets', () => {
  it.each(CATEGORIES)('%s has at least 8 well-formed questions', (category) => {
    const questions = getPreflightQuestions(category);
    expect(questions.length).toBeGreaterThanOrEqual(8);
    for (const q of questions) {
      expect(q.question.length).toBeGreaterThan(10);
      expect(q.hint.length).toBeGreaterThan(5);
    }
  });

  it.each(CATEGORIES)('%s has unique keys', (category) => {
    const keys = getPreflightQuestions(category).map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keys are globally unique across every category', () => {
    // preflight_key is unique per property, so a collision between two
    // category sets would silently overwrite an owner's answer.
    const all = CATEGORIES.flatMap((c) => getPreflightQuestions(c).map((q) => q.key));
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('findPreflightQuestion — API guard', () => {
  it('rejects a key from a different category', () => {
    expect(findPreflightQuestion('Commercial', 'res_noise')).toBeNull();
  });

  it('rejects an arbitrary key', () => {
    expect(findPreflightQuestion('Commercial', 'not_a_real_key')).toBeNull();
  });

  it('accepts a valid key for the category', () => {
    expect(findPreflightQuestion('Commercial', 'com_aircon')?.key).toBe('com_aircon');
  });
});

describe('preflightProgress', () => {
  it('is incomplete below the target', () => {
    const p = preflightProgress('Commercial', PREFLIGHT_TARGET - 1);
    expect(p.complete).toBe(false);
  });

  it('is complete at the target', () => {
    expect(preflightProgress('Commercial', PREFLIGHT_TARGET).complete).toBe(true);
  });

  it('clamps an over-count to the set size', () => {
    const p = preflightProgress('Commercial', 999);
    expect(p.answered).toBe(p.total);
  });

  it('handles zero', () => {
    const p = preflightProgress('Residential', 0);
    expect(p.answered).toBe(0);
    expect(p.complete).toBe(false);
  });
});
