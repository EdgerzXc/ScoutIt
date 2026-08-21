import React from 'react';
import { isSamplePropertySlug } from '@/lib/sampleInventory';

export default function ProvenanceBadge({ record }) {
  if (!record || (!record.is_sample && !isSamplePropertySlug(record.slug))) return null;

  return (
    <span
      className="ml-2 inline-flex select-none items-center justify-center whitespace-nowrap rounded-sm border border-gold-accent/30 bg-gold-accent/10 px-2 py-1 align-middle font-mono text-[12px] uppercase leading-none tracking-[0.14em] text-gold-accent"
      title="Sample data retained only for invited human testing"
    >
      Sample data &mdash; for human testing
    </span>
  );
}
