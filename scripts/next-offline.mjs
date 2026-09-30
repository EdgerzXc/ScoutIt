import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const command = process.argv[2];
if (!["build", "dev", "start"].includes(command)) {
  console.error("Usage: node scripts/next-offline.mjs build|dev|start");
  process.exit(2);
}

const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const child = spawn(process.execPath, [nextCli, command, ...process.argv.slice(3)], {
  stdio: "inherit",
  env: {
    ...process.env,
    // Next loads .env.local unless these values already exist in process.env.
    AIRTABLE_API_KEY: "",
    AIRTABLE_BASE_ID: "",
    UPSTASH_REDIS_REST_URL: "",
    UPSTASH_REDIS_REST_TOKEN: "",
    // Development otherwise borrows the production /api/cms when Airtable
    // credentials are absent, which can still cause production quota use.
    SCOUTIT_OFFLINE_CMS: "1",
  },
});

child.on("error", (error) => {
  console.error("Offline Next.js command could not start:", error);
  process.exitCode = 1;
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
