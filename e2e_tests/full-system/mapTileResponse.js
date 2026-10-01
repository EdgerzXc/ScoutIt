// CARTO style, sprites and font PBFs cannot prove that a basemap rendered.
export function isCartoVectorTile(url) {
  const parsed = new URL(url);
  const host = "basemaps.cartocdn.com";
  return (parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)) &&
    /\/\d+\/\d+\/\d+\.(?:pbf|mvt)$/.test(parsed.pathname);
}
