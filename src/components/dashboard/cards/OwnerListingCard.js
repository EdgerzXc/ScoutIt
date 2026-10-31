import React, { memo } from 'react';
import { Lock } from 'lucide-react';
import HoverCard from '../../ui/HoverCard';
import ShareModal from "@/components/property/ShareModal";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { buildShareText } from "@/lib/shareBriefing";
import { COMPLETENESS_UNKNOWN_LABEL } from "@/lib/dashboardListings";

const OwnerListingCard = memo(({ 
  listing, 
  pendingPitchesCount, 
  isSelected, 
  completeness, 
  selectMode, 
  toggleSelected, 
  setViewingDossierId, 
  index = 0 
}) => {
  const [shareTextOpen, setShareTextOpen] = React.useState(null);

  const handleShare = (e) => {
    e.stopPropagation();
    const cleanUrl = `${window.location.origin}/property/${listing.slug || listing.id}`;
    const shareText = buildShareText(listing, cleanUrl);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      navigator.share({
        title: `${listing.title || "Premium Space"} - ScoutIt`,
        text: shareText
      }).catch(err => {
        if (err.name !== 'AbortError') {
          setShareTextOpen(shareText);
        }
      });
    } else {
      setShareTextOpen(shareText);
    }
  };

  return (
    <>
      <HoverCard
        className="p-5 md:p-6 flex flex-col cursor-pointer h-auto min-h-[12rem] md:h-64 shrink-0 w-[80vw] max-w-[340px] snap-center md:w-auto md:max-w-none md:shrink"
        isSelected={isSelected}
        isCta={pendingPitchesCount > 0}
        index={index}
        onClick={() => selectMode ? toggleSelected(listing.id) : setViewingDossierId(listing.id)}
      >
        {selectMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelected(listing.id)}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-4 w-5 h-5 accent-gold-accent cursor-pointer z-10"
          />
        )}
        <div className="flex justify-between items-start mb-auto">
          <div className="pr-4">
            <h3 className="font-working-title text-xl text-on-surface mb-1 group-hover:underline break-words min-w-0 [overflow-wrap:anywhere]">
              {listing.title || 'Untitled Property'}
              <ProvenanceBadge record={listing} />
            </h3>
            <p className="text-xs text-text-secondary break-words [overflow-wrap:anywhere]">{listing.location || 'Location missing'}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {listing.lifecycleState === "off_market" || listing.pipelineStatus === "off_market" ? (
                <span className="inline-flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-[var(--accent-bright)] bg-[var(--accent)]/10 border border-[var(--accent-muted)] px-2 py-0.5 rounded">
                  <Lock size={11} className="text-[var(--accent)] shrink-0" aria-hidden="true" />
                  <span>Off-Market Cloud</span>
                  {(listing.quietly_open_to_offers || listing.quietlyOpenToOffers) && (
                    <span className="text-[var(--accent)]">· Whisper</span>
                  )}
                </span>
              ) : listing.lifecycleState === "live" || listing.pipelineStatus === "approved" ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
                  <span>Live Market</span>
                </span>
              ) : listing.pipelineStatus === "ai_drafting" ? (
                <span className="inline-flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                  <span>With ScoutIt Team</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-text-secondary bg-surface-variant/40 border border-surface-variant px-2 py-0.5 rounded">
                  <span>Draft Staging</span>
                </span>
              )}
              {listing.spatial_generation_status && listing.spatial_generation_status !== 'NONE' && (
                <span className="font-mono text-[12px] uppercase tracking-wider text-[var(--accent)] font-semibold inline-block">
                  3D: {listing.spatial_generation_status === 'LIVE' ? 'Live Twin' : listing.spatial_generation_status === 'REVISION_REQUESTED' ? 'Express Revision (4-12h)' : 'In Production'}
                </span>
              )}
            </div>
          </div>
          {!selectMode && (
            // A-146: null means unknown (dashboardListings completenessScoreOf),
            // never "null%" — a stated absence, not a computed-looking zero.
            Number.isFinite(completeness) ? (
            <div className="relative w-10 h-10 shrink-0" title={`${completeness}% complete`}>
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                <path className="text-gold-accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${completeness}, 100`} strokeWidth="3"></path>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-data-tabular font-bold text-[12px] text-text-primary leading-none">{completeness}%</span>
              </div>
            </div>
            ) : (
              <span className="shrink-0 font-label-caps text-[12px] tracking-widest uppercase text-text-secondary" title="Listing strength has not been computed yet">{COMPLETENESS_UNKNOWN_LABEL}</span>
            )
          )}
        </div>

        {listing.pipelineStatus === 'ai_drafting' ? (
          <div className="border-t border-surface-variant pt-4 mt-4 h-full flex flex-col justify-center">
            <div className="bg-surface-alt/50 p-2.5 rounded border border-surface-variant flex items-center justify-center gap-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gold-accent/5 opacity-50 animate-pulse"></div>
              <span className="animate-spin text-gold-accent text-xs">⚙️</span>
              <span className="text-[12px] text-text-secondary font-label-caps uppercase tracking-widest z-10">With the ScoutIt team</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 border-t border-surface-variant pt-4 mt-4">
            <div>
              <span className="block font-label-caps text-[12px] tracking-widest text-text-muted uppercase mb-1">Inquiries</span>
              <span className={`font-data-tabular text-lg ${pendingPitchesCount > 0 ? 'text-gold-accent font-bold' : 'text-text-secondary'}`}>
                {pendingPitchesCount}
              </span>
            </div>
            <div>
              <span className="block font-label-caps text-[12px] tracking-widest text-text-muted uppercase mb-1">Views</span>
              <span className="font-data-tabular text-lg text-text-muted" title="View tracking arrives once page instrumentation ships">-</span>
            </div>
            <div className="flex items-end justify-end">
              {!listing.is_sample && (
                <button 
                  type="button"
                  className="text-gold-accent border border-gold-accent/30 rounded px-3 py-1.5 min-h-[38px] sm:min-h-11 inline-flex items-center justify-center text-xs uppercase font-label-caps tracking-widest hover:bg-gold-accent hover:text-background active:scale-95 transition"
                  onClick={handleShare}
                >
                  Share
                </button>
              )}
            </div>
          </div>
        )}
      <ShareModal 
        isOpen={!!shareTextOpen}
        onClose={() => setShareTextOpen(null)}
        shareText={shareTextOpen}
        propertyUrl={typeof window !== 'undefined' ? `${window.location.origin}/property/${listing.slug || listing.id}` : ''}
      />
    </HoverCard>
    </>
  );
});

OwnerListingCard.displayName = 'OwnerListingCard';

export default OwnerListingCard;
