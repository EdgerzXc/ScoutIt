import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

// ═══════════════════════════════════════════════════════════════
// DRIFT GUARD — the two Airtable writers must stay identical
//
// `mission-control/` is a SEPARATE Next.js deployment. It cannot import from
// this project's src/, so three modules are vendored (copied) into it. Copies
// rot: that is exactly how finding W3 happened — the staff app's Airtable
// client fell ~84 fields behind the main app's, and nothing failed, so nobody
// noticed. A staff publish silently left every category spec stale.
//
// This test turns that silent rot into a red test. If you edit one copy and
// forget the other, CI fails here with the exact command to fix it.
// ═══════════════════════════════════════════════════════════════

const VENDORED = [
  'propertyFieldMapping.js',
  'detailKeyAliases.js',
  'numericTwins.js',
];

const MAIN = join(process.cwd(), 'src', 'lib');
const STAFF = join(process.cwd(), 'mission-control', 'src', 'lib');

const sha = (p) => createHash('sha256').update(readFileSync(p, 'utf8')).digest('hex');

describe('vendored modules must not drift between the two apps', () => {
  // If the staff app isn't checked out alongside (e.g. a partial clone), skip
  // rather than fail — a missing sibling project is not a code defect.
  const staffPresent = existsSync(STAFF);

  it('the mission-control project is present', () => {
    expect(typeof staffPresent).toBe('boolean');
  });

  for (const file of VENDORED) {
    it(`${file} is byte-identical in both projects`, () => {
      if (!staffPresent) return;
      const mainPath = join(MAIN, file);
      const staffPath = join(STAFF, file);

      expect(existsSync(mainPath)).toBe(true);
      expect(
        existsSync(staffPath),
        `${file} is missing from mission-control. Run:\n` +
          `  cp src/lib/${file} mission-control/src/lib/${file}`,
      ).toBe(true);

      expect(
        sha(staffPath),
        `${file} has DRIFTED between the two apps.\n` +
          `This is finding W3 recurring — the staff publish path will write\n` +
          `different Airtable fields than the owner path, silently.\n` +
          `Fix: copy whichever is correct over the other, e.g.\n` +
          `  cp src/lib/${file} mission-control/src/lib/${file}`,
      ).toBe(sha(mainPath));
    });
  }
});

describe('both apps actually use the shared mapping', () => {
  it('the staff Airtable client imports reverseMapCategoryFields', () => {
    if (!existsSync(STAFF)) return;
    const src = readFileSync(join(STAFF, 'airtable.js'), 'utf8');
    // Guards the specific regression: someone "simplifies" the staff client
    // back to a hardcoded 6-field object and loses ~84 fields again.
    expect(src).toContain('propertyFieldMapping');
    expect(src).toContain('reverseMapCategoryFields(property.details)');
  });

  it('the main Airtable client imports it too', () => {
    const src = readFileSync(join(MAIN, 'airtable.js'), 'utf8');
    expect(src).toContain('propertyFieldMapping');
  });
});
