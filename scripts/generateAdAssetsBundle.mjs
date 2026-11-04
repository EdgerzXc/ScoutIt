import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const adAssetsDir = path.join(rootDir, 'ad_assets');
const logosDir = path.join(adAssetsDir, '01_logos_and_brand');
const uiWalkthroughDir = path.join(adAssetsDir, '02_website_ui_walkthrough');
const buttonsFeaturesDir = path.join(adAssetsDir, '03_button_and_feature_explorations');
const videoProdDir = path.join(adAssetsDir, '04_video_ad_production_pack');
const motionPromptsDir = path.join(adAssetsDir, '05_motion_and_ai_prompts');

// Create directories
[adAssetsDir, logosDir, uiWalkthroughDir, buttonsFeaturesDir, videoProdDir, motionPromptsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log('>>> Created ad_assets directory structure.');

// 1. Read vector path from src/components/brand/markPath.js
const markPathSrc = fs.readFileSync(path.join(rootDir, 'src/components/brand/markPath.js'), 'utf8');
const MARK_PATH = markPathSrc.match(/'(M[^']+)'/)?.[1];
if (!MARK_PATH) throw new Error('Could not find MARK_PATH in markPath.js');

console.log('>>> Extracted MARK_PATH successfully.');

// SVG Templates
const GOLD = '#E8AE3C';
const BRIGHT_GOLD = '#F7C64E';
const OBSIDIAN = '#0D0D0D';
const SURFACE = '#141417';

// 1.1 Solo Mark SVGs
const svgMarkGold = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="ScoutIt Logo Mark">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7C64E"/>
      <stop offset="50%" stop-color="#E8AE3C"/>
      <stop offset="100%" stop-color="#C28720"/>
    </linearGradient>
  </defs>
  <path fill="url(#goldGrad)" fill-rule="evenodd" d="${MARK_PATH}"/>
</svg>`;

const svgMarkWhite = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="ScoutIt Logo Mark White">
  <path fill="#FFFFFF" fill-rule="evenodd" d="${MARK_PATH}"/>
</svg>`;

// 1.2 Full Horizontal Lockup SVG (Icon + S [gold] cout [white] IT [gold])
const svgWordmarkHorizontal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 240" width="960" height="240" role="img" aria-label="ScoutIt Horizontal Wordmark">
  <defs>
    <linearGradient id="goldGradWordmark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7C64E"/>
      <stop offset="50%" stop-color="#E8AE3C"/>
      <stop offset="100%" stop-color="#C28720"/>
    </linearGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <!-- Logo Mark -->
  <g transform="translate(30, 25) scale(0.95)">
    <path fill="url(#goldGradWordmark)" fill-rule="evenodd" d="${MARK_PATH}" filter="url(#goldGlow)"/>
  </g>
  <!-- Wordmark Text -->
  <text x="245" y="155" font-family="'Space Grotesk', 'Syne', 'Inter', -apple-system, sans-serif" font-size="110" font-weight="800" letter-spacing="-2px">
    <tspan fill="#F7C64E">S</tspan><tspan fill="#FFFFFF">cout</tspan><tspan fill="#F7C64E">IT</tspan>
  </text>
  <!-- Sub-label / Tagline -->
  <text x="250" y="195" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="17" font-weight="600" letter-spacing="8px" fill="#A1A1AA">
    SPACE INTELLIGENCE
  </text>
</svg>`;

// 1.3 Cinematic Badge SVG
const svgCinematicBadge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="ScoutIt Space Intelligence Badge">
  <defs>
    <linearGradient id="badgeGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7C64E"/>
      <stop offset="100%" stop-color="#E8AE3C"/>
    </linearGradient>
    <radialGradient id="badgeBackdrop" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1A1813"/>
      <stop offset="70%" stop-color="#0E0E10"/>
      <stop offset="100%" stop-color="#070708"/>
    </radialGradient>
    <filter id="badgeGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <!-- Circular container -->
  <circle cx="400" cy="400" r="375" fill="url(#badgeBackdrop)" stroke="#E8AE3C" stroke-width="2" stroke-opacity="0.3"/>
  <circle cx="400" cy="400" r="360" fill="none" stroke="#E8AE3C" stroke-width="1" stroke-dasharray="8 6" stroke-opacity="0.4"/>
  <circle cx="400" cy="400" r="280" fill="none" stroke="#E8AE3C" stroke-width="1.5" stroke-opacity="0.2"/>

  <!-- Center Logo Mark -->
  <g transform="translate(260, 230) scale(1.4)">
    <path fill="url(#badgeGold)" fill-rule="evenodd" d="${MARK_PATH}" filter="url(#badgeGlow)"/>
  </g>

  <!-- Typography -->
  <text x="400" y="550" text-anchor="middle" font-family="'Space Grotesk', 'Syne', sans-serif" font-size="44" font-weight="800" letter-spacing="6px">
    <tspan fill="#F7C64E">SCOUT</tspan><tspan fill="#FFFFFF">IT</tspan>
  </text>
  <text x="400" y="595" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="15" font-weight="700" letter-spacing="8px" fill="#E8AE3C">
    PHYSICAL SPACE INTELLIGENCE
  </text>
  <text x="400" y="630" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="500" letter-spacing="4px" fill="#71717A">
    14.5547° N, 121.0244° E • METRO MANILA
  </text>
  
  <!-- Subtle Crosshairs -->
  <line x1="400" y1="35" x2="400" y2="70" stroke="#E8AE3C" stroke-width="2" opacity="0.6"/>
  <line x1="400" y1="730" x2="400" y2="765" stroke="#E8AE3C" stroke-width="2" opacity="0.6"/>
  <line x1="35" y1="400" x2="70" y2="400" stroke="#E8AE3C" stroke-width="2" opacity="0.6"/>
  <line x1="730" y1="400" x2="765" y2="400" stroke="#E8AE3C" stroke-width="2" opacity="0.6"/>
</svg>`;

// Write SVGs
fs.writeFileSync(path.join(logosDir, 'scoutit-mark-gold.svg'), svgMarkGold);
fs.writeFileSync(path.join(logosDir, 'scoutit-mark-white.svg'), svgMarkWhite);
fs.writeFileSync(path.join(logosDir, 'scoutit-wordmark-horizontal.svg'), svgWordmarkHorizontal);
fs.writeFileSync(path.join(logosDir, 'scoutit-badge-space-intelligence.svg'), svgCinematicBadge);

console.log('>>> Wrote vector SVGs.');

// Render Raster PNGs using sharp
async function renderRasters() {
  console.log('>>> Rendering high-resolution raster PNGs with Sharp...');

  // 1. Mark Gold Transparent 1024x1024
  await sharp(Buffer.from(svgMarkGold), { density: 600 })
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(logosDir, 'scoutit-mark-gold-1024x1024.png'));

  // 2. Mark Gold Transparent 2048x2048 (4K Ultra-Res)
  await sharp(Buffer.from(svgMarkGold), { density: 1200 })
    .resize(2048, 2048, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(logosDir, 'scoutit-mark-gold-2048x2048.png'));

  // 3. Mark White Transparent 1024x1024
  await sharp(Buffer.from(svgMarkWhite), { density: 600 })
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(logosDir, 'scoutit-mark-white-1024x1024.png'));

  // 4. Mark on Obsidian Tile (1080x1080) with warm ambient glow
  const darkBackdrop = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
    <defs>
      <radialGradient id="aura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#E8AE3C" stop-opacity="0.22"/>
        <stop offset="45%" stop-color="#E8AE3C" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1080" height="1080" fill="#0D0D0F"/>
    <circle cx="540" cy="540" r="500" fill="url(#aura)"/>
  </svg>`);

  const markInner = await sharp(Buffer.from(svgMarkGold), { density: 800 })
    .resize(600, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp(darkBackdrop)
    .composite([{ input: markInner, left: 240, top: 240 }])
    .png()
    .toFile(path.join(logosDir, 'scoutit-mark-gold-on-obsidian-1080x1080.png'));

  // 5. Horizontal Wordmark Transparent (1920x480)
  await sharp(Buffer.from(svgWordmarkHorizontal), { density: 600 })
    .resize(1920, 480, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(logosDir, 'scoutit-wordmark-horizontal-1920x480.png'));

  // 6. Cinematic Badge 1080x1080
  await sharp(Buffer.from(svgCinematicBadge), { density: 600 })
    .resize(1080, 1080, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(logosDir, 'scoutit-badge-space-intelligence-1080x1080.png'));

  // 7. Copy original source SIT render if present
  const originalSit = path.join(rootDir, 'Assets', 'SIT Assets.png');
  if (fs.existsSync(originalSit)) {
    fs.copyFileSync(originalSit, path.join(logosDir, 'scoutit-original-monogram-artwork.png'));
  }

  // 8. Copy Mascot cutout if present
  const serpentMascot = path.join(rootDir, 'promotional/campaigns/serpent-mascot/friendly_serpent_cutout.png');
  if (fs.existsSync(serpentMascot)) {
    fs.copyFileSync(serpentMascot, path.join(logosDir, 'scoutit-mascot-friendly-guide.png'));
  }

  console.log('>>> Finished rendering brand assets.');
}

// Copy Real Website UI Screens into 02_website_ui_walkthrough
function copyUiScreens() {
  console.log('>>> Copying high-definition website UI walkthrough screens...');

  const screenSourceDir = path.join(rootDir, 'promotional/campaigns/scoutit-60s-commercial/web/screens');
  const realScreensDir = path.join(rootDir, 'promotional/campaigns/real-screens');

  const mapping = [
    { src: path.join(screenSourceDir, 'homepage.png'), dest: '01_homepage_hero_interface.png', desc: 'Homepage: Clean dark-mode search, value proposition, live space cards' },
    { src: path.join(screenSourceDir, 'discover.png'), dest: '02_discover_interactive_gis_map.png', desc: 'Discover: Interactive split-screen Mapbox map with real-time property cluster pins' },
    { src: path.join(screenSourceDir, 'metropolis.png'), dest: '03_search_filters_and_radius.png', desc: 'Search & Filters: Category pills (Office, Retail, Residential), price range, sqm slider' },
    { src: path.join(screenSourceDir, 'property-dossier.png'), dest: '04_property_dossier_overview.png', desc: 'Property Dossier: Prime commercial & residential spaces with verified specs & pricing' },
    { src: path.join(screenSourceDir, 'property-ecom.png'), dest: '05_property_specifications_grid.png', desc: 'Property Specs: Clear floor plates, ceiling heights, column layout, power specs' },
    { src: path.join(screenSourceDir, 'property-transit.png'), dest: '06_gis_hazard_and_transit_radar.png', desc: 'GIS Environmental Intelligence: Project NOAH flood zone verification & MRT/LRT walk ring' },
    { src: path.join(screenSourceDir, 'property-broker.png'), dest: '07_verified_broker_pipeline.png', desc: 'Direct Contact: Licensed PRC REBL broker credentials & direct inquiry channel' },
    { src: path.join(screenSourceDir, 'property-directory.png'), dest: '08_property_directory_grid.png', desc: 'Directory: Dense curated listing cards with instant availability tags' },
    { src: path.join(screenSourceDir, 'showcase-chatbox.png'), dest: '09_deal_room_and_inquiry_modal.png', desc: 'Deal Room: Direct sovereign messaging with space owners and verified brokers' },
  ];

  mapping.forEach(item => {
    let sourcePath = item.src;
    if (!fs.existsSync(sourcePath)) {
      const fallback = path.join(realScreensDir, path.basename(item.src));
      if (fs.existsSync(fallback)) sourcePath = fallback;
    }

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join(uiWalkthroughDir, item.dest));
      console.log(`    Copied ${item.dest}`);
    } else {
      console.warn(`    Warning: Source file not found: ${item.src}`);
    }
  });

  // Also copy 360 preview if present
  const tourPreview = path.join(rootDir, 'public/video/cyber-sigma-preview.png');
  if (fs.existsSync(tourPreview)) {
    fs.copyFileSync(tourPreview, path.join(uiWalkthroughDir, '10_property_360_spatial_preview.png'));
    console.log('    Copied 10_property_360_spatial_preview.png');
  }
}

// Copy Cutouts & Generate Feature Breakdown Cards in 03_button_and_feature_explorations
function copyCutouts() {
  console.log('>>> Copying button and UI feature cutouts...');

  const cutoutSourceDir = path.join(rootDir, 'promotional/campaigns/scoutit-60s-commercial/web/cutouts');
  const realCutoutsDir = path.join(rootDir, 'promotional/campaigns/real-screens/cutouts');

  const cutouts = [
    { src: 'hero-cta-buttons.png', dest: 'btn_hero_scout_spaces.png' },
    { src: 'discover-search-bar.png', dest: 'btn_discover_search_and_filter.png' },
    { src: 'discover-map.png', dest: 'btn_interactive_map_cluster_pins.png' },
    { src: 'property-header.png', dest: 'btn_property_dossier_header.png' },
    { src: 'property-specs.png', dest: 'btn_property_technical_specs_grid.png' },
    { src: 'transit-section.png', dest: 'btn_gis_transit_and_walk_radar.png' },
    { src: 'broker-card.png', dest: 'btn_verified_broker_credential.png' },
    { src: 'deal-room-chat.png', dest: 'btn_direct_contact_inquire_dealroom.png' },
    { src: 'telemetry-nav-header.png', dest: 'btn_top_navigation_telemetry.png' },
  ];

  cutouts.forEach(c => {
    let sourcePath = path.join(cutoutSourceDir, c.src);
    if (!fs.existsSync(sourcePath)) {
      sourcePath = path.join(realCutoutsDir, c.src);
    }
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join(buttonsFeaturesDir, c.dest));
      console.log(`    Copied cutout ${c.dest}`);
    }
  });
}

async function main() {
  await renderRasters();
  copyUiScreens();
  copyCutouts();
  console.log('>>> Phase 1 completed successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
