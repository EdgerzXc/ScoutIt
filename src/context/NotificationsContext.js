"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, createElement } from "react";

export const NotificationsContext = createContext(null);

export const DEFAULT_NOTIFICATIONS_VALUE = {
  notifications: [],
  toasts: [],
  addToast: () => {},
  markNotificationsRead: async () => {},
  clearAllNotifications: async () => {},
  addNotification: async () => {},
};

export function useNotifications() {
  const context = useContext(NotificationsContext);
  return context || DEFAULT_NOTIFICATIONS_VALUE;
}

export function NotificationsProvider({
  children,
  authedFetch,
  currentUser,
  initialNotifications = [],
  apiRef,
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, icon = "✓") => {
    const id = "t_" + Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [{ ...notif, id: 'n_' + Date.now(), read: false }, ...prev]);
    if (currentUser?.id && authedFetch) {
      authedFetch(`/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: notif.title,
          desc: notif.desc,
          icon: typeof notif.icon === "string" ? notif.icon : "🔔",
          notificationType: notif.notificationType || "client_event",
          propertyId: notif.propertyId || undefined,
          link: notif.link || undefined,
        }),
      }).catch((e) => console.error("Failed to persist notification", e));
    }
  }, [currentUser?.id, authedFetch]);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (currentUser?.id && authedFetch) {
      authedFetch(`/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch((e) => console.error("Failed to mark notifications read", e));
    }
  }, [currentUser?.id, authedFetch]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    if (currentUser?.id && authedFetch) {
      authedFetch(`/api/notifications`, { method: "DELETE" })
        .catch((e) => console.error("Failed to clear notifications", e));
    }
  }, [currentUser?.id, authedFetch]);

  useEffect(() => {
    if (apiRef) {
      apiRef.current = {
        addToast,
        addNotification,
        markNotificationsRead,
        clearAllNotifications,
        setNotifications,
      };
    }
  }, [apiRef, addToast, addNotification, markNotificationsRead, clearAllNotifications]);

  const value = useMemo(() => ({
    notifications,
    toasts,
    addToast,
    addNotification,
    markNotificationsRead,
    clearAllNotifications,
    setNotifications,
  }), [notifications, toasts, addToast, addNotification, markNotificationsRead, clearAllNotifications]);

  return createElement(NotificationsContext.Provider, { value }, children);
}
