"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import "./signal-post-media.css";

export default function SignalPostMedia({ signalId, title, media }) {
  const [selected, setSelected] = useState(null);
  const [playback, setPlayback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const item = media.find((entry) => entry.id === selected) || media[0];
  const assetUrl = (id) => `/api/community/signals/${encodeURIComponent(signalId)}/media?asset=${encodeURIComponent(id)}`;

  async function play() {
    setLoading(true);
    setError(false);
    try {
      const result = await fetch(assetUrl(item.id), { cache: "no-store" }).then((response) => response.json());
      const player = new URL(result.playback);
      if (player.protocol !== "https:" || player.port || !/^customer-[a-z\d]+\.cloudflarestream\.com$/i.test(player.hostname)) throw new Error("Unavailable video");
      setPlayback({ id: item.id, url: result.playback });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="spm-gallery" aria-label="Post media" onClick={(event) => event.stopPropagation()}>
      <div className="spm-frame">
        {item.kind === "photo" ? (
          <Image unoptimized src={assetUrl(item.id)} width={1280} height={800} alt={item.alt || `Photo for ${title}`} />
        ) : playback?.id === item.id ? (
          <iframe title={`Video for ${title}`} src={playback.url} allow="fullscreen; picture-in-picture" allowFullScreen />
        ) : (
          <button type="button" className="spm-play" disabled={loading} onClick={play}>
            <Play size={18} aria-hidden="true" /> {loading ? "Loading video…" : "Play promotion"}
          </button>
        )}
      </div>
      {error && <p role="alert" className="spm-error">Video is unavailable. Try again.</p>}
      {media.length > 1 && (
        <div className="spm-items" role="group" aria-label="Choose post media">
          {media.map((asset, index) => (
            <button key={asset.id} type="button" aria-pressed={asset.id === item.id} onClick={() => {
              setSelected(asset.id);
              setError(false);
              setPlayback(null);
            }}>{asset.kind === "video" ? "Video" : `Photo ${index + 1}`}</button>
          ))}
        </div>
      )}
    </div>
  );
}
