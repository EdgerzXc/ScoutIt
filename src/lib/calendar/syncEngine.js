// Phase 3 core — the loop-safe sync decision logic. Pure, deterministic, no I/O.
//
// The whole point: an edit made on one side propagates to the other EXACTLY
// once, and the write coming back (the "echo") is dropped. This is enforced by
// comparing content hashes against `lastSyncedHash` — the hash we recorded the
// last time the two sides agreed.
import { computeContentHash } from "./eventNormalize";

export const OUTBOUND = { PUSH: "push", SKIP: "skip" };
export const INBOUND = { APPLY: "apply", SKIP: "skip", CONFLICT: "conflict" };

/**
 * ScoutIt -> provider. Push only when the local event differs from what we last
 * synced; otherwise skip (nothing changed, or this is our own echo settling).
 * @param {{ local: object, lastSyncedHash: string|null }} args
 */
export function decideOutbound({ local, lastSyncedHash }) {
  const localHash = computeContentHash(local);
  if (localHash === lastSyncedHash) return { action: OUTBOUND.SKIP, hash: localHash };
  return { action: OUTBOUND.PUSH, hash: localHash };
}

/**
 * provider -> ScoutIt. Drop the echo of our own write; flag a genuine conflict
 * when BOTH sides changed since the last agreement; otherwise apply.
 * @param {{ remote: object, local: object|null, lastSyncedHash: string|null }} args
 */
export function decideInbound({ remote, local, lastSyncedHash }) {
  const remoteHash = computeContentHash(remote);

  // The remote equals what we last pushed => this is our own change echoing
  // back. Never re-apply it. This is the core loop guard.
  if (remoteHash === lastSyncedHash) return { action: INBOUND.SKIP, hash: remoteHash };

  const localHash = local ? computeContentHash(local) : null;
  const localChanged = localHash !== null && localHash !== lastSyncedHash;

  // Remote changed (we're here) AND local also changed since last agreement =>
  // true conflict. Caller resolves last-write-wins by updated_at.
  if (localChanged) return { action: INBOUND.CONFLICT, hash: remoteHash };

  return { action: INBOUND.APPLY, hash: remoteHash };
}
