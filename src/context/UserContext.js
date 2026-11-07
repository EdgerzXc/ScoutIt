"use client";

import { createContext, useContext, useMemo, createElement } from "react";

export const UserContext = createContext(null);

export const DEFAULT_USER_VALUE = {
  currentUser: null,
  identityResolved: false,
  savedIds: [],
  toggleSave: async () => {},
  authedFetch: async () => ({ ok: false, status: 401, json: async () => ({}) }),
};

export function useUser() {
  const context = useContext(UserContext);
  return context || DEFAULT_USER_VALUE;
}

export function UserProvider({
  children,
  value,
}) {
  const memoizedValue = useMemo(() => value || DEFAULT_USER_VALUE, [value]);

  return createElement(UserContext.Provider, { value: memoizedValue }, children);
}
