import { describe, it, expect } from 'vitest';
import {
  buildPropertyJsonLd,
  buildFaqPageNode,
  mergeFaqIntoOverride,
  schemaTypeForCategory,
} from '../propertySchema.js';

const COMMERCIAL = {
  title: 'One BGC Tower Unit 32',
  slug: 'one-bgc-32',
  spaceCategory: 'Commercial Office',
  location: '11th Ave, BGC',
  city: 'Taguig',
  coordinates: [14.5494, 121.048],
  seo_description: 'Grade A office.',
  photos: ['https://x/a.jpg', 'https://x/b.jpg'],
  details: { Floor_Area_Sqm: '250' },
};

const FAQS = [
  {
    question: 'What is the aircon system?',
    answers: [
      { text: 'VRF, tenant-metered.', tier: 'silver' },
      { text: 'VRF with after-hours billing.', tier: 'gold' },
    ],
  },
  { question: 'Is there generator backup?', answers: [{ text: 'Full floor coverage.', tier: 'gold' }] },
  { question: 'Nobody answered this one?', answers: [] },
];

const graphOf = (json) => JSON.parse(json)['@graph'];
const nodeOf = (json, type) => graphOf(json).find((n) => n['@type'] === type);

describe('schemaTypeForCategory', () => {
  it.each([
    ['Residential House', 'SingleFamilyResidence'],
    ['Condominium', 'Apartment'],
    ['Commercial Office', 'CommercialProperty'],
    ['Restaurant', 'Restaurant'],
    ['Event Venue', 'EventVenue'],
    ['Hospitality', 'Hotel'],
    ['STR', 'LodgingBusiness'],
    ['', 'Residence'],
  ])('maps %s to %s', (input, expected) => {
    expect(schemaTypeForCategory(input)).toBe(expected);
  });

  it('checks restaurant before the broader commercial rule', () => {
    expect(schemaTypeForCategory('Commercial Restaurant Space')).toBe('Restaurant');
  });
});

describe('buildPropertyJsonLd — compliance', () => {
  // Money renders only in the "Your Move" section. Emitting a price here
  // would contradict the visible page, which is exactly the mismatch that
  // earns a structured-data manual action.
  it('never emits offers or price', () => {
    const json = buildPropertyJsonLd(COMMERCIAL, 'one-bgc-32', FAQS);
    expect(json).not.toMatch(/"offers"/i);
    expect(json).not.toMatch(/"price"/i);
  });

  // Honest Blank Rule: a missing spec is omitted, never zero-filled.
  it('emits no empty fields for a sparse record', () => {
    const json = buildPropertyJsonLd({ title: 'Bare', slug: 'b' }, 'b', []);
    expect(json).not.toContain('""');
    expect(graphOf(json).some((n) => n.address)).toBe(false);
  });
});

describe('buildPropertyJsonLd — graph shape', () => {
  it('builds listing, asset, breadcrumb and FAQ nodes', () => {
    const graph = graphOf(buildPropertyJsonLd(COMMERCIAL, 'one-bgc-32', FAQS));
    expect(graph).toHaveLength(4);
  });

  it('links the listing to the asset via mainEntity', () => {
    const json = buildPropertyJsonLd(COMMERCIAL, 'one-bgc-32', FAQS);
    expect(nodeOf(json, 'RealEstateListing').mainEntity['@id']).toBe(
      nodeOf(json, 'CommercialProperty')['@id'],
    );
  });

  it('coerces floor size to a number with the right unit code', () => {
    const size = nodeOf(buildPropertyJsonLd(COMMERCIAL, 'one-bgc-32', []), 'CommercialProperty').floorSize;
    expect(size.value).toBe(250);
    expect(size.unitCode).toBe('MTK');
  });

  it('emits geo coordinates when present', () => {
    const geo = nodeOf(buildPropertyJsonLd(COMMERCIAL, 'one-bgc-32', []), 'CommercialProperty').geo;
    expect(geo.latitude).toBe(14.5494);
  });

  // schema.org only defines these on Accommodation subtypes.
  it('puts bedrooms on residential types only', () => {
    const res = {
      title: 'Villa', slug: 'v', spaceCategory: 'Residential House',
      details: { RES_Bedrooms: '4', RES_Bathrooms: '3' },
    };
    expect(nodeOf(buildPropertyJsonLd(res, 'v', []), 'SingleFamilyResidence').numberOfBedrooms).toBe(4);
    expect(nodeOf(buildPropertyJsonLd(COMMERCIAL, 'c', []), 'CommercialProperty').numberOfBedrooms).toBeUndefined();
  });
});

describe('buildFaqPageNode', () => {
  // An empty FAQPage is invalid structured data and a manual-action risk,
  // so emitting nothing is strictly better than emitting a shell.
  it('returns null when there is nothing answered', () => {
    expect(buildFaqPageNode([], 'u')).toBeNull();
    expect(buildFaqPageNode([{ question: 'q', answers: [] }], 'u')).toBeNull();
    expect(buildFaqPageNode([{ question: 'q', answers: [{ text: '   ', tier: 'gold' }] }], 'u')).toBeNull();
  });

  it('drops unanswered questions from the entity list', () => {
    expect(buildFaqPageNode(FAQS, 'u').mainEntity).toHaveLength(2);
  });

  it('picks the highest-authority answer', () => {
    const first = buildFaqPageNode(FAQS, 'u').mainEntity[0];
    expect(first.acceptedAnswer.text).toContain('after-hours');
  });

  it('omits the FAQ node entirely when a listing has no answers', () => {
    const graph = graphOf(buildPropertyJsonLd(COMMERCIAL, 'c', []));
    expect(graph.some((n) => n['@type'] === 'FAQPage')).toBe(false);
  });
});

describe('mergeFaqIntoOverride', () => {
  const OVERRIDE = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: 'Hand written',
  });

  it('wraps a single-node override into a graph with the FAQ appended', () => {
    const merged = JSON.parse(mergeFaqIntoOverride(OVERRIDE, FAQS, 'u'));
    expect(merged['@graph']).toHaveLength(2);
    expect(merged['@graph'][0].name).toBe('Hand written');
  });

  it('returns a malformed override untouched rather than dropping the work', () => {
    expect(mergeFaqIntoOverride('{not json', FAQS, 'u')).toBe('{not json');
  });

  it('does not double up when the operator wrote their own FAQPage', () => {
    const already = JSON.stringify({ '@graph': [{ '@type': 'FAQPage' }] });
    expect(mergeFaqIntoOverride(already, FAQS, 'u')).toBe(already);
  });

  it('leaves the override alone when there are no answered questions', () => {
    expect(mergeFaqIntoOverride(OVERRIDE, [], 'u')).toBe(OVERRIDE);
  });
});
