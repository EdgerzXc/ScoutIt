"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import "./signal-post-media.css";

async function mediaRequest(signalId, body) {
  const { data } = await getSession();
  if (!data?.session?.access_token) return { error: "Sign in to add media." };
  const headers = { Authorization: `Bearer ${data.session.access_token}` };
  const options = body ? { method: "POST", headers, body } : { headers, cache: "no-store" };
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`/api/community/signals/${encodeURIComponent(signalId)}/media`, options);
  return response.json();
}

export default function SignalMediaUpload({ signalId }) {
  const [access, setAccess] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    mediaRequest(signalId).then((result) => { if (active) setAccess(result); }).catch(() => {});
    return () => { active = false; };
  }, [signalId]);

  if (!access?.photoLimit && !access?.videoLimit) return null;
  const assets = access.assets || [];
  const photoSlot = Array.from({ length: access.photoLimit }, (_, index) => index)
    .find((position) => !assets.some((asset) => asset.position === position));
  const video = assets.find((asset) => asset.kind === "video");

  async function send(operation, success) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await operation();
      setMessage(result.error ? { text: result.error, error: true } : { text: success });
    } catch {
      setMessage({ text: "The upload could not be completed. Your signal is live.", error: true });
    } finally {
      await mediaRequest(signalId).then((result) => {
        if (!result.error) setAccess(result);
      }).catch(() => {});
      setBusy(false);
    }
  }

  function uploadPhoto(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    body.set("position", String(photoSlot));
    form.reset();
    void send(() => mediaRequest(signalId, body), "Photo sent for review.");
  }

  function uploadVideo(event) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("file");
    if (!file?.size || file.size > 50 * 1024 * 1024) {
      setMessage({ text: "Choose a video up to 50 MB and 30 seconds.", error: true });
      return;
    }
    void send(async () => {
      const started = await mediaRequest(signalId, { action: "startVideo" });
      if (started.error) return started;
      const target = new URL(started.uploadUrl);
      if (target.origin !== "https://upload.videodelivery.net") return { error: "Video upload is unavailable." };
      const body = new FormData();
      body.set("file", file);
      const upload = await fetch(target.href, { method: "POST", body, credentials: "omit" });
      if (!upload.ok) return { error: "The video upload stopped. Discard it to try again." };
      return mediaRequest(signalId, { action: "finishVideo" });
    }, "Video sent for review.");
  }

  return (
    <section className="spm-upload" aria-label="Signal media" onClick={(event) => event.stopPropagation()}>
      <h4>Add media</h4>
      {assets.length > 0 && (
        <ul className="spm-upload-status">
          {assets.map((asset) => <li key={asset.id}>{asset.kind === "photo" ? `Photo ${asset.position + 1}` : "Video"} · {asset.state === "reserved" ? "Processing" : asset.state === "review" ? "In review" : asset.state === "approved" ? "Published" : "Declined"}</li>)}
        </ul>
      )}
      {photoSlot !== undefined && (
        <form onSubmit={uploadPhoto}>
          <label>Photo {photoSlot + 1} of {access.photoLimit}<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} /></label>
          <label>Image description<input name="alt" type="text" maxLength={120} disabled={busy} /></label>
          <button type="submit" disabled={busy}>Submit photo</button>
        </form>
      )}
      {access.videoLimit > 0 && !video && (
        <form onSubmit={uploadVideo}>
          <label>Promotion clip · 30 seconds max<input name="file" type="file" accept="video/mp4,video/quicktime,video/webm" required disabled={busy} /></label>
          <button type="submit" disabled={busy}>Submit video</button>
        </form>
      )}
      {access.videoLimit > 0 && video?.state === "reserved" && (
        <div className="spm-upload-actions">
          <button type="button" disabled={busy} onClick={() => send(() => mediaRequest(signalId, { action: "finishVideo" }), "Video sent for review.")}>Check video</button>
          <button type="button" disabled={busy} onClick={() => send(() => mediaRequest(signalId, { action: "discardVideo" }), "Pending upload cleared.")}>Discard upload</button>
        </div>
      )}
      {busy && <p role="status">Sending media…</p>}
      {message && <p role={message.error ? "alert" : "status"}>{message.text}</p>}
    </section>
  );
}
