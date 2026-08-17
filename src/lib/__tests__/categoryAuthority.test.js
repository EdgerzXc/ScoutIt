import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const readSrc = (relPath) => fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');

describe('category authority source contracts', () => {
  const auditedFiles = [
    'src/app/property/DirectoryClient.js',
    'src/app/property/page.js',
    'src/app/intel/page.js',
    'src/lib/airtable.js',
  ];

  it('ensures no scoped runtime file references obsolete MOCK_CATEGORIES', () => {
    for (const relPath of auditedFiles) {
      const content = readSrc(relPath);
      expect(content).not.toContain('MOCK_CATEGORIES');
    }
  });

  it('ensures intel page uses honest CMS spaceCategory and does not coerce property category to Residential', () => {
    const intelPage = readSrc('src/app/intel/page.js');

    // Dead scaffolding must be absent
    expect(intelPage).not.toContain('baseProperties = [].map');

    // Property category mapping must not coerce missing category to Residential
    expect(intelPage).not.toMatch(/p\.spaceCategory\s*\|\|\s*["']Residential["']/);

    // Property category mapping must honestly use spaceCategory directly
    expect(intelPage).toMatch(/let\s+cat\s*=\s*p\.spaceCategory\s*\|\|\s*["']["'];/);
  });

  it('ensures directory client consumes CMS spaceCategory without slug overrides', () => {
    const directoryClient = readSrc('src/app/property/DirectoryClient.js');

    // Must map spaceCategory directly without mock category table lookups
    expect(directoryClient).toMatch(/toCard\(\s*p\s*,\s*p\.spaceCategory\s*\|\|\s*null/);
    expect(directoryClient).not.toContain('MOCK_CATEGORIES');
  });

  it('ensures airtable helper normalizes SpaceCategory without overrides', () => {
    const airtableHelper = readSrc('src/lib/airtable.js');

    // Authoritative field mapping from Airtable SpaceCategory
    expect(airtableHelper).toMatch(/spaceCategory:\s*f\.SpaceCategory\s*\|\|\s*["']["']/);
  });
});
