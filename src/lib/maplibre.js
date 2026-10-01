import * as maplibregl from "maplibre-gl";
import maplibrePackage from "maplibre-gl/package.json";

// Next bundles the main module but does not keep the worker's relative shared
// import beside it. Both matching assets are copied before dev/build instead.
maplibregl.setWorkerUrl(`/maplibre/${maplibrePackage.version}/maplibre-gl-worker.mjs`);

export default maplibregl;
