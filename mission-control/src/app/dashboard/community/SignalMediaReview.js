import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";

const bucket = "signal-photos";
const uuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

async function videoRequest(path, options = {}) {
  const account = process.env.SCOUTIT_SIGNAL_STREAM_ACCOUNT;
  const token = process.env.SCOUTIT_SIGNAL_STREAM_TOKEN;
  if (!/^[a-f\d]{32}$/i.test(account || "") || !token) return null;
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/stream/${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 204) return true;
  const body = await response.json();
  return response.ok && body.success ? body.result : null;
}

async function reviewSource(client, asset) {
  if (asset.kind === "photo" && asset.locator === `${asset.signal_id}/${asset.id}.webp`) {
    const { data } = await client.storage.from(bucket).createSignedUrl(asset.locator, 300);
    return data?.signedUrl || null;
  }
  if (asset.kind === "video" && /^[a-f\d]{32}$/i.test(asset.locator || "")) {
    const customer = process.env.SCOUTIT_SIGNAL_STREAM_CUSTOMER || "";
    if (!/^[a-z\d]+$/i.test(customer)) return null;
    const result = await videoRequest(`${asset.locator}/token`, {
      method: "POST", body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 }),
    });
    if (/^[a-z\d._-]+$/i.test(result?.token || "")) return `https://customer-${customer}.cloudflarestream.com/${result.token}/iframe`;
  }
  return null;
}

async function decideMedia(formData) {
  "use server";
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);
  const id = formData.get("assetId");
  const decision = formData.get("decision");
  if (typeof id !== "string" || !uuid.test(id) || !["approved", "rejected"].includes(decision)) throw new Error("Invalid media decision.");
  const client = createAdminClient();
  const { data: asset, error } = await client.from("signal_media")
    .select("id,signal_id,kind,locator,alt_text,expires_at,stratosphere_signals(author_account_id,signal_type,status,last_confirmed_at)")
    .eq("id", id).eq("state", "review").maybeSingle();
  if (error || !asset) throw new Error("This upload is no longer awaiting review.");
  if (decision === "approved") {
    const post = asset.stratosphere_signals;
    const cutoff = Date.now() - 30 * 86_400_000;
    if (formData.get("reviewed") !== "on" || !["live", "limited"].includes(post?.status) || !(Date.parse(post?.last_confirmed_at) >= cutoff)) {
      throw new Error("Confirm review of the media and check that its signal is active.");
    }
    const grants = JSON.parse(process.env.SCOUTIT_SIGNAL_MEDIA_PILOT_GRANTS || "{}");
    const allowed = asset.kind === "video" ? ["cluster", "universe"] : ["solar", "cluster", "universe"];
    if (process.env.SCOUTIT_SIGNAL_MEDIA_ENABLED !== "true" || !allowed.includes(grants?.[post.author_account_id])) {
      throw new Error("The author’s pilot upload access is unavailable.");
    }
    if (asset.kind === "photo") {
      if (asset.locator !== `${asset.signal_id}/${asset.id}.webp`) throw new Error("Photo could not be verified.");
      const { data: file, error: photoError } = await client.storage.from(bucket).info(asset.locator);
      if (photoError || !file) throw new Error("The private photo is unavailable.");
    }
    if (asset.kind === "video") {
      if (post.signal_type !== "COMMERCIAL_PROMOTION" || !/^[a-f\d]{32}$/i.test(asset.locator || "")) throw new Error("Video needs a Promotion signal.");
      const video = await videoRequest(asset.locator);
      if (!video?.readyToStream || !video.requireSignedURLs || !(video.duration > 0 && video.duration <= 30)) throw new Error("The private clip is unavailable or exceeds 30 seconds.");
    }
  }
  await logActionStrict({ staff, action: `signal_media.${decision}_requested`, targetTable: "signal_media", targetId: id, metadata: { signal_id: asset.signal_id } });
  const { data: updated, error: updateError } = await client.from("signal_media").update({ state: decision, reviewed_at: new Date().toISOString() })
    .eq("id", id).eq("state", "review").select("id").maybeSingle();
  if (updateError || !updated) throw new Error("The media decision could not be recorded.");
  revalidatePath("/dashboard/community");
}

export default async function SignalMediaReview({ staff, client }) {
  assertTier(staff, TIERS.OPS_MANAGER);
  const { data: items, error } = await client.from("signal_media")
    .select("id,signal_id,kind,locator,alt_text,stratosphere_signals(title)")
    .eq("state", "review").order("created_at").limit(20);
  if (error || !items?.length) return null;
  const sources = await Promise.all(items.map((item) => reviewSource(client, item).catch(() => null)));

  return (
    <section className="space-y-3" aria-label="Signal media review">
      <h2 className="text-lg font-semibold text-white">Signal media</h2>
      {items.map((item, index) => (
        <div className="space-y-3 rounded-lg border border-white/15 p-4" key={item.id}>
          <p className="text-sm text-white">{item.stratosphere_signals?.title} · {item.kind}</p>
          {item.alt_text && <p className="text-sm text-white/70">{item.alt_text}</p>}
          {sources[index] ? <a href={sources[index]} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-gold underline">Open private preview</a> : <p className="text-sm text-white/70">Preview unavailable</p>}
          <form action={decideMedia} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="assetId" value={item.id} />
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-white"><input type="checkbox" name="reviewed" /> I checked the media for contact details and relevance</label>
            <button className="min-h-11 rounded border border-white/20 px-3 text-sm text-white" name="decision" value="approved" disabled={!sources[index]}>Approve</button>
            <button className="min-h-11 rounded border border-white/20 px-3 text-sm text-white" name="decision" value="rejected">Decline</button>
          </form>
        </div>
      ))}
    </section>
  );
}
