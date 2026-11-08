import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    storage: {
      listBuckets: vi.fn(),
      createBucket: vi.fn(),
      from: vi.fn(),
    },
  },
}));

import { GET, POST, approvePropertyClaim } from '@/app/api/property/claim/route';
import { POST as uploadHandler } from '@/app/api/property/claim/upload/route';

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATION: ACTING LIKE A PROPERTY OWNER CLAIMING THEIR PROPERTY
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PROPERTY = {
  id: '8a245f70-4f89-11d3-9a0c-0305e82c3301',
  slug: 'the-ridgeline-at-capitol-commons',
  canonical_slug: 'the-ridgeline-at-capitol-commons',
  title: 'The Ridgeline at Capitol Commons',
  owner_id: 'originating-broker-456',
  verified: false,
  lister_relationship: 'authorized_broker', // provisionally listed by broker
  pipeline_status: 'approved',
};

const CLAIMANT_USER = {
  id: 'claimant-owner-789',
  email: 'maria.santos@gmail.com',
  full_name: 'Maria Santos',
  role: 'seeker',
  active_roles: ['seeker'],
  subscription_tier: 'starry',
};

describe('Owner Property Claim Simulation (End-to-End User Journey)', () => {
  let dbClaims = [];
  let dbDocuments = [];
  let dbEvents = [];
  let dbProperty = { ...MOCK_PROPERTY };
  let dbProfile = { ...CLAIMANT_USER };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(CLAIMANT_USER.id);

    dbClaims = [];
    dbDocuments = [];
    dbEvents = [];
    dbProperty = { ...MOCK_PROPERTY };
    dbProfile = { ...CLAIMANT_USER };

    // Wire up mock Supabase simulating database behavior
    supabaseAdmin.from = vi.fn().mockImplementation((table) => {
      if (table === 'properties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col, val) => {
              const matched = dbProperty.id === val || dbProperty.slug === val ? dbProperty : null;
              return {
                maybeSingle: vi.fn().mockResolvedValue({ data: matched, error: null }),
                single: vi.fn().mockResolvedValue({ data: matched, error: null }),
                eq: vi.fn().mockResolvedValue({ data: [], error: null }), // live listings check
              };
            }),
            in: vi.fn().mockResolvedValue({ data: [dbProperty], error: null }),
          }),
          update: vi.fn().mockImplementation((updates) => {
            Object.assign(dbProperty, updates);
            return {
              eq: vi.fn().mockResolvedValue({ data: dbProperty, error: null }),
            };
          }),
        };
      }
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: dbProfile, error: null }),
            }),
            in: vi.fn().mockResolvedValue({ data: [dbProfile], error: null }),
          }),
          update: vi.fn().mockImplementation((updates) => {
            Object.assign(dbProfile, updates);
            return {
              eq: vi.fn().mockResolvedValue({ data: dbProfile, error: null }),
            };
          }),
        };
      }
      if (table === 'property_claims') {
        const createQuery = () => {
          const query = {
            eq: vi.fn().mockImplementation((col, val) => {
              if (col === 'id') {
                return {
                  maybeSingle: vi.fn().mockImplementation(() => {
                    const found = dbClaims.find((c) => c.id === val);
                    return Promise.resolve({ data: found || null, error: null });
                  }),
                  single: vi.fn().mockImplementation(() => {
                    const found = dbClaims.find((c) => c.id === val);
                    return Promise.resolve({ data: found || null, error: null });
                  }),
                };
              }
              return query;
            }),
            in: vi.fn().mockImplementation(() => query),
            order: vi.fn().mockImplementation(() => query),
            limit: vi.fn().mockImplementation(() => query),
            maybeSingle: vi.fn().mockImplementation(() => {
              const found = dbClaims[0] || null;
              return Promise.resolve({ data: found, error: null });
            }),
            single: vi.fn().mockImplementation(() => {
              const found = dbClaims[0] || null;
              return Promise.resolve({ data: found, error: null });
            }),
          };
          return query;
        };

        return {
          select: vi.fn().mockImplementation(createQuery),
          insert: vi.fn().mockImplementation((row) => {
            const newClaim = { id: `claim-${Date.now()}`, created_at: new Date().toISOString(), ...row };
            dbClaims.push(newClaim);
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newClaim, error: null }),
              }),
            };
          }),
          update: vi.fn().mockImplementation((updates) => {
            return {
              eq: vi.fn().mockImplementation((col, val) => {
                const target = dbClaims.find((c) => c.id === val);
                if (target) Object.assign(target, updates);
                return Promise.resolve({ error: null });
              }),
            };
          }),
        };
      }
      if (table === 'property_claim_documents') {
        return {
          insert: vi.fn().mockImplementation((rows) => {
            const list = Array.isArray(rows) ? rows : [rows];
            list.forEach((r) => dbDocuments.push({ id: `doc-${Date.now()}-${Math.random()}`, ...r }));
            return Promise.resolve({ error: null });
          }),
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: dbDocuments, error: null }),
          }),
        };
      }
      if (table === 'property_claim_events') {
        return {
          insert: vi.fn().mockImplementation((row) => {
            dbEvents.push({ id: `evt-${Date.now()}`, created_at: new Date().toISOString(), ...row });
            return Promise.resolve({ error: null });
          }),
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: dbEvents, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    supabaseAdmin.storage = {
      listBuckets: vi.fn().mockResolvedValue({ data: [{ name: 'claim-documents' }] }),
      createBucket: vi.fn().mockResolvedValue({ data: null, error: null }),
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'dummy/path' }, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://supabase.co/signed/doc.pdf' }, error: null }),
      }),
    };
  });

  it('Simulates full journey: owner discovers, uploads title + ID, submits claim, and gets approved', async () => {
    // ── STEP 1: Owner visits the property page and checks claim status ──────
    const checkReq = new Request(
      `https://www.scoutit.space/api/property/claim?propertyId=${MOCK_PROPERTY.slug}`
    );
    const checkRes = await GET(checkReq);
    expect(checkRes.status).toBe(200);
    const checkJson = await checkRes.json();

    expect(checkJson.success).toBe(true);
    expect(checkJson.claimable).toBe(true);
    expect(checkJson.isOwnListing).toBe(false);
    expect(checkJson.signedIn).toBe(true);
    expect(checkJson.myClaim).toBeNull();

    // ── STEP 2: Owner uploads Document 1 (TCT/CCT Land Title PDF) ───────────
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xc4, 0xe5, 0xf2, 0xe5]);
    const pdfFile = {
      name: 'condo_cct_title_ridgeline.pdf',
      type: 'application/pdf',
      size: pdfBytes.length,
      arrayBuffer: () => Promise.resolve(pdfBytes.buffer),
    };

    const titleFormData = new Map();
    titleFormData.set('file', pdfFile);
    titleFormData.set('documentType', 'tct_cct_title');
    titleFormData.set('propertyId', MOCK_PROPERTY.id);

    const titleUploadReq = {
      headers: new Headers({ Authorization: 'Bearer mock-token' }),
      formData: () => Promise.resolve(titleFormData),
    };

    const titleUploadRes = await uploadHandler(titleUploadReq);
    expect(titleUploadRes.status).toBe(200);
    const titleUploadJson = await titleUploadRes.json();

    expect(titleUploadJson.success).toBe(true);
    expect(titleUploadJson.documentType).toBe('tct_cct_title');
    expect(titleUploadJson.originalFilename).toContain('condo_cct_title_ridgeline');

    // ── STEP 3: Owner uploads Document 2 (Valid Government Photo ID) ────────
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const idFile = {
      name: 'passport_maria_santos.jpg',
      type: 'image/jpeg',
      size: jpegBytes.length,
      arrayBuffer: () => Promise.resolve(jpegBytes.buffer),
    };

    const idFormData = new Map();
    idFormData.set('file', idFile);
    idFormData.set('documentType', 'gov_id');
    idFormData.set('propertyId', MOCK_PROPERTY.id);

    const idUploadReq = {
      headers: new Headers({ Authorization: 'Bearer mock-token' }),
      formData: () => Promise.resolve(idFormData),
    };

    const idUploadRes = await uploadHandler(idUploadReq);
    expect(idUploadRes.status).toBe(200);
    const idUploadJson = await idUploadRes.json();

    expect(idUploadJson.success).toBe(true);
    expect(idUploadJson.documentType).toBe('gov_id');

    // ── STEP 4: Owner agrees to legal disclaimer and submits the legal claim ─
    const claimReq = new Request('https://www.scoutit.space/api/property/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: MOCK_PROPERTY.slug,
        claimedRelationship: 'owner',
        agreed: true,
        documents: [
          {
            documentType: titleUploadJson.documentType,
            storagePath: titleUploadJson.storagePath,
            originalFilename: titleUploadJson.originalFilename,
            fileSizeBytes: titleUploadJson.fileSizeBytes,
            mimeType: titleUploadJson.mimeType,
          },
          {
            documentType: idUploadJson.documentType,
            storagePath: idUploadJson.storagePath,
            originalFilename: idUploadJson.originalFilename,
            fileSizeBytes: idUploadJson.fileSizeBytes,
            mimeType: idUploadJson.mimeType,
          },
        ],
      }),
    });

    const claimRes = await POST(claimReq);
    expect(claimRes.status).toBe(200);
    const claimJson = await claimRes.json();

    expect(claimJson.success).toBe(true);
    expect(claimJson.status).toBe('submitted');
    const claimId = claimJson.claimId;

    // Verify database state: claim, documents, and audit event were persisted
    expect(dbClaims).toHaveLength(1);
    expect(dbClaims[0].claimed_relationship).toBe('owner');
    expect(dbDocuments).toHaveLength(2);
    expect(dbDocuments[0].document_type).toBe('tct_cct_title');
    expect(dbDocuments[1].document_type).toBe('gov_id');

    const auditEvent = dbEvents.find((e) => e.event_type === 'CLAIM_SUBMITTED');
    expect(auditEvent).toBeDefined();
    expect(auditEvent.payload.documents_count).toBe(2);

    // ── STEP 5: Staff reviews and approves the claim in Mission Control ──────
    const approvalResult = await approvePropertyClaim(supabaseAdmin, {
      claimId,
      reviewerId: 'staff-super-admin-001',
    });

    expect(approvalResult.ok).toBe(true);
    expect(approvalResult.ownerId).toBe(CLAIMANT_USER.id);

    // ── STEP 6: Verify post-approval invariants ──────────────────────────────
    // 1. Property ownership transferred
    expect(dbProperty.owner_id).toBe(CLAIMANT_USER.id);
    expect(dbProperty.verified).toBe(true);
    expect(dbProperty.lister_relationship).toBe('owner');

    // 2. Claimant profile role promoted to include 'owner'
    expect(dbProfile.active_roles).toContain('owner');

    // 3. Claim status updated to approved
    expect(dbClaims[0].status).toBe('approved');

    // 4. Approval event recorded in legal audit trail
    const approvalEvent = dbEvents.find((e) => e.event_type === 'CLAIM_APPROVED');
    expect(approvalEvent).toBeDefined();
    expect(approvalEvent.payload.owner_id).toBe(CLAIMANT_USER.id);
  });
});
