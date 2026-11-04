import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'ad_assets', '03_button_and_feature_explorations');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert local images to base64 for embedding cleanly in standalone cards
function getBase64Image(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const ext = path.extname(filePath).replace('.', '');
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:image/${ext === 'svg' ? 'svg+xml' : ext};base64,${data}`;
}

const logoMarkUri = getBase64Image(path.join(rootDir, 'ad_assets', '01_logos_and_brand', 'scoutit-mark-gold.svg'));
const heroScreenUri = getBase64Image(path.join(rootDir, 'ad_assets', '02_website_ui_walkthrough', '01_homepage_hero_interface.png'));
const mapScreenUri = getBase64Image(path.join(rootDir, 'ad_assets', '02_website_ui_walkthrough', '02_discover_interactive_gis_map.png'));
const filterScreenUri = getBase64Image(path.join(rootDir, 'ad_assets', '02_website_ui_walkthrough', '03_search_filters_and_radius.png'));
const dossierScreenUri = getBase64Image(path.join(rootDir, 'ad_assets', '02_website_ui_walkthrough', '04_property_dossier_overview.png'));
const transitScreenUri = getBase64Image(path.join(rootDir, 'ad_assets', '02_website_ui_walkthrough', '06_gis_hazard_and_transit_radar.png'));
const brokerScreenUri = getBase64Image(path.join(rootDir, 'ad_assets', '02_website_ui_walkthrough', '07_verified_broker_pipeline.png'));

const cards = [
  {
    fileName: 'card_01_button_scout_spaces_to_map.png',
    title: 'FEATURE 01: ONE-CLICK MAP EXPLORATION',
    buttonLabel: 'SCOUT SPACES // EXPLORE METRO MANILA',
    buttonSub: 'PRIMARY HERO CTA ON HOMEPAGE',
    destination: '/discover (LIVE GIS MAPBOX INTERFACE)',
    targetAudience: 'Everyday Renters, Homebuyers, Commercial Seekers',
    benefitHeadline: 'Zero Gated Forms. Explore Every Space Instantly.',
    benefitDesc: 'Clicking "Scout Spaces" takes users directly into an interactive dual-pane GIS map. See live verified residential condos, commercial studios, and retail spaces with transparent pin clusters across BGC, Makati, and Ortigas. No mandatory email paywalls before browsing.',
    previewImg: mapScreenUri,
    specs: ['Direct route: /discover', 'Dual-pane spatial layout', 'Interactive Mapbox GL pins', 'Cluster auto-zoom']
  },
  {
    fileName: 'card_02_button_filters_and_pricing.png',
    title: 'FEATURE 02: PRECISION SEARCH & BUDGET FILTER',
    buttonLabel: 'FILTERS: PRICE • SQM • PROPERTY TYPE',
    buttonSub: 'DYNAMIC CLIENT-SIDE RADIAL ENGINE',
    destination: 'INSTANT LOCAL FILTERING (HAVERSINE RADIUS)',
    targetAudience: 'Budget-Conscious Renters, Families & Growing Businesses',
    benefitHeadline: 'Find What Fits Your Exact Wallet and Transit Ring.',
    benefitDesc: 'Ordinary real estate sites hide prices or say "Contact for Price." ScoutIt displays exact rental/purchase figures, allows filtering by price per square meter, property category (Residential / Office / Retail), and calculates exact Haversine distance from your workplace or train station.',
    previewImg: filterScreenUri,
    specs: ['Price/sqm instant filter', 'Distance radius calculation', 'Residential vs Commercial', 'Zero reload lag']
  },
  {
    fileName: 'card_03_button_hazard_and_flood_check.png',
    title: 'FEATURE 03: PROJECT NOAH FLOOD & SEISMIC RADAR',
    buttonLabel: 'GIS HAZARD LAYER // PROJECT NOAH',
    buttonSub: 'ENVIRONMENTAL INTELLIGENCE TOGGLE',
    destination: '3-TIER ENVIRONMENTAL RISK DOSSIER',
    targetAudience: 'Anyone Renting or Buying in the Philippines',
    benefitHeadline: 'Never Rent a Flooded Unit or Faultline Danger Zone.',
    benefitDesc: 'Typhoons and earthquakes are real risks in Metro Manila. ScoutIt integrates official Project NOAH 100-year flood elevation models and PHIVOLCS West Valley Fault distances directly into every space card. Check flood depth and seismic bedrock safety BEFORE paying a deposit.',
    previewImg: transitScreenUri,
    specs: ['Project NOAH 100-yr flood model', 'Elevation above sea level (MSL)', 'PHIVOLCS faultline distance', '800m transit walk score']
  },
  {
    fileName: 'card_04_button_direct_owner_inquiry.png',
    title: 'FEATURE 04: DIRECT OWNER & VERIFIED BROKER INQUIRY',
    buttonLabel: 'INQUIRE DIRECTLY // SECURE DEAL ROOM',
    buttonSub: 'ZERO-MIDDLEMAN VERIFIED PIPELINE',
    destination: 'AUTHENTICATED BROKER & OWNER CHANNEL',
    targetAudience: 'Renters & Buyers Tired of Spam and Ghosting',
    benefitHeadline: 'No Fake Listings. No Middleman Markup. Direct Access.',
    benefitDesc: 'Every property on ScoutIt links directly to verified property owners or licensed PRC Real Estate Brokers (PRC REBL authenticated). Say goodbye to endless Facebook group spam, unregistered middlemen adding secret cuts, or brokers who ghost you after asking for your contact info.',
    previewImg: brokerScreenUri,
    specs: ['PRC REBL license authentication', 'Direct WhatsApp / Phone / Email', 'Zero platform commission cuts', 'Audit trail protection']
  }
];

function generateHtml(card) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1920px;
      height: 1080px;
      background: #08080A;
      color: #F4F4F5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 80px;
      position: relative;
    }

    /* Ambient background grid and glow */
    .bg-glow {
      position: absolute;
      top: -200px;
      right: -200px;
      width: 900px;
      height: 900px;
      background: radial-gradient(circle, rgba(232, 174, 60, 0.12) 0%, rgba(232, 174, 60, 0.02) 50%, transparent 70%);
      pointer-events: none;
    }
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(232, 174, 60, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(232, 174, 60, 0.03) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 2;
      border-bottom: 1px solid rgba(232, 174, 60, 0.2);
      padding-bottom: 24px;
    }
    .brand-lockup {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .brand-mark {
      width: 48px;
      height: 48px;
    }
    .brand-name {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand-name span:nth-child(1) { color: #F7C64E; }
    .brand-name span:nth-child(2) { color: #FFFFFF; }
    .brand-name span:nth-child(3) { color: #F7C64E; }
    .telemetry-pill {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 13px;
      letter-spacing: 2px;
      color: #E8AE3C;
      background: rgba(232, 174, 60, 0.08);
      border: 1px solid rgba(232, 174, 60, 0.25);
      padding: 8px 16px;
      border-radius: 9999px;
      text-transform: uppercase;
    }

    /* Main Content Layout */
    .content-grid {
      display: grid;
      grid-template-columns: 820px 1fr;
      gap: 60px;
      align-items: center;
      position: relative;
      z-index: 2;
      flex: 1;
      padding: 40px 0;
    }

    /* Left Info Column */
    .left-col {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .category-kicker {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      color: #F7C64E;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .headline {
      font-size: 46px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -1px;
      color: #FFFFFF;
    }
    .description {
      font-size: 20px;
      line-height: 1.55;
      color: #A1A1AA;
    }

    /* Interactive Button Demonstration Box */
    .button-demo-box {
      background: rgba(20, 20, 24, 0.85);
      border: 1px solid rgba(232, 174, 60, 0.35);
      border-radius: 14px;
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      backdrop-filter: blur(16px);
      box-shadow: 0 12px 36px rgba(0,0,0,0.5), 0 0 30px rgba(232, 174, 60, 0.08);
    }
    .demo-step-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .step-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      background: #E8AE3C;
      color: #0D0D0D;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .action-button-mockup {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #F7C64E 0%, #E8AE3C 100%);
      color: #0D0D0D;
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 18px rgba(247, 198, 78, 0.35);
    }
    .destination-arrow {
      font-size: 24px;
      color: #F7C64E;
    }
    .destination-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      color: #E4E4E7;
      background: #18181B;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 10px 18px;
      border-radius: 8px;
    }

    /* Specs Checklist */
    .specs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 8px;
    }
    .spec-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #D4D4D8;
    }
    .spec-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #F7C64E;
    }

    /* Right Preview Column (Screen Frame) */
    .right-col {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .screen-frame {
      width: 100%;
      height: 540px;
      background: #121214;
      border: 1px solid rgba(232, 174, 60, 0.3);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0,0,0,0.8), 0 0 50px rgba(232, 174, 60, 0.12);
      position: relative;
    }
    .screen-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
    }
    .frame-badge {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(13, 13, 15, 0.88);
      border: 1px solid rgba(232, 174, 60, 0.4);
      color: #F7C64E;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 6px;
      backdrop-filter: blur(8px);
      letter-spacing: 1.5px;
    }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 2;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #71717A;
      letter-spacing: 1px;
    }
    .footer span.highlight {
      color: #E8AE3C;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-grid"></div>

  <!-- Header -->
  <header class="header">
    <div class="brand-lockup">
      <img src="${logoMarkUri}" class="brand-mark" alt="ScoutIt Logo">
      <div class="brand-name">
        <span>S</span><span>cout</span><span>IT</span>
      </div>
    </div>
    <div class="telemetry-pill">
      ${card.title}
    </div>
  </header>

  <!-- Main Grid -->
  <main class="content-grid">
    <div class="left-col">
      <div class="category-kicker">WHERE THIS BUTTON TAKES YOU // ${card.targetAudience}</div>
      <h1 class="headline">${card.benefitHeadline}</h1>
      <p class="description">${card.benefitDesc}</p>

      <!-- Button Interaction Flow -->
      <div class="button-demo-box">
        <div class="demo-step-row">
          <div class="step-badge">USER ACTION</div>
          <div class="action-button-mockup">
            <span>⌖</span>
            <span>${card.buttonLabel}</span>
          </div>
        </div>
        <div class="demo-step-row">
          <div class="destination-arrow">↳</div>
          <div class="destination-pill">
            <span>DESTINATION: ${card.destination}</span>
          </div>
        </div>
      </div>

      <!-- Specs Checklist -->
      <div class="specs-grid">
        ${card.specs.map(s => `<div class="spec-item"><div class="spec-dot"></div><span>${s}</span></div>`).join('')}
      </div>
    </div>

    <!-- Right Screen Preview -->
    <div class="right-col">
      <div class="screen-frame">
        <img src="${card.previewImg}" alt="UI Preview">
        <div class="frame-badge">REAL SCOUTIT UI • 60 FPS CAPTURE</div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div>SCOUTIT SPACE INTELLIGENCE PLATFORM • <span class="highlight">scoutit.ph</span></div>
    <div>ASSET FOR COMMERCIAL VIDEO PRODUCTION // SCENE GUIDE</div>
  </footer>
</body>
</html>`;
}

// Complete End-to-End User Flow Infographic
function generateInfographicHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1920px;
      height: 1080px;
      background: #08080A;
      color: #F4F4F5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 80px;
      position: relative;
    }
    .bg-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 1400px;
      height: 700px;
      background: radial-gradient(ellipse, rgba(232, 174, 60, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(232, 174, 60, 0.25);
      padding-bottom: 24px;
    }
    .brand-lockup { display: flex; align-items: center; gap: 16px; }
    .brand-name { font-size: 32px; font-weight: 800; }
    .brand-name span:nth-child(1) { color: #F7C64E; }
    .brand-name span:nth-child(2) { color: #FFFFFF; }
    .brand-name span:nth-child(3) { color: #F7C64E; }
    .badge-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      color: #E8AE3C;
      background: rgba(232, 174, 60, 0.1);
      border: 1px solid rgba(232, 174, 60, 0.3);
      padding: 8px 18px;
      border-radius: 9999px;
      letter-spacing: 2px;
    }

    .title-banner {
      text-align: center;
      margin: 20px 0;
    }
    .title-banner h1 {
      font-size: 40px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .title-banner p {
      font-size: 18px;
      color: #A1A1AA;
    }

    .steps-container {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
      align-items: stretch;
      margin: 10px 0;
    }

    .step-card {
      background: #111114;
      border: 1px solid rgba(232, 174, 60, 0.2);
      border-radius: 14px;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .step-card.active-step {
      border-color: rgba(247, 198, 78, 0.6);
      box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 24px rgba(232, 174, 60, 0.12);
    }
    .step-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 800;
      color: #F7C64E;
      background: rgba(232, 174, 60, 0.15);
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 14px;
      letter-spacing: 1px;
    }
    .step-title {
      font-size: 19px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 10px;
      line-height: 1.25;
    }
    .step-desc {
      font-size: 13px;
      color: #A1A1AA;
      line-height: 1.5;
      margin-bottom: 16px;
      flex: 1;
    }
    .step-button-preview {
      background: #1A1A1E;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 10px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #F7C64E;
      text-align: center;
      font-weight: 700;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #71717A;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>

  <header class="header">
    <div class="brand-lockup">
      <img src="${logoMarkUri}" width="44" height="44" alt="Mark">
      <div class="brand-name">
        <span>S</span><span>cout</span><span>IT</span>
      </div>
    </div>
    <div class="badge-pill">END-TO-END COMMERCIAL & RESIDENTIAL SEARCH JOURNEY</div>
  </header>

  <div class="title-banner">
    <h1>Where ScoutIt Takes You: The 5-Step Sovereign Real Estate Experience</h1>
    <p>How ordinary people, families, and businesses find and verify spaces with zero gatekeeping.</p>
  </div>

  <div class="steps-container">
    <div class="step-card">
      <div>
        <div class="step-num">STEP 01</div>
        <div class="step-title">Instant Map Launch</div>
        <div class="step-desc">Click "Scout Spaces" on the homepage. Instantly loads Metro Manila's entire active inventory on a high-speed Mapbox canvas.</div>
      </div>
      <div class="step-button-preview">CTA: [SCOUT SPACES]</div>
    </div>

    <div class="step-card">
      <div>
        <div class="step-num">STEP 02</div>
        <div class="step-title">Budget & Radius Filter</div>
        <div class="step-desc">Filter by exact price, sqm, and property category. Calculate walking distance to MRT/LRT without page reloads.</div>
      </div>
      <div class="step-button-preview">FILTER: [PRICE / SQM / TYPE]</div>
    </div>

    <div class="step-card active-step">
      <div>
        <div class="step-num">STEP 03</div>
        <div class="step-title">Flood & Hazard Audit</div>
        <div class="step-desc">Verify Project NOAH 100-year flood levels and faultline distances before ever paying a deposit or signing a lease.</div>
      </div>
      <div class="step-button-preview" style="background: rgba(232, 174, 60, 0.2); border-color: #F7C64E;">GIS: [PROJECT NOAH RADAR]</div>
    </div>

    <div class="step-card">
      <div>
        <div class="step-num">STEP 04</div>
        <div class="step-title">Architectural Dossier</div>
        <div class="step-desc">Inspect real photos, 360-degree tours, column layouts, ceiling heights, backup generator specs, and parking slots.</div>
      </div>
      <div class="step-button-preview">VIEW: [FULL SPACE DOSSIER]</div>
    </div>

    <div class="step-card">
      <div>
        <div class="step-num">STEP 05</div>
        <div class="step-title">Direct Owner Deal</div>
        <div class="step-desc">Connect directly to verified space owners or PRC-licensed brokers with zero middleman markups or unsolicited spam.</div>
      </div>
      <div class="step-button-preview" style="background: #F7C64E; color: #0D0D0D;">ACTION: [DIRECT INQUIRY]</div>
    </div>
  </div>

  <footer class="footer">
    <div>SCOUTIT • PHYSICAL SPACE INTELLIGENCE FOR EVERYONE</div>
    <div>WWW.SCOUTIT.PH</div>
  </footer>
</body>
</html>`;
}

async function renderCards() {
  console.log('>>> Launching Playwright Chromium to render high-res visual cards...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  for (const card of cards) {
    const html = generateHtml(card);
    await page.setContent(html, { waitUntil: 'networkidle' });
    const targetPath = path.join(outputDir, card.fileName);
    await page.screenshot({ path: targetPath, type: 'png' });
    console.log(`    Generated card: ${card.fileName}`);
  }

  // Render the Master Infographic Card
  const infoHtml = generateInfographicHtml();
  await page.setContent(infoHtml, { waitUntil: 'networkidle' });
  const infoPath = path.join(outputDir, 'card_05_visual_user_journey_infographic.png');
  await page.screenshot({ path: infoPath, type: 'png' });
  console.log(`    Generated card: card_05_visual_user_journey_infographic.png`);

  await browser.close();
  console.log('>>> Playwright render complete.');
}

renderCards().catch(err => {
  console.error(err);
  process.exit(1);
});
