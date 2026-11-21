import { posix } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { openLocalClaimScanner, processPrivateClaimDocuments, removeExpiredClaimUploads } from "../src/lib/claimPrivateScanner.mjs";

async function main() {
  const cleanup = process.argv[2] === "--clean-expired-uploads";
  if (process.argv.length > (cleanup ? 3 : 2)) throw new Error("Unexpected option");
  const url = new URL(process.env.SUPABASE_URL || "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const socket = process.env.SCOUTIT_CLAIM_CLAMD_SOCKET;
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || !key) {
    throw new Error("Private worker needs Supabase URL and server credentials");
  }
  if (!cleanup && (!socket || process.platform === "win32" || !posix.isAbsolute(socket))) {
    throw new Error("Private worker needs a local Unix antivirus socket");
  }
  const admin = createClient(url.origin, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(20_000) }) },
  });
  return cleanup
    ? removeExpiredClaimUploads(admin)
    : processPrivateClaimDocuments(admin, await openLocalClaimScanner(socket));
}

try {
  console.log(JSON.stringify(await main()));
} catch {
  console.error("Private claim document job could not be confirmed. Check worker configuration and provider availability.");
  process.exitCode = 1;
}
