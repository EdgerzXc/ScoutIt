"use client";

import { useState } from "react";
import { usePremiumFields } from "@/lib/usePremiumFields";
import { imageMediaUrl, safeFloorPlans, spatialEmbedUrl } from "@/lib/propertyMedia";
import { isSamplePropertySlug } from "@/lib/sampleInventory";
import MaterialSwapperToolbar from "@/components/property/MaterialSwapperToolbar";
import SpatialStudioRevisionModal from "@/components/property/SpatialStudioRevisionModal";
import { DEFAULT_MATERIAL_CONFIG } from "@/lib/spatialStudio";
import { ExternalLink, FileText } from "lucide-react";

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
  const [materialConfig, setMaterialConfig] = useState(DEFAULT_MATERIAL_CONFIG);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
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

  const mediaCount =
    (realLuma ? 1 : 0) +
    (realMatterport ? 1 : 0) +
    (realHeatmap ? 1 : 0) +
    (realFloorPlans.length ? 1 : 0);

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

      {/* Media Format Quick Jumper */}
      {mediaCount > 1 && (
        <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-surface-variant/40">
          <span className="font-mono text-[12px] uppercase tracking-widest text-text-muted mr-1">
            Media formats:
          </span>
          {realLuma && (
            <a
              href="#vault-luma"
              className="px-2.5 py-1 rounded font-mono text-[12px] uppercase tracking-wider bg-surface border border-border text-text-secondary hover:text-gold-accent hover:border-gold-accent transition-colors"
            >
              3D Spatial Map
            </a>
          )}
          {realMatterport && (
            <a
              href="#vault-matterport"
              className="px-2.5 py-1 rounded font-mono text-[12px] uppercase tracking-wider bg-surface border border-border text-text-secondary hover:text-gold-accent hover:border-gold-accent transition-colors"
            >
              360° Walkthrough
            </a>
          )}
          {realHeatmap && !failedImages.has(realHeatmap) && (
            <a
              href="#vault-heatmap"
              className="px-2.5 py-1 rounded font-mono text-[12px] uppercase tracking-wider bg-surface border border-border text-text-secondary hover:text-gold-accent hover:border-gold-accent transition-colors"
            >
              Drone Heatmap
            </a>
          )}
          {realFloorPlans.length > 0 && (
            <a
              href="#vault-floorplans"
              className="px-2.5 py-1 rounded font-mono text-[12px] uppercase tracking-wider bg-surface border border-border text-text-secondary hover:text-gold-accent hover:border-gold-accent transition-colors"
            >
              Floor Plans ({realFloorPlans.length})
            </a>
          )}
        </div>
      )}

      {realLuma && (
        <div id="vault-luma">
          <EmbedCard
            title="3D Spatial Map"
            url={realLuma}
            iframeTitle="Verified 3D spatial map"
            materialConfig={materialConfig}
            onMaterialChange={setMaterialConfig}
            onRequestRevision={() => setRevisionModalOpen(true)}
            canRequestRevision={true}
            hasMaterialSwapper={true}
            badgeText="WebGL · Spatial Studio"
          />
        </div>
      )}

      {realMatterport && (
        <div id="vault-matterport">
          <EmbedCard
            title="360° Room Tour"
            url={realMatterport}
            iframeTitle="Verified Matterport room tour"
            hasMaterialSwapper={false}
            badgeText="Matterport · Photometric Walkthrough"
          />
        </div>
      )}

      {realHeatmap && !failedImages.has(realHeatmap) && (
        <section id="vault-heatmap" className="vault-item">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-label-caps text-[12px] uppercase tracking-widest text-gold-accent">
              Drone Heatmap Analysis
            </h2>
            <a
              href={realHeatmap}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-text-secondary hover:text-gold-accent transition-colors"
            >
              <span>Full Resolution</span>
              <ExternalLink size={12} />
            </a>
          </div>
          <div className="h-[260px] overflow-hidden rounded border border-surface-variant relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={realHeatmap}
              alt="Owner-supplied drone heatmap analysis"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setFailedImages((current) => new Set(current).add(realHeatmap))}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="font-mono text-[12px] uppercase tracking-wider text-text-primary bg-background/90 px-2.5 py-1 rounded border border-border backdrop-blur">
                Rooftop Solar & Thermal Exposure Map
              </span>
              <span className="font-mono text-[12px] uppercase tracking-wider text-gold-accent bg-background/90 px-2 py-1 rounded border border-gold-accent/30 backdrop-blur">
                Verified Sensor Flight
              </span>
            </div>
          </div>
        </section>
      )}

      {realFloorPlans.length > 0 && (
        <section id="vault-floorplans" className="vault-item">
          <h2 className="mb-3 font-label-caps text-[12px] uppercase tracking-widest text-gold-accent">
            Floor Plans{realFloorPlans.length > 1 ? ` · ${realFloorPlans.length}` : ""}
          </h2>
          <div className="grid grid-cols-1 gap-3 rounded border border-surface-variant bg-surface p-3 sm:grid-cols-2">
            {realFloorPlans.map((plan) => {
              const isImage = plan.type.startsWith("image/");
              return (
                <a
                  key={`${plan.url}-${plan.name}`}
                  href={plan.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded border border-surface-variant bg-background transition-colors hover:border-gold-accent"
                >
                  {isImage ? (
                    <div className="relative h-[160px] w-full overflow-hidden bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={plan.url}
                        alt={plan.name}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <span className="absolute top-2 right-2 rounded bg-background/90 px-2 py-0.5 font-mono text-[12px] uppercase tracking-wider text-text-secondary border border-border">
                        Schematic Preview
                      </span>
                    </div>
                  ) : (
                    <div className="relative flex h-[160px] w-full flex-col items-center justify-center bg-surface overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--accent)_1px,transparent_1px)] [background-size:16px_16px]" />
                      <FileText size={30} className="text-gold-accent mb-2 transition-transform duration-200 group-hover:scale-110" />
                      <span className="font-mono text-[12px] uppercase tracking-widest text-text-primary font-bold">
                        Architectural Dossier
                      </span>
                      <span className="font-mono text-[12px] uppercase tracking-wider text-text-secondary mt-1 flex items-center gap-1">
                        Vector Blueprint PDF <ExternalLink size={12} />
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-surface/60 border-t border-border-subtle">
                    <span className="truncate font-mono text-[12px] uppercase tracking-wider text-text-secondary group-hover:text-text-primary transition-colors">
                      {plan.name}
                    </span>
                    <ExternalLink size={12} className="shrink-0 text-text-muted group-hover:text-gold-accent transition-colors ml-2" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <SpatialStudioRevisionModal
        isOpen={revisionModalOpen}
        onClose={() => setRevisionModalOpen(false)}
        property={{ slug }}
      />
    </div>
  );
}

function EmbedCard({
  title,
  url,
  iframeTitle,
  materialConfig,
  onMaterialChange,
  onRequestRevision,
  canRequestRevision,
  hasMaterialSwapper = false,
  badgeText,
}) {
  return (
    <section className="vault-item">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-label-caps text-[12px] uppercase tracking-widest text-gold-accent">{title}</h2>
        {badgeText && (
          <span className="font-mono text-[12px] uppercase tracking-wider text-text-secondary bg-surface-variant/40 px-2 py-0.5 rounded border border-border">
            {badgeText}
          </span>
        )}
      </div>
      <div className="h-[460px] overflow-hidden rounded border border-surface-variant bg-surface relative group">
        <iframe
          src={url}
          className="h-full w-full border-none"
          title={iframeTitle}
          loading="lazy"
          allow="fullscreen; xr-spatial-tracking"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {hasMaterialSwapper && (
          <MaterialSwapperToolbar
            activeConfig={materialConfig}
            onChange={onMaterialChange}
            onRequestRevision={onRequestRevision}
            canRequestRevision={canRequestRevision}
          />
        )}
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