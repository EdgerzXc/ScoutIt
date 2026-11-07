"use client";

import { createContext, useContext, useMemo, createElement } from "react";

export const ListingsContext = createContext(null);

export const DEFAULT_MAP_CENTER = [121.0215, 14.5547];

export const DEFAULT_LISTINGS_VALUE = {
  listings: [],
  catalogue: [],
  isLoading: false,
  inventoryError: false,
  refetchInventory: () => {},
  searchByRadius: async () => {},
  updateListing: async () => false,
  closeListing: async () => false,
  permanentlyRemoveListing: async () => false,
  publishListing: async () => false,
  addListing: async () => {},
  bulkAddListings: async () => false,
  addConciergeListing: async () => false,
  DEFAULT_MAP_CENTER,
};

export function useListings() {
  const context = useContext(ListingsContext);
  return context || DEFAULT_LISTINGS_VALUE;
}

export function ListingsProvider({
  children,
  value,
}) {
  const memoizedValue = useMemo(() => value || DEFAULT_LISTINGS_VALUE, [value]);

  return createElement(ListingsContext.Provider, { value: memoizedValue }, children);
}
