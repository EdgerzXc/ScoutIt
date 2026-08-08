import React from 'react';

export default function ProvenanceBadge({ record }) {
  if (!record || !record.is_sample) return null;

  return (
    <span 
      className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-[2px] bg-[rgba(232,174,60,0.15)] border border-[rgba(232,174,60,0.3)] text-[#E8AE3C] text-[10px] uppercase font-mono tracking-widest leading-none ml-2 align-middle select-none whitespace-nowrap"
      title="This is a demonstration listing"
    >
      Sample
    </span>
  );
}
