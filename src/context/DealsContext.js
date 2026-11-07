"use client";

import { createContext, useContext, useMemo, createElement } from "react";

export const DealsContext = createContext(null);

export const DEFAULT_DEALS_VALUE = {
  pitches: [],
  sendPitch: async () => false,
  inviteBroker: async () => false,
  updatePitchStatus: async () => false,
};

export function useDeals() {
  const context = useContext(DealsContext);
  return context || DEFAULT_DEALS_VALUE;
}

export function DealsProvider({
  children,
  value,
}) {
  const memoizedValue = useMemo(() => value || DEFAULT_DEALS_VALUE, [value]);

  return createElement(DealsContext.Provider, { value: memoizedValue }, children);
}
