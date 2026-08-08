// ─────────────────────────────────────────────────────────────────────────
// SEO READINESS — the rules, extracted so they can be tested
// SEO-01 · WORK ORDER W11 · NEW_IDEAS_2.md §55
//
// Pulled out of the route so the logic is reachable by vitest without a
// database. The route's job is auth and I/O; the judgement lives here.
//
// ⚠️ EVERY FIELD READ HERE IS A COLUMN THAT ACTUALLY EXISTS. The previous
// version of this logic read six columns that don't (`address`, `photos`,
// `category`, `property_type`, `metadata`, `status`) and therefore reported
// every listing in the database as un-indexable. See lib/propertyLookup.js.
// ─────────────────────────────────────────────────────────────────────────

/** Minimum strength before a page is worth asking Google to index. */
export const INDEX_ELIGIBLE_MIN_SCORE = 70;

/** Minimum photos before a listing page is worth indexing. */
export const MIN_PHOTOS = 3;

/** Minimum description length, in characters. */
export const MIN_DESCRIPTION_CHARS = 100;

/**
 * Photos live inside the 'details' jsonb blob, not in a top-level column.
 * Accepts the two shapes the app has used: an array, or a comma-joined string
 * carried over from Airtable's Photos field.
 */
export function extractPhotos(prop) {
  const details = prop?.details && typeof prop.details === "object" ? prop.details : {};
  const raw = details.photos ?? details.Photos ?? null;
  let list = [];
  if (Array.isArray(raw)) list = raw;
  else if (typeof raw === "string" && raw.trim()) list = raw.split(",");
  const cleaned = list.map((p) => String(p || "").trim()).filter(Boolean);
  // A single media_link is still media, and the strength check counts it — but
  // it is NOT a photo for the 3-photo rule. Conflating them would let a listing
  // with one hero image pass a check that exists to demand a gallery.
  return cleaned;
}

/**
 * Map a 'properties' row onto the UI listing model 'computeListingStrength'
 * expects (it was written against DashboardContext's mapper, not the raw row).
 */
export function toListingModel(prop) {
  const details = prop?.details && typeof prop.details === "object" ? prop.details : {};
  const photos = extractPhotos(prop);
  return {
    title: prop?.title,
    location: prop?.location,
    loc: prop?.location,
    price: prop?.price,
    desc: prop?.description,
    hasMedia: photos.length > 0 || !!prop?.media_link,
    mediaLink: prop?.media_link || photos[0] || null,
    // `coordinates` is a PostGIS geography column, not a lat/lng pair.
    coordinates: prop?.coordinates || null,
    spaceCategory: prop?.space_category || prop?.type,
    details,
  };
}

/**
 * The full readiness report.
 *
 * @param {object} prop - a 'properties' row
 * @param {object} deps
 * @param {(model: object) => object} deps.strength - computeListingStrength
 * @param {string} deps.lifecycle - normalised lifecycle state
 * @param {string} deps.liveState - the value that counts as live
 */
export function buildReadinessReport(prop, { strength, lifecycle, liveState }) {
  const listingModel = toListingModel(prop);
  const strengthResult = strength(listingModel);
  const photos = extractPhotos(prop);
  const photoCount = photos.length;
  const isLive = lifecycle === liveState;
  const description = typeof prop?.description === "string" ? prop.description.trim() : "";

  const seoChecks = {
    canonicalSlugPresent: !!(prop?.canonical_slug || prop?.slug),
    photosCount: photoCount,
    minPhotosPassed: photoCount >= MIN_PHOTOS,
    geocoded: !!prop?.coordinates,
    descriptionSubstantial: description.length >= MIN_DESCRIPTION_CHARS,
    isLive,
  };

  // ── INDEX ELIGIBILITY ──────────────────────────────────────────────────
  // Originally `isLive && score >= MIN`, and a test caught why that was wrong:
  // `computeListingStrength` checks `hasMedia` — ONE image satisfies it — so a
  // listing with a single photo scored 100 and was declared index eligible
  // while `minPhotosPassed` was simultaneously false. The panel would have
  // said "Google can index this" directly above "Add 2 more photos".
  //
  // Contradicting itself on one screen is worse than either verdict alone: the
  // reader can't tell which half to act on, so they act on neither.
  //
  // So eligibility now requires the HARD checks as well as the score. Strength
  // items beyond them (deep intel, buyer questions) still appear as blockers —
  // they improve ranking rather than permitting indexing, which is what the
  // panel's copy says when eligible: "anything below still helps it rank".
  const hardChecksPass =
    seoChecks.isLive &&
    seoChecks.canonicalSlugPresent &&
    seoChecks.geocoded &&
    seoChecks.minPhotosPassed &&
    seoChecks.descriptionSubstantial;

  seoChecks.isIndexEligible = hardChecksPass && strengthResult.score >= INDEX_ELIGIBLE_MIN_SCORE;

  // Ordered, human-readable blockers. The panel renders these verbatim, so each
  // one names THE FIX, not the failure. "descriptionSubstantial: false" tells
  // an owner nothing; "write at least 100 characters" tells them what to do.
  const blockers = [];
  if (!seoChecks.isLive) {
    blockers.push("Publish this listing — a draft has no page for Google to index.");
  }
  if (!seoChecks.canonicalSlugPresent) {
    blockers.push("This listing has no URL yet. Re-publish it to generate one.");
  }
  if (!seoChecks.geocoded) {
    blockers.push("Add a map location — ungeocoded listings are left out of location searches.");
  }
  if (!seoChecks.minPhotosPassed) {
    const short = MIN_PHOTOS - photoCount;
    blockers.push(
      photoCount === 0
        ? `Add at least ${MIN_PHOTOS} photos. This listing has none.`
        : `Add ${short} more photo${short === 1 ? "" : "s"} — ${MIN_PHOTOS} is the minimum.`
    );
  }
  if (!seoChecks.descriptionSubstantial) {
    blockers.push(
      description.length === 0
        ? `Write a description of at least ${MIN_DESCRIPTION_CHARS} characters. Short pages rarely rank.`
        : `Extend the description to ${MIN_DESCRIPTION_CHARS}+ characters — it is currently ${description.length}.`
    );
  }
  for (const item of strengthResult.missing || []) {
    blockers.push(`Missing: ${item}`);
  }

  return {
    strength: strengthResult,
    seoChecks,
    blockers,
    readinessScore: strengthResult.score,
    indexEligibleMinScore: INDEX_ELIGIBLE_MIN_SCORE,
    indexEligible: seoChecks.isIndexEligible,
  };
}
