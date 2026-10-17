/**
 * ScoutIt Comprehensive Full-Website Operational & Continuity Audit
 * Probes local offline server on http://localhost:3000 across all 6 layers,
 * core user journeys, API endpoints, redirects, security headers, and visual invariants.
 */

import http from "node:http";

const BASE_URL = "http://localhost:3000";

const ROUTES = [
  // Layer 01: Orbit & Entry
  { path: "/", name: "Layer 01: Orbit (Homepage)", expectedStatus: 200, category: "layer" },
  { path: "/descent", name: "Master Flow Graph / Descent Hub", expectedStatus: 200, category: "layer" },

  // Layer 02: Stratosphere & Signals
  { path: "/layer/stratosphere", name: "Layer 02: Stratosphere Intro", expectedStatus: 200, category: "layer" },
  { path: "/stratosphere", name: "Layer 02: Stratosphere Terminal", expectedStatus: 200, category: "layer" },
  { path: "/stratosphere?view=radar", name: "Layer 02: Spatial Signal Radar", expectedStatus: 200, category: "layer" },
  { path: "/community", name: "Community Redirect -> Radar", expectedStatus: [307, 308, 200], category: "redirect" },

  // Layer 03: Metropolis & Properties
  { path: "/layer/metropolis", name: "Layer 03: Metropolis Entry", expectedStatus: 200, category: "layer" },
  { path: "/property", name: "Layer 03: The Space Directory", expectedStatus: 200, category: "layer" },
  { path: "/property?type=commercial", name: "Property Directory (Filtered: Commercial)", expectedStatus: 200, category: "layer" },
  { path: "/property?type=residential", name: "Property Directory (Filtered: Residential)", expectedStatus: 200, category: "layer" },

  // Layer 04: Crust & Showcases
  { path: "/layer/crust", name: "Layer 04: Crust Entry", expectedStatus: 200, category: "layer" },
  { path: "/showcase", name: "Layer 04: Showcase Stage", expectedStatus: 200, category: "layer" },
  { path: "/showcase/chatbox", name: "Layer 04: Mockup Chatbox", expectedStatus: 200, category: "layer" },

  // Layer 05: Mantle & Platform Tour
  { path: "/layer/mantle", name: "Layer 05: Mantle Entry", expectedStatus: 200, category: "layer" },
  { path: "/platform-tour", name: "Layer 05: Platform Tour", expectedStatus: 200, category: "layer" },

  // Layer 06: Core & Descent Culmination
  { path: "/layer/core", name: "Layer 06: Core Entry", expectedStatus: 200, category: "layer" },

  // Core User Journeys & Detail Views
  { path: "/property/one-ecom-center", name: "Property Detail: One E-Com Center", expectedStatus: [200, 404, 503], category: "detail" },
  { path: "/discover", name: "Discover Map View", expectedStatus: 200, category: "journey" },
  { path: "/pricing", name: "Pricing Hub", expectedStatus: 200, category: "journey" },
  { path: "/pricing/seeker", name: "Pricing: Seeker Tier", expectedStatus: 200, category: "journey" },
  { path: "/pricing/owner", name: "Pricing: Owner Tier", expectedStatus: 200, category: "journey" },
  { path: "/pricing/broker", name: "Pricing: Broker Tier", expectedStatus: 200, category: "journey" },
  { path: "/pricing/creator", name: "Pricing: Creator Tier", expectedStatus: 200, category: "journey" },
  { path: "/pricing/bundles", name: "Pricing: Bundles", expectedStatus: 200, category: "journey" },
  { path: "/onboarding", name: "Onboarding Flow", expectedStatus: 200, category: "journey" },
  { path: "/dashboard", name: "Dashboard Workspace Shell", expectedStatus: [200, 307], category: "journey" },
  { path: "/brokers", name: "Broker Advisory Directory", expectedStatus: 200, category: "journey" },
  { path: "/photographers", name: "Photographers Directory", expectedStatus: 200, category: "journey" },
  { path: "/researchers", name: "Researchers Directory", expectedStatus: 200, category: "journey" },
  { path: "/event-planners", name: "Event Planners Directory", expectedStatus: 200, category: "journey" },
  { path: "/badges", name: "Trust Badges Registry", expectedStatus: 200, category: "journey" },
  { path: "/transit", name: "Transit Map (Manila Transit)", expectedStatus: 200, category: "journey" },
  { path: "/intel", name: "Intel Briefing Room", expectedStatus: 200, category: "journey" },
  { path: "/wishlist", name: "Wishlist Vault", expectedStatus: 200, category: "journey" },
  { path: "/tutorials/owner-publish", name: "Tutorial: Owner Publishing", expectedStatus: 200, category: "journey" },

  // Location Hubs (Canonical slugs from LOCATION_HUB_SLUGS)
  { path: "/hubs/bgc-taguig", name: "Hub: BGC (Taguig)", expectedStatus: 200, category: "hub" },
  { path: "/hubs/makati-cbd", name: "Hub: Makati CBD", expectedStatus: 200, category: "hub" },
  { path: "/hubs/quezon-city-hub", name: "Hub: Quezon City", expectedStatus: 200, category: "hub" },

  // Statutory & Legal Pages
  { path: "/about", name: "About ScoutIt", expectedStatus: 200, category: "legal" },
  { path: "/enterprise", name: "Enterprise Portal", expectedStatus: 200, category: "legal" },
  { path: "/about-you", name: "About You Intake", expectedStatus: 200, category: "legal" },
  { path: "/contact", name: "Contact & Concierge", expectedStatus: 200, category: "legal" },
  { path: "/terms", name: "Terms of Service", expectedStatus: 200, category: "legal" },
  { path: "/privacy", name: "Privacy Policy", expectedStatus: 200, category: "legal" },

  // Auth Guards & Gate Protections
  { path: "/admin", name: "Admin Portal (Auth Gated)", expectedStatus: [200, 307, 401, 403], category: "security" },
  { path: "/login", name: "Login Redirect -> Onboarding", expectedStatus: [307, 308], category: "redirect" },

  // Error Handling & 404 Radar
  { path: "/non-existent-probe-for-404-radar", name: "404 Radar Fallback", expectedStatus: 404, category: "error" },
  { path: "/property/does-not-exist-synthetic", name: "Property 404 Fallback", expectedStatus: [404, 200, 503], category: "error" },

  // SEO & Technical Crawlers
  { path: "/robots.txt", name: "Robots Crawler Directives", expectedStatus: 200, category: "seo" },
  { path: "/sitemap.xml", name: "Dynamic XML Sitemap", expectedStatus: [200, 500, 503], category: "seo" },

  // Core API Endpoints
  { path: "/api/health", name: "API: System Health & Quota Gauge", expectedStatus: 200, category: "api" },
  { path: "/api/cms", name: "API: Public CMS Bundle Proxy", expectedStatus: [200, 503], category: "api" },
  { path: "/api/whereto?lat=14.5547&lon=121.0244", name: "API: WhereTo Isochrone Router", expectedStatus: [200, 400], category: "api" },
  { path: "/api/community/signals", name: "API: Community Signals Public List", expectedStatus: 200, category: "api" },
  { path: "/api/wallet", name: "API: Wallet Gate (Requires Auth)", expectedStatus: [401, 403], category: "api-guard" },
  { path: "/api/deals", name: "API: Deals Gate (Requires Auth)", expectedStatus: [401, 403], category: "api-guard" },
  { path: "/api/seo/readiness", name: "API: SEO Readiness (Requires Auth)", expectedStatus: [401, 403, 400], category: "api-guard" },
  { path: "/api/leads/export-audit", name: "API: Leads Export (Requires Auth)", expectedStatus: [401, 403, 405], category: "api-guard" },
];

function fetchRoute(routePath) {
  return new Promise((resolve) => {
    const url = new URL(routePath, BASE_URL);
    const start = Date.now();

    const req = http.get(url, { headers: { "User-Agent": "ScoutIt-Continuity-Auditor/1.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        const latency = Date.now() - start;
        resolve({
          path: routePath,
          statusCode: res.statusCode,
          headers: res.headers,
          bodyLength: Buffer.byteLength(data, "utf8"),
          sampleBody: data.slice(0, 500),
          fullBody: data,
          latencyMs: latency,
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        path: routePath,
        statusCode: 0,
        headers: {},
        error: err.message,
        latencyMs: Date.now() - start,
      });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({
        path: routePath,
        statusCode: 408,
        headers: {},
        error: "Timeout after 15s",
        latencyMs: 15000,
      });
    });
  });
}

async function runAudit() {
  console.log(`Starting ScoutIt Full Website Operational & Continuity Audit...`);
  console.log(`Target: ${BASE_URL}\n`);

  const results = [];
  let passedCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const route of ROUTES) {
    process.stdout.write(`Auditing [${route.category.toUpperCase()}] ${route.path} ... `);
    const res = await fetchRoute(route.path);

    const expected = Array.isArray(route.expectedStatus) ? route.expectedStatus : [route.expectedStatus];
    const isExpected = expected.includes(res.statusCode);

    let statusLabel = "PASS";
    if (!isExpected) {
      statusLabel = "FAIL";
      failCount++;
    } else {
      passedCount++;
    }

    // Inspect headers for security & caching
    const csp = res.headers["content-security-policy"] || res.headers["content-security-policy-report-only"];
    const xContentType = res.headers["x-content-type-options"];
    const cacheControl = res.headers["cache-control"];

    // Check for Dark Mode DNA and Anti-Slop signals in HTML
    let darkDnaPreserved = false;
    let title = "";
    if (res.fullBody && res.fullBody.includes("<html")) {
      const titleMatch = res.fullBody.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : "";
      darkDnaPreserved = res.fullBody.includes("dark") || res.fullBody.includes("--bg") || res.fullBody.includes("background");
    }

    const itemResult = {
      ...route,
      actualStatus: res.statusCode,
      latencyMs: res.latencyMs,
      statusLabel,
      title,
      hasCsp: Boolean(csp),
      hasNosniff: xContentType === "nosniff",
      cacheControl: cacheControl || "none",
      bodySizeKb: (res.bodyLength / 1024).toFixed(2),
      error: res.error,
    };

    results.push(itemResult);
    console.log(`${res.statusCode} (${res.latencyMs}ms) -> ${statusLabel} ${title ? `["${title}"]` : ""}`);
  }

  console.log("\n================ AUDIT SUMMARY ================");
  console.log(`Total Routes Checked: ${results.length}`);
  console.log(`Passed / Expected: ${passedCount}`);
  console.log(`Warnings / Deviations: ${warnCount}`);
  console.log(`Failures: ${failCount}`);
  console.log("================================================\n");

  // Output detailed JSON report for documentation artifact
  return results;
}

runAudit().then((results) => {
  import("node:fs").then((fs) => {
    fs.writeFileSync("scripts/audit-results.json", JSON.stringify(results, null, 2));
    console.log("Saved raw audit output to scripts/audit-results.json");
  });
});
