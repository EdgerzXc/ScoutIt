import { chromium } from "playwright";

const sections = [
  ["orbit", ".layer-orbit"],
  ["board", ".layer-board"],
  ["atmos", ".layer-atmos"],
  ["city", ".layer-city"],
  ["crust", ".layer-crust"],
  ["mantle", ".layer-mantle"],
  ["core", ".layer-core"],
];

const url = process.argv[2] || "http://localhost:3000/descent";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);

for (const [name, sel] of sections) {
  const el = await page.$(sel);
  if (!el) { console.log("MISSING", sel); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `shots/${name}.png` });
  console.log("shot", name);
}
await browser.close();
console.log("done");
