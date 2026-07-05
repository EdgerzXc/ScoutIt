import os

filepath = 'src/components/dashboard/BuyerMode.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'import { useState, useEffect, useRef } from "react";',
    'import { useState, useEffect, useRef, useMemo } from "react";'
)

content = content.replace(
'''  // Live-filter logic
  const q = searchQuery.trim().toLowerCase();
  const matches = (item) => !q || [item.title, item.type, item.loc, item.desc].some(v => v && v.toLowerCase().includes(q));
  
  // Apply filter to all listings
  const filteredListings = listings.filter(matches);''',
'''  // ⚡ Bolt Optimization: Memoize filtered listings to avoid O(N*C) calculations on every keystroke
  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listings;
    
    return listings.filter(item => 
      [item.title, item.type, item.loc, item.desc].some(v => v && v.toLowerCase().includes(q))
    );
  }, [listings, searchQuery]);'''
)

content = content.replace(
'''  // Map actual saved properties from the Intelligence Ledger
  const actualSavedListings = listings.filter(l => savedIds.includes(l.id)).map(l => ({
    id: l.id,
    type: l.spaceCategory || l.type || 'Property',
    title: l.title,
    loc: l.location || l.loc || 'Location hidden',
    img: l.hasMedia ? '📸' : '🏢', // Fallback icon
  }));
  const savedFiltered = actualSavedListings.filter(matches);''',
'''  // ⚡ Bolt Optimization: Memoize saved listings mapping and filtering
  const savedFiltered = useMemo(() => {
    const _actualSavedListings = listings
      .filter(l => savedIds.includes(l.id))
      .map(l => ({
        id: l.id,
        type: l.spaceCategory || l.type || 'Property',
        title: l.title,
        loc: l.location || l.loc || 'Location hidden',
        img: l.hasMedia ? '📸' : '🏢',
      }));
      
    const q = searchQuery.trim().toLowerCase();
    if (!q) return _actualSavedListings;
    
    return _actualSavedListings.filter(item => 
      [item.title, item.type, item.loc, item.desc].some(v => v && v.toLowerCase().includes(q))
    );
  }, [listings, savedIds, searchQuery]);'''
)

content = content.replace(
'''onClick={() => setShowMap(false)}''',
'''onClick={() => setShowMap(false)} aria-label="Close"'''
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
