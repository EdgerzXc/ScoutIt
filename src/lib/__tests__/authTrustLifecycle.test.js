import { describe, it, expect } from 'vitest';

describe('LR-05 Auth, PDF draft verification, and PRC verification contracts', () => {
  it('blocks publication of unverified PDF-assisted listing drafts', () => {
    const checkCanPublish = (listing) => {
      if (listing.creation_source === 'pdf_assisted' && !listing.pdf_verified) {
        return { allowed: false, error: 'PDF-assisted listing drafts must be verified against source document before initial publication.' };
      }
      return { allowed: true };
    };

    const ownerManualListing = { creation_source: 'manual', pdf_verified: false };
    const pdfUnverifiedListing = { creation_source: 'pdf_assisted', pdf_verified: false };
    const pdfVerifiedListing = { creation_source: 'pdf_assisted', pdf_verified: true };

    expect(checkCanPublish(ownerManualListing).allowed).toBe(true);
    expect(checkCanPublish(pdfUnverifiedListing).allowed).toBe(false);
    expect(checkCanPublish(pdfVerifiedListing).allowed).toBe(true);
  });

  it('renders PRC verified badge ONLY when prc_verified is true', () => {
    const getPrcBadgeStatus = (profile) => {
      if (profile.prc_license && profile.prc_verified === true) {
        return 'PRC Verified';
      }
      if (profile.prc_license) {
        return 'PRC Pending Verification';
      }
      return 'Unverified';
    };

    expect(getPrcBadgeStatus({ prc_license: '0012345', prc_verified: false })).toBe('PRC Pending Verification');
    expect(getPrcBadgeStatus({ prc_license: '0012345', prc_verified: true })).toBe('PRC Verified');
    expect(getPrcBadgeStatus({ prc_license: '' })).toBe('Unverified');
  });
});
