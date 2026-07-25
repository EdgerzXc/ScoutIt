/**
 * Spatial Transit Data Sync Script
 * Overpass API (OpenStreetMap) Philippines Rail Stations Fetcher
 * Run via: node scripts/sync_transit_data.js
 */

const fs = require("fs");
const path = require("path");

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const METRO_MANILA_BBOX = "14.3,120.8,14.8,121.2";

// Overpass QL Query for LRT-1, LRT-2, MRT-3, MRT-7, and Subway stations
const query = `
[out:json][timeout:25];
(
  node["railway"="station"](${METRO_MANILA_BBOX});
  node["station"="subway"](${METRO_MANILA_BBOX});
);
out body;
`;

async function syncTransitData() {
  console.log("📡 Fetching latest Philippines transit station data from OpenStreetMap...");

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      body: "data=" + encodeURIComponent(query),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.ok) {
      throw new Error(`Overpass API HTTP ${response.status}`);
    }

    const data = await response.json();
    const nodes = data.elements || [];

    console.log(`✓ Fetched ${nodes.length} station nodes from OSM.`);

    const lrt1 = [];
    const lrt2 = [];
    const mrt3 = [];

    nodes.forEach((node) => {
      const name = node.tags?.name || node.tags?.["name:en"] || "Station";
      const station = {
        name,
        lon: node.lon,
        lat: node.lat,
      };

      const line = (node.tags?.operator || node.tags?.line || "").toLowerCase();
      if (line.includes("lrt 1") || line.includes("lrt-1") || name.includes("LRT-1")) {
        lrt1.push(station);
      } else if (line.includes("lrt 2") || line.includes("lrt-2") || name.includes("LRT-2")) {
        lrt2.push(station);
      } else {
        mrt3.push(station);
      }
    });

    const targetPath = path.join(__dirname, "../src/data/manila_transit_stations.json");
    console.log(`💾 Updating ${targetPath}...`);

    // Merge with existing structure safely
    const existing = JSON.parse(fs.readFileSync(targetPath, "utf8"));
    const updated = {
      lrt1: lrt1.length > 0 ? lrt1 : existing.lrt1,
      lrt2: lrt2.length > 0 ? lrt2 : existing.lrt2,
      mrt3: mrt3.length > 0 ? mrt3 : existing.mrt3,
    };

    fs.writeFileSync(targetPath, JSON.stringify(updated, null, 2));
    console.log("✅ Transit station data updated successfully!");
  } catch (err) {
    console.warn("⚠️ OSM fetch skipped or offline, retaining existing station data:", err.message);
  }
}

syncTransitData();
