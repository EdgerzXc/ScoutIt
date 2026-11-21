import { createHash } from "node:crypto";
import { displayModeBootstrap, liteModeBootstrap, simpleModeBootstrap } from "./themeBootstraps.mjs";

// Dev-only allowance so impeccable live mode's picker UI (localhost:8400) can load.
// Guarded by NODE_ENV so it never reaches production.
const __impeccableLiveDev =
  process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://accounts.google.com https://challenges.cloudflare.com https://va.vercel-scripts.com${__impeccableLiveDev};
    script-src-attr 'none';
    style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style;
    img-src 'self' blob: data: https://*.supabase.co https://*.airtableusercontent.com https://*.mapbox.com https://events.mapbox.com https://*.cartocdn.com https://*.tile.openstreetmap.org https://services.arcgisonline.com https://browser.dataspace.copernicus.eu https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://picsum.photos https://images.unsplash.com https://randomuser.me;
    font-src 'self' data:;
    worker-src 'self' blob:;
    child-src 'self' blob:;
    frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://drive.google.com https://my.matterport.com https://*.matterport.com https://lumalabs.ai https://accounts.google.com https://challenges.cloudflare.com;
    connect-src 'self' https://*.supabase.co https://*.mapbox.com https://events.mapbox.com https://api.open-meteo.com https://air-quality-api.open-meteo.com https://*.cartocdn.com https://services.arcgisonline.com https://huggingface.co https://*.hf.co https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com https://*.google.com https://earthquake.usgs.gov https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://va.vercel-scripts.com${__impeccableLiveDev};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;
export const contentSecurityPolicy = cspHeader.replace(/\n/g, '');
export const previewContentSecurityPolicy = contentSecurityPolicy
  .replace(" 'unsafe-eval'", '')
  .replace("base-uri 'self'", "base-uri 'none'");

const themeHashes = [liteModeBootstrap, simpleModeBootstrap, displayModeBootstrap]
  .map((script) => "'sha256-" + createHash("sha256").update(script).digest("base64") + "'")
  .join(" ");

export function recoveryContentSecurityPolicy(nonce) {
  return previewContentSecurityPolicy.replace("'unsafe-inline'", "'nonce-" + nonce + "' 'strict-dynamic' " + themeHashes);
}
