import React, { memo } from 'react';
import HoverCard from '../../ui/HoverCard';

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
  return (
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
        <div className="grid grid-cols-2 gap-4 border-t border-surface-variant pt-4 mt-4">
          <div>
            <span className="block font-label-caps text-[9px] tracking-widest text-text-muted uppercase mb-1">Active Inquiries</span>
            <span className={`font-data-tabular text-lg ${pendingPitchesCount > 0 ? 'text-gold-accent font-bold' : 'text-text-secondary'}`}>
              {pendingPitchesCount}
            </span>
          </div>
          <div>
            <span className="block font-label-caps text-[9px] tracking-widest text-text-muted uppercase mb-1">Profile Views</span>
            <span className="font-data-tabular text-lg text-text-muted" title="View tracking arrives once page instrumentation ships">—</span>
          </div>
        </div>
      )}
    </HoverCard>
  );
});

OwnerListingCard.displayName = 'OwnerListingCard';

export default OwnerListingCard;
