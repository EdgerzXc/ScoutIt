import { SIGNAL_MEDIA_UUID } from "./signalMediaPolicy";

export function signalMediaEnabled() {
  return process.env.SCOUTIT_SIGNAL_MEDIA_ENABLED === "true";
}

export function signalMediaPilotTier(userId) {
  if (!signalMediaEnabled() || typeof userId !== "string" || !SIGNAL_MEDIA_UUID.test(userId)) return null;
  try {
    const grants = JSON.parse(process.env.SCOUTIT_SIGNAL_MEDIA_PILOT_GRANTS || "{}");
    const tier = grants?.[userId];
    return ["solar", "cluster", "universe"].includes(tier) ? tier : null;
  } catch {
    return null;
  }
}

export function signalStreamConfigured() {
  return Boolean(
    /^[a-f\d]{32}$/i.test(process.env.SCOUTIT_SIGNAL_STREAM_ACCOUNT || "") &&
    /^[a-z\d]+$/i.test(process.env.SCOUTIT_SIGNAL_STREAM_CUSTOMER || "") &&
    process.env.SCOUTIT_SIGNAL_STREAM_TOKEN
  );
}

export async function signalStreamRequest(path, options) {
  if (!signalStreamConfigured()) throw new Error("Video is unavailable");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.SCOUTIT_SIGNAL_STREAM_ACCOUNT}/stream/${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${process.env.SCOUTIT_SIGNAL_STREAM_TOKEN}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error("Video provider unavailable");
  return body.result;
}

export async function withApprovedSignalMedia(client, signals) {
  if (!signalMediaEnabled() || !signals.length) return signals;
  const { data, error } = await client.from("signal_media")
    .select("id,signal_id,kind,position,alt_text")
    .eq("state", "approved")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .in("signal_id", signals.map(({ id }) => id))
    .order("position");
  if (error || !data?.length) return signals;
  const bySignal = new Map();
  for (const item of data) {
    const media = bySignal.get(item.signal_id) || [];
    media.push({ id: item.id, kind: item.kind, alt: item.alt_text });
    bySignal.set(item.signal_id, media);
  }
  return signals.map((signal) => bySignal.has(signal.id) ? { ...signal, media: bySignal.get(signal.id) } : signal);
}
