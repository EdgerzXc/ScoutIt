import { tierRank } from "./entitlements";

export const SIGNAL_PHOTO_BUCKET = "signal-photos";
export const SIGNAL_PHOTO_LIMIT = 3;
export const SIGNAL_VIDEO_SECONDS = 30;
export const SIGNAL_MEDIA_UUID = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

export function signalMediaSlots(tier, signalType, videoEnabled = false) {
  return {
    photoLimit: tierRank(tier) >= tierRank("solar") ? SIGNAL_PHOTO_LIMIT : 0,
    videoLimit: videoEnabled && tierRank(tier) >= tierRank("cluster") && signalType === "COMMERCIAL_PROMOTION" ? 1 : 0,
  };
}

export function signalMediaSlotAllowed({ kind, position, photoLimit, videoLimit }) {
  return Number.isInteger(position) && (
    kind === "photo" ? position >= 0 && position < photoLimit : kind === "video" && videoLimit === 1 && position === SIGNAL_PHOTO_LIMIT
  );
}
