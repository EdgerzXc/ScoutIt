import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+?)[=:](.*)/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/(^['"]|['"]$)/g, '');
      process.env[key] = value;
    }
  });
}

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

async function backupAirtable() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error("❌ Cannot backup: AIRTABLE_API_KEY or AIRTABLE_BASE_ID missing.");
    process.exit(1);
  }

  console.log("📦 Starting Airtable CMS backup...");

  let allRecords = [];
  let offset = null;

  try {
    do {
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Properties`;
      if (offset) {
        url += `?offset=${offset}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Airtable API responded with ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      allRecords = allRecords.concat(data.records || []);
      offset = data.offset;

      console.log(`✅ Fetched page... Total records so far: ${allRecords.length}`);
    } while (offset);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const backupFile = path.join(backupDir, `cms_backup_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(allRecords, null, 2));

    console.log(`🎉 Backup complete! ${allRecords.length} records saved to ${backupFile}`);

  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    process.exit(1);
  }
}

backupAirtable();
