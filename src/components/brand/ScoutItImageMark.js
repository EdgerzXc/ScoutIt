import { MARK_PATH, MARK_VIEWBOX } from '@/components/brand/markPath';

/**
 * ImageResponse/Satori-safe ScoutIt mark, the counterpart to
 * ScoutItImageWordmark. Satori renders `img` with an SVG data URI reliably
 * where inline `<svg>` children are patchy, and `encodeURIComponent` keeps
 * this edge-safe — neither `Buffer` nor `btoa` is dependable in that runtime.
 */
const markDataUri = (fill) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}">` +
      `<path fill="${fill}" fill-rule="evenodd" d="${MARK_PATH}"/></svg>`
  )}`;

/**
 * `fill` is required rather than defaulted: a CSS variable cannot reach inside
 * a data URI, so the colour has to be a literal, and it belongs in the route
 * that already declares `--accent` rather than hidden in a default here.
 */
export default function ScoutItImageMark({ fill, size = 168, marginBottom = '36px' }) {
  const MARK_DATA_URI = markDataUri(fill);
  /* eslint-disable-next-line @next/next/no-img-element -- Satori renders this,
     not the browser; next/image does not exist inside ImageResponse. */
  return <img src={MARK_DATA_URI} width={size} height={size} alt="" style={{ marginBottom }} />;
}
