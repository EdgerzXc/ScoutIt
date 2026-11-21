import { createConnection } from "node:net";
import { createHash } from "node:crypto";
import {
  CLAIM_DOCUMENT_BUCKET, CLAIM_DOCUMENT_MIMES, CLAIM_MULTIPART_FILE_MAX_BYTES, claimDocumentFilename,
} from "./claimDocumentPath.mjs";

function requestClamd(socketPath, parts) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ path: socketPath });
    let response = "";
    const timer = setTimeout(() => finish(new Error("Local scan timed out")), 15_000);
    function finish(error, value) {
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error);
      else resolve(value);
    }
    socket.once("connect", () => {
      for (const part of parts) socket.write(part);
    });
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      response += chunk;
      if (response.length > 1024) finish(new Error("Invalid local scan reply"));
      else if (response.includes("\0")) finish(null, response.split("\0", 1)[0]);
    });
    socket.once("error", () => finish(new Error("Local scanner is unavailable")));
    socket.once("close", () => finish(new Error("Incomplete local scan reply")));
  });
}

export function freshClamdSignatures(version, now = Date.now()) {
  const signatureDate = /^ClamAV [^/]+\/\d+\/(.+)$/.exec(version)?.[1];
  const timestamp = Date.parse(signatureDate && !/(?:UTC|GMT|Z|[+-]\d{4})$/i.test(signatureDate)
    ? signatureDate + " UTC" : signatureDate || "");
  return Number.isFinite(timestamp) && timestamp <= now + 60_000 && now - timestamp <= 72 * 60 * 60 * 1000;
}

export async function openLocalClaimScanner(socketPath) {
  const version = await requestClamd(socketPath, ["zVERSION\0"]);
  if (!freshClamdSignatures(version)) throw new Error("Local antivirus signatures are unavailable or stale");
  return async (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > CLAIM_MULTIPART_FILE_MAX_BYTES) {
      throw new Error("Claim file size is outside the scan limit");
    }
    const length = Buffer.alloc(4);
    length.writeUInt32BE(buffer.length);
    const reply = await requestClamd(socketPath, ["zINSTREAM\0", length, buffer, Buffer.alloc(4)]);
    if (reply === "stream: OK") return "clean";
    if (/^stream: .+ FOUND$/.test(reply)) return "blocked";
    throw new Error("Local scanner did not confirm a verdict");
  };
}

function objectMatches(object, expectedMime, bytes) {
  return object?.contentType === expectedMime && object.size === bytes &&
    typeof object.version === "string" && object.version.length > 0;
}

export async function processPrivateClaimDocuments(admin, scan) {
  const { data: details, error: bucketError } = await admin.storage.getBucket(CLAIM_DOCUMENT_BUCKET);
  if (bucketError || details?.public !== false) throw new Error("Private claim bucket unavailable");
  const { data, error } = await admin.rpc("lease_claim_document_scans", { p_batch: 5 });
  if (error || !Array.isArray(data)) throw new Error("Claim scan queue unavailable");
  const bucket = admin.storage.from(CLAIM_DOCUMENT_BUCKET);
  const counts = { clean: 0, blocked: 0, pending: 0, unconfirmed: 0 };

  for (const job of data) {
    let status = "pending";
    let checksum = null;
    let version = null;
    try {
      const filename = claimDocumentFilename(job.object_path, job.claimant_id, [job.property_id, job.slug, job.canonical_slug]);
      const mime = filename && CLAIM_DOCUMENT_MIMES[filename.split(".").at(-1).toLowerCase()];
      const bytes = Number(job.byte_count);
      if (!mime || mime !== job.declared_mime || !Number.isInteger(bytes) || bytes < 1 || bytes > CLAIM_MULTIPART_FILE_MAX_BYTES) {
        status = "blocked";
      } else {
        const before = await bucket.info(job.object_path);
        if (!before.error && objectMatches(before.data, mime, bytes)) {
          const { data: blob, error: downloadError } = await bucket.download(job.object_path);
          if (!downloadError && blob?.size === bytes) {
            const buffer = Buffer.from(await blob.arrayBuffer());
            const verdict = await scan(buffer);
            const after = await bucket.info(job.object_path);
            if (!after.error && objectMatches(after.data, mime, bytes) && after.data.version === before.data.version) {
              if (verdict === "blocked") status = "blocked";
              if (verdict === "clean") {
                status = "clean";
                version = before.data.version;
                checksum = createHash("sha256").update(buffer).digest("hex");
              }
            }
          }
        }
      }
    } catch {
      status = "pending";
    }
    const outcome = await admin.rpc("finish_claim_document_scan", {
      p_document: job.document_id, p_lease: job.lease, p_status: status, p_checksum: checksum, p_version: version,
    });
    counts[outcome.error || outcome.data !== true ? "unconfirmed" : status] += 1;
  }
  return counts;
}

export async function removeExpiredClaimUploads(admin) {
  const { data: details, error: bucketError } = await admin.storage.getBucket(CLAIM_DOCUMENT_BUCKET);
  if (bucketError || details?.public !== false) throw new Error("Private claim bucket unavailable");
  const { data, error } = await admin.rpc("list_expired_claim_uploads");
  if (error || !Array.isArray(data)) throw new Error("Claim upload retention check unavailable");
  const bucket = admin.storage.from(CLAIM_DOCUMENT_BUCKET);
  const counts = { removed: 0, unconfirmed: 0 };
  for (const { object_path: path, object_version: version } of data) {
    const before = await bucket.info(path);
    if (before.error || before.data?.version !== version) {
      counts.unconfirmed += 1;
      continue;
    }
    const { error: removalError } = await bucket.remove([path]);
    const after = await bucket.info(path);
    const code = Number(after.error?.statusCode || after.error?.status);
    counts[!removalError && code === 404 ? "removed" : "unconfirmed"] += 1;
  }
  return counts;
}
