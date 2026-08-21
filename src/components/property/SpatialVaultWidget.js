"use client";

import { useState } from "react";
import { usePremiumFields } from "@/lib/usePremiumFields";
import { imageMediaUrl, safeFloorPlans, spatialEmbedUrl } from "@/lib/propertyMedia";
import { isSamplePropertySlug } from "@/lib/sampleInventory";

export default function SpatialVaultWidget({
  slug,
  lumaUrl,
  matterportUrl,
  heatmapUrl,
  floorPlans = [],
  hasVaultMedia = false,
}) {
  const { fields, loading } = usePremiumFields(slug);
  const [failedImages, setFailedImages] = useState(new Set());
  const isSample = isSamplePropertySlug(slug);

  const realLuma =
    spatialEmbedUrl(fields.luma3dMapUrl, "luma") ||
    spatialEmbedUrl(lumaUrl, "luma");
  const realMatterport =
    spatialEmbedUrl(fields.matterportTourUrl, "matterport") ||
    spatialEmbedUrl(matterportUrl, "matterport");
  const realHeatmap =
    imageMediaUrl(fields.droneHeatmapUrl) ||
    imageMediaUrl(heatmapUrl);
  const realFloorPlans = safeFloorPlans(
    fields.floorPlans?.length ? fields.floorPlans : floorPlans,
  );
  const hasRenderableMedia = Boolean(
    realLuma || realMatterport || realHeatmap || realFloorPlans.length,
  );

  if (loading && slug) {
    return <VaultStatus title="Checking spatial media" detail="Verifying your access and the available captures." />;
  }

  if (!hasRenderableMedia) {
    return hasVaultMedia ? (
      <VaultStatus
        locked
        title="Spatial media is access-controlled"
        detail="This listing includes interactive 3D spatial models and drone media, available on Cluster tier."
      />
    ) : (
      <VaultStatus
        title="Spatial media unavailable"
        detail="The owner has not supplied a verified 3D scan, 360° tour, heatmap, or floor plan for this property."
      />
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Demonstration notice for sample properties (§4 & §6) */}
      {isSample && (
        <div className="p-3.5 rounded bg-surface/80 border border-gold-accent/25 flex items-start gap-3">
          <span className="font-mono text-gold-accent text-sm leading-none font-bold">◈</span>
          <div>
            <span className="font-mono text-[12px] uppercase tracking-widest text-gold-accent font-bold block mb-0.5">
              Spatial Vault Demonstration
            </span>
            <p className="font-sans text-xs text-text-secondary m-0 leading-relaxed">
              Sample spatial formats ScoutIt supports. Production properties display only the verified media captured for that space.
            </p>
          </div>
        </div>
      )}

      {realLuma && (
        <EmbedCard title="3D Spatial Map" url={realLuma} iframeTitle="Verified 3D spatial map" />
      )}

      {realMatterport && (
        <EmbedCard title="360° Room Tour" url={realMatterport} iframeTitle="Verified Matterport room tour" />
      )}

      {realHeatmap && !failedImages.has(realHeatmap) && (
        <section className="vault-item">
          <h2 className="mb-3 font-label-caps text-[12px] uppercase tracking-widest text-gold-accent">
            Drone Heatmap Analysis
          </h2>
          <div className="h-[240px] overflow-hidden rounded border border-surface-variant">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={realHeatmap}
              alt="Owner-supplied drone heatmap analysis"
              className="h-full w-full object-cover"
              onError={() => setFailedImages((current) => new Set(current).add(realHeatmap))}
            />
          </div>
        </section>
      )}

      {realFloorPlans.length > 0 && (
        <section className="vault-item">
          <h2 className="mb-3 font-label-caps text-[12px] uppercase tracking-widest text-gold-accent">
            Floor Plans{realFloorPlans.length > 1 ? ` · ${realFloorPlans.length}` : ""}
          </h2>
          <div className="grid grid-cols-1 gap-3 rounded border border-surface-variant bg-surface p-3 sm:grid-cols-2">
            {realFloorPlans.map((plan) => {
              const isImage = plan.type.startsWith("image/");
              return (
                <a
                  key={plan.url}
                  href={plan.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded border border-surface-variant bg-background transition-colors hover:border-gold-accent"
                >
                  {isImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={plan.url} alt={plan.name} className="h-[160px] w-full bg-surface object-contain" />
                  ) : (
                    <div className="flex h-[160px] w-full items-center justify-center bg-surface">
                      <span className="font-label-caps text-[12px] uppercase tracking-widest text-text-secondary">PDF</span>
                    </div>
                  )}
                  <span className="block truncate px-3 py-2 font-label-caps text-[12px] uppercase tracking-widest text-text-secondary">
                    {plan.name}
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function EmbedCard({ title, url, iframeTitle }) {
  return (
    <section className="vault-item">
      <h2 className="mb-3 font-label-caps text-[12px] uppercase tracking-widest text-gold-accent">{title}</h2>
      <div className="h-[400px] overflow-hidden rounded border border-surface-variant bg-surface">
        <iframe
          src={url}
          className="h-full w-full border-none"
          title={iframeTitle}
          loading="lazy"
          allow="fullscreen; xr-spatial-tracking"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </section>
  );
}

function VaultStatus({ title, detail, locked = false }) {
  return (
    <section className="mt-8 rounded border border-surface-variant bg-surface p-6 text-center" role="status">
      <span className="font-label-caps text-[12px] uppercase tracking-widest text-gold-accent">
        {locked ? "Cluster access" : "Verified media status"}
      </span>
      <h2 className="mt-3 font-headline-editorial text-lg text-on-surface">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">{detail}</p>
      {locked && (
        <a
          href="/pricing/seeker"
          className="mt-5 inline-flex rounded bg-gold-accent px-6 py-3 font-label-caps text-[12px] font-bold uppercase tracking-widest text-background transition-opacity hover:opacity-90"
        >
          View Cluster access →
        </a>
      )}
    </section>
  );
}