"use client";

import { createContext, useContext, useMemo, createElement } from "react";

export const WalletContext = createContext(null);

export const DEFAULT_WALLET_VALUE = {
  connects: 5,
  getCurrentTier: () => "starry",
  raiseQuest: async () => false,
};

export function useWallet() {
  const context = useContext(WalletContext);
  return context || DEFAULT_WALLET_VALUE;
}

export function WalletProvider({
  children,
  value,
}) {
  const memoizedValue = useMemo(() => value || DEFAULT_WALLET_VALUE, [value]);

  return createElement(WalletContext.Provider, { value: memoizedValue }, children);
}
