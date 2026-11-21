"use client";

import { useActionState, useEffect, useState } from "react";
import { setVerifiedCoordinates } from "./actions";

export function CoordinateForm({ id, title, point, publicSlug }) {
  const [result, save, pending] = useActionState(setVerifiedCoordinates, null);
  const [ready, setReady] = useState(false);
  const [lat, setLat] = useState(point?.lat ?? "");
  const [lng, setLng] = useState(point?.lng ?? "");
  useEffect(() => setReady(true), []);
  return (
    <div className="w-full min-w-0 sm:max-w-xl">
      <form action={save} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <input name="lat" required inputMode="decimal" placeholder="latitude" disabled={!ready || pending}
          value={lat} onChange={(event) => setLat(event.target.value)} aria-label={`Latitude for ${title}`}
          className="min-h-11 w-32 bg-neutral-900 border border-neutral-700 rounded px-2 font-mono text-xs text-neutral-100 placeholder:text-neutral-400" />
        <input name="lng" required inputMode="decimal" placeholder="longitude" disabled={!ready || pending}
          value={lng} onChange={(event) => setLng(event.target.value)} aria-label={`Longitude for ${title}`}
          className="min-h-11 w-32 bg-neutral-900 border border-neutral-700 rounded px-2 font-mono text-xs text-neutral-100 placeholder:text-neutral-400" />
        <button type="submit" disabled={!ready || pending}
          className="min-h-11 px-3 rounded bg-gold hover:bg-gold/90 text-black font-mono text-xs tracking-widest uppercase disabled:opacity-50">
          {pending ? "Verifying…" : "Verify"}
        </button>
        {publicSlug && (
          <a href={`https://www.scoutit.space/property/${encodeURIComponent(publicSlug)}`} target="_blank" rel="noreferrer"
            className="min-h-11 inline-flex items-center px-3 rounded border border-neutral-700 text-neutral-300 font-mono text-xs tracking-widest uppercase hover:border-gold/60">
            View
          </a>
        )}
      </form>
      <div role="alert" className="mt-1 text-xs text-red-300">{!pending && result?.ok === false ? result.message : ""}</div>
      <div role="status" className="mt-1 text-xs text-neutral-200">{!pending && result?.ok ? result.message : ""}</div>
    </div>
  );
}
