import React, { memo } from 'react';
import HoverCard from '../../ui/HoverCard';
import ShareModal from "@/components/property/ShareModal";

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
    const title = listing.title || "Premium Space";
    const cat = listing.spaceCategory || listing.category || "Commercial Space";
    const sqm = listing.sqm || listing.Floor_Area_Sqm || listing.CM_Total_GLA || "";
    const cleanLoc = (listing.location || 'Location upon inquiry');
    const cleanCat = cat.replace(/\s+/g, '');
    const locTag = cleanLoc !== 'Location upon inquiry' ? '#' + cleanLoc.split(',')[0].replace(/[^a-zA-Z0-9]/g, '') : '';
    const cleanUrl = `${window.location.origin}/property/${listing.slug || listing.id}`;
    
    const shareText = `■ MARKET INTELLIGENCE BRIEFING\n${title}\n\n▸ Category: ${cat}\n▸ Location: ${cleanLoc}${sqm ? '\n▸ Size: ' + sqm + ' sqm' : ''}\n\nDiscover the complete architectural and operational signals for this space on ScoutIt, the Philippines' first spatial commerce platform.\n\nAccess the full dossier here:\n${cleanUrl}\n\n#ScoutIt #${cleanCat} ${locTag} #RealEstatePH`;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      navigator.share({
        title: `${title} - ScoutIt`,
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
        className="p-5 md:p-6 flex flex-col cursor-pointer h-auto min-h-[12rem] md:h-64 shrink-0 w-[85vw] snap-center md:w-auto md:shrink"
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
            <h3 className="font-working-title text-xl text-on-surface mb-1 group-hover:underline">{listing.title || 'Untitled Property'}</h3>
            <p className="text-xs text-text-secondary">{listing.location || 'Location missing'}</p>
          </div>
          {!selectMode && (
            <div className="relative w-10 h-10 shrink-0" title={`${completeness}% complete`}>
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                <path className="text-gold-accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${completeness}, 100`} strokeWidth="3"></path>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-data-tabular font-bold text-[8px] text-text-primary leading-none">{completeness}%</span>
              </div>
            </div>
          )}
        </div>

        {listing.pipelineStatus === 'ai_drafting' ? (
          <div className="border-t border-surface-variant pt-4 mt-4 h-full flex flex-col justify-center">
            <div className="bg-surface-alt/50 p-2.5 rounded border border-surface-variant flex items-center justify-center gap-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gold-accent/5 opacity-50 animate-pulse"></div>
              <span className="animate-spin text-gold-accent text-xs">⚙️</span>
              <span className="text-[10px] text-text-secondary font-label-caps uppercase tracking-widest z-10">COUNCIL AI IS DRAFTING...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 border-t border-surface-variant pt-4 mt-4">
            <div>
              <span className="block font-label-caps text-[9px] tracking-widest text-text-muted uppercase mb-1">Inquiries</span>
              <span className={`font-data-tabular text-lg ${pendingPitchesCount > 0 ? 'text-gold-accent font-bold' : 'text-text-secondary'}`}>
                {pendingPitchesCount}
              </span>
            </div>
            <div>
              <span className="block font-label-caps text-[9px] tracking-widest text-text-muted uppercase mb-1">Views</span>
              <span className="font-data-tabular text-lg text-text-muted" title="View tracking arrives once page instrumentation ships">—</span>
            </div>
            <div className="flex items-end justify-end">
              <button 
                className="text-gold-accent border border-gold-accent/30 rounded px-3 py-1.5 text-[10px] uppercase font-label-caps tracking-widest hover:bg-gold-accent hover:text-background transition-colors"
                onClick={handleShare}
              >
                Share
              </button>
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
