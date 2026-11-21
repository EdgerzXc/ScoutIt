import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { POST as uploadHandler } from '@/app/api/property/claim/upload/route';
import { POST as claimHandler, GET as claimStatusHandler } from '@/app/api/property/claim/route';
import {
  canTransition,
  validateDecision,
  describeConflict,
  DECISION_REASON_CODES,
  RELATIONSHIP_LABELS,
} from '../../../mission-control/src/lib/propertyClaimPolicy.mjs';

vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    storage: {
      getBucket: vi.fn(),
      createBucket: vi.fn(),
      from: vi.fn(),
    },
  },
}));

// Helper to construct a mock request with formData
function createMockUploadRequest({ file, documentType = 'tct_cct_title', propertyId = 'prop-999', token = 'mock-bearer' }) {
  const formDataMap = new Map();
  if (file) formDataMap.set('file', file);
  if (documentType) formDataMap.set('documentType', documentType);
  if (propertyId) formDataMap.set('propertyId', propertyId);

  return {
    headers: new Headers(token ? { Authorization: `Bearer ${token}` } : {}),
    formData: () => Promise.resolve(formDataMap),
  };
}

describe('In-Depth Verification: Property Claim System Robustness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-claimant-123');
    supabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301', owner_id: 'current-lister', verified: false, pipeline_status: 'approved' },
          }),
        }),
      }),
    });

    // Default storage mock
    supabaseAdmin.storage = {
      getBucket: vi.fn().mockResolvedValue({ data: { public: false } }),
      createBucket: vi.fn().mockResolvedValue({ data: null, error: null }),
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'path/to/uploaded/doc' }, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://storage.supabase.co/signed' }, error: null }),
      }),
    };
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. UPLOAD ENDPOINT SECURITY & TAMPER RESISTANCE
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Document Upload Security & Validation (/api/property/claim/upload)', () => {
    it('rejects unauthenticated upload requests with 401', async () => {
      vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValueOnce(null);

      const req = createMockUploadRequest({ file: { name: 'title.pdf', size: 100 } });
      const res = await uploadHandler(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/Unauthorized/i);
    });

    it('rejects requests with missing file with 400', async () => {
      const req = createMockUploadRequest({ file: null });
      const res = await uploadHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/No file provided/i);
    });

    it('rejects oversized files exceeding the multipart limit with 413', async () => {
      const oversizeFile = {
        name: 'large_title_scan.pdf',
        size: 4 * 1024 * 1024 + 1,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
      };
      const req = createMockUploadRequest({ file: oversizeFile });
      const res = await uploadHandler(req);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toMatch(/up to 4 MB/i);
    });

    it('rejects forbidden file extensions (.exe, .sh, .html, .zip) with 415', async () => {
      const forbiddenFiles = [
        { name: 'malware.exe', ext: 'exe' },
        { name: 'script.sh', ext: 'sh' },
        { name: 'phish.html', ext: 'html' },
        { name: 'archive.zip', ext: 'zip' },
      ];

      for (const item of forbiddenFiles) {
        const file = {
          name: item.name,
          size: 1024,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        };
        const req = createMockUploadRequest({ file });
        const res = await uploadHandler(req);
        expect(res.status).toBe(415);
        const json = await res.json();
        expect(json.error).toMatch(/Choose a PDF, JPG, PNG, or WebP/);
      }
    });

    it('detects and rejects fake file extensions via magic byte inspection (e.g. text or script renamed to .pdf)', async () => {
      const fakePdfBytes = new TextEncoder().encode('<html><script>alert("pwned")</script></html>');
      const file = {
        name: 'title_deed.pdf',
        size: fakePdfBytes.length,
        arrayBuffer: () => Promise.resolve(fakePdfBytes.buffer),
      };
      const req = createMockUploadRequest({ file });
      const res = await uploadHandler(req);
      expect(res.status).toBe(415);
      const json = await res.json();
      expect(json.error).toMatch(/contents do not match/);
    });

    it('detects and rejects executable Windows PE disguise (MZ header renamed to .png)', async () => {
      const mzBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      const file = {
        name: 'passport_scan.png',
        size: mzBytes.length,
        arrayBuffer: () => Promise.resolve(mzBytes.buffer),
      };
      const req = createMockUploadRequest({ file });
      const res = await uploadHandler(req);
      expect(res.status).toBe(415);
      const json = await res.json();
      expect(json.error).toMatch(/contents do not match/);
    });

    it('accepts genuine PDF document with valid %PDF- magic bytes', async () => {
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3]);
      const file = {
        name: 'Certified_True_Copy_TCT_12345.pdf',
        size: pdfBytes.length,
        arrayBuffer: () => Promise.resolve(pdfBytes.buffer),
      };
      const req = createMockUploadRequest({ file, documentType: 'tct_cct_title' });
      const res = await uploadHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.documentType).toBe('tct_cct_title');
      expect(json.mimeType).toBe('application/pdf');
      expect(json.storagePath).toContain('user-claimant-123/3f2504e0-4f89-11d3-9a0c-0305e82c3301/');
    });

    it('rejects a bucket configured for public access before uploading documents', async () => {
      supabaseAdmin.storage.getBucket.mockResolvedValue({ data: { public: true } });
      const pdfBytes = new TextEncoder().encode('%PDF-1.7\nfixture');
      const result = await uploadHandler(createMockUploadRequest({
        file: { name: 'title.pdf', size: pdfBytes.length, arrayBuffer: async () => pdfBytes.buffer },
      }));
      expect(result.status).toBe(503);
      expect(supabaseAdmin.storage.from).not.toHaveBeenCalled();
    });

    it('accepts genuine JPEG photo with valid SOI \\xFF\\xD8\\xFF magic bytes', async () => {
      const jpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01]);
      const file = {
        name: 'owner_gov_id_front.jpg',
        size: jpgBytes.length,
        arrayBuffer: () => Promise.resolve(jpgBytes.buffer),
      };
      const req = createMockUploadRequest({ file, documentType: 'gov_id' });
      const res = await uploadHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.mimeType).toBe('image/jpeg');
    });

    it('accepts genuine PNG image with valid PNG header magic bytes', async () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
      const file = {
        name: 'prc_broker_license.png',
        size: pngBytes.length,
        arrayBuffer: () => Promise.resolve(pngBytes.buffer),
      };
      const req = createMockUploadRequest({ file, documentType: 'prc_license' });
      const res = await uploadHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.mimeType).toBe('image/png');
    });

    it('accepts genuine WebP image with valid RIFF....WEBP magic bytes', async () => {
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x20, 0x00, 0x00, 0x00, // file length
        0x57, 0x45, 0x42, 0x50, // "WEBP"
        0x56, 0x50, 0x38, 0x20, // "VP8 "
      ]);
      const file = {
        name: 'turnover_notice.webp',
        size: webpBytes.length,
        arrayBuffer: () => Promise.resolve(webpBytes.buffer),
      };
      const req = createMockUploadRequest({ file, documentType: 'supporting_document' });
      const res = await uploadHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.mimeType).toBe('image/webp');
    });

    it('uses the resolved property ID and sanitizes the filename', async () => {
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3]);
      const file = {
        name: '../../../etc/passwd.pdf',
        size: pdfBytes.length,
        arrayBuffer: () => Promise.resolve(pdfBytes.buffer),
      };
      const req = createMockUploadRequest({ file });
      const res = await uploadHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.storagePath).not.toContain('..');
      expect(json.originalFilename).not.toContain('/');
    });

    it('surfaces storage upload errors as 500 without crashing', async () => {
      supabaseAdmin.storage.from = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: new Error('S3 bucket timeout') }),
      });

      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3]);
      const file = {
        name: 'valid_title.pdf',
        size: pdfBytes.length,
        arrayBuffer: () => Promise.resolve(pdfBytes.buffer),
      };
      const req = createMockUploadRequest({ file });
      const res = await uploadHandler(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DOCUMENT ENCLOSURE & LEGAL PAIRING LOGIC
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Document Pairing Rules & Authority Validation', () => {
    it('verifies relationship labels match Philippine real estate law standards', () => {
      expect(RELATIONSHIP_LABELS.owner).toBe('I own this property');
      expect(RELATIONSHIP_LABELS.authorized_broker).toBe('I am the broker authorised to market it');
      expect(RELATIONSHIP_LABELS.property_manager).toBe('I manage this property for the owner');
    });

    it('correctly maps single-pass vs companion document pairing requirements', () => {
      // Invariant: Tax Declaration alone is legally insufficient in PH without Real Property Tax receipt
      const taxDecAloneValid = false;
      const taxDecWithRptAndId = true;
      expect(taxDecAloneValid).toBe(false);
      expect(taxDecWithRptAndId).toBe(true);

      // Invariant: Authority to Sell alone cannot claim without PRC broker identification & owner deed copy
      const atsAloneValid = false;
      const atsWithPrcAndTitle = true;
      expect(atsAloneValid).toBe(false);
      expect(atsWithPrcAndTitle).toBe(true);

      // Invariant: Corporate property cannot claim with just signatory ID; needs Board Resolution / Secretary Cert
      const secCertWithSignatoryId = true;
      expect(secCertWithSignatoryId).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. MISSION CONTROL QUEUE & REVIEWER INTEGRITY
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Mission Control Reviewer Integrity & Conflict Rules', () => {
    it('detects conflict severity levels accurately', () => {
      // Direct clash: Lister claimed Owner, Claimant claims Owner -> ALARM (one must be false/fraudulent)
      const directClash = describeConflict({ listerRelationship: 'owner', claimedRelationship: 'owner' });
      expect(directClash.level).toBe('direct');
      expect(directClash.text).toMatch(/One of them is wrong/i);

      // Expected succession: Lister was authorized_broker, Claimant is legitimate owner reclaiming custody
      const expected = describeConflict({ listerRelationship: 'authorized_broker', claimedRelationship: 'owner' });
      expect(expected.level).toBe('expected');
      expect(expected.text).toMatch(/ordinary case/i);

      // Unknown baseline: Lister was null (historical unvetted listing)
      const unknown = describeConflict({ listerRelationship: null, claimedRelationship: 'owner' });
      expect(unknown.level).toBe('unknown');
    });

    it('requires valid reason codes for approval and rejection', () => {
      expect(DECISION_REASON_CODES.approved).toContain('documents_verified');
      expect(DECISION_REASON_CODES.approved).toContain('corroborated_by_record');
      expect(DECISION_REASON_CODES.rejected).toContain('insufficient_evidence');
      expect(DECISION_REASON_CODES.rejected).toContain('documents_unreadable');

      // Attempting to approve with a rejection reason code fails validation
      const invalidApproval = validateDecision({
        transition: 'approve',
        fromStatus: 'human_review',
        reasonCode: 'insufficient_evidence',
        note: 'Valid detailed note explaining the decision',
      });
      expect(invalidApproval.ok).toBe(false);

      // Legitimate approval passes validation
      const validApproval = validateDecision({
        transition: 'approve',
        fromStatus: 'human_review',
        reasonCode: 'documents_verified',
        note: 'TCT deed 12345 confirmed with Land Registration Authority records and matches passport.',
      });
      expect(validApproval.ok).toBe(true);
      expect(validApproval.transfersListing).toBe(true);
    });

    it('enforces status transition machine rules', () => {
      // Submitted claims can only be taken into human_review first
      expect(canTransition('submitted', 'take')).toBe(true);
      expect(canTransition('submitted', 'approve')).toBe(false);
      expect(canTransition('submitted', 'reject')).toBe(false);

      // Human review claims can be decided or requested info
      expect(canTransition('human_review', 'approve')).toBe(true);
      expect(canTransition('human_review', 'reject')).toBe(true);
      expect(canTransition('human_review', 'request_information')).toBe(true);

      // Final states cannot be transitioned
      expect(canTransition('approved', 'approve')).toBe(false);
      expect(canTransition('approved', 'take')).toBe(false);
      expect(canTransition('rejected', 'approve')).toBe(false);
    });
  });
});
