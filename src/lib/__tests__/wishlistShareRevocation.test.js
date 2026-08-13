import { describe, expect, it } from "vitest";
import {
  decodeWishlistShareToken,
  decryptUserId,
  encryptUserId,
  isWishlistShareRevoked,
} from "../wishlistCrypto.js";

const USER_ID = "9f1c2b7e-0000-4aaa-8bbb-1234567890ab";
const ISSUED_AT = Date.now();

describe("wishlist share revocation watermark", () => {
  it("exposes authenticated issuance metadata without leaking it in the URL", () => {
    const token = encryptUserId(USER_ID, { issuedAt: ISSUED_AT });
    const details = decodeWishlistShareToken(token);

    expect(details).toMatchObject({
      userId: USER_ID,
      issuedAt: ISSUED_AT,
      legacy: false,
    });
    expect(token).not.toContain(USER_ID);
    expect(decryptUserId(token)).toBe(USER_ID);
  });

  it("revokes tokens at or before the owner's watermark", () => {
    const details = decodeWishlistShareToken(
      encryptUserId(USER_ID, { issuedAt: ISSUED_AT }),
    );

    expect(isWishlistShareRevoked(details, new Date(ISSUED_AT).toISOString())).toBe(true);
  });

  it("keeps a newly generated token valid without reviving the old one", () => {
    const revokedBefore = new Date(ISSUED_AT).toISOString();
    const oldDetails = { userId: USER_ID, issuedAt: Date.parse(revokedBefore) - 1 };
    const newDetails = { userId: USER_ID, issuedAt: Date.parse(revokedBefore) + 1 };

    expect(isWishlistShareRevoked(oldDetails, revokedBefore)).toBe(true);
    expect(isWishlistShareRevoked(newDetails, revokedBefore)).toBe(false);
  });

  it("fails closed for legacy issuance metadata after an owner revokes links", () => {
    expect(isWishlistShareRevoked(
      { userId: USER_ID, issuedAt: null, legacy: true },
      new Date(ISSUED_AT).toISOString(),
    )).toBe(true);
  });
});
